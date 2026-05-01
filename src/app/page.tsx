'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MdArrowForward, MdAutoAwesome, MdLayers, MdAutoFixHigh } from 'react-icons/md';
import NavBar from '@/components/NavBar';
import styles from './page.module.css';

export default function LandingPage() {
  return (
    <div className={styles.pageWrapper}>
      <NavBar />
      
      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.heroSection}>
          <div className="container">
            <motion.div 
              className={styles.heroContent}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className={styles.badge}>
                <MdAutoAwesome size={16} className={styles.badgeIcon} />
                <span>The Future of Presentations is Here</span>
              </div>
              
              <h1 className={styles.title}>
                Redesign your slides with <br/>
                <span className="text-gradient">Papipoint AI.</span>
              </h1>
              
              <p className={styles.subtitle}>
                Upload your outdated .pptx presentations, provide a few references, and watch as our AI
                transforms them into stunning, professional masterpieces in seconds.
              </p>
              
              <div className={styles.ctaGroup}>
                <button className="btn-primary">
                  Start for Free <MdArrowForward size={18} />
                </button>
                <button className="btn-secondary">
                  View Demo
                </button>
              </div>
            </motion.div>

            <motion.div 
              className={styles.heroImageContainer}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className={`glass-panel ${styles.mockupWindow}`}>
                <div className={styles.mockupHeader}>
                  <div className={styles.dot} style={{ background: '#ff5f56' }} />
                  <div className={styles.dot} style={{ background: '#ffbd2e' }} />
                  <div className={styles.dot} style={{ background: '#27c93f' }} />
                </div>
                <div className={styles.mockupBody}>
                  {/* Placeholder for the app screenshot or interactive element */}
                  <div className={styles.mockupPlaceholder}>
                    <div className={styles.mockupSlide} />
                    <div className={styles.mockupSidebar}>
                      <div className={styles.skeletonText} />
                      <div className={styles.skeletonText} style={{ width: '60%' }} />
                      <div className={styles.skeletonBox} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className={styles.featuresSection}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <h2>How Papipoint Works</h2>
              <p>Three simple steps to presentation perfection</p>
            </div>
            
            <div className={styles.featureGrid}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <MdLayers size={24} color="var(--primary)" />
                </div>
                <h3>1. Upload</h3>
                <p>Drag and drop your existing .pptx file. We preserve your raw text and data while stripping away the old styling.</p>
              </div>
              
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <MdAutoFixHigh size={24} color="var(--primary)" />
                </div>
                <h3>2. AI Magic</h3>
                <p>Choose an AI model or use your own API key. Our AI structures your content and applies modern design principles.</p>
              </div>
              
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <MdAutoAwesome size={24} color="var(--primary)" />
                </div>
                <h3>3. Refine & Export</h3>
                <p>Tweak the final result in our Canva-like editor and export back to a perfectly formatted PowerPoint file.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
