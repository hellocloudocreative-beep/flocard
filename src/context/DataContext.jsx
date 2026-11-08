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
      const { supabase, supabaseAdmin, isSupabaseConfigured } = await import('../lib/supabase.js');
      if (!isSupabaseConfigured) return;
      const client = supabaseAdmin || supabase;
      if (!client) return;

      // 1. Synchronize Profiles from Supabase
      try {
        const { data: cloudProfiles, error: pErr } = await client
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (!pErr && Array.isArray(cloudProfiles) && cloudProfiles.length > 0) {
          const localProfiles = StorageEngine.getProfiles();
          for (const cp of cloudProfiles) {
            const rawPortfolio = Array.isArray(cp.portfolio) ? cp.portfolio : [];
            const bannerEntry = rawPortfolio.find(x => x && x._isBannerConfig);
            const banner = cp.banner || bannerEntry?.banner || null;
            const cleanPortfolio = rawPortfolio.filter(x => !x || !x._isBannerConfig);
            const avatarZoom = cp.avatar_zoom ?? bannerEntry?.avatarZoom ?? 100;
            const avatarPosX = cp.avatar_pos_x ?? bannerEntry?.avatarPosX ?? 50;
            const avatarPosY = cp.avatar_pos_y ?? bannerEntry?.avatarPosY ?? 50;
            const photoShape = cp.photo_shape ?? bannerEntry?.photoShape ?? 'circle';

            const mappedProfile = {
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
            };

            const existIdx = localProfiles.findIndex(p => (p.slug && p.slug.toLowerCase() === cp.slug.toLowerCase()) || p.id === cp.id);
            if (existIdx >= 0) {
              localProfiles[existIdx] = { ...localProfiles[existIdx], ...mappedProfile };
            } else {
              localProfiles.push(mappedProfile);
            }
          }
          StorageEngine.saveLocalProfiles(localProfiles);
          setProfiles(localProfiles);
        }
      } catch (err) {
        console.warn('[DataContext] Profiles cloud sync note:', err.message);
      }

      // 2. Synchronize NFC Hardware Cards from Supabase
      try {
        const { data: cloudCards, error: cErr } = await client
          .from('nfc_cards')
          .select('*')
          .order('created_at', { ascending: false });

        if (!cErr && Array.isArray(cloudCards) && cloudCards.length > 0) {
          const localCards = StorageEngine.getCards();
          for (const cc of cloudCards) {
            const rawStatus = (cc.status || 'in_stock').toLowerCase();
            const appStatus = rawStatus === 'revoked' ? 'disabled' : rawStatus;
            const mappedCard = {
              id: cc.id,
              cardCode: cc.card_code,
              cardName: `NFC Card ${cc.card_code}`,
              chipType: cc.chip_type || 'NXP NTAG216 (888 Bytes)',
              batch: cc.batch || 'Batch-A',
              edition: cc.edition || 'purple',
              customerId: cc.customer_id,
              profileSlug: cc.profile_slug,
              status: appStatus,
              tapCount: cc.tap_count || 0,
              lastTapped: cc.last_tapped_at,
              updatedAt: cc.updated_at || cc.created_at
            };
            const existIdx = localCards.findIndex(c => c.cardCode === cc.card_code || c.id === cc.id);
            if (existIdx >= 0) {
              localCards[existIdx] = { ...localCards[existIdx], ...mappedCard };
            } else {
              localCards.push(mappedCard);
            }
          }
          StorageEngine.saveLocalCards(localCards);
          setCards(localCards);
        }
      } catch (err) {
        console.warn('[DataContext] NFC Cards cloud sync note:', err.message);
      }

      // 3. Synchronize Customers from Supabase Auth
      if (supabaseAdmin && supabaseAdmin.auth && supabaseAdmin.auth.admin) {
        try {
          const { data: userData, error: uErr } = await supabaseAdmin.auth.admin.listUsers();
          if (!uErr && userData?.users?.length > 0) {
            const localCusts = StorageEngine.getCustomers();
            for (const u of userData.users) {
              const mappedCust = {
                id: u.id,
                name: u.user_metadata?.name || u.user_metadata?.full_name || u.email.split('@')[0],
                email: u.email,
                phone: u.phone || u.user_metadata?.phone || '',
                company: u.user_metadata?.company || '',
                avatar: u.user_metadata?.avatar_url || u.user_metadata?.picture || '',
                role: u.user_metadata?.role || (u.email.includes('flocard.in') ? 'owner' : 'customer'),
                status: u.user_metadata?.status || 'active',
                joinedDate: (u.created_at || '').split('T')[0] || new Date().toISOString().split('T')[0],
                totalCards: 0,
                totalDesigns: 0
              };
              const existIdx = localCusts.findIndex(c => c.email.toLowerCase() === u.email.toLowerCase() || c.id === u.id);
              if (existIdx >= 0) {
                localCusts[existIdx] = { ...localCusts[existIdx], ...mappedCust };
              } else {
                localCusts.unshift(mappedCust);
              }
            }
            StorageEngine.saveLocalCustomers(localCusts);
            setCustomers(localCusts);

            // Auto-provision digital profile if customer doesn't have one yet
            const localProfs = StorageEngine.getProfiles();
            let profsChanged = false;
            for (const u of userData.users) {
              const uEmail = (u.email || '').toLowerCase().trim();
              const uName = u.user_metadata?.name || u.user_metadata?.full_name || uEmail.split('@')[0];
              const uSlug = uName.toLowerCase().replace(/[^a-z0-9]/g, '');
              const hasProf = localProfs.some(p => 
                (p.email && p.email.toLowerCase().trim() === uEmail) || 
                (p.userId && p.userId === u.id) ||
                (p.slug && p.slug.toLowerCase() === uSlug)
              );
              if (!hasProf && uSlug) {
                localProfs.push({
                  id: `prof_${u.id}`,
                  userId: u.id,
                  slug: uSlug,
                  name: uName,
                  email: uEmail,
                  role: 'Executive & Member',
                  company: u.user_metadata?.company || 'FLOCARDS Member',
                  tagline: 'Contactless Digital Profile & NFC Identity',
                  bio: 'Connect seamlessly with my verified FLOCARDS smart identity.',
                  avatar: u.user_metadata?.avatar_url || u.user_metadata?.picture || '',
                  avatar_url: u.user_metadata?.avatar_url || u.user_metadata?.picture || '',
                  theme: 'gold',
                  phone: u.phone || u.user_metadata?.phone || '',
                  whatsapp: '',
                  website: `flocard.in/p/${uSlug}`,
                  status: 'active',
                  views_count: 0,
                  save_count: 0,
                  vcard_enabled: true,
                  updatedAt: u.created_at || new Date().toISOString()
                });
                profsChanged = true;
              }
            }
            if (profsChanged) {
              StorageEngine.saveLocalProfiles(localProfs);
              setProfiles(localProfs);
            }
          }
        } catch (err) {
          console.warn('[DataContext] Customer cloud sync note:', err.message);
        }
      }

      // 4. Synchronize Card Designs & Embedded Print Orders from Supabase
      try {
        const { data: cloudDesigns, error } = await client
          .from('card_designs')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(cloudDesigns) && cloudDesigns.length > 0) {
          const localDesigns = StorageEngine.getDesigns();
          const localOrders = StorageEngine.getOrders();
          let designsUpdated = false;
          let ordersUpdated = false;

          for (const cd of cloudDesigns) {
            const fc = cd.front_config || {};
            const localId = fc._localId || cd.id;

            const mappedDesign = {
              id: localId,
              supabaseId: cd.id,
              title: cd.title || fc.title || 'Card Design',
              edition: cd.edition || 'purple',
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
            };

            const existDIdx = localDesigns.findIndex(d => d.id === localId || d.supabaseId === cd.id);
            if (existDIdx >= 0) {
              localDesigns[existDIdx] = { ...localDesigns[existDIdx], ...mappedDesign };
            } else {
              localDesigns.unshift(mappedDesign);
              designsUpdated = true;
            }

            if (fc.printOrder) {
              const po = fc.printOrder;
              const existOIdx = localOrders.findIndex(o => o.id === po.id || o.orderReference === po.orderReference);
              if (existOIdx < 0) {
                localOrders.unshift(po);
                ordersUpdated = true;
              } else {
                localOrders[existOIdx] = { ...localOrders[existOIdx], ...po };
              }
            }

            // Synthesize customer from design so customers from flocard.in are never lost
            const custEmail = (fc.customerEmail || '').trim().toLowerCase();
            if (custEmail) {
              const currentCusts = StorageEngine.getCustomers();
              const existC = currentCusts.find(c => (c.email && c.email.toLowerCase() === custEmail) || (fc.customerId && c.id === fc.customerId));
              if (!existC) {
                currentCusts.unshift({
                  id: fc.customerId || `cust_${custEmail.replace(/[^a-z0-9]/g, '_')}`,
                  name: fc.customerName || fc.name || custEmail.split('@')[0],
                  email: custEmail,
                  phone: fc.customerPhone || '',
                  company: fc.company || '',
                  role: 'customer',
                  status: 'active',
                  joinedDate: (cd.created_at || '').split('T')[0] || new Date().toISOString().split('T')[0],
                  totalCards: 0,
                  totalDesigns: 1
                });
                StorageEngine.saveLocalCustomers(currentCusts);
                setCustomers(currentCusts);
              }
            }
          }

          if (designsUpdated) {
            StorageEngine.saveLocalDesigns(localDesigns);
            setDesigns(localDesigns);
          }
          if (ordersUpdated) {
            StorageEngine.saveLocalOrders(localOrders);
            setOrders(localOrders);
          }
        }
      } catch (err) {
        console.warn('[DataContext] Card designs cloud sync note:', err.message);
      }

      // 5. Check if native orders table exists and query it as well
      try {
        const { data: cloudOrders, error: ordErr } = await client
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (!ordErr && Array.isArray(cloudOrders) && cloudOrders.length > 0) {
          const localOrders = StorageEngine.getOrders();
          let changed = false;
          for (const co of cloudOrders) {
            const ordRef = co.order_reference || co.id;
            const exist = localOrders.some(o => o.id === ordRef || o.orderReference === ordRef);
            if (!exist) {
              localOrders.unshift({
                id: ordRef,
                orderReference: ordRef,
                customerName: co.customer_name,
                customerEmail: co.customer_email,
                customerPhone: co.customer_phone,
                company: co.company,
                status: co.status || 'new_order',
                shippingAddress: co.shipping_address,
                totalAmount: Number(co.total_amount) || 1899,
                createdAt: co.created_at,
                updatedAt: co.updated_at,
                source: co.source || 'web_studio'
              });
              changed = true;
            }

            // Synthesize customer from cloud order if not present
            const coEmail = (co.customer_email || '').trim().toLowerCase();
            if (coEmail) {
              const currentCusts = StorageEngine.getCustomers();
              const existC = currentCusts.find(c => (c.email && c.email.toLowerCase() === coEmail) || (co.customer_id && c.id === co.customer_id));
              if (!existC) {
                currentCusts.unshift({
                  id: co.customer_id || `cust_${coEmail.replace(/[^a-z0-9]/g, '_')}`,
                  name: co.customer_name || coEmail.split('@')[0],
                  email: coEmail,
                  phone: co.customer_phone || '',
                  company: co.company || '',
                  role: 'customer',
                  status: 'active',
                  joinedDate: (co.created_at || '').split('T')[0] || new Date().toISOString().split('T')[0],
                  totalCards: 0,
                  totalDesigns: 0
                });
                StorageEngine.saveLocalCustomers(currentCusts);
                setCustomers(currentCusts);
              }
            }
          }
          if (changed) {
            StorageEngine.saveLocalOrders(localOrders);
            setOrders(localOrders);
          }
        }
      } catch (_) {}

      refreshAll();
    } catch (err) {
      console.warn('[DataContext] Cloud sync error:', err.message);
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

    // Fallback sync polling every 12 seconds for resilient cross-device data propagation
    const pollInterval = setInterval(() => {
      syncCloudData();
    }, 12000);

    return () => {
      clearInterval(pollInterval);
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
    return updated;
  };

  const deleteProfile = (id) => {
    StorageEngine.deleteProfile(id);
    refreshAll();
  };

  const saveCard = (card) => {
    const updated = StorageEngine.saveCard(card);
    refreshAll();
    return updated;
  };

  const deleteCard = (id) => {
    StorageEngine.deleteCard(id);
    refreshAll();
  };

  const recordTap = (cardCode, clientMeta) => {
    const card = StorageEngine.recordCardTap(cardCode, clientMeta);
    refreshAll();
    return card;
  };

  const saveDesign = (design) => {
    const updated = StorageEngine.saveDesign(design);
    refreshAll();
    return updated;
  };

  const updateDesignStatus = (id, status, notes) => {
    const updated = StorageEngine.updateDesignStatus(id, status, notes);
    refreshAll();
    return updated;
  };

  const deleteDesign = (id) => {
    StorageEngine.deleteDesign(id);
    refreshAll();
  };

  const saveOrder = (order) => {
    const updated = StorageEngine.saveOrder(order);
    refreshAll();
    return updated;
  };

  const saveAdminOrderDesign = (orderId, updatedDesignConfig, adminUser, options) => {
    const updated = StorageEngine.saveAdminOrderDesign(orderId, updatedDesignConfig, adminUser, options);
    refreshAll();
    return updated;
  };

  const updateOrderStatus = (params) => {
    const updated = StorageEngine.updateOrderStatus(params);
    refreshAll();
    return updated;
  };

  const deliverOrder = (orderId, actorUser) => {
    const result = StorageEngine.deliverOrder(orderId, actorUser);
    refreshAll();
    return result;
  };

  const deleteOrder = (id, actorUser) => {
    const res = StorageEngine.deleteOrder(id, actorUser);
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

  const saveCustomer = (customer) => {
    const updated = StorageEngine.saveCustomer(customer);
    refreshAll();
    return updated;
  };

  const deleteCustomer = (id) => {
    StorageEngine.deleteCustomer(id);
    refreshAll();
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
      resetAllData,
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
