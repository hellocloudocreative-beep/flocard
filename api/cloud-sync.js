import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://ekycoxwtwratujezngep.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY || 'sb_secret_DVTVdCekywmyjn0IYLj1Fg_Y7ty8nbG';

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    storageKey: 'flocard-serverless-admin',
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

export default async function handler(req, res) {
  // CORS support
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
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

        // Generate deterministic slug for cloud persistence in profiles table
        const baseSlug = (cust.slug || cust.name || (cleanEmail ? cleanEmail.split('@')[0] : 'cust'))
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '') || 'cust';

        let userSlug = cust.slug;
        if (!userSlug) {
          try {
            const { data: existingProf } = await adminClient.from('profiles').select('slug').eq('name', cust.name).maybeSingle();
            if (existingProf?.slug) {
              userSlug = existingProf.slug;
            } else {
              userSlug = baseSlug;
            }
          } catch (_) {
            userSlug = baseSlug;
          }
        }

        // Persist customer as first-class entity in Supabase profiles table for universal multi-admin sync
        try {
          const profPayload = {
            slug: userSlug || baseSlug,
            name: cust.name || 'Valued Client',
            email: cleanEmail || null,
            phone: cust.phone || null,
            whatsapp: cust.whatsapp || cust.phone || null,
            company: cust.company || null,
            role: cust.role || 'customer',
            status: cust.status || 'active',
            services: cust.notes ? [{ note: cust.notes }] : [],
            updated_at: new Date().toISOString()
          };
          if (userId && uuidRegex.test(userId)) {
            profPayload.id = userId;
            if (isRealAuthUser) profPayload.user_id = userId;
          }
          await adminClient.from('profiles').upsert(profPayload, { onConflict: 'slug' });
        } catch (profErr) {
          console.warn('[CloudSync API] syncCustomer profile upsert note:', profErr.message);
        }

        return res.status(200).json({
          success: true,
          customer: {
            ...cust,
            id: userId || cust.id || `cust_${Date.now()}`,
            slug: userSlug || baseSlug
          }
        });
      }

      case 'deleteCustomer': {
        const { id, email, slug } = body;
        if (!id && !email && !slug) return res.status(400).json({ error: 'Missing customer identifier' });

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const targetEmails = new Set();
        if (email) targetEmails.add(email.toLowerCase().trim());

        // Find associated profile by exact id or slug
        try {
          if (id && uuidRegex.test(id)) {
            const { data: p } = await adminClient.from('profiles').select('id, user_id, email, slug').or(`id.eq.${id},user_id.eq.${id}`).maybeSingle();
            if (p?.email) targetEmails.add(p.email.toLowerCase().trim());
            if (p?.user_id && uuidRegex.test(p.user_id)) {
              try { await adminClient.auth.admin.deleteUser(p.user_id); } catch (_) {}
            }
          }
          if (slug) {
            const { data: p } = await adminClient.from('profiles').select('id, user_id, email, slug').eq('slug', slug).maybeSingle();
            if (p?.email) targetEmails.add(p.email.toLowerCase().trim());
            if (p?.user_id && uuidRegex.test(p.user_id)) {
              try { await adminClient.auth.admin.deleteUser(p.user_id); } catch (_) {}
            }
          }
        } catch (_) {}

        // Delete from Supabase Auth by direct id if UUID
        if (id && uuidRegex.test(id)) {
          try { await adminClient.auth.admin.deleteUser(id); } catch (_) {}
        }

        // Delete from profiles table by exact id or slug (NEVER by loose name)
        if (id && uuidRegex.test(id)) {
          try { await adminClient.from('profiles').delete().eq('id', id); } catch (_) {}
          try { await adminClient.from('profiles').delete().eq('user_id', id); } catch (_) {}
        }
        if (slug) {
          try { await adminClient.from('profiles').delete().eq('slug', slug); } catch (_) {}
        }
        for (const em of targetEmails) {
          try { await adminClient.from('profiles').delete().eq('email', em); } catch (_) {}
        }

        return res.status(200).json({ success: true });
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
        const { id } = body;
        if (!id) return res.status(400).json({ error: 'Missing order identifier' });
        try {
          await adminClient.from('orders').delete().or(`id.eq.${id},order_reference.eq.${id}`);
          await adminClient.from('card_designs').delete().eq('order_id', id);
        } catch (_) {}
        return res.status(200).json({ success: true });
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
        const orderRow = {
          order_reference: payload.orderReference || payload.id,
          customer_name: payload.customerName || '',
          customer_email: payload.customerEmail || '',
          customer_phone: payload.customerPhone || '',
          company: payload.company || '',
          status: payload.status || 'new_order',
          shipping_address: payload.shippingAddress || '',
          total_amount: Number(payload.totalAmount || 0),
          created_at: payload.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        if (payload.id && uuidRegex.test(payload.id)) {
          orderRow.id = payload.id;
        }
        let { error } = await adminClient.from('orders').upsert(orderRow, { onConflict: 'order_reference' });
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ success: true });
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
        const [profilesRes, cardsRes, designsRes, ordersRes, usersRes, invoicesRes] = await Promise.all([
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
          })()
        ]);

        return res.status(200).json({
          success: true,
          profiles: profilesRes.data || [],
          cards: cardsRes.data || [],
          designs: designsRes.data || [],
          orders: ordersRes.data || [],
          users: usersRes.data?.users || [],
          invoices: invoicesRes?.data || []
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
