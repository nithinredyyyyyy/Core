import React from 'react';
import styles from './NavTabs.module.css';

/**
 * NavTabs – a simple accessible tab navigation component.
 * Props:
 *   tabs: [{ id: string, label: string }]
 *   activeTabId: string
 *   onSelect: (id: string) => void
 */
export default function NavTabs({ tabs, activeTabId, onSelect }) {
  return (
    <div role="tablist" className={styles.tablist} aria-label="Stage navigation">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={tab.id === activeTabId}
          aria-controls={`panel-${tab.id}`}
          id={`tab-${tab.id}`}
          type="button"
          className={`${styles.tab} ${tab.id === activeTabId ? styles.active : ''}`}
          onClick={() => onSelect(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
