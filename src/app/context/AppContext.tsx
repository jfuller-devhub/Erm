import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  Vendor, Contract, ActivityItem, VendorContact, ConfigOption,
  INITIAL_VENDORS, INITIAL_CONTRACTS, INITIAL_ACTIVITY, INITIAL_VENDOR_CONTACTS,
  INITIAL_CONFIG_OPTIONS,
  generateId,
} from '../data/mockData';
import {
  syncVendorProductLinks,
  removeVendorFromAllProducts,
} from '../data/syncUtils';

interface AppContextType {
  vendors: Vendor[];
  contracts: Contract[];
  activity: ActivityItem[];
  vendorContacts: VendorContact[];
  configOptions: ConfigOption[];
  addVendor: (vendor: Omit<Vendor, 'id' | 'createdDate' | 'updatedDate'>) => void;
  updateVendor: (id: string, changes: Partial<Vendor>) => void;
  deleteVendor: (id: string) => void;
  addContract: (contract: Omit<Contract, 'id' | 'createdDate' | 'updatedDate'>) => void;
  updateContract: (id: string, changes: Partial<Contract>) => void;
  deleteContract: (id: string) => void;
  addVendorContact: (contact: Omit<VendorContact, 'id'>) => void;
  updateVendorContact: (id: string, changes: Partial<VendorContact>) => void;
  deleteVendorContact: (id: string) => void;
  addConfigOption: (option: Omit<ConfigOption, 'id'>) => void;
  updateConfigOption: (id: string, changes: Partial<ConfigOption>) => void;
  deleteConfigOption: (id: string) => void;
  toggleConfigOptionStatus: (id: string) => void;
  getActiveOptions: (table: string, field: string) => string[];
}

// ─── HMR-stable singleton context ─────────────────────────────────────────────
// React Fast Refresh re-evaluates modules on every hot update, which calls
// createContext() again and produces a *new* context object. Any existing
// AppProvider then provides the OLD object, while consumers import the NEW
// one — making useContext() return null and triggering the "must be used
// within AppProvider" error.
//
// Solution: store the context on window so it persists across HMR cycles.
// On the first load the context is created and cached; on every subsequent
// hot reload the cached instance is reused, keeping Provider ↔ consumer in sync.

declare global {
  interface Window {
    __ERMAppContext?: React.Context<AppContextType | null>;
  }
}

function getContext(): React.Context<AppContextType | null> {
  if (!window.__ERMAppContext) {
    window.__ERMAppContext = createContext<AppContextType | null>(null);
  }
  return window.__ERMAppContext;
}

