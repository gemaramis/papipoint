import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MdLogin } from 'react-icons/md';
import styles from './NavBar.module.css';

export default function NavBar() {
  return (
    <nav className={`glass-panel ${styles.navbar}`}>
      <div className={`container ${styles.navContainer}`}>
        <Link href="/" className={styles.logo}>
          <Image src="/logo.png" alt="Papipoint Logo" width={32} height={32} style={{ borderRadius: '8px' }} />
          <span className="text-gradient" style={{ fontWeight: 700, fontSize: '1.25rem' }}>Papipoint</span>
        </Link>
        
        <div className={styles.navLinks}>
          <Link href="#features" className={styles.navLink}>Features</Link>
          <Link href="#pricing" className={styles.navLink}>Pricing</Link>
          <Link href="#faq" className={styles.navLink}>FAQ</Link>
        </div>
        
        <div className={styles.navActions}>
          <Link href="/login" className={styles.loginBtn}>
            <MdLogin size={18} />
            Login
          </Link>
          <Link href="/signup" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
