/* ==========================================================================
   DATA CONTEXT & REACTIVE STORE
   Provides live state hooks for Profiles, NFC Cards, Card Designs, and Audit Logs.
   ========================================================================== */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { StorageEngine } from '../lib/storage';

const flocardBus = typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('flocard_realtime_sync')
  : null;

export function broadcastSyncChange(type, payload = {}) {
  if (flocardBus) {
    try {
      flocardBus.postMessage({ type, payload, timestamp: Date.now() });
    } catch (_) {}
  }
}

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
      const deletedCustNames = StorageEngine.getDeletedCustomerNames?.() || [];
      const deletedProfileIds = StorageEngine.getDeletedProfileIds?.() || [];
      const deletedProfileSlugs = StorageEngine.getDeletedProfileSlugs?.() || [];
      const deletedProfileNames = StorageEngine.getDeletedProfileNames?.() || [];
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
      let cloudInvoices = serverData?.invoices;

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
          const cpName = (cp.name || '').toLowerCase().trim();
          if (!cpSlug) continue;

          const isDeleted = (cp.id && (deletedCustIds.includes(cp.id) || deletedProfileIds.includes(cp.id))) ||
                            (cp.user_id && deletedCustIds.includes(cp.user_id));
          if (isDeleted) continue;

          // Exclude CRM customer records from Digital Profiles list to keep counts accurate & separate
          if (cp.role === 'customer' && !cp.is_digital_profile && !cp.bio && !cp.tagline) {
            continue;
          }

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

          // Clean human-friendly name: never show raw IDs or random hashes in name
          let cleanProfName = (cp.name || '').trim();
          if (!cleanProfName || cleanProfName === cp.slug || /^[0-9a-f-]{12,}$/i.test(cleanProfName)) {
            cleanProfName = cpSlug
              .replace(/-[0-9a-f]{4,8}$/i, '')
              .replace(/[_-]/g, ' ')
              .replace(/\b\w/g, l => l.toUpperCase());
          }

          mappedProfiles.push({
            id: cp.id,
            slug: cp.slug,
            name: cleanProfName || 'Digital Profile',
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
            status: cp.status === 'draft' ? 'private' : (cp.status || 'active'),
            isPrivate: cp.status === 'draft' || cp.status === 'suspended',
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

        // Reconcile profiles: Live cloud records + locally created profiles not yet replicated
        const finalProfiles = [...mappedProfiles];
        const cloudSlugs = new Set(mappedProfiles.map(p => (p.slug || '').toLowerCase().trim()));
        const cloudIds = new Set(mappedProfiles.map(p => p.id));

        for (const lp of localProfiles) {
          const lSlug = (lp.slug || '').toLowerCase().trim();
          const lpId = lp.id ? String(lp.id) : '';
          const isDeleted = (lpId && (deletedCustIds.includes(lpId) || deletedProfileIds.includes(lpId))) ||
                            (lSlug && (deletedProfileSlugs.includes(lSlug) || deletedProfileIds.includes(lSlug)));
          if (isDeleted) continue;

          // If this local profile is not yet in cloud data and not deleted, keep it!
          if (lSlug && !cloudSlugs.has(lSlug) && (!lpId || !cloudIds.has(lpId))) {
            finalProfiles.push(lp);
          }
        }

        StorageEngine.saveLocalProfiles(finalProfiles);
        setProfiles([...finalProfiles]);
      }

      // 2. Reconcile Customers
      const localCustomers = StorageEngine.getCustomers();
      const authoritativeCusts = [];
      const seenCustEmails = new Set();
      const seenCustIds = new Set();
      const seenCustNames = new Set();

      // From cloud users
      for (const u of (cloudUsers || [])) {
        const uEmail = (u.email || '').toLowerCase().trim();
        const rawName = u.user_metadata?.name || u.user_metadata?.full_name || '';
        if (!uEmail || deletedCustIds.includes(u.id) || deletedCustEmails.includes(uEmail)) continue;
        if (uEmail.includes('flocard.in') && u.user_metadata?.role === 'owner') continue;

        let cleanName = rawName.trim();
        if (!cleanName || /^[0-9a-f-]{12,}$/i.test(cleanName)) {
          cleanName = uEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        }

        seenCustEmails.add(uEmail);
        if (u.id) seenCustIds.add(u.id);
        if (cleanName) seenCustNames.add(cleanName.toLowerCase());

        authoritativeCusts.push({
          id: u.id,
          name: cleanName,
          email: u.email,
          phone: u.phone || u.user_metadata?.phone || '',
          company: u.user_metadata?.company || '',
          avatar: u.user_metadata?.avatar_url || u.user_metadata?.picture || '',
          role: 'customer',
          status: u.user_metadata?.status || 'active',
          joinedDate: (u.created_at || '').split('T')[0] || new Date().toISOString().split('T')[0],
          totalCards: 0,
          totalDesigns: 0
        });
      }

      // Reconcile customers derived from digital profiles (ensures all profiles created across any device are synchronized as customers)
      for (const cp of (cloudProfiles || [])) {
        const cpEmail = (cp.email || '').toLowerCase().trim();
        const cpSlug = (cp.slug || '').toLowerCase().trim();
        const cpName = (cp.name || '').trim();
        const cpId = cp.id ? String(cp.id).trim() : '';

        if (deletedCustIds.includes(cpId) || deletedProfileIds.includes(cpId)) continue;
        if (cpEmail && (deletedCustEmails.includes(cpEmail) || seenCustEmails.has(cpEmail))) {
          const existing = authoritativeCusts.find(c => c.email?.toLowerCase().trim() === cpEmail);
          if (existing) {
            if (cp.phone && !existing.phone) existing.phone = cp.phone;
            if (cp.company && !existing.company) existing.company = cp.company;
            if (cp.avatar_url && !existing.avatar) existing.avatar = cp.avatar_url;
            if (cpName && (!existing.name || existing.name === cpEmail.split('@')[0])) existing.name = cpName;
          }
          continue;
        }

        let cleanDerivedName = cpName;
        if (!cleanDerivedName || /^[0-9a-f-]{12,}$/i.test(cleanDerivedName)) {
          cleanDerivedName = cpSlug
            .replace(/-[0-9a-f]{4,8}$/i, '')
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
        }

        if (cleanDerivedName && cleanDerivedName !== 'Flocard' && cleanDerivedName !== 'Admin') {
          if (cpEmail) seenCustEmails.add(cpEmail);
          if (cpId) seenCustIds.add(cpId);
          seenCustNames.add(cleanDerivedName.toLowerCase());

          authoritativeCusts.push({
            id: cpId || `cust_${cpSlug}`,
            slug: cpSlug,
            name: cleanDerivedName,
            email: cpEmail || '',
            phone: cp.phone || '',
            company: cp.company || '',
            avatar: cp.avatar_url || '',
            role: cp.role || 'customer',
            status: cp.status || 'active',
            joinedDate: (cp.created_at || '').split('T')[0] || new Date().toISOString().split('T')[0],
            totalCards: 0,
            totalDesigns: 0
          });
        }
      }

      // Retain valid local customers (including newly added customers and those without emails)
      for (const lc of localCustomers) {
        const lcEmail = (lc.email || '').toLowerCase().trim();
        const lcId = lc.id ? String(lc.id).trim() : '';
        const lcName = (lc.name || '').trim();
        const lcNameLower = lcName.toLowerCase();
        if (deletedCustIds.includes(lcId) || (lcEmail && deletedCustEmails.includes(lcEmail))) continue;

        if (lcEmail && seenCustEmails.has(lcEmail)) {
          const existing = authoritativeCusts.find(c => c.email?.toLowerCase().trim() === lcEmail);
          if (existing) {
            if (lc.phone && !existing.phone) existing.phone = lc.phone;
            if (lc.company && !existing.company) existing.company = lc.company;
            if (lc.name && (!existing.name || existing.name === lcEmail.split('@')[0])) existing.name = lc.name;
            if (lc.whatsapp && !existing.whatsapp) existing.whatsapp = lc.whatsapp;
            if (lc.notes && !existing.notes) existing.notes = lc.notes;
          }
          continue;
        }

        if (lcId && seenCustIds.has(lcId)) continue;

        if (lcNameLower && seenCustNames.has(lcNameLower)) {
          const existing = authoritativeCusts.find(c => (c.name || '').trim().toLowerCase() === lcNameLower);
          if (existing) {
            if (lc.phone && !existing.phone) existing.phone = lc.phone;
            if (lc.company && !existing.company) existing.company = lc.company;
            if (lc.whatsapp && !existing.whatsapp) existing.whatsapp = lc.whatsapp;
            if (lc.notes && !existing.notes) existing.notes = lc.notes;
          }
          continue;
        }

        if (lcEmail) seenCustEmails.add(lcEmail);
        if (lcId) seenCustIds.add(lcId);
        if (lcNameLower) seenCustNames.add(lcNameLower);
        authoritativeCusts.push(lc);
      }

      // Check for live customer updates
      const prevCustCount = StorageEngine.getCustomers().length;
      if (authoritativeCusts.length > prevCustCount) {
        const latest = authoritativeCusts[authoritativeCusts.length - 1];
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('flocard_realtime_sync_toast', {
            detail: {
              title: '⚡ Live Update',
              message: `Customer ${latest?.name || 'record'} updated in real-time.`
            }
          }));
        }
      }

      // Authoritative customer list across all devices & sessions
      StorageEngine.saveLocalCustomers(authoritativeCusts);
      setCustomers([...authoritativeCusts]);

      // 3. Reconcile Card Designs
      if (Array.isArray(cloudDesigns)) {
        const mappedDesigns = [];
        for (const cd of cloudDesigns) {
          const fc = cd.front_config || {};
          const localId = fc._localId || cd.id;

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

        StorageEngine.saveLocalDesigns(mappedDesigns);
        setDesigns([...mappedDesigns]);
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

      // 5. Reconcile Invoices across all accounts
      if (Array.isArray(cloudInvoices)) {
        const localInvoices = StorageEngine.getInvoices();
        const seenInvNos = new Set();
        const finalInvoices = [];

        for (const ci of cloudInvoices) {
          const invNo = ci.invoice_number || ci.id;
          if (!invNo || deletedInvoiceIds.includes(invNo) || deletedInvoiceIds.includes(ci.id)) continue;
          seenInvNos.add(invNo);
          if (ci.id) seenInvNos.add(ci.id);

          const meta = ci.metadata || {};
          finalInvoices.push({
            id: ci.id || invNo,
            invoiceNumber: invNo,
            orderId: ci.order_id || meta.orderId || meta.orderReference || '',
            orderReference: ci.order_reference || meta.orderReference || '',
            customerId: ci.customer_id || meta.customerId || '',
            customerEmail: ci.customer_email || meta.customerEmail || '',
            customerName: ci.customer_name || meta.customerName || '',
            totalAmount: Number(ci.total_amount || meta.totalAmount || 0),
            taxAmount: Number(ci.tax_amount || meta.taxAmount || 0),
            createdAt: ci.created_at || meta.createdAt,
            updatedAt: ci.updated_at || meta.updatedAt,
            ...meta
          });
        }

        for (const li of localInvoices) {
          const lNo = li.invoiceNumber || li.id;
          if (!lNo || deletedInvoiceIds.includes(lNo) || seenInvNos.has(lNo)) continue;
          seenInvNos.add(lNo);
          finalInvoices.push(li);
        }

        StorageEngine.saveLocalInvoices(finalInvoices);
      }

      // 6. Reconcile NFC Cards (Preserve old cards, merge cloud cards, check tombstones)
      const localCards = StorageEngine.getCards();
      const authoritativeCards = [];
      const seenCardCodes = new Set();

      if (Array.isArray(cloudCards)) {
        for (const cc of cloudCards) {
          const cCode = cc.card_code || cc.id;
          if (!cCode || deletedCardIds.includes(cc.id) || deletedCardIds.includes(cCode)) continue;
          seenCardCodes.add(cCode.toLowerCase());
          if (cc.id) seenCardCodes.add(cc.id.toLowerCase());

          const rawStatus = (cc.status || 'in_stock').toLowerCase();
          const cCodeNorm = (cc.card_code || cc.id || '').toLowerCase();
          const existingLocal = localCards.find(c => (c.cardCode || '').toLowerCase() === cCodeNorm || c.id === cc.id);

          const profSlug = cc.profile_slug || existingLocal?.profileSlug || null;
          const matchedProfile = profSlug ? finalProfiles.find(p => (p.slug || '').toLowerCase().trim() === profSlug.toLowerCase().trim()) : null;
          const matchedCust = authoritativeCusts.find(c => (matchedProfile && c.id === matchedProfile.id) || (profSlug && c.slug === profSlug));

          const resolvedCustName = cc.customer_name || existingLocal?.customerName || matchedCust?.name || matchedProfile?.name || '';
          const resolvedProfName = cc.profile_name || existingLocal?.profileName || matchedProfile?.name || profSlug || '';
          const resolvedCustId = cc.customer_id || existingLocal?.customerId || matchedCust?.id || matchedProfile?.id || null;

          authoritativeCards.push({
            id: cc.id || cCode,
            cardCode: cc.card_code,
            cardName: cc.card_name || existingLocal?.cardName || `NFC Card ${cc.card_code}`,
            chipType: cc.chip_type || existingLocal?.chipType || 'NXP NTAG216 (888 Bytes)',
            batch: cc.batch || existingLocal?.batch || 'Batch-A',
            edition: cc.edition || existingLocal?.edition || 'purple',
            customerId: resolvedCustId,
            customerName: resolvedCustName,
            profileSlug: profSlug,
            profileName: resolvedProfName,
            status: rawStatus === 'revoked' ? 'disabled' : rawStatus,
            tapCount: cc.tap_count || existingLocal?.tapCount || 0,
            lastTapped: cc.last_tapped_at || existingLocal?.lastTapped || null,
            updatedAt: cc.updated_at || cc.created_at
          });
        }
      }

      // Retain existing local cards so physical cards in hand or previously created cards are never missing
      for (const lc of localCards) {
        const lcCode = lc.cardCode || lc.id;
        if (!lcCode || deletedCardIds.includes(lc.id) || deletedCardIds.includes(lcCode)) continue;
        const normCode = lcCode.toLowerCase();
        if (seenCardCodes.has(normCode) || (lc.id && seenCardCodes.has(lc.id.toLowerCase()))) {
          const existing = authoritativeCards.find(c => c.cardCode?.toLowerCase() === normCode || c.id === lc.id);
          if (existing) {
            if (!existing.profileSlug && lc.profileSlug) existing.profileSlug = lc.profileSlug;
            if (!existing.customerId && lc.customerId) existing.customerId = lc.customerId;
            if (!existing.customerName && lc.customerName) existing.customerName = lc.customerName;
            if (!existing.profileName && lc.profileName) existing.profileName = lc.profileName;
          }
          continue;
        }
        seenCardCodes.add(normCode);
        authoritativeCards.push(lc);
      }

      StorageEngine.saveLocalCards(authoritativeCards);
      setCards([...authoritativeCards]);

      setLastCloudSyncTime(new Date());
    } catch (err) {
      console.warn('[DataContext] Cloud sync error:', err.message);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Real-time synchronization listeners across browser windows, tabs, and local dispatches
  useEffect(() => {
    // Clean legacy poisonous name-based tombstones so new creations with common names are never hidden
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('flocard_deleted_cust_names');
        localStorage.removeItem('flocard_deleted_profile_names');
      } catch (_) {}
    }

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
        refreshAll();
        syncCloudData();
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    // Cross-tab broadcast listener for immediate zero-latency cross-admin sync
    if (flocardBus) {
      flocardBus.onmessage = (event) => {
        if (event?.data?.type) {
          refreshAll();
          syncCloudData();
        }
      };
    }

    // High-frequency background sync polling every 3.5 seconds for instantaneous cross-device data propagation
    const pollInterval = setInterval(() => {
      syncCloudData();
    }, 3500);

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

  const saveProfile = async (profile) => {
    const updated = await StorageEngine.saveProfile(profile);
    setProfiles(prev => {
      const idx = prev.findIndex(p => p.id === updated.id || p.slug === updated.slug);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [updated, ...prev];
    });
    refreshAll();
    (async () => {
      try {
        await syncCloudData();
        broadcastSyncChange('PROFILE_SAVED', updated);
      } catch (err) {
        console.warn('[DataContext] Profile cloud sync note:', err.message);
      }
    })();
    return updated;
  };

  const deleteProfile = async (id) => {
    setProfiles(prev => prev.filter(p => p.id !== id && p.slug !== id && p.name !== id));
    await StorageEngine.deleteProfile(id);
    refreshAll();
    await syncCloudData();
    broadcastSyncChange('PROFILE_DELETED', { id });
  };

  const saveCard = async (card) => {
    const updated = StorageEngine.saveCard(card);
    setCards(prev => {
      const idx = prev.findIndex(c => (c.id && c.id === updated.id) || (c.cardCode && c.cardCode === updated.cardCode));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [updated, ...prev];
    });
    refreshAll();
    (async () => {
      try {
        await StorageEngine.syncCardToCloud(updated);
        await callCloudSyncApi('syncCard', { card: updated });
        broadcastSyncChange('CARD_SAVED', updated);
      } catch (e) {
        console.warn('[DataContext] syncCard note:', e.message);
      }
    })();
    return updated;
  };

  const deleteCard = async (id) => {
    await StorageEngine.deleteCard(id);
    setCards(prev => prev.filter(c => c.id !== id && c.cardCode !== id));
    refreshAll();
    await syncCloudData();
    broadcastSyncChange('CARD_DELETED', { id });
  };

  const recordTap = (cardCode, clientMeta) => {
    const card = StorageEngine.recordCardTap(cardCode, clientMeta);
    refreshAll();
    return card;
  };

  const saveDesign = async (design) => {
    const updated = StorageEngine.saveDesign(design);
    refreshAll();
    await StorageEngine.syncDesignToCloud(updated);
    await syncCloudData();
    broadcastSyncChange('DESIGN_SAVED', updated);
    return updated;
  };

  const updateDesignStatus = (id, status, notes) => {
    const updated = StorageEngine.updateDesignStatus(id, status, notes);
    refreshAll();
    syncCloudData();
    broadcastSyncChange('DESIGN_STATUS_UPDATED', { id, status });
    return updated;
  };

  const deleteDesign = async (id) => {
    await StorageEngine.deleteDesign(id);
    setDesigns(prev => prev.filter(d => d.id !== id && d.supabaseId !== id));
    refreshAll();
    await syncCloudData();
    broadcastSyncChange('DESIGN_DELETED', { id });
  };

  const saveOrder = (order) => {
    const updated = StorageEngine.saveOrder(order);
    refreshAll();
    syncCloudData();
    broadcastSyncChange('ORDER_SAVED', updated);
    return updated;
  };

  const saveAdminOrderDesign = (orderId, updatedDesignConfig, adminUser, options) => {
    const updated = StorageEngine.saveAdminOrderDesign(orderId, updatedDesignConfig, adminUser, options);
    refreshAll();
    syncCloudData();
    broadcastSyncChange('ORDER_DESIGN_SAVED', { orderId });
    return updated;
  };

  const updateOrderStatus = (params) => {
    const updated = StorageEngine.updateOrderStatus(params);
    refreshAll();
    syncCloudData();
    broadcastSyncChange('ORDER_STATUS_UPDATED', params);
    return updated;
  };

  const deliverOrder = (orderId, actorUser) => {
    const result = StorageEngine.deliverOrder(orderId, actorUser);
    refreshAll();
    syncCloudData();
    broadcastSyncChange('ORDER_DELIVERED', { orderId });
    return result;
  };

  const deleteOrder = async (id, actorUser) => {
    const res = await StorageEngine.deleteOrder(id, actorUser);
    setOrders(prev => prev.filter(o => o.id !== id && o.orderReference !== id));
    refreshAll();
    await syncCloudData();
    broadcastSyncChange('ORDER_DELETED', { id });
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
    setCustomers(prev => {
      const idx = prev.findIndex(c => c.id === updated.id || (c.email && c.email === updated.email));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [updated, ...prev];
    });
    refreshAll();

    // Await cloud sync so Supabase is populated BEFORE completion
    try {
      const synced = await StorageEngine.syncCustomerToCloud(updated);
      if (synced?.id) {
        updated.id = synced.id;
        if (synced.slug) updated.slug = synced.slug;
      }
    } catch (err) {
      console.warn('[DataContext] Customer cloud sync note:', err.message);
    }

    refreshAll();
    await syncCloudData();
    broadcastSyncChange('CUSTOMER_SAVED', updated);
    return updated;
  };

  const deleteCustomer = async (id) => {
    setCustomers(prev => prev.filter(c => c.id !== id && c.email !== id && c.name !== id));
    await StorageEngine.deleteCustomer(id);
    refreshAll();
    await syncCloudData();
    broadcastSyncChange('CUSTOMER_DELETED', { id });
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
    await syncCloudData();
  };

  const purgeOrdersInvoicesAndProfiles = async (actorName) => {
    await StorageEngine.purgeOrdersInvoicesAndProfiles(actorName);
    setOrders([]);
    setProfiles([]);
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
      purgeOrdersInvoicesAndProfiles,
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
