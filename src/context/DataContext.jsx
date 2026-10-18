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
  const [auditLogs, setAuditLogs] = useState(() => StorageEngine.getAuditLogs());
  const [studioBackground, setStudioBackground] = useState(() => StorageEngine.getStudioBackground());
  const [adminAccounts, setAdminAccounts] = useState(() => StorageEngine.getAdminAccounts());
  const [lastOrderUpdate, setLastOrderUpdate] = useState(null);

  const refreshAll = () => {
    setProfiles(StorageEngine.getProfiles());
    setCards(StorageEngine.getCards());
    setDesigns(StorageEngine.getDesigns());
    setOrders(StorageEngine.getOrders());
    setCustomers(StorageEngine.getCustomers());
    setTemplates(StorageEngine.getTemplates());
    setAuditLogs(StorageEngine.getAuditLogs());
    setStudioBackground(StorageEngine.getStudioBackground());
    setAdminAccounts(StorageEngine.getAdminAccounts());
  };

  // Real-time synchronization listeners across browser windows, tabs, and local dispatches
  useEffect(() => {
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
    };

    window.addEventListener('flocard_order_updated', handleOrderUpdated);
    window.addEventListener('flocard_profile_updated', refreshAll);
    window.addEventListener('flocard_card_updated', refreshAll);
    window.addEventListener('flocard_notification_created', refreshAll);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('flocard_order_updated', handleOrderUpdated);
      window.removeEventListener('flocard_profile_updated', refreshAll);
      window.removeEventListener('flocard_card_updated', refreshAll);
      window.removeEventListener('flocard_notification_created', refreshAll);
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
      auditLogs,
      adminAccounts,
      lastOrderUpdate,
      addAdminAccount,
      revokeAdminAccount,
      studioBackground,
      updateStudioBackground,
      resetStudioBg,
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
      updateOrderStatus,
      deliverOrder,
      deleteOrder,
      createOrderFromDesign,
      assignDesignToOrder,
      saveCustomer,
      deleteCustomer,
      saveTemplate,
      deleteTemplate,
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
