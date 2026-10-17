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

  const updateOrderStatus = (id, status) => {
    const updated = StorageEngine.updateOrderStatus(id, status);
    refreshAll();
    return updated;
  };

  const deliverOrder = (orderId) => {
    const result = StorageEngine.deliverOrder(orderId);
    refreshAll();
    return result;
  };

  const deleteOrder = (id) => {
    StorageEngine.deleteOrder(id);
    refreshAll();
  };

  const createOrderFromDesign = (design, notes) => {
    const order = StorageEngine.createOrderFromDesign(design, notes);
    refreshAll();
    return order;
  };

  const assignDesignToOrder = (designId, notes) => {
    const res = StorageEngine.assignDesignToOrder(designId, notes);
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
      getOrderById: StorageEngine.getOrderById
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
