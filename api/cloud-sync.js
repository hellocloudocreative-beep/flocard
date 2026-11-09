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
              const { data: slugTaken } = await adminClient.from('profiles').select('id').eq('slug', rawSlug).maybeSingle();
              if (slugTaken && slugTaken.id !== userId) {
                userSlug = `${rawSlug}-${userId.slice(0, 6)}`;
              } else {
                userSlug = rawSlug;
              }
            }
          } catch (_) {
            userSlug = `${rawSlug}-${userId.slice(0, 6)}`;
          }
        }

        const profilePayload = {
          id: userId,
          user_id: isRealAuthUser ? userId : null,
          slug: userSlug,
          name: cust.name || 'Valued Customer',
          email: cleanEmail || `${userSlug}@client.flocard.in`,
          phone: cust.phone || '',
          company: cust.company || '',
          role: 'customer',
          status: cust.status || 'active',
          theme: 'purple',
          updated_at: new Date().toISOString()
        };

        let { error: profErr } = await adminClient.from('profiles').upsert(profilePayload, { onConflict: 'id' });
        if (profErr && profErr.code === '23503' && profilePayload.user_id) {
          profilePayload.user_id = null;
          const retry = await adminClient.from('profiles').upsert(profilePayload, { onConflict: 'id' });
          profErr = retry.error;
        }

        if (profErr) {
          return res.status(500).json({ error: profErr.message });
        }

        return res.status(200).json({
          success: true,
          customer: {
            ...cust,
            id: userId,
            slug: userSlug
          }
        });
      }

      case 'deleteCustomer': {
        const { id, email, slug } = body;
        if (!id && !email && !slug) return res.status(400).json({ error: 'Missing customer identifier' });

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        // 1. Delete from Supabase Auth if UUID or by matching email
        if (id && uuidRegex.test(id)) {
          await adminClient.auth.admin.deleteUser(id).catch(() => {});
        } else if (email) {
          try {
            const { data: usersData } = await adminClient.auth.admin.listUsers();
            const matched = usersData?.users?.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
            if (matched?.id) {
              await adminClient.auth.admin.deleteUser(matched.id).catch(() => {});
            }
          } catch (_) {}
        }

        // 2. Delete from profiles table by id, user_id, email, or slug
        if (id) {
          await adminClient.from('profiles').delete().eq('id', id).catch(() => {});
          await adminClient.from('profiles').delete().eq('user_id', id).catch(() => {});
        }
        if (email) {
          await adminClient.from('profiles').delete().ilike('email', email).catch(() => {});
        }
        if (slug) {
          await adminClient.from('profiles').delete().eq('slug', slug).catch(() => {});
        }

        // 3. Purge orphaned card designs for this customer
        if (id) {
          await adminClient.from('card_designs').delete().eq('user_id', id).catch(() => {});
        }

        // 4. Disassociate cards assigned to this customer so they return to stock
        if (id) {
          await adminClient.from('nfc_cards').update({ customer_id: null, profile_slug: null, status: 'in_stock' }).eq('customer_id', id).catch(() => {});
        }
        if (slug) {
          await adminClient.from('nfc_cards').update({ customer_id: null, profile_slug: null, status: 'in_stock' }).eq('profile_slug', slug).catch(() => {});
        }

        return res.status(200).json({ success: true });
      }

      case 'deleteProfile': {
        const { id, slug, email } = body;
        if (!id && !slug && !email) return res.status(400).json({ error: 'Missing profile identifier' });

        if (id) {
          await adminClient.from('profiles').delete().eq('id', id).catch(() => {});
          await adminClient.from('profiles').delete().eq('user_id', id).catch(() => {});
        }
        if (slug) {
          await adminClient.from('profiles').delete().eq('slug', slug).catch(() => {});
        }
        if (email) {
          await adminClient.from('profiles').delete().ilike('email', email).catch(() => {});
        }

        // Also disassociate NFC cards pointing to this deleted profile
        if (slug) {
          await adminClient.from('nfc_cards').update({ profile_slug: null }).eq('profile_slug', slug).catch(() => {});
        }

        return res.status(200).json({ success: true, message: 'Profile permanently deleted' });
      }

      case 'deleteCard': {
        const { id, cardCode } = body;
        if (!id && !cardCode) return res.status(400).json({ error: 'Missing card identifier' });
        if (id) {
          await adminClient.from('nfc_cards').delete().eq('id', id).catch(() => {});
        }
        if (cardCode) {
          await adminClient.from('nfc_cards').delete().eq('card_code', cardCode).catch(() => {});
        }
        return res.status(200).json({ success: true });
      }

      case 'deleteDesign': {
        const { id } = body;
        if (!id) return res.status(400).json({ error: 'Missing design identifier' });
        await adminClient.from('card_designs').delete().eq('id', id).catch(() => {});
        return res.status(200).json({ success: true });
      }

      case 'deleteOrder': {
        const { id } = body;
        if (!id) return res.status(400).json({ error: 'Missing order identifier' });
        try {
          await adminClient.from('orders').delete().or(`id.eq.${id},order_reference.eq.${id}`).catch(() => {});
          await adminClient.from('card_designs').delete().eq('order_id', id).catch(() => {});
        } catch (_) {}
        return res.status(200).json({ success: true });
      }

      case 'resetAllData': {
        try {
          await adminClient.from('card_designs').delete().neq('id', '___preserve___').catch(() => {});
          await adminClient.from('profiles').delete().neq('role', 'owner').catch(() => {});
          await adminClient.from('orders').delete().neq('id', '___preserve___').catch(() => {});
          await adminClient.from('nfc_cards').update({ customer_id: null, profile_slug: null, status: 'in_stock' }).neq('id', '___preserve___').catch(() => {});
        } catch (_) {}
        return res.status(200).json({ success: true });
      }

      case 'syncProfile': {
        const payload = body.profile;
        if (!payload) return res.status(400).json({ error: 'Missing profile' });
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

      case 'fetchData': {
        const [profilesRes, cardsRes, designsRes, usersRes] = await Promise.all([
          adminClient.from('profiles').select('*').order('created_at', { ascending: false }),
          adminClient.from('nfc_cards').select('*').order('created_at', { ascending: false }),
          adminClient.from('card_designs').select('*').order('created_at', { ascending: false }),
          adminClient.auth.admin.listUsers().catch(() => ({ data: { users: [] } }))
        ]);

        return res.status(200).json({
          success: true,
          profiles: profilesRes.data || [],
          cards: cardsRes.data || [],
          designs: designsRes.data || [],
          users: usersRes.data?.users || []
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
