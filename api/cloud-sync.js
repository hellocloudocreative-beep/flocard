import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://myfznpeynuvftqfinxzb.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY || 'sb_secret_DVTVdCekywmyjn0IYLj1Fg_Y7ty8nbG';

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    storageKey: 'flocard-serverless-admin',
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

function mapToDbOrderStatus(s) {
  if (!s) return 'design_submitted';
  const norm = String(s).toLowerCase().trim();
  if (norm === 'new_order' || norm === 'new_request' || norm === 'pending' || norm === 'draft' || norm === 'submitted' || norm === 'new' || norm === 'design_submitted') return 'design_submitted';
  if (norm === 'reviewing' || norm === 'in_review' || norm === 'design_review' || norm === 'awaiting_confirmation') return 'design_submitted';
  if (norm === 'approved' || norm === 'artwork_approved' || norm === 'awaiting_payment' || norm === 'payment_confirmed') return 'artwork_approved';
  if (norm === 'manufacturing' || norm === 'manufacturing_started' || norm === 'production') return 'manufacturing_started';
  if (norm === 'quality_check' || norm === 'quality_inspection') return 'quality_inspection';
  if (norm === 'dispatched' || norm === 'shipped') return 'dispatched';
  if (norm === 'delivered' || norm === 'completed') return 'delivered';
  if (norm === 'revision_required') return 'revision_required';
  if (norm === 'on_hold') return 'on_hold';
  if (norm === 'manufacturing_issue') return 'manufacturing_issue';
  if (norm === 'delivery_issue') return 'delivery_issue';
  if (norm === 'cancelled' || norm === 'rejected') return 'cancelled';
  return 'design_submitted';
}

