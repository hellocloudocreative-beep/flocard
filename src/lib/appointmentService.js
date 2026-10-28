/* ==========================================================================
   FLOCARDS APPOINTMENT BOOKING SERVICE
   Features:
   - Dynamic slot generation based on business hours, duration, and buffer
   - Notice window enforcement (min notice hours, max advance booking window)
   - Concurrency & double-booking prevention:
     Server-side & storage validation before committing any booking
   - Booking reference generation (e.g. FLC-BK-9182A)
   - Status transitions (pending -> confirmed / cancelled / completed)
   - Supabase table integration with graceful persistent offline fallback
   ========================================================================== */

import { supabase, isSupabaseConfigured } from './supabase.js';
import { StorageEngine } from './storage.js';
import { DAYS_OF_WEEK, timeToMinutes, formatTime12h, getNowInTimezone } from './businessHoursService.js';

export const DEFAULT_BOOKING_CONFIG = {
  enabled: true,
  slotDurationMinutes: 30,
  bufferMinutes: 10,
  minNoticeHours: 2,
  maxAdvanceDays: 30,
  autoConfirm: true,
  blockedDates: [],
  blockedTimes: [], // e.g. [{ date: '2026-11-01', time: '14:00' }]
  confirmationMessage: 'Thank you for scheduling with us! Your consultation request has been recorded.',
  title: 'Schedule a Consultation',
  subtitle: 'Select an available time slot for an in-person or virtual consultation.'
};

/**
 * Generate a unique, professional booking reference
 * e.g. FLC-BK-4A8F
 */
export function generateBookingReference() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const dateCode = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  return `FLC-BK-${dateCode}-${rand}`;
}

/**
 * Get the day of week key for a given 'YYYY-MM-DD' date string
 */
export function getDayKeyForDate(dateStr) {
  const date = new Date(`${dateStr}T12:00:00Z`);
  const dayIndex = date.getUTCDay(); // 0 is Sunday
  return dayIndex === 0 ? 'sunday' : DAYS_OF_WEEK[dayIndex - 1];
}

/**
 * Generate available time slots for a specific date given:
 * - business hours schedule
 * - appointment configuration
 * - existing bookings for that profile on that date
 */
export function generateAvailableSlots({
  dateStr, // 'YYYY-MM-DD'
  businessHours,
  bookingConfig = DEFAULT_BOOKING_CONFIG,
  existingBookings = []
}) {
  if (!bookingConfig || bookingConfig.enabled === false) return [];
  if (!businessHours || businessHours.enabled === false) return [];

  const timezone = businessHours.timezone || 'Asia/Kolkata';
  const nowInfo = getNowInTimezone(timezone);

  // Check if date is in the past
  if (dateStr < nowInfo.dateStr) return [];

  // Check advance booking window
  const selectedDate = new Date(`${dateStr}T00:00:00Z`);
  const todayDate = new Date(`${nowInfo.dateStr}T00:00:00Z`);
  const diffDays = Math.round((selectedDate - todayDate) / (1000 * 60 * 60 * 24));
  const maxAdvance = bookingConfig.maxAdvanceDays || 30;
  if (diffDays > maxAdvance) return [];

  // Check if date is blocked
  const blockedDates = Array.isArray(bookingConfig.blockedDates) ? bookingConfig.blockedDates : [];
  const specialClosures = Array.isArray(businessHours.specialClosures) ? businessHours.specialClosures : [];
  if (blockedDates.includes(dateStr) || specialClosures.includes(dateStr)) return [];

  const dayKey = getDayKeyForDate(dateStr);
  const daySchedule = businessHours.schedule?.[dayKey];

  if (!daySchedule || !daySchedule.isOpen || !Array.isArray(daySchedule.slots) || daySchedule.slots.length === 0) {
    return [];
  }

  const duration = bookingConfig.slotDurationMinutes || 30;
  const buffer = bookingConfig.bufferMinutes || 0;
  const minNoticeHours = bookingConfig.minNoticeHours || 0;
  const minNoticeMinutes = minNoticeHours * 60;

  // Active bookings for this date (excluding cancelled)
  const activeBookings = existingBookings.filter(b => 
    b.bookingDate === dateStr && b.status !== 'cancelled'
  );

  const availableSlots = [];

  for (const window of daySchedule.slots) {
    const windowStart = timeToMinutes(window.open);
    const windowEnd = timeToMinutes(window.close);

    let current = windowStart;
    while (current + duration <= windowEnd) {
      const slotStart = current;
      const slotEnd = current + duration;

      const startH = Math.floor(slotStart / 60);
      const startM = slotStart % 60;
      const timeStr = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;

      const endH = Math.floor(slotEnd / 60);
      const endM = slotEnd % 60;
      const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      // Check min notice if date is today
      let isTooSoon = false;
      if (dateStr === nowInfo.dateStr) {
        if (slotStart <= nowInfo.minutes + minNoticeMinutes) {
          isTooSoon = true;
        }
      }

      // Check explicit blocked times
      const isExplicitlyBlocked = Array.isArray(bookingConfig.blockedTimes) &&
        bookingConfig.blockedTimes.some(bt => bt.date === dateStr && bt.time === timeStr);

      // Check double-booking conflict against existing active appointments
      const hasConflict = activeBookings.some(b => {
        const bookedStart = timeToMinutes(b.startTime);
        const bookedEnd = timeToMinutes(b.endTime || b.startTime) + (b.endTime ? 0 : duration);
        // Overlap condition: start < bookedEnd && slotEnd > bookedStart
        return slotStart < bookedEnd && slotEnd > bookedStart;
      });

      if (!isTooSoon && !isExplicitlyBlocked && !hasConflict) {
        availableSlots.push({
          time: timeStr,
          endTime: endTimeStr,
          label: `${formatTime12h(timeStr)} – ${formatTime12h(endTimeStr)}`,
          displayTime: formatTime12h(timeStr),
          startMinutes: slotStart,
          endMinutes: slotEnd
        });
      }

      current += duration + buffer;
    }
  }

  return availableSlots;
}

