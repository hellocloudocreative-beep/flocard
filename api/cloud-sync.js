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

        if (cleanEmail) {
          try {
            const { data: usersData } = await adminClient.auth.admin.listUsers();
            const existing = usersData?.users?.find(u => u.email?.toLowerCase().trim() === cleanEmail);
            if (existing) {
              userId = existing.id;
              isRealAuthUser = true;
            }
          } catch (listErr) {
            console.warn('[CloudSync API] listUsers note:', listErr.message);
          }

          if (!userId) {
            try {
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
            } catch (createErr) {
              console.warn('[CloudSync API] createUser note:', createErr.message);
            }
          }
        }

        if (!userId) {
          userId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });
        }

        const rawSlug = (cust.slug || cust.name || (cleanEmail ? cleanEmail.split('@')[0] : 'cust'))
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '') || 'cust';

        let userSlug = cust.slug;
        if (!userSlug) {
          try {
            const { data: existingProf } = await adminClient.from('profiles').select('slug').eq('id', userId).maybeSingle();
            if (existingProf && existingProf.slug) {
              userSlug = existingProf.slug;
            } else {
              userSlug = rawSlug;
            }
          } catch (_) {
            userSlug = rawSlug;
          }
        }

        // Also ensure profile is persisted in Supabase profiles table for universal cloud sync
        try {
          const profPayload = {
            slug: userSlug || rawSlug,
            name: cust.name,
            email: cleanEmail || null,
            phone: cust.phone || null,
            company: cust.company || null,
            status: cust.status || 'active',
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
            id: userId,
            slug: userSlug || rawSlug
          }
        });
      }

      case 'deleteCustomer': {
        const { id, email, slug, name } = body;
        if (!id && !email && !slug && !name) return res.status(400).json({ error: 'Missing customer identifier' });

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const targetEmails = new Set();
        if (email) targetEmails.add(email.toLowerCase().trim());

        // Find any profile associated with this id, slug, or email to capture associated emails & user_ids
        try {
          if (id && uuidRegex.test(id)) {
            const { data: p } = await adminClient.from('profiles').select('id, user_id, email, slug, name').or(`id.eq.${id},user_id.eq.${id}`).maybeSingle();
            if (p?.email) targetEmails.add(p.email.toLowerCase().trim());
            if (p?.user_id && uuidRegex.test(p.user_id)) {
              try { await adminClient.auth.admin.deleteUser(p.user_id); } catch (_) {}
            }
          }
          if (slug) {
            const { data: p } = await adminClient.from('profiles').select('id, user_id, email, slug, name').eq('slug', slug).maybeSingle();
            if (p?.email) targetEmails.add(p.email.toLowerCase().trim());
            if (p?.user_id && uuidRegex.test(p.user_id)) {
              try { await adminClient.auth.admin.deleteUser(p.user_id); } catch (_) {}
            }
          }
          if (name) {
            const { data: pList } = await adminClient.from('profiles').select('id, user_id, email, slug, name').ilike('name', name);
            for (const p of (pList || [])) {
              if (p?.email) targetEmails.add(p.email.toLowerCase().trim());
              if (p?.user_id && uuidRegex.test(p.user_id)) {
                try { await adminClient.auth.admin.deleteUser(p.user_id); } catch (_) {}
              }
            }
          }
        } catch (_) {}

        // Delete from Supabase Auth by direct id if UUID
        if (id && uuidRegex.test(id)) {
          try { await adminClient.auth.admin.deleteUser(id); } catch (_) {}
        }

        // Delete all matching users in Supabase Auth by email
        if (targetEmails.size > 0) {
          try {
            const { data: usersData } = await adminClient.auth.admin.listUsers();
            for (const u of (usersData?.users || [])) {
              if (u.email && targetEmails.has(u.email.toLowerCase().trim())) {
                try { await adminClient.auth.admin.deleteUser(u.id); } catch (_) {}
              }
            }
          } catch (_) {}
        }

        // 2. Delete from profiles table
        if (id) {
          try { await adminClient.from('profiles').delete().eq('id', id); } catch (_) {}
          try { await adminClient.from('profiles').delete().eq('user_id', id); } catch (_) {}
        }
        for (const em of targetEmails) {
          try { await adminClient.from('profiles').delete().ilike('email', em); } catch (_) {}
        }
        if (slug) {
          try { await adminClient.from('profiles').delete().eq('slug', slug); } catch (_) {}
        }
        if (name) {
          try { await adminClient.from('profiles').delete().ilike('name', name); } catch (_) {}
        }

        // 3. Purge orphaned card designs for this customer
        if (id) {
          try { await adminClient.from('card_designs').delete().eq('user_id', id); } catch (_) {}
        }
        for (const em of targetEmails) {
          try {
            const { data: allDesigns } = await adminClient.from('card_designs').select('id, front_config');
            for (const des of (allDesigns || [])) {
              const desEmail = des.front_config?.customerEmail || des.front_config?.email;
              if (desEmail && desEmail.toLowerCase().trim() === em) {
                await adminClient.from('card_designs').delete().eq('id', des.id);
              }
            }
          } catch (_) {}
        }

        // 4. Disassociate cards assigned to this customer so they return to stock
        if (id) {
          try { await adminClient.from('nfc_cards').update({ customer_id: null, profile_slug: null, status: 'in_stock' }).eq('customer_id', id); } catch (_) {}
        }
        if (slug) {
          try { await adminClient.from('nfc_cards').update({ customer_id: null, profile_slug: null, status: 'in_stock' }).eq('profile_slug', slug); } catch (_) {}
        }

        // 5. Purge customer orders
        if (id) {
          try { await adminClient.from('orders').delete().eq('customer_id', id); } catch (_) {}
        }
        for (const em of targetEmails) {
          try { await adminClient.from('orders').delete().ilike('customer_email', em); } catch (_) {}
        }

        return res.status(200).json({ success: true });
      }

      case 'deleteProfile': {
        const { id, slug, email, name } = body;
        if (!id && !slug && !email && !name) return res.status(400).json({ error: 'Missing profile identifier' });

        if (id) {
          try { await adminClient.from('profiles').delete().eq('id', id); } catch (_) {}
          try { await adminClient.from('profiles').delete().eq('user_id', id); } catch (_) {}
        }
        if (slug) {
          try { await adminClient.from('profiles').delete().eq('slug', slug); } catch (_) {}
        }
        if (email) {
          try { await adminClient.from('profiles').delete().ilike('email', email); } catch (_) {}
        }
        if (name) {
          try { await adminClient.from('profiles').delete().ilike('name', name); } catch (_) {}
        }

        // Also disassociate NFC cards pointing to this deleted profile
        if (slug) {
          try { await adminClient.from('nfc_cards').update({ profile_slug: null }).eq('profile_slug', slug); } catch (_) {}
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
        if (!validStatuses.includes(payload.status)) {
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
        const payload = body.card;
        if (!payload) return res.status(400).json({ error: 'Missing card' });
        let { error } = await adminClient.from('nfc_cards').upsert(payload, { onConflict: 'card_code' });
        if (error && error.code === '23503' && payload.customer_id) {
          delete payload.customer_id;
          const retry = await adminClient.from('nfc_cards').upsert(payload, { onConflict: 'card_code' });
          error = retry.error;
        }
        if (error) return res.status(500).json({ error: error.message });
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
