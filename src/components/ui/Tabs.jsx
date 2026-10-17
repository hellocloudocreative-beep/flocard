/* ==========================================================================
   UI ARC - TABS COMPONENT
   Accessible sliding pill tabs with keyboard navigation and fluid transitions.
   ========================================================================== */
import React, { createContext, useContext, useState } from 'react';

const TabsContext = createContext();

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  children,
  className = '',
  style = {}
}) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const activeTab = value !== undefined ? value : internalValue;

  const setActiveTab = (newVal) => {
    if (value === undefined) setInternalValue(newVal);
    if (onValueChange) onValueChange(newVal);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={`arc-tabs ${className}`} style={{ width: '100%', ...style }}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className = '', style = {}, ariaLabel = 'Navigation tabs' }) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`arc-tabs-list ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: '#15101D',
        border: '1px solid #30223F',
        borderRadius: '9999px',
        padding: '4px',
        gap: '4px',
        position: 'relative',
        maxWidth: '100%',
        overflowX: 'auto',
        ...style
      }}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className = '', disabled = false, style = {} }) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isSelected = activeTab === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      className={`arc-tabs-trigger ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 18px',
        borderRadius: '9999px',
        border: 'none',
        background: isSelected ? 'linear-gradient(135deg, #6B00FF 0%, #8B5CF6 100%)' : 'transparent',
        color: isSelected ? '#FFFFFF' : '#82758F',
        fontWeight: isSelected ? 600 : 500,
        fontSize: '0.86rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isSelected ? '0 4px 14px rgba(107, 0, 255, 0.35)' : 'none',
        whiteSpace: 'nowrap',
        ...style
      }}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className = '', style = {} }) {
  const { activeTab } = useContext(TabsContext);
  if (activeTab !== value) return null;

  return (
    <div
      role="tabpanel"
      className={`arc-tabs-content ${className}`}
      style={{
        animation: 'fadeIn 0.22s ease',
        width: '100%',
        ...style
      }}
    >
      {children}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default Tabs;
