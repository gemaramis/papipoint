'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import styles from './layout.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.dashboardContainer}>
      <Sidebar />
      <main className={styles.mainContent}>
        <div className={styles.contentInner}>
          {children}
        </div>
      </main>
    </div>
  );
}
