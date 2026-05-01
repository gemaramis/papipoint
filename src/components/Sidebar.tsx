import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { MdSpaceDashboard, MdSettings, MdFileUpload, MdLogout } from 'react-icons/md';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <Link href="/" className={styles.logo}>
          <Image src="/logo.png" alt="Papipoint Logo" width={32} height={32} style={{ borderRadius: '8px' }} />
          <span className="text-gradient" style={{ fontWeight: 700, fontSize: '1.25rem' }}>Papipoint</span>
        </Link>
      </div>

      <nav className={styles.nav}>
        <Link 
          href="/dashboard" 
          className={`${styles.navItem} ${pathname === '/dashboard' ? styles.active : ''}`}
        >
          <MdSpaceDashboard size={20} />
          <span>Overview</span>
        </Link>
        <Link 
          href="/dashboard/projects" 
          className={`${styles.navItem} ${pathname?.startsWith('/dashboard/projects') ? styles.active : ''}`}
        >
          <MdFileUpload size={20} />
          <span>My Projects</span>
        </Link>
        <Link 
          href="/dashboard/settings" 
          className={`${styles.navItem} ${pathname === '/dashboard/settings' ? styles.active : ''}`}
        >
          <MdSettings size={20} />
          <span>Settings</span>
        </Link>
      </nav>

      <div className={styles.footer}>
        <button className={styles.logoutBtn}>
          <MdLogout size={20} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
