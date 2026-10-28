/* ==========================================================================
   FLOCARDS BUSINESS HOURS & SCHEDULE ENGINE
   Supports:
   - Configurable weekly schedules per day (Monday to Sunday)
   - Multiple time slots per day (e.g. 09:00-13:00, 14:00-18:00)
   - Closed / unavailable days
   - Configurable timezone (defaults to Asia/Kolkata or user timezone)
   - Live calculations: Open now, Closed now, Opens at [time]
   - Overnight business hours handling
   - Special closures / holiday dates
   ========================================================================== */

export const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
];

export const DAY_LABELS = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
};

export const DEFAULT_BUSINESS_HOURS = {
  enabled: true,
  timezone: 'Asia/Kolkata',
  schedule: {
    monday: { isOpen: true, slots: [{ open: '09:30', close: '18:30' }] },
    tuesday: { isOpen: true, slots: [{ open: '09:30', close: '18:30' }] },
    wednesday: { isOpen: true, slots: [{ open: '09:30', close: '18:30' }] },
    thursday: { isOpen: true, slots: [{ open: '09:30', close: '18:30' }] },
    friday: { isOpen: true, slots: [{ open: '09:30', close: '18:30' }] },
    saturday: { isOpen: true, slots: [{ open: '10:00', close: '16:00' }] },
    sunday: { isOpen: false, slots: [] }
  },
  specialClosures: [], // Array of YYYY-MM-DD
  notes: 'Appointments recommended for design consultations.'
};

/**
 * Format 24h time string 'HH:mm' to 12h readable string 'h:mm A'
 */
export function formatTime12h(timeStr) {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  if (isNaN(h)) return timeStr;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m < 10 ? `0${m}` : m;
  return `${displayH}:${displayM} ${period}`;
}

/**
 * Convert time string 'HH:mm' into minutes from midnight
 */
export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Get the current time in the configured timezone as:
 * { dayKey: 'monday'..'sunday', minutes: number, dateStr: 'YYYY-MM-DD', timeStr: 'HH:mm' }
 */
export function getNowInTimezone(timezone = 'Asia/Kolkata') {
  const now = new Date();
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const parts = formatter.formatToParts(now);
    const getPart = (type) => parts.find(p => p.type === type)?.value || '';

    const weekday = getPart('weekday').toLowerCase();
    const dayKey = DAYS_OF_WEEK.includes(weekday) ? weekday : 'monday';
    const year = getPart('year');
    const month = getPart('month');
    const day = getPart('day');
    const hour = parseInt(getPart('hour'), 10) || 0;
    const minute = parseInt(getPart('minute'), 10) || 0;

    return {
      dayKey,
      minutes: hour * 60 + minute,
      dateStr: `${year}-${month}-${day}`,
      timeStr: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    };
  } catch (err) {
    // Fallback to local time if timezone string is invalid
    const dayIndex = now.getDay(); // 0 is Sunday
    const dayKey = dayIndex === 0 ? 'sunday' : DAYS_OF_WEEK[dayIndex - 1];
    const minutes = now.getHours() * 60 + now.getMinutes();
    const dateStr = now.toISOString().split('T')[0];
    return {
      dayKey,
      minutes,
      dateStr,
      timeStr: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    };
  }
}

/**
 * Calculate live business status:
 * returns {
 *   isOpen: boolean,
 *   badge: 'Open now' | 'Closed now' | 'Special Closure',
 *   detail: 'Closes at 6:30 PM' | 'Opens at 9:30 AM tomorrow' | etc.,
 *   currentSlot: object | null
 * }
 */
export function calculateBusinessStatus(businessHours = DEFAULT_BUSINESS_HOURS) {
  if (!businessHours || businessHours.enabled === false) {
    return null;
  }

  const schedule = businessHours.schedule || DEFAULT_BUSINESS_HOURS.schedule;
  const timezone = businessHours.timezone || 'Asia/Kolkata';
  const specialClosures = Array.isArray(businessHours.specialClosures) ? businessHours.specialClosures : [];

  const nowInfo = getNowInTimezone(timezone);
  const { dayKey, minutes, dateStr } = nowInfo;

  // Check special temporary closure dates
  if (specialClosures.includes(dateStr)) {
    return {
      isOpen: false,
      badge: 'Closed now',
      detail: 'Closed for special holiday / event',
      currentSlot: null,
      isSpecialClosure: true
    };
  }

  const todaySchedule = schedule[dayKey];

  if (todaySchedule && todaySchedule.isOpen && Array.isArray(todaySchedule.slots)) {
    for (const slot of todaySchedule.slots) {
      const openMin = timeToMinutes(slot.open);
      const closeMin = timeToMinutes(slot.close);

      // Normal daytime slot (open < close)
      if (openMin <= closeMin) {
        if (minutes >= openMin && minutes < closeMin) {
          return {
            isOpen: true,
            badge: 'Open now',
            detail: `Closes at ${formatTime12h(slot.close)}`,
            currentSlot: slot
          };
        }
      } else {
        // Overnight slot (e.g. 20:00 to 02:00 next morning)
        if (minutes >= openMin || minutes < closeMin) {
          return {
            isOpen: true,
            badge: 'Open now',
            detail: `Closes at ${formatTime12h(slot.close)}`,
            currentSlot: slot
          };
        }
      }
    }
  }

  // If currently closed, find next opening slot
  const nextOpening = findNextOpening(schedule, dayKey, minutes, specialClosures);

  return {
    isOpen: false,
    badge: 'Closed now',
    detail: nextOpening ? `Opens ${nextOpening}` : 'Currently closed',
    currentSlot: null
  };
}

/**
 * Helper to find the next opening time relative to current day and minutes
 */
function findNextOpening(schedule, currentDayKey, currentMinutes, specialClosures = []) {
  const currentIndex = DAYS_OF_WEEK.indexOf(currentDayKey);

  // Check today's upcoming slots
  const todaySchedule = schedule[currentDayKey];
  if (todaySchedule && todaySchedule.isOpen && Array.isArray(todaySchedule.slots)) {
    for (const slot of todaySchedule.slots) {
      const openMin = timeToMinutes(slot.open);
      if (openMin > currentMinutes) {
        return `today at ${formatTime12h(slot.open)}`;
      }
    }
  }

  // Look ahead across the next 7 days
  for (let offset = 1; offset <= 7; offset++) {
    const nextIndex = (currentIndex + offset) % 7;
    const nextDayKey = DAYS_OF_WEEK[nextIndex];
    const daySched = schedule[nextDayKey];

    if (daySched && daySched.isOpen && Array.isArray(daySched.slots) && daySched.slots.length > 0) {
      const firstSlot = daySched.slots[0];
      const dayWord = offset === 1 ? 'tomorrow' : `on ${DAY_LABELS[nextDayKey]}`;
      return `${dayWord} at ${formatTime12h(firstSlot.open)}`;
    }
  }

  return null;
}

export const businessHoursService = {
  DAYS_OF_WEEK,
  DAY_LABELS,
  DEFAULT_BUSINESS_HOURS,
  formatTime12h,
  timeToMinutes,
  getNowInTimezone,
  calculateBusinessStatus,
  getLiveStatus: calculateBusinessStatus
};