/**
 * Fetch all appointments for a profile slug
 */
export async function getAppointments(profileSlug) {
  if (!profileSlug) return [];

  // Try Supabase first if table exists
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('profile_slug', profileSlug)
        .order('booking_date', { ascending: true });

      if (!error && Array.isArray(data)) {
        return data.map(normalizeAppointmentFromDb);
      }
    } catch {
      // Table may not exist yet, fallback to local storage
    }
  }

  // Local storage fallback
  const localList = StorageEngine.getAppointments?.(profileSlug) || [];
  return localList;
}

/**
 * Submit an appointment booking with concurrency protection
 */
export async function submitAppointmentBooking({
  profileSlug,
  profileId,
  serviceId = null,
  serviceName = '',
  customerName,
  customerEmail = '',
  customerPhone,
  bookingDate, // 'YYYY-MM-DD'
  startTime,   // 'HH:mm'
  endTime,     // 'HH:mm'
  notes = '',
  businessHours,
  bookingConfig
}) {
  // 1. Validate mandatory fields
  if (!profileSlug) throw new Error('Profile reference is required.');
  if (!customerName || !customerName.trim()) throw new Error('Please enter your full name.');
  if (!customerPhone || !customerPhone.trim()) throw new Error('Please enter a contact phone number or WhatsApp.');
  if (!bookingDate) throw new Error('Please select an appointment date.');
  if (!startTime) throw new Error('Please select an available time slot.');

  // 2. Concurrency Check: Fetch live existing bookings to ensure no double-booking
  const currentBookings = await getAppointments(profileSlug);
  const slotMinutes = timeToMinutes(startTime);
  const duration = bookingConfig?.slotDurationMinutes || 30;
  const slotEndMinutes = endTime ? timeToMinutes(endTime) : slotMinutes + duration;

  const conflict = currentBookings.find(b => {
    if (b.bookingDate !== bookingDate || b.status === 'cancelled') return false;
    const bStart = timeToMinutes(b.startTime);
    const bEnd = timeToMinutes(b.endTime || b.startTime) + (b.endTime ? 0 : duration);
    return slotMinutes < bEnd && slotEndMinutes > bStart;
  });

  if (conflict) {
    throw new Error('This time slot was just booked by another visitor. Please select a different time slot.');
  }

  const referenceCode = generateBookingReference();
  const initialStatus = bookingConfig?.autoConfirm !== false ? 'confirmed' : 'pending';

  const appointmentRecord = {
    id: `apt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    profileSlug,
    profileId,
    serviceId,
    serviceName,
    customerName: customerName.trim(),
    customerEmail: (customerEmail || '').trim(),
    customerPhone: customerPhone.trim(),
    bookingDate,
    startTime,
    endTime: endTime || `${String(Math.floor(slotEndMinutes / 60)).padStart(2, '0')}:${String(slotEndMinutes % 60).padStart(2, '0')}`,
    notes: notes.trim(),
    status: initialStatus,
    referenceCode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 3. Save to Supabase if available
  let savedToSupabase = false;
  if (isSupabaseConfigured && supabase) {
    try {
      const dbPayload = {
        id: appointmentRecord.id,
        profile_slug: profileSlug,
        service_id: serviceId,
        service_name: serviceName,
        customer_name: appointmentRecord.customerName,
        customer_email: appointmentRecord.customerEmail,
        customer_phone: appointmentRecord.customerPhone,
        booking_date: bookingDate,
        start_time: startTime,
        end_time: appointmentRecord.endTime,
        notes: appointmentRecord.notes,
        status: appointmentRecord.status,
        reference_code: referenceCode,
        created_at: appointmentRecord.createdAt,
        updated_at: appointmentRecord.updatedAt
      };

      const { data, error } = await supabase
        .from('appointments')
        .insert([dbPayload])
        .select()
        .single();

      if (!error && data) {
        savedToSupabase = true;
      }
    } catch {
      // Supabase table insertion failed; fallback to local
    }
  }

  // 4. Always synchronize with StorageEngine
  StorageEngine.saveAppointment?.(appointmentRecord);

  // 5. Add Audit Log
  StorageEngine.addAuditLog(
    'Appointment Booking',
    `New appointment ${referenceCode} booked by ${appointmentRecord.customerName} on ${bookingDate} at ${formatTime12h(startTime)} (${initialStatus})`,
    appointmentRecord.customerEmail || appointmentRecord.customerPhone || 'Visitor'
  );

  return {
    success: true,
    appointment: appointmentRecord,
    referenceCode,
    status: initialStatus,
    savedToSupabase
  };
}

/**
 * Update an appointment's status (approved/confirmed, rescheduled, cancelled)
 */
export async function updateAppointmentStatus({
  id,
  profileSlug,
  status, // 'confirmed' | 'cancelled' | 'completed' | 'pending'
  rescheduleDate = null,
  rescheduleTime = null,
  actorName = 'Owner'
}) {
  if (!id) throw new Error('Appointment ID required.');

  // Try updating in Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const updates = {
        status,
        updated_at: new Date().toISOString()
      };
      if (rescheduleDate) updates.booking_date = rescheduleDate;
      if (rescheduleTime) updates.start_time = rescheduleTime;

      await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id);
    } catch {
      // Local fallback handled below
    }
  }

  // Update in StorageEngine
  const updated = StorageEngine.updateAppointmentStatus?.(id, status, { rescheduleDate, rescheduleTime });

  StorageEngine.addAuditLog(
    'Appointment Booking',
    `Appointment ${id} status changed to ${status}${rescheduleDate ? ` (rescheduled to ${rescheduleDate} ${rescheduleTime})` : ''}`,
    actorName
  );

  return updated;
}

function normalizeAppointmentFromDb(row) {
  return {
    id: row.id,
    profileSlug: row.profile_slug,
    serviceId: row.service_id,
    serviceName: row.service_name,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    bookingDate: row.booking_date,
    startTime: row.start_time,
    endTime: row.end_time,
    notes: row.notes,
    status: row.status,
    referenceCode: row.reference_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export const appointmentService = {
  DEFAULT_BOOKING_CONFIG,
  generateBookingReference,
  getDayKeyForDate,
  generateAvailableSlots,
  getAvailableSlots: (profile, dateStr) => generateAvailableSlots({
    dateStr,
    bookingConfig: profile.bookingConfig,
    businessHours: profile.businessHours,
    existingBookings: StorageEngine.getAppointments().filter(a => a.profileSlug === profile.slug)
  }),
  getAppointments,
  submitAppointmentBooking,
  bookAppointment: (bookingData) => {
    const existing = StorageEngine.getAppointments();
    const bDate = bookingData.date || bookingData.bookingDate;
    const bTime = typeof bookingData.time === 'object' ? bookingData.time.time : (bookingData.time || bookingData.startTime);
    const conflict = existing.find(a =>
      a.profileSlug === bookingData.profileSlug &&
      (a.date === bDate || a.bookingDate === bDate) &&
      (a.time === bTime || a.startTime === bTime) &&
      a.status !== 'cancelled'
    );
    if (conflict) {
      return { success: false, error: 'This time slot is already booked. Please pick another slot.' };
    }
    const refCode = bookingData.referenceCode || generateBookingReference();
    const saved = StorageEngine.saveAppointment({
      ...bookingData,
      referenceCode: refCode,
      bookingDate: bDate,
      date: bDate,
      startTime: bTime,
      time: bTime,
      status: bookingData.status || 'confirmed'
    });
    return { success: true, appointment: saved };
  },
  updateStatus: async (appointmentId, status, user) => {
    return updateAppointmentStatus({
      id: appointmentId,
      status,
      actorName: user?.name || 'Administrator'
    });
  }
};