export default async function handler(req, res) {
  // CORS support
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, apikey'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (_) {}
  }
  body = body || {};

  const action = body.action || req.query?.action;

  try {
    switch (action) {
      case 'syncCustomer': {
        const cust = body.customer;
        if (!cust) return res.status(400).json({ error: 'Missing customer payload' });

        const cleanEmail = cust.email ? String(cust.email).toLowerCase().trim() : '';
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        let userId = (cust.id && uuidRegex.test(cust.id)) ? cust.id : null;
        let isRealAuthUser = false;

        // Try to match or create user in Supabase Auth if clean email is provided
        if (cleanEmail) {
          try {
            const { data: usersData } = await adminClient.auth.admin.listUsers();
            const existing = usersData?.users?.find(u => u.email?.toLowerCase().trim() === cleanEmail);
            if (existing) {
              userId = existing.id;
              isRealAuthUser = true;
            } else {
              const { data: createData, error: createErr } = await adminClient.auth.admin.createUser({
                email: cleanEmail,
                email_confirm: true,
                user_metadata: {
                  name: cust.name || cleanEmail.split('@')[0],
                  company: cust.company || '',
                  phone: cust.phone || '',
                  role: cust.role || 'customer',
                  status: cust.status || 'active'
                }
              });
              if (!createErr && createData?.user) {
                userId = createData.user.id;
                isRealAuthUser = true;
              }
            }
          } catch (authErr) {
            console.warn('[CloudSync API] auth operation note:', authErr.message);
          }
        }

        // Always guarantee a valid UUID so primary key is rock-solid
        if (!userId) {
          if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            userId = crypto.randomUUID();
          } else {
            userId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
              const r = (Math.random() * 16) | 0;
              const v = c === 'x' ? r : (r & 0x3) | 0x8;
              return v.toString(16);
            });
          }
        }

        // Generate deterministic slug for cloud persistence in profiles table
        const baseSlug = (cust.slug || cust.name || (cleanEmail ? cleanEmail.split('@')[0] : 'cust'))
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '') || 'cust';

        let userSlug = cust.slug;
        if (!userSlug) {
          // Check if profile exists with same email or phone
          if (cleanEmail) {
            const { data: existingProf } = await adminClient.from('profiles').select('id, slug').eq('email', cleanEmail).maybeSingle();
            if (existingProf?.slug) {
              userSlug = existingProf.slug;
              if (existingProf.id) userId = existingProf.id;
            }
          }
          if (!userSlug && cust.phone) {
            const { data: existingProfPhone } = await adminClient.from('profiles').select('id, slug').eq('phone', cust.phone).maybeSingle();
            if (existingProfPhone?.slug) {
              userSlug = existingProfPhone.slug;
              if (existingProfPhone.id) userId = existingProfPhone.id;
            }
          }
          if (!userSlug) {
            const { data: slugTaken } = await adminClient.from('profiles').select('id').eq('slug', baseSlug).maybeSingle();
            if (slugTaken && slugTaken.id !== userId) {
              const suffix = Math.random().toString(36).substring(2, 6);
              userSlug = `${baseSlug}-${suffix}`;
            } else {
              userSlug = baseSlug;
            }
          }
        }

        // Persist customer as first-class entity in Supabase profiles table for universal multi-admin sync
        let savedRow = null;
        try {
          const finalSlug = userSlug || baseSlug;
          // Check if profile already exists with this slug to keep existing id
          const { data: existingProfRow } = await adminClient.from('profiles').select('id, user_id').eq('slug', finalSlug).maybeSingle();

          const profPayload = {
            slug: finalSlug,
            name: cust.name || 'Valued Client',
            email: cleanEmail || null,
            phone: cust.phone || null,
            whatsapp: cust.whatsapp || cust.phone || null,
            company: cust.company || null,
            role: 'customer',
            status: cust.status || 'active',
            theme: 'purple',
            services: cust.notes ? [{ note: cust.notes }] : [],
            updated_at: new Date().toISOString()
          };

          if (existingProfRow?.id) {
            profPayload.id = existingProfRow.id;
            if (existingProfRow.user_id) profPayload.user_id = existingProfRow.user_id;
          } else if (userId) {
            profPayload.id = userId;
            if (isRealAuthUser) profPayload.user_id = userId;
          }

          let { data, error: profErr } = await adminClient
            .from('profiles')
            .upsert(profPayload, { onConflict: 'slug' })
            .select()
            .maybeSingle();

          if (profErr) {
            console.warn('[CloudSync API] syncCustomer primary profile upsert retry note:', profErr.message);
            // Fallback retry without user_id and without forced id
            delete profPayload.user_id;
            delete profPayload.id;
            const retry = await adminClient
              .from('profiles')
              .upsert(profPayload, { onConflict: 'slug' })
              .select()
              .maybeSingle();
            if (retry.data) {
              savedRow = retry.data;
            }
          } else {
            savedRow = data;
          }
        } catch (profErr) {
          console.warn('[CloudSync API] syncCustomer profile upsert note:', profErr.message);
        }

        return res.status(200).json({
          success: true,
          customer: {
            ...cust,
            id: savedRow?.id || userId,
            slug: savedRow?.slug || userSlug || baseSlug,
            role: 'customer'
          }
        });
      }

      case 'deleteCustomer': {
        const { id, email, slug, name, phone } = body;
        if (!id && !email && !slug && !name && !phone) return res.status(400).json({ error: 'Missing customer identifier' });

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const targetEmails = new Set();
        if (email) targetEmails.add(email.toLowerCase().trim());
        const targetIds = new Set();
        if (id) targetIds.add(String(id).trim());
        const targetSlugs = new Set();
        if (slug) targetSlugs.add(String(slug).trim().toLowerCase());
        const targetPhones = new Set();
        if (phone) targetPhones.add(String(phone).trim());
        const targetNames = new Set();
        if (name) targetNames.add(String(name).trim());

        // Find associated profile by exact id, user_id, slug, email, phone, or name
        try {
          if (id && uuidRegex.test(id)) {
            const { data: pList } = await adminClient.from('profiles').select('id, user_id, email, slug, phone, name').or(`id.eq.${id},user_id.eq.${id}`);
            for (const p of (pList || [])) {
              if (p?.email) targetEmails.add(p.email.toLowerCase().trim());
              if (p?.id) targetIds.add(String(p.id));
              if (p?.user_id) targetIds.add(String(p.user_id));
              if (p?.slug) targetSlugs.add(String(p.slug).toLowerCase());
              if (p?.phone) targetPhones.add(String(p.phone).trim());
            }
          }
          if (slug) {
            const { data: pList } = await adminClient.from('profiles').select('id, user_id, email, slug, phone, name').eq('slug', slug);
            for (const p of (pList || [])) {
              if (p?.email) targetEmails.add(p.email.toLowerCase().trim());
              if (p?.id) targetIds.add(String(p.id));
              if (p?.user_id) targetIds.add(String(p.user_id));
              if (p?.slug) targetSlugs.add(String(p.slug).toLowerCase());
              if (p?.phone) targetPhones.add(String(p.phone).trim());
            }
          }
          if (email) {
            const { data: pList } = await adminClient.from('profiles').select('id, user_id, email, slug, phone, name').ilike('email', email.trim());
            for (const p of (pList || [])) {
              if (p?.email) targetEmails.add(p.email.toLowerCase().trim());
              if (p?.id) targetIds.add(String(p.id));
              if (p?.user_id) targetIds.add(String(p.user_id));
              if (p?.slug) targetSlugs.add(String(p.slug).toLowerCase());
              if (p?.phone) targetPhones.add(String(p.phone).trim());
            }
          }
          if (phone) {
            const { data: pList } = await adminClient.from('profiles').select('id, user_id, email, slug, phone, name').eq('phone', phone.trim());
            for (const p of (pList || [])) {
              if (p?.email) targetEmails.add(p.email.toLowerCase().trim());
              if (p?.id) targetIds.add(String(p.id));
              if (p?.user_id) targetIds.add(String(p.user_id));
              if (p?.slug) targetSlugs.add(String(p.slug).toLowerCase());
            }
          }
          if (name) {
            const { data: pList } = await adminClient.from('profiles').select('id, user_id, email, slug, phone, name').eq('role', 'customer').ilike('name', name.trim());
            for (const p of (pList || [])) {
              if (p?.email) targetEmails.add(p.email.toLowerCase().trim());
              if (p?.id) targetIds.add(String(p.id));
              if (p?.user_id) targetIds.add(String(p.user_id));
              if (p?.slug) targetSlugs.add(String(p.slug).toLowerCase());
            }
          }
        } catch (_) {}

        // Delete permanently from Supabase Auth by matching user ID or matching email
        try {
          const { data: usersData } = await adminClient.auth.admin.listUsers();
          if (usersData?.users) {
            for (const u of usersData.users) {
              const uEmail = (u.email || '').toLowerCase().trim();
              const uId = String(u.id);
              if (targetEmails.has(uEmail) || targetIds.has(uId)) {
                try {
                  await adminClient.auth.admin.deleteUser(u.id);
                } catch (_) {}
              }
            }
          }
        } catch (_) {}

        // Delete permanently from profiles table by exact id, user_id, slug, email, phone, or customer name
        for (const tId of targetIds) {
          if (uuidRegex.test(tId)) {
            try { await adminClient.from('profiles').delete().eq('id', tId); } catch (_) {}
            try { await adminClient.from('profiles').delete().eq('user_id', tId); } catch (_) {}
          }
        }
        for (const tSlug of targetSlugs) {
          try { await adminClient.from('profiles').delete().eq('slug', tSlug); } catch (_) {}
        }
        for (const em of targetEmails) {
          try { await adminClient.from('profiles').delete().ilike('email', em); } catch (_) {}
        }
        for (const ph of targetPhones) {
          try { await adminClient.from('profiles').delete().eq('phone', ph); } catch (_) {}
        }
        for (const nm of targetNames) {
          try { await adminClient.from('profiles').delete().eq('role', 'customer').ilike('name', nm); } catch (_) {}
        }

        // Record permanent tombstone in audit_logs so every device on refresh respects this deletion
        try {
          const tombstonePayload = JSON.stringify({
            ids: Array.from(targetIds),
            emails: Array.from(targetEmails),
            slugs: Array.from(targetSlugs),
            phones: Array.from(targetPhones),
            names: Array.from(targetNames),
            deletedAt: new Date().toISOString()
          });

          await adminClient.from('audit_logs').insert({
            action: 'DELETE_CUSTOMER',
            entity: 'customer',
            actor_email: 'admin@flocard.in',
            details: tombstonePayload
          });
        } catch (auditErr) {
          console.warn('[deleteCustomer] audit_logs insert note:', auditErr.message);
        }

        return res.status(200).json({
          success: true,
          deleted: {
            ids: Array.from(targetIds),
            emails: Array.from(targetEmails),
            slugs: Array.from(targetSlugs)
          }
        });
      }

      case 'deleteProfile': {
        const { id, slug, email } = body;
        if (!id && !slug && !email) return res.status(400).json({ error: 'Missing profile identifier' });

        if (id) {
          try { await adminClient.from('profiles').delete().eq('id', id); } catch (_) {}
          try { await adminClient.from('profiles').delete().eq('user_id', id); } catch (_) {}
        }
        if (slug) {
          try { await adminClient.from('profiles').delete().eq('slug', slug); } catch (_) {}
        }
        if (email) {
          try { await adminClient.from('profiles').delete().eq('email', email); } catch (_) {}
        }

        return res.status(200).json({ success: true, message: 'Profile permanently deleted' });
      }

      case 'deleteCard': {
        const { id, cardCode } = body;
        if (!id && !cardCode) return res.status(400).json({ error: 'Missing card identifier' });
        if (id) {
          try { await adminClient.from('nfc_cards').delete().eq('id', id); } catch (_) {}
        }
        if (cardCode) {
          try { await adminClient.from('nfc_cards').delete().eq('card_code', cardCode); } catch (_) {}
        }
        return res.status(200).json({ success: true });
      }

      case 'deleteDesign': {
        const { id } = body;
        if (!id) return res.status(400).json({ error: 'Missing design identifier' });
        try { await adminClient.from('card_designs').delete().eq('id', id); } catch (_) {}
        try {
          const { data: allDesigns } = await adminClient.from('card_designs').select('id, front_config');
          for (const des of (allDesigns || [])) {
            if (des.front_config?._localId === id) {
              await adminClient.from('card_designs').delete().eq('id', des.id);
            }
          }
        } catch (_) {}
        return res.status(200).json({ success: true });
      }

      case 'deleteOrder': {
        const { id, orderReference } = body;
        const target = id || orderReference;
        if (!target) return res.status(400).json({ error: 'Missing order identifier' });
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const targetRefs = new Set([target, id, orderReference].filter(Boolean));

        // 1. Delete from orders table by UUID and by order_reference safely
        for (const r of targetRefs) {
          if (uuidRegex.test(r)) {
            try { await adminClient.from('orders').delete().eq('id', r); } catch (_) {}
          }
          try { await adminClient.from('orders').delete().eq('order_reference', r); } catch (_) {}
        }

        // 2. Remove embedded printOrder from card_designs so it never resurrects
        try {
          const { data: allDesigns } = await adminClient.from('card_designs').select('id, front_config');
          for (const des of (allDesigns || [])) {
            const po = des.front_config?.printOrder;
            if (po && (targetRefs.has(po.id) || targetRefs.has(po.orderReference))) {
              const updatedFront = { ...des.front_config };
              delete updatedFront.printOrder;
              await adminClient.from('card_designs').update({ front_config: updatedFront }).eq('id', des.id);
            }
          }
        } catch (_) {}

        // 3. Persist authoritative tombstone in audit_logs so every other admin account wipes it on refresh
        try {
          const tombstonePayload = JSON.stringify({
            ids: Array.from(targetRefs),
            orderReferences: Array.from(targetRefs),
            deletedAt: new Date().toISOString()
          });

          await adminClient.from('audit_logs').insert({
            action: 'DELETE_ORDER',
            entity: 'order',
            actor_email: 'admin@flocard.in',
            details: tombstonePayload
          });
        } catch (_) {}

        return res.status(200).json({ success: true, deleted: Array.from(targetRefs) });
      }

      case 'resetOrdersInvoicesProfiles': {
        try {
          await adminClient.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        } catch (_) {}
        try {
          await adminClient.from('invoices').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        } catch (_) {}
        try {
          await adminClient.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        } catch (_) {}
        return res.status(200).json({ success: true });
      }

      case 'resetAllData': {
        const OWNER_EMAILS = ['flocard', 'flocard@flocard.in', 'hello.flocard@gmail.com', 'admin@flocard.in'];
        try {
          await adminClient.from('card_designs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        } catch (_) {}
        try {
          await adminClient.from('nfc_cards').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        } catch (_) {}
        try {
          await adminClient.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        } catch (_) {}
        try {
          await adminClient.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        } catch (_) {}
        try {
          const { data: usersData } = await adminClient.auth.admin.listUsers();
          for (const u of (usersData?.users || [])) {
            const uEmail = (u.email || '').toLowerCase().trim();
            if (!OWNER_EMAILS.includes(uEmail)) {
              try { await adminClient.auth.admin.deleteUser(u.id); } catch (_) {}
            }
          }
        } catch (_) {}
        return res.status(200).json({ success: true });
      }

      case 'syncProfile': {
        const payload = body.profile;
        if (!payload) return res.status(400).json({ error: 'Missing profile' });

        // Guard: Prevent legacy demo profile resurrection
        if (payload.slug === 'alex' || payload.slug === 'your-name' || payload.name === 'Alex Rivera' || payload.name === 'Your Name') {
          return res.status(200).json({ success: true, message: 'Ignored legacy demo profile' });
        }

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (payload.id && !uuidRegex.test(payload.id)) {
          delete payload.id;
        }
        if (payload.user_id && !uuidRegex.test(payload.user_id)) {
          delete payload.user_id;
        }
        if (!payload.slug) {
          payload.slug = `prof-${Date.now()}`;
        }
        payload.slug = String(payload.slug).trim().toLowerCase();

        const validStatuses = ['active', 'suspended', 'draft'];
        if (payload.status === 'private' || payload.isPrivate) {
          payload.status = 'draft';
        } else if (!validStatuses.includes(payload.status)) {
          payload.status = 'active';
        }

        let { error } = await adminClient.from('profiles').upsert(payload, { onConflict: 'slug' });
        if (error && error.code === '23503' && payload.user_id) {
          delete payload.user_id;
          const retry = await adminClient.from('profiles').upsert(payload, { onConflict: 'slug' });
          error = retry.error;
        }
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ success: true });
      }

      case 'syncCard': {
        const payload = { ...body.card };
        if (!payload || !payload.card_code) return res.status(400).json({ error: 'Missing card or card_code' });

        payload.chip_type = payload.chip_type || 'NTAG216 (888 Bytes)';
        payload.batch = payload.batch || 'Batch-A';
        payload.edition = payload.edition || 'purple';
        payload.status = payload.status || 'in_stock';
        payload.updated_at = new Date().toISOString();

        // Check and satisfy profile_slug foreign key if assigned
        if (payload.profile_slug) {
          try {
            const { data: profExists } = await adminClient.from('profiles').select('slug').eq('slug', payload.profile_slug).maybeSingle();
            if (!profExists) {
              await adminClient.from('profiles').insert({
                slug: payload.profile_slug,
                name: payload.profile_name || payload.customer_name || payload.profile_slug,
                status: 'active'
              });
            }
          } catch (_) {}
        }

        // Only send customer_id if it's a valid Supabase Auth UUID to prevent FK 23503 violations
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (payload.customer_id && !uuidRegex.test(payload.customer_id)) {
          delete payload.customer_id;
        }

        let { error } = await adminClient.from('nfc_cards').upsert(payload, { onConflict: 'card_code' });
        if (error && error.code === '23503') {
          if (payload.customer_id) {
            delete payload.customer_id;
            const retry = await adminClient.from('nfc_cards').upsert(payload, { onConflict: 'card_code' });
            error = retry.error;
          }
        }

        if (error) {
          console.warn('[CloudSync API] syncCard upsert warning:', error.message);
          return res.status(200).json({ success: true, warning: error.message });
        }
        return res.status(200).json({ success: true });
      }

      case 'syncDesign': {
        const payload = body.design;
        if (!payload) return res.status(400).json({ error: 'Missing design' });
        let { error } = await adminClient.from('card_designs').upsert(payload, { onConflict: 'id' });
        if (error && error.code === '23503' && payload.user_id) {
          delete payload.user_id;
          const retry = await adminClient.from('card_designs').upsert(payload, { onConflict: 'id' });
          error = retry.error;
        }
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ success: true });
      }

      case 'syncOrder': {
        const payload = body.order;
        if (!payload) return res.status(400).json({ error: 'Missing order' });
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const ordRef = payload.orderReference || payload.id || `FLC-ORD-${Math.floor(1000 + Math.random() * 9000)}`;
        const cName = (payload.customerName || payload.clientName || payload.customerDetails?.fullName || payload.customerDetails?.name || 'Valued Client').trim();
        const cEmail = (payload.customerEmail || payload.clientEmail || payload.customerDetails?.email || (cName ? `${cName.toLowerCase().replace(/[^a-z0-9]/g, '')}@flocard.in` : 'customer@flocard.in')).trim();
        const cPhone = (payload.customerPhone || payload.clientPhone || payload.customerDetails?.phone || '').trim();
        const cCompany = (payload.company || payload.customerDetails?.company || '').trim();
        const cAddress = (payload.shippingAddress || payload.shipping_address || payload.customerDetails?.address || '').trim();
        const dbStatus = mapToDbOrderStatus(payload.status);

        const orderRow = {
          order_reference: ordRef,
          customer_name: cName,
          customer_email: cEmail,
          customer_phone: cPhone || null,
          company: cCompany || null,
          status: dbStatus,
          shipping_address: cAddress || null,
          total_amount: Number(payload.totalAmount || payload.pricing?.totalAmount || 0),
          created_at: payload.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        if (payload.id && uuidRegex.test(payload.id)) {
          orderRow.id = payload.id;
        }

        try {
          const { error } = await adminClient.from('orders').upsert(orderRow, { onConflict: 'order_reference' });
          if (error) {
            console.warn('[CloudSync API] syncOrder primary upsert warning:', error.message);
          }
        } catch (e) {
          console.warn('[CloudSync API] syncOrder error:', e.message);
        }

        // Secondary bulletproof sync: Embed printOrder in card_designs table so it NEVER gets lost even if orders table had an issue!
        try {
          const designPayload = payload.design || {
            title: `${cName}'s Card Design`,
            edition: payload.edition || 'purple',
            front: payload.frontConfig || { name: cName, company: cCompany },
            back: payload.backConfig || {}
          };
          const designId = (payload.designId && uuidRegex.test(payload.designId))
            ? payload.designId
            : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = (Math.random()*16)|0; return (c==='x'?r:(r&0x3)|0x8).toString(16); }));

          const fullPrintOrderSnapshot = {
            ...payload,
            id: ordRef,
            orderReference: ordRef,
            customerName: cName,
            customerEmail: cEmail,
            customerPhone: cPhone,
            company: cCompany,
            shippingAddress: cAddress,
            status: payload.status || 'new_order',
            totalAmount: orderRow.total_amount
          };

          await adminClient.from('card_designs').upsert({
            id: designId,
            title: `${cName}'s Card Design`,
            edition: payload.edition || 'purple',
            front_config: {
              ...(designPayload.front || {}),
              name: cName,
              company: cCompany,
              orderId: ordRef,
              printOrder: fullPrintOrderSnapshot
            },
            back_config: designPayload.back || {},
            status: 'submitted',
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
        } catch (_) {}

        // Tertiary: Ensure the customer is persisted in profiles table so multi-admin CRM shows them
        try {
          if (cEmail && !cEmail.endsWith('@flocard.in')) {
            const baseSlug = (cName || cEmail.split('@')[0]).toLowerCase().replace(/[^a-z0-9]/g, '') || 'cust';
            await adminClient.from('profiles').upsert({
              slug: baseSlug,
              name: cName,
              email: cEmail,
              phone: cPhone || null,
              company: cCompany || null,
              role: 'customer',
              status: 'active',
              updated_at: new Date().toISOString()
            }, { onConflict: 'slug' });
          }
        } catch (_) {}

        return res.status(200).json({ success: true, order: { ...payload, orderReference: ordRef, status: payload.status || 'new_order' } });
      }

      case 'syncInvoice': {
        const payload = body.invoice;
        if (!payload) return res.status(400).json({ error: 'Missing invoice payload' });
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const invRow = {
          invoice_number: payload.invoiceNumber || payload.id,
          order_reference: payload.orderReference || payload.orderId || '',
          customer_email: payload.customerEmail || payload.billedTo?.email || '',
          customer_name: payload.customerName || payload.billedTo?.name || '',
          total_amount: Number(payload.totalAmount || payload.grandTotal || 0),
          tax_amount: Number(payload.taxAmount || payload.taxTotal || 0),
          metadata: payload,
          created_at: payload.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        if (payload.id && uuidRegex.test(payload.id)) {
          invRow.id = payload.id;
        }
        try {
          await adminClient.from('invoices').upsert(invRow, { onConflict: 'invoice_number' });
        } catch (_) {}
        return res.status(200).json({ success: true });
      }

      case 'deleteInvoice': {
        const { id, invoiceNumber } = body;
        const target = id || invoiceNumber;
        if (!target) return res.status(400).json({ error: 'Missing invoice identifier' });
        try {
          await adminClient.from('invoices').delete().or(`id.eq.${target},invoice_number.eq.${target}`);
        } catch (_) {}
        return res.status(200).json({ success: true });
      }

      case 'fetchData': {
        const [profilesRes, cardsRes, designsRes, ordersRes, usersRes, invoicesRes, tombstonesRes] = await Promise.all([
          adminClient.from('profiles').select('*').order('created_at', { ascending: false }),
          adminClient.from('nfc_cards').select('*').order('created_at', { ascending: false }),
          adminClient.from('card_designs').select('*').order('created_at', { ascending: false }),
          (async () => {
            try {
              return await adminClient.from('orders').select('*').order('created_at', { ascending: false });
            } catch (_) {
              return { data: [] };
            }
          })(),
          (async () => {
            try {
              return await adminClient.auth.admin.listUsers();
            } catch (_) {
              return { data: { users: [] } };
            }
          })(),
          (async () => {
            try {
              return await adminClient.from('invoices').select('*').order('created_at', { ascending: false });
            } catch (_) {
              return { data: [] };
            }
          })(),
          (async () => {
            try {
              return await adminClient
                .from('audit_logs')
                .select('action, details, created_at')
                .in('action', ['DELETE_CUSTOMER', 'DELETE_ORDER'])
                .order('created_at', { ascending: false })
                .limit(300);
            } catch (_) {
              return { data: [] };
            }
          })()
        ]);

        return res.status(200).json({
          success: true,
          profiles: profilesRes.data || [],
          cards: cardsRes.data || [],
          designs: designsRes.data || [],
          orders: ordersRes.data || [],
          users: usersRes.data?.users || [],
          invoices: invoicesRes?.data || [],
          tombstones: tombstonesRes?.data || []
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    console.error('[CloudSync API Error]:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
