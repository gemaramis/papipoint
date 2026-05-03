'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MdArrowBack } from 'react-icons/md';
import { supabase } from '@/lib/supabase';
import styles from '../login/page.module.css'; // Reuse login styles

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.backLinkWrapper}>
        <Link href="/" className={styles.backLink}>
          <MdArrowBack size={16} /> Back to Home
        </Link>
      </div>

      <div className={`glass-panel ${styles.authCard}`}>
        <div className={styles.logoMarkWrapper}>
          <Image src="/logo.png" alt="Papipoint Logo" width={48} height={48} style={{ borderRadius: '12px', boxShadow: '0 8px 24px rgba(230, 57, 70, 0.3)' }} />
        </div>

        <h1 className={styles.title}>Create Account</h1>
        <p className={styles.subtitle}>Join Papipoint to transform your presentations</p>

        {error && <div style={{ color: 'var(--primary)', marginBottom: '16px', fontSize: '0.9rem', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSignup} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>

          <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className={styles.footerText}>
          Already have an account? <Link href="/login" className={styles.link}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