const AppContext = getContext();

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [vendors, setVendors] = useState<Vendor[]>(INITIAL_VENDORS);
  const [contracts, setContracts] = useState<Contract[]>(INITIAL_CONTRACTS);
  const [activity, setActivity] = useState<ActivityItem[]>(INITIAL_ACTIVITY);
  const [vendorContacts, setVendorContacts] = useState<VendorContact[]>(INITIAL_VENDOR_CONTACTS);
  const [configOptions, setConfigOptions] = useState<ConfigOption[]>(INITIAL_CONFIG_OPTIONS);

  const today = new Date().toISOString().split('T')[0];

  const logActivity = useCallback((item: Omit<ActivityItem, 'id'>) => {
    setActivity(prev => [{ ...item, id: 'ACT-' + generateId() }, ...prev]);
  }, []);

  // ── Vendors ────────────────────────────────────────────────────────────────
  const addVendor = useCallback((vendor: Omit<Vendor, 'id' | 'createdDate' | 'updatedDate'>) => {
    const newId = 'VEN-' + generateId();
    setVendors(prev => [...prev, { ...vendor, id: newId, createdDate: today, updatedDate: today }]);
    logActivity({ entityId: newId, entityType: 'vendor', user: 'You', userInitials: 'YO', action: `Added vendor ${vendor.name}`, timestamp: today });
    // Sync: add this vendor to any selected products' vendorIds in localStorage
    syncVendorProductLinks(newId, vendor.productIds ?? [], []);
  }, [today, logActivity]);

  const updateVendor = useCallback((id: string, changes: Partial<Vendor>) => {
    setVendors(prev => {
      const old = prev.find(v => v.id === id);
      const oldProductIds = old?.productIds ?? [];
      const newProductIds = changes.productIds ?? oldProductIds;
      // Sync product vendorIds in localStorage
      syncVendorProductLinks(id, newProductIds, oldProductIds);
      return prev.map(v => v.id === id ? { ...v, ...changes, updatedDate: today } : v);
    });
    logActivity({ entityId: id, entityType: 'vendor', user: 'You', userInitials: 'YO', action: `Updated vendor record ${id}`, timestamp: today });
  }, [today, logActivity]);

  const deleteVendor = useCallback((id: string) => {
    setVendors(prev => prev.filter(v => v.id !== id));
    setContracts(prev => prev.filter(c => c.vendorId !== id));
    setVendorContacts(prev => prev.filter(c => c.vendorId !== id));
    // Sync: remove this vendor from all products' vendorIds in localStorage
    removeVendorFromAllProducts(id);
  }, []);

  // ── Contracts ──────────────────────────────────────────────────────────────
  const addContract = useCallback((contract: Omit<Contract, 'id' | 'createdDate' | 'updatedDate'>) => {
    const newId = 'CON-' + generateId();
    setContracts(prev => [...prev, { ...contract, id: newId, createdDate: today, updatedDate: today }]);
    logActivity({ entityId: newId, entityType: 'contract', user: 'You', userInitials: 'YO', action: `Created contract ${contract.title}`, timestamp: today });
  }, [today, logActivity]);

  const updateContract = useCallback((id: string, changes: Partial<Contract>) => {
    setContracts(prev => prev.map(c => c.id === id ? { ...c, ...changes, updatedDate: today } : c));
    logActivity({ entityId: id, entityType: 'contract', user: 'You', userInitials: 'YO', action: `Updated contract record ${id}`, timestamp: today });
  }, [today, logActivity]);

  const deleteContract = useCallback((id: string) => {
    setContracts(prev => prev.filter(c => c.id !== id));
  }, []);

  // ── Vendor Contacts ────────────────────────────────────────────────────────
  const addVendorContact = useCallback((contact: Omit<VendorContact, 'id'>) => {
    const newId = 'COT-' + generateId();
    setVendorContacts(prev => [...prev, { ...contact, id: newId }]);
    logActivity({ entityId: contact.vendorId, entityType: 'vendor', user: 'You', userInitials: 'YO', action: `Added contact ${contact.name} to vendor`, timestamp: today });
  }, [logActivity, today]);

  const updateVendorContact = useCallback((id: string, changes: Partial<VendorContact>) => {
    setVendorContacts(prev => prev.map(c => c.id === id ? { ...c, ...changes } : c));
  }, []);

  const deleteVendorContact = useCallback((id: string) => {
    setVendorContacts(prev => prev.filter(c => c.id !== id));
  }, []);

  // ── Config Options ─────────────────────────────────────────────────────────
  const addConfigOption = useCallback((option: Omit<ConfigOption, 'id'>) => {
    const newId = 'CFG-' + generateId();
    setConfigOptions(prev => [...prev, { ...option, id: newId }]);
  }, []);

  const updateConfigOption = useCallback((id: string, changes: Partial<ConfigOption>) => {
    setConfigOptions(prev => prev.map(o => o.id === id ? { ...o, ...changes } : o));
  }, []);

  const deleteConfigOption = useCallback((id: string) => {
    setConfigOptions(prev => prev.filter(o => o.id !== id));
  }, []);

  const toggleConfigOptionStatus = useCallback((id: string) => {
    setConfigOptions(prev =>
      prev.map(o => o.id === id
        ? { ...o, status: o.status === 'Active' ? 'Inactive' : 'Active' }
        : o
      )
    );
  }, []);

  /** Returns sorted active values for a given table + field — used by form dropdowns */
  const getActiveOptions = useCallback((table: string, field: string): string[] => {
    return configOptions
      .filter(o => o.table === table && o.field === field && o.status === 'Active')
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(o => o.value);
  }, [configOptions]);

  return (
    <AppContext.Provider value={{
      vendors, contracts, activity, vendorContacts, configOptions,
      addVendor, updateVendor, deleteVendor,
      addContract, updateContract, deleteContract,
      addVendorContact, updateVendorContact, deleteVendorContact,
      addConfigOption, updateConfigOption, deleteConfigOption,
      toggleConfigOptionStatus, getActiveOptions,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}