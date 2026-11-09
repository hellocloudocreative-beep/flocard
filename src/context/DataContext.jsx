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
      const { supabase, supabaseAdmin, isSupabaseConfigured } = await import('../lib/supabase.js');
      if (!isSupabaseConfigured) {
        setIsCloudSyncing(false);
        return;
      }
      const client = supabaseAdmin || supabase;
      if (!client) {
        setIsCloudSyncing(false);
        return;
      }

      const deletedCustIds = StorageEngine.getDeletedCustomerIds?.() || [];
      const deletedCustEmails = StorageEngine.getDeletedCustomerEmails?.() || [];
      const deletedCardIds = StorageEngine.getDeletedCardIds?.() || [];
      const deletedDesignIds = StorageEngine.getDeletedDesignIds?.() || [];
      const deletedOrderIds = StorageEngine.getDeletedOrderIds?.() || [];
      const deletedInvoiceIds = StorageEngine.getDeletedInvoiceIds?.() || [];

      // 1. Synchronize Profiles from Supabase
      try {
        const { data: cloudProfiles, error: pErr } = await client
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (!pErr && Array.isArray(cloudProfiles) && cloudProfiles.length > 0) {
          const localProfiles = StorageEngine.getProfiles();
          const currentCusts = StorageEngine.getCustomers();
          let custsUpdated = false;

          for (const cp of cloudProfiles) {
            const cpEmail = (cp.email || '').toLowerCase().trim();
            const isDeleted = (cp.id && deletedCustIds.includes(cp.id)) ||
                              (cp.user_id && deletedCustIds.includes(cp.user_id)) ||
                              (cpEmail && deletedCustEmails.includes(cpEmail));
            if (isDeleted) {
              const pIdx = localProfiles.findIndex(p => p.id === cp.id || (cpEmail && p.email?.toLowerCase().trim() === cpEmail));
              if (pIdx >= 0) localProfiles.splice(pIdx, 1);
              const cIdx = currentCusts.findIndex(c => c.id === cp.id || (cpEmail && c.email?.toLowerCase().trim() === cpEmail));
              if (cIdx >= 0) { currentCusts.splice(cIdx, 1); custsUpdated = true; }
              continue;
            }

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

            // Immediately synthesize and update customer from verified profile
            const isCustomerProfile = cp.role === 'customer' || (!cp.email?.includes('flocard.in') && cp.role !== 'owner');
            if (isCustomerProfile && cp.name) {
              const custId = cp.id || cp.user_id;
              const custEmail = (cp.email || '').toLowerCase().trim();
              const existIdx = currentCusts.findIndex(c => (custId && c.id === custId) || (custEmail && c.email && c.email.toLowerCase().trim() === custEmail));
              const mappedFromProfile = {
                id: custId,
                name: cp.name,
                email: custEmail,
                phone: cp.phone || '',
                company: cp.company || '',
                avatar: cp.avatar_url || '',
                role: 'customer',
                status: cp.status || 'active',
                joinedDate: (cp.created_at || '').split('T')[0] || new Date().toISOString().split('T')[0],
                totalCards: 0,
                totalDesigns: 0
              };
              if (existIdx >= 0) {
                currentCusts[existIdx] = { ...currentCusts[existIdx], ...mappedFromProfile };
              } else {
                currentCusts.unshift(mappedFromProfile);
              }
              custsUpdated = true;
            }
          }
          if (custsUpdated) {
            StorageEngine.saveLocalCustomers(currentCusts);
            setCustomers([...currentCusts]);
          }
          StorageEngine.saveLocalProfiles(localProfiles);
          setProfiles([...localProfiles]);
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
            if (deletedCardIds.includes(cc.id) || (cc.card_code && deletedCardIds.includes(cc.card_code))) {
              const cIdx = localCards.findIndex(c => c.cardCode === cc.card_code || c.id === cc.id);
              if (cIdx >= 0) localCards.splice(cIdx, 1);
              continue;
            }
            if (cc.customer_id && deletedCustIds.includes(cc.customer_id)) {
              cc.customer_id = null;
              cc.profile_slug = null;
            }
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
          const filteredLocalCards = localCards.filter(c => !deletedCardIds.includes(c.id) && !deletedCardIds.includes(c.cardCode));
          StorageEngine.saveLocalCards(filteredLocalCards);
          setCards([...filteredLocalCards]);
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
              const uEmail = (u.email || '').toLowerCase().trim();
              if (deletedCustIds.includes(u.id) || (uEmail && deletedCustEmails.includes(uEmail))) {
                continue;
              }
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
            setCustomers([...localCusts]);

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
              setProfiles([...localProfs]);
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
          const currentCusts = StorageEngine.getCustomers();
          let custsUpdated = false;

          for (const cd of cloudDesigns) {
            const fc = cd.front_config || {};
            const localId = fc._localId || cd.id;

            if (deletedDesignIds.includes(cd.id) || (localId && deletedDesignIds.includes(localId))) {
              const existDIdx = localDesigns.findIndex(d => d.id === localId || d.supabaseId === cd.id);
              if (existDIdx >= 0) localDesigns.splice(existDIdx, 1);
              continue;
            }

            const custEmail = (fc.customerEmail || '').trim().toLowerCase();
            const isDesignCustDeleted = (fc.customerId && deletedCustIds.includes(fc.customerId)) ||
                                       (custEmail && deletedCustEmails.includes(custEmail));
            if (isDesignCustDeleted) {
              const existDIdx = localDesigns.findIndex(d => d.id === localId || d.supabaseId === cd.id);
              if (existDIdx >= 0) localDesigns.splice(existDIdx, 1);
              continue;
            }

            const mappedDesign = {
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
            };

            const existDIdx = localDesigns.findIndex(d => d.id === localId || d.supabaseId === cd.id);
            if (existDIdx >= 0) {
              localDesigns[existDIdx] = { ...localDesigns[existDIdx], ...mappedDesign };
            } else {
              localDesigns.unshift(mappedDesign);
            }

            // Extract and reconstruct embedded Print Order across devices
            if (fc.printOrder) {
              const po = fc.printOrder;
              const isPoDeleted = (po.id && deletedOrderIds.includes(po.id)) ||
                                  (po.orderReference && deletedOrderIds.includes(po.orderReference));
              if (isPoDeleted) {
                const existOIdx = localOrders.findIndex(o => o.id === po.id || o.orderReference === po.orderReference);
                if (existOIdx >= 0) localOrders.splice(existOIdx, 1);
              } else {
                const existOIdx = localOrders.findIndex(o => o.id === po.id || o.orderReference === po.orderReference);
                if (existOIdx < 0) {
                  localOrders.unshift(po);
                } else {
                  localOrders[existOIdx] = { ...localOrders[existOIdx], ...po };
                }
              }
            } else if (mappedDesign.orderId) {
              const ordRef = mappedDesign.orderId;
              const isOrdDeleted = deletedOrderIds.includes(ordRef);
              if (isOrdDeleted) {
                const existOIdx = localOrders.findIndex(o => o.id === ordRef || o.orderReference === ordRef);
                if (existOIdx >= 0) localOrders.splice(existOIdx, 1);
              } else {
                const existOIdx = localOrders.findIndex(o => o.id === ordRef || o.orderReference === ordRef);
                if (existOIdx < 0) {
                  localOrders.unshift({
                    id: ordRef,
                    orderReference: ordRef,
                    designId: localId,
                    designTitle: mappedDesign.title,
                    customerName: mappedDesign.customerName,
                    customerEmail: mappedDesign.customerEmail,
                    customerPhone: mappedDesign.customerPhone,
                    company: mappedDesign.company,
                    edition: mappedDesign.edition,
                    status: mappedDesign.status === 'approved' ? 'approved' : 'new_order',
                    createdAt: cd.created_at,
                    updatedAt: cd.updated_at || cd.created_at,
                    totalAmount: 1899,
                    source: 'web_studio'
                  });
                }
              }
            }

            // Synthesize customer from design so customers from any device are never lost
            if (custEmail && !isDesignCustDeleted) {
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
                custsUpdated = true;
              }
            }
          }

          if (custsUpdated) {
            StorageEngine.saveLocalCustomers(currentCusts);
            setCustomers([...currentCusts]);
          }
          const cleanLocalDesigns = localDesigns.filter(d => !deletedDesignIds.includes(d.id) && !deletedDesignIds.includes(d.supabaseId));
          StorageEngine.saveLocalDesigns(cleanLocalDesigns);
          setDesigns([...cleanLocalDesigns]);

          const cleanLocalOrders = localOrders.filter(o => {
            const isDel = (o.id && deletedOrderIds.includes(o.id)) ||
                          (o.orderReference && deletedOrderIds.includes(o.orderReference)) ||
                          (o.customerId && deletedCustIds.includes(o.customerId)) ||
                          (o.customerEmail && deletedCustEmails.includes(o.customerEmail.toLowerCase().trim()));
            return !isDel;
          });
          StorageEngine.saveLocalOrders(cleanLocalOrders);
          setOrders([...cleanLocalOrders]);
        }
      } catch (err) {
        console.warn('[DataContext] Card designs cloud sync note:', err.message);
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

  const deleteCard = async (id) => {
    await StorageEngine.deleteCard(id);
    setCards(prev => prev.filter(c => c.id !== id && c.cardCode !== id));
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

  const deleteDesign = async (id) => {
    await StorageEngine.deleteDesign(id);
    setDesigns(prev => prev.filter(d => d.id !== id && d.supabaseId !== id));
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

  const deleteOrder = async (id, actorUser) => {
    const res = await StorageEngine.deleteOrder(id, actorUser);
    setOrders(prev => prev.filter(o => o.id !== id && o.orderReference !== id));
    refreshAll();
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
      return synced || updated;
    } catch (err) {
      refreshAll();
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
