/* ==========================================================================
   DATA CONTEXT & REACTIVE STORE
   Provides live state hooks for Profiles, NFC Cards, Card Designs, and Audit Logs.
   ========================================================================== */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { StorageEngine } from '../lib/storage';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [profiles, setProfiles] = useState(() => StorageEngine.getProfiles());
  const [cards, setCards] = useState(() => StorageEngine.getCards());
  const [designs, setDesigns] = useState(() => StorageEngine.getDesigns());
  const [orders, setOrders] = useState(() => StorageEngine.getOrders());
  const [customers, setCustomers] = useState(() => StorageEngine.getCustomers());
  const [templates, setTemplates] = useState(() => StorageEngine.getTemplates());
  const [products, setProducts] = useState(() => StorageEngine.getProducts());
  const [auditLogs, setAuditLogs] = useState(() => StorageEngine.getAuditLogs());
  const [studioBackground, setStudioBackground] = useState(() => StorageEngine.getStudioBackground());
  const [adminAccounts, setAdminAccounts] = useState(() => StorageEngine.getAdminAccounts());
  const [demoConfig, setDemoConfig] = useState(() => StorageEngine.getDemoConfig());
  const [invoiceSettings, setInvoiceSettings] = useState(() => StorageEngine.getInvoiceSettings());
  const [lastOrderUpdate, setLastOrderUpdate] = useState(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState(null);

  const refreshAll = () => {
    setProfiles(StorageEngine.getProfiles());
    setCards(StorageEngine.getCards());
    setDesigns(StorageEngine.getDesigns());
    setOrders(StorageEngine.getOrders());
    setCustomers(StorageEngine.getCustomers());
    setTemplates(StorageEngine.getTemplates());
    setProducts(StorageEngine.getProducts());
    setAuditLogs(StorageEngine.getAuditLogs());
    setStudioBackground(StorageEngine.getStudioBackground());
    setAdminAccounts(StorageEngine.getAdminAccounts());
    setDemoConfig(StorageEngine.getDemoConfig());
    setInvoiceSettings(StorageEngine.getInvoiceSettings());
  };

  // Comprehensive cloud synchronization for all shared resources across all admin accounts & devices
  const syncCloudData = async () => {
    try {
      setIsCloudSyncing(true);

      const deletedCustIds = StorageEngine.getDeletedCustomerIds?.() || [];
      const deletedCustEmails = StorageEngine.getDeletedCustomerEmails?.() || [];
      const deletedProfileIds = StorageEngine.getDeletedProfileIds?.() || [];
      const deletedProfileSlugs = StorageEngine.getDeletedProfileSlugs?.() || [];
      const deletedCardIds = StorageEngine.getDeletedCardIds?.() || [];
      const deletedDesignIds = StorageEngine.getDeletedDesignIds?.() || [];
      const deletedOrderIds = StorageEngine.getDeletedOrderIds?.() || [];
      const deletedInvoiceIds = StorageEngine.getDeletedInvoiceIds?.() || [];

      // 1. Primary: Serverless Cloud Sync API (bypasses browser RLS restrictions, connects with admin service key)
      let serverData = null;
      try {
        const res = await fetch('/api/cloud-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'fetchData' })
        });
        if (res.ok) {
          const json = await res.json();
          if (json && json.success) {
            serverData = json;
          }
        }
      } catch (apiErr) {
        // Fallback to client query
      }

      const { supabase, supabaseAdmin, isSupabaseConfigured } = await import('../lib/supabase.js');
      const client = supabaseAdmin || supabase;

      let cloudProfiles = serverData?.profiles;
      let cloudCards = serverData?.cards;
      let cloudDesigns = serverData?.designs;
      let cloudOrders = serverData?.orders;
      let cloudUsers = serverData?.users;

      // Fallback: Query client tables directly if serverless endpoint didn't return
      if (!serverData && isSupabaseConfigured && client) {
        try {
          const [pRes, cRes, dRes] = await Promise.all([
            client.from('profiles').select('*').order('created_at', { ascending: false }),
            client.from('nfc_cards').select('*').order('created_at', { ascending: false }),
            client.from('card_designs').select('*').order('created_at', { ascending: false })
          ]);
          cloudProfiles = pRes.data || [];
          cloudCards = cRes.data || [];
          cloudDesigns = dRes.data || [];
        } catch (_) {}
      }

      // 1. Reconcile Profiles
      if (Array.isArray(cloudProfiles)) {
        const localProfiles = StorageEngine.getProfiles();
        const validSlugs = new Set();
        const validIds = new Set();
        const mappedProfiles = [];

        for (const cp of cloudProfiles) {
          const cpEmail = (cp.email || '').toLowerCase().trim();
          const cpSlug = (cp.slug || '').toLowerCase().trim();
          if (!cpSlug) continue;

          const isDeleted = (cp.id && (deletedCustIds.includes(cp.id) || deletedProfileIds.includes(cp.id))) ||
                            (cp.user_id && deletedCustIds.includes(cp.user_id)) ||
                            (deletedProfileSlugs.includes(cpSlug) || deletedProfileIds.includes(cpSlug)) ||
                            (cpEmail && (deletedCustEmails.includes(cpEmail) || deletedProfileIds.includes(cpEmail)));
          if (isDeleted) continue;

          validSlugs.add(cpSlug);
          if (cp.id) validIds.add(cp.id);

          const rawPortfolio = Array.isArray(cp.portfolio) ? cp.portfolio : [];
          const bannerEntry = rawPortfolio.find(x => x && x._isBannerConfig);
          const banner = cp.banner || bannerEntry?.banner || null;
          const cleanPortfolio = rawPortfolio.filter(x => !x || !x._isBannerConfig);
          const avatarZoom = cp.avatar_zoom ?? bannerEntry?.avatarZoom ?? 100;
          const avatarPosX = cp.avatar_pos_x ?? bannerEntry?.avatarPosX ?? 50;
          const avatarPosY = cp.avatar_pos_y ?? bannerEntry?.avatarPosY ?? 50;
          const photoShape = cp.photo_shape ?? bannerEntry?.photoShape ?? 'circle';

          mappedProfiles.push({
            id: cp.id,
            slug: cp.slug,
            name: cp.name || cp.slug,
            role: cp.role || '',
            company: cp.company || '',
            tagline: cp.tagline || '',
            bio: cp.bio || '',
            avatar: cp.avatar_url || '',
            avatar_url: cp.avatar_url || '',
            theme: cp.theme || 'purple',
            phone: cp.phone || '',
            email: cp.email || '',
            whatsapp: cp.whatsapp || '',
            website: cp.website || '',
            linkedin: cp.linkedin || '',
            instagram: cp.instagram || '',
            twitter: cp.twitter || '',
            github: cp.github || '',
            location: cp.location || '',
            services: Array.isArray(cp.services) ? cp.services : [],
            portfolio: cleanPortfolio,
            vcard_enabled: cp.vcard_enabled !== false,
            status: cp.status || 'active',
            views_count: cp.views_count || 0,
            save_count: cp.save_count || 0,
            banner: banner || { enabled: true, url: '/assets/hero-bg.jpg', zoom: 100, positionX: 50, positionY: 45 },
            avatarZoom,
            avatarPosX,
            avatarPosY,
            photoShape,
            updatedAt: cp.updated_at || cp.created_at
          });
        }

        // If serverData is authoritative, replace local profiles with live cloud records (purging cross-device deletions)
        let finalProfiles = mappedProfiles;
        if (!serverData) {
          // In offline fallback, keep local profiles that were not deleted
          for (const lp of localProfiles) {
            const lSlug = lp.slug?.toLowerCase().trim();
            if (lSlug && !validSlugs.has(lSlug) && !deletedProfileSlugs.includes(lSlug)) {
              finalProfiles.push(lp);
            }
          }
        }

        StorageEngine.saveLocalProfiles(finalProfiles);
        setProfiles([...finalProfiles]);
      }

      // 2. Reconcile Customers
      const authoritativeCusts = [];
      const seenCustEmails = new Set();
      const seenCustIds = new Set();

      // From cloud users
      for (const u of (cloudUsers || [])) {
        const uEmail = (u.email || '').toLowerCase().trim();
        if (!uEmail || deletedCustIds.includes(u.id) || deletedCustEmails.includes(uEmail)) continue;
        if (uEmail.includes('flocard.in') && u.user_metadata?.role === 'owner') continue;

        seenCustEmails.add(uEmail);
        if (u.id) seenCustIds.add(u.id);

        authoritativeCusts.push({
          id: u.id,
          name: u.user_metadata?.name || u.user_metadata?.full_name || uEmail.split('@')[0],
          email: u.email,
          phone: u.phone || u.user_metadata?.phone || '',
          company: u.user_metadata?.company || '',
          avatar: u.user_metadata?.avatar_url || u.user_metadata?.picture || '',
          role: u.user_metadata?.role || 'customer',
          status: u.user_metadata?.status || 'active',
          joinedDate: (u.created_at || '').split('T')[0] || new Date().toISOString().split('T')[0],
          totalCards: 0,
          totalDesigns: 0
        });
      }

      // From cloud profiles
      for (const cp of (cloudProfiles || [])) {
        const cpEmail = (cp.email || '').toLowerCase().trim();
        const isDeleted = (cp.id && deletedCustIds.includes(cp.id)) ||
                          (cp.user_id && deletedCustIds.includes(cp.user_id)) ||
                          (cpEmail && deletedCustEmails.includes(cpEmail));
        if (isDeleted) continue;

        const isCustomer = cp.role === 'customer' || (!cp.email?.includes('flocard.in') && cp.role !== 'owner');
        if (isCustomer && cp.name) {
          const custId = cp.id || cp.user_id || `cust_${cp.slug}`;
          if (cpEmail && seenCustEmails.has(cpEmail)) {
            const existing = authoritativeCusts.find(c => c.email?.toLowerCase().trim() === cpEmail);
            if (existing) {
              if (cp.phone && !existing.phone) existing.phone = cp.phone;
              if (cp.company && !existing.company) existing.company = cp.company;
              if (cp.avatar_url && !existing.avatar) existing.avatar = cp.avatar_url;
            }
          } else if (!seenCustIds.has(custId)) {
            if (cpEmail) seenCustEmails.add(cpEmail);
            seenCustIds.add(custId);
            authoritativeCusts.push({
              id: custId,
              name: cp.name,
              email: cp.email || '',
              phone: cp.phone || '',
              company: cp.company || '',
              avatar: cp.avatar_url || '',
              role: 'customer',
              status: cp.status || 'active',
              joinedDate: (cp.created_at || '').split('T')[0] || new Date().toISOString().split('T')[0],
              totalCards: 0,
              totalDesigns: 0
            });
          }
        }
      }

      // If serverData is authoritative, set customers strictly to authoritativeCusts (purges old 4 test customers)
      if (serverData) {
        StorageEngine.saveLocalCustomers(authoritativeCusts);
        setCustomers([...authoritativeCusts]);
      } else if (authoritativeCusts.length > 0) {
        const currentCusts = StorageEngine.getCustomers();
        for (const ac of authoritativeCusts) {
          const idx = currentCusts.findIndex(c => (ac.email && c.email?.toLowerCase() === ac.email.toLowerCase()) || c.id === ac.id);
          if (idx >= 0) {
            currentCusts[idx] = { ...currentCusts[idx], ...ac };
          } else {
            currentCusts.unshift(ac);
          }
        }
        StorageEngine.saveLocalCustomers(currentCusts);
        setCustomers([...currentCusts]);
      }

      // 3. Reconcile Card Designs
      if (Array.isArray(cloudDesigns)) {
        const mappedDesigns = [];
        for (const cd of cloudDesigns) {
          const fc = cd.front_config || {};
          const localId = fc._localId || cd.id;

          if (deletedDesignIds.includes(cd.id) || (localId && deletedDesignIds.includes(localId))) {
            continue;
          }

          const custEmail = (fc.customerEmail || '').trim().toLowerCase();
          const isDesignCustDeleted = (fc.customerId && deletedCustIds.includes(fc.customerId)) ||
                                     (custEmail && deletedCustEmails.includes(custEmail));
          if (isDesignCustDeleted) continue;

          mappedDesigns.push({
            id: localId,
            supabaseId: cd.id,
            title: cd.title || fc.title || 'Card Design',
            edition: fc.edition || cd.edition || 'purple',
            templateType: fc.templateType || 'standard',
            customerName: fc.customerName || fc.name || 'Valued Client',
            customerEmail: fc.customerEmail || '',
            customerPhone: fc.customerPhone || '',
            company: fc.company || '',
            front: fc,
            back: cd.back_config || {},
            customColors: fc.customColors || {},
            customerLogo: fc.customerLogo || null,
            flocardLogo: fc.flocardLogo || { size: 100, position: 'top-left' },
            status: cd.status || 'submitted',
            orderId: fc.orderId || fc.printOrder?.id || null,
            submittedAt: cd.submitted_at || cd.created_at || 'Just now',
            updatedAt: cd.updated_at || cd.created_at
          });
        }

        if (serverData) {
          StorageEngine.saveLocalDesigns(mappedDesigns);
          setDesigns([...mappedDesigns]);
        } else if (mappedDesigns.length > 0) {
          const localDesigns = StorageEngine.getDesigns();
          for (const md of mappedDesigns) {
            const idx = localDesigns.findIndex(d => d.id === md.id || d.supabaseId === md.supabaseId);
            if (idx >= 0) localDesigns[idx] = { ...localDesigns[idx], ...md };
            else localDesigns.unshift(md);
          }
          const cleanLocalDesigns = localDesigns.filter(d => !deletedDesignIds.includes(d.id) && !deletedDesignIds.includes(d.supabaseId));
          StorageEngine.saveLocalDesigns(cleanLocalDesigns);
          setDesigns([...cleanLocalDesigns]);
        }
      }

      // 4. Reconcile Orders
      const authoritativeOrders = [];
      const seenOrderRefs = new Set();

      for (const co of (cloudOrders || [])) {
        const ordRef = co.order_reference || co.id;
        if (deletedOrderIds.includes(co.id) || deletedOrderIds.includes(ordRef)) continue;

        seenOrderRefs.add(ordRef);
        if (co.id) seenOrderRefs.add(co.id);

        authoritativeOrders.push({
          id: co.id || ordRef,
          orderReference: ordRef,
          customerName: co.customer_name || 'Valued Client',
          customerEmail: co.customer_email || '',
          customerPhone: co.customer_phone || '',
          company: co.company || '',
          status: co.status || 'new_order',
          shippingAddress: co.shipping_address || '',
          totalAmount: Number(co.total_amount || 0),
          createdAt: co.created_at,
          updatedAt: co.updated_at || co.created_at
        });
      }

      // Incorporate embedded print orders from designs
      const activeDesigns = serverData ? (cloudDesigns || []) : StorageEngine.getDesigns();
      for (const d of activeDesigns) {
        const fc = d.front_config || d.front || {};
        if (fc.printOrder) {
          const po = fc.printOrder;
          const ref = po.orderReference || po.id;
          if (ref && !seenOrderRefs.has(ref) && !deletedOrderIds.includes(ref)) {
            seenOrderRefs.add(ref);
            authoritativeOrders.unshift(po);
          }
        }
      }

      if (serverData && (cloudOrders?.length > 0 || authoritativeOrders.length > 0)) {
        StorageEngine.saveLocalOrders(authoritativeOrders);
        setOrders([...authoritativeOrders]);
      }

      // 5. Reconcile NFC Cards
      if (Array.isArray(cloudCards) && cloudCards.length > 0) {
        const mappedCards = cloudCards.map(cc => {
          const rawStatus = (cc.status || 'in_stock').toLowerCase();
          return {
            id: cc.id,
            cardCode: cc.card_code,
            cardName: `NFC Card ${cc.card_code}`,
            chipType: cc.chip_type || 'NXP NTAG216 (888 Bytes)',
            batch: cc.batch || 'Batch-A',
            edition: cc.edition || 'purple',
            customerId: cc.customer_id,
            profileSlug: cc.profile_slug,
            status: rawStatus === 'revoked' ? 'disabled' : rawStatus,
            tapCount: cc.tap_count || 0,
            lastTapped: cc.last_tapped_at,
            updatedAt: cc.updated_at || cc.created_at
          };
        }).filter(c => !deletedCardIds.includes(c.id) && !deletedCardIds.includes(c.cardCode));

        StorageEngine.saveLocalCards(mappedCards);
        setCards([...mappedCards]);
      }

      setLastCloudSyncTime(new Date());
    } catch (err) {
      console.warn('[DataContext] Cloud sync error:', err.message);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Real-time synchronization listeners across browser windows, tabs, and local dispatches
  useEffect(() => {
    // Initial cloud fetch on mount
    syncCloudData();

    // Supabase Realtime subscription for cross-device & cross-admin synchronization
    let realtimeChannel = null;
    (async () => {
      try {
        const { supabase, supabaseAdmin, isSupabaseConfigured } = await import('../lib/supabase.js');
        if (!isSupabaseConfigured) return;
        const client = supabaseAdmin || supabase;
        if (!client) return;

        realtimeChannel = client
          .channel('cloud-admin-sync')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
            syncCloudData();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'nfc_cards' }, () => {
            syncCloudData();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'card_designs' }, () => {
            syncCloudData();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
            syncCloudData();
          })
          .subscribe();
      } catch (err) {
        console.warn('[DataContext] Realtime subscribe error:', err);
      }
    })();

    const handleOrderUpdated = (e) => {
      refreshAll();
      if (e.detail) {
        setLastOrderUpdate(e.detail);
      }
    };

    const handleStorageChange = (e) => {
      if (e.key && e.key.includes('flocard_data')) {
        refreshAll();
      }
    };

    const handleWindowFocus = () => {
      refreshAll();
      syncCloudData();
    };

    window.addEventListener('flocard_order_updated', handleOrderUpdated);
    window.addEventListener('flocard_sales_updated', refreshAll);
    window.addEventListener('flocard_invoice_settings_updated', refreshAll);
    window.addEventListener('flocard_profile_updated', refreshAll);
    window.addEventListener('flocard_card_updated', refreshAll);
    window.addEventListener('flocard_card_status_changed', refreshAll);
    window.addEventListener('flocard_notification_created', refreshAll);
    window.addEventListener('flocard_products_updated', refreshAll);
    window.addEventListener('flocard_demo_updated', refreshAll);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleWindowFocus);

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncCloudData();
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    // High-frequency background sync polling every 6 seconds for instantaneous cross-device data propagation
    const pollInterval = setInterval(() => {
      syncCloudData();
    }, 6000);

    return () => {
      clearInterval(pollInterval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (realtimeChannel) {
        import('../lib/supabase.js').then(({ supabase, supabaseAdmin }) => {
          const client = supabaseAdmin || supabase;
          if (client) client.removeChannel(realtimeChannel);
        }).catch(() => {});
      }
      window.removeEventListener('flocard_order_updated', handleOrderUpdated);
      window.removeEventListener('flocard_sales_updated', refreshAll);
      window.removeEventListener('flocard_invoice_settings_updated', refreshAll);
      window.removeEventListener('flocard_profile_updated', refreshAll);
      window.removeEventListener('flocard_card_updated', refreshAll);
      window.removeEventListener('flocard_card_status_changed', refreshAll);
      window.removeEventListener('flocard_notification_created', refreshAll);
      window.removeEventListener('flocard_products_updated', refreshAll);
      window.removeEventListener('flocard_demo_updated', refreshAll);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  const addAdminAccount = (accountData) => {
    const updated = StorageEngine.addAdminAccount(accountData);
    refreshAll();
    return updated;
  };

  const revokeAdminAccount = (email, revokedBy) => {
    const res = StorageEngine.revokeAdminAccount(email, revokedBy);
    refreshAll();
    return res;
  };

  const updateStudioBackground = (bgUrl, role) => {
    const res = StorageEngine.saveStudioBackground(bgUrl, role);
    if (res.success) {
      setStudioBackground(res.bgUrl);
    }
    return res;
  };

  const resetStudioBg = (role) => {
    const res = StorageEngine.resetStudioBackground(role);
    if (res.success) {
      setStudioBackground(res.bgUrl);
    }
    return res;
  };

  const saveProfile = (profile) => {
    const updated = StorageEngine.saveProfile(profile);
    refreshAll();
    syncCloudData();
    return updated;
  };

  const deleteProfile = async (id) => {
    await StorageEngine.deleteProfile(id);
    setProfiles(prev => prev.filter(p => p.id !== id && p.slug !== id));
    refreshAll();
    syncCloudData();
  };

  const saveCard = (card) => {
    const updated = StorageEngine.saveCard(card);
    refreshAll();
    syncCloudData();
    return updated;
  };

  const deleteCard = async (id) => {
    await StorageEngine.deleteCard(id);
    setCards(prev => prev.filter(c => c.id !== id && c.cardCode !== id));
    refreshAll();
    syncCloudData();
  };

  const recordTap = (cardCode, clientMeta) => {
    const card = StorageEngine.recordCardTap(cardCode, clientMeta);
    refreshAll();
    return card;
  };

  const saveDesign = (design) => {
    const updated = StorageEngine.saveDesign(design);
    refreshAll();
    syncCloudData();
    return updated;
  };

  const updateDesignStatus = (id, status, notes) => {
    const updated = StorageEngine.updateDesignStatus(id, status, notes);
    refreshAll();
    syncCloudData();
    return updated;
  };

  const deleteDesign = async (id) => {
    await StorageEngine.deleteDesign(id);
    setDesigns(prev => prev.filter(d => d.id !== id && d.supabaseId !== id));
    refreshAll();
    syncCloudData();
  };

  const saveOrder = (order) => {
    const updated = StorageEngine.saveOrder(order);
    refreshAll();
    syncCloudData();
    return updated;
  };

  const saveAdminOrderDesign = (orderId, updatedDesignConfig, adminUser, options) => {
    const updated = StorageEngine.saveAdminOrderDesign(orderId, updatedDesignConfig, adminUser, options);
    refreshAll();
    syncCloudData();
    return updated;
  };

  const updateOrderStatus = (params) => {
    const updated = StorageEngine.updateOrderStatus(params);
    refreshAll();
    syncCloudData();
    return updated;
  };

  const deliverOrder = (orderId, actorUser) => {
    const result = StorageEngine.deliverOrder(orderId, actorUser);
    refreshAll();
    syncCloudData();
    return result;
  };

  const deleteOrder = async (id, actorUser) => {
    const res = await StorageEngine.deleteOrder(id, actorUser);
    setOrders(prev => prev.filter(o => o.id !== id && o.orderReference !== id));
    refreshAll();
    syncCloudData();
    return res;
  };

  const deleteInvoice = (id) => {
    const res = StorageEngine.deleteInvoice(id);
    refreshAll();
    return res;
  };

  const createOrderFromDesign = (design, notes, customerUser) => {
    const order = StorageEngine.createOrderFromDesign(design, notes, customerUser);
    refreshAll();
    return order;
  };

  const submitPrintOrder = (payload) => {
    const order = StorageEngine.submitPrintOrder(payload);
    refreshAll();
    return order;
  };

  const updateOrderPaymentStatus = (opts) => {
    const order = StorageEngine.updateOrderPaymentStatus(opts);
    refreshAll();
    return order;
  };

  const setOrderInvoiceEligibility = (opts) => {
    const order = StorageEngine.setOrderInvoiceEligibility(opts);
    refreshAll();
    return order;
  };

  const assignOrderInvoice = (orderId, actorUser, reason) => {
    const order = StorageEngine.assignOrderInvoice(orderId, actorUser, reason);
    refreshAll();
    return order;
  };

  const declineOrderInvoice = (orderId, actorUser, reason) => {
    const order = StorageEngine.declineOrderInvoice(orderId, actorUser, reason);
    refreshAll();
    return order;
  };

  const assignCustomerInvoice = (customerId, actorUser, reason) => {
    const res = StorageEngine.assignCustomerInvoice(customerId, actorUser, reason);
    refreshAll();
    return res;
  };

  const declineCustomerInvoice = (customerId, actorUser, reason) => {
    const res = StorageEngine.declineCustomerInvoice(customerId, actorUser, reason);
    refreshAll();
    return res;
  };

  const restoreBackup = async (payload, opts) => {
    const res = await StorageEngine.restoreBackup(payload, opts);
    refreshAll();
    syncCloudData();
    return res;
  };

  const saveInvoiceConfig = (cfg) => {
    const updated = StorageEngine.saveInvoiceConfig(cfg);
    refreshAll();
    return updated;
  };

  const saveInvoice = (invoice) => {
    const saved = StorageEngine.saveInvoice(invoice);
    refreshAll();
    return saved;
  };

  const assignDesignToOrder = (designId, notes, adminUser) => {
    const res = StorageEngine.assignDesignToOrder(designId, notes, adminUser);
    refreshAll();
    return res;
  };

  const saveCustomer = async (customer) => {
    const updated = StorageEngine.saveCustomer(customer);
    refreshAll();
    try {
      const synced = await StorageEngine.syncCustomerToCloud(updated);
      refreshAll();
      syncCloudData();
      return synced || updated;
    } catch (err) {
      refreshAll();
      syncCloudData();
      throw err;
    }
  };

  const deleteCustomer = async (id) => {
    await StorageEngine.deleteCustomer(id);
    setCustomers([...StorageEngine.getCustomers()]);
    setProfiles([...StorageEngine.getProfiles()]);
    setDesigns([...StorageEngine.getDesigns()]);
    setOrders([...StorageEngine.getOrders()]);
    refreshAll();
    syncCloudData();
  };

  const saveTemplate = (template) => {
    const updated = StorageEngine.saveTemplate(template);
    refreshAll();
    return updated;
  };

  const deleteTemplate = (id) => {
    StorageEngine.deleteTemplate(id);
    refreshAll();
  };

  const saveProduct = (product, role, email) => {
    const res = StorageEngine.saveProduct(product, role, email);
    if (res.success) {
      refreshAll();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('flocard_products_updated', { detail: res.product }));
      }
    }
    return res;
  };

  const reorderProducts = (orderedKeysOrIds, role, email) => {
    const res = StorageEngine.reorderProducts(orderedKeysOrIds, role, email);
    if (res.success) {
      refreshAll();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('flocard_products_updated', { detail: res.products }));
      }
    }
    return res;
  };

  const toggleProductStatus = (editionKeyOrId, newStatus, role, email) => {
    const res = StorageEngine.toggleProductStatus(editionKeyOrId, newStatus, role, email);
    if (res.success) {
      refreshAll();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('flocard_products_updated', { detail: res.product }));
      }
    }
    return res;
  };

  const recordOrderPayment = (params) => {
    const res = StorageEngine.recordOrderPayment(params);
    refreshAll();
    return res;
  };

  const recordOrderRefund = (params) => {
    const res = StorageEngine.recordOrderRefund(params);
    refreshAll();
    return res;
  };

  const recordFinancialAdjustment = (params) => {
    const res = StorageEngine.recordFinancialAdjustment(params);
    refreshAll();
    return res;
  };

  const saveInvoiceSettings = (settings, email) => {
    const res = StorageEngine.saveInvoiceSettings(settings, email);
    refreshAll();
    return res;
  };

  const resetAllData = () => {
    StorageEngine.resetAll();
    refreshAll();
  };

  const clearAllCustomersOrdersDesigns = async (actorName) => {
    await StorageEngine.clearAllCustomersOrdersDesigns(actorName);
    refreshAll();
  };

  return (
    <DataContext.Provider value={{
      profiles,
      cards,
      designs,
      orders,
      customers,
      templates,
      products,
      auditLogs,
      adminAccounts,
      lastOrderUpdate,
      addAdminAccount,
      revokeAdminAccount,
      studioBackground,
      updateStudioBackground,
      resetStudioBg,
      demoConfig,
      saveDemoConfig: StorageEngine.saveDemoConfig,
      resetDemoConfig: StorageEngine.resetDemoConfig,
      invoiceSettings,
      saveInvoiceSettings,
      getInvoiceSettings: StorageEngine.getInvoiceSettings,
      recordOrderPayment,
      recordOrderRefund,
      recordFinancialAdjustment,
      refreshAll,
      syncCloudData,
      isCloudSyncing,
      lastCloudSyncTime,
      saveProfile,
      deleteProfile,
      saveCard,
      deleteCard,
      recordTap,
      saveDesign,
      updateDesignStatus,
      deleteDesign,
      saveOrder,
      saveAdminOrderDesign,
      updateOrderStatus,
      deliverOrder,
      deleteOrder,
      createOrderFromDesign,
      submitPrintOrder,
      updateOrderPaymentStatus,
      setOrderInvoiceEligibility,
      assignOrderInvoice,
      declineOrderInvoice,
      assignCustomerInvoice,
      declineCustomerInvoice,
      getInvoiceConfig: StorageEngine.getInvoiceConfig,
      saveInvoiceConfig,
      saveInvoice,
      deleteInvoice,
      getInvoices: StorageEngine.getInvoices,
      getInvoicesByOrder: StorageEngine.getInvoicesByOrder,
      getInvoicesByCustomer: StorageEngine.getInvoicesByCustomer,
      assignDesignToOrder,
      saveCustomer,
      deleteCustomer,
      saveTemplate,
      deleteTemplate,
      saveProduct,
      reorderProducts,
      toggleProductStatus,
      getProductByEdition: StorageEngine.getProductByEdition,
      createBackupZip: StorageEngine.createBackupZip,
      parseBackupZip: StorageEngine.parseBackupZip,
      restoreBackup,
      resetAllData,
      clearAllCustomersOrdersDesigns,
      getProfileBySlug: StorageEngine.getProfileBySlug,
      getCardByCode: StorageEngine.getCardByCode,
      getDesignById: StorageEngine.getDesignById,
      getOrderById: StorageEngine.getOrderById,
      getOrdersForUser: StorageEngine.getOrders,
      getOrderHistory: StorageEngine.getOrderHistory,
      getOrderInternalNotes: StorageEngine.getOrderInternalNotes,
      addOrderInternalNote: StorageEngine.addOrderInternalNote,
      getNotifications: StorageEngine.getNotifications,
      markNotificationRead: StorageEngine.markNotificationRead,
      markAllNotificationsRead: StorageEngine.markAllNotificationsRead,
      getRealAnalytics: StorageEngine.getRealAnalytics,
      logAnalyticsEvent: StorageEngine.logAnalyticsEvent
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
