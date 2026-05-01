'use client';

import React from 'react';
import Link from 'next/link';
import { MdAdd, MdFileUpload, MdAccessTime } from 'react-icons/md';
import styles from './page.module.css';

export default function DashboardOverview() {
  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome back, Jane</h1>
          <p className={styles.subtitle}>Here's an overview of your presentations.</p>
        </div>
        <button className="btn-primary">
          <MdAdd size={18} />
          New Presentation
        </button>
      </div>

      <div className={styles.statsGrid}>
        <div className={`glass-panel ${styles.statCard}`}>
          <div className={styles.statIconWrapper}>
            <MdFileUpload size={24} className={styles.statIcon} />
          </div>
          <div className={styles.statInfo}>
            <h3>Total Projects</h3>
            <p className={styles.statValue}>12</p>
          </div>
        </div>

        <div className={`glass-panel ${styles.statCard}`}>
          <div className={styles.statIconWrapper}>
            <MdAccessTime size={24} className={styles.statIcon} />
          </div>
          <div className={styles.statInfo}>
            <h3>Hours Saved</h3>
            <p className={styles.statValue}>~34h</p>
          </div>
        </div>
      </div>

      <div className={styles.recentProjects}>
        <div className={styles.sectionHeader}>
          <h2>Recent Projects</h2>
          <Link href="/dashboard/projects" className={styles.viewAll}>
            View All
          </Link>
        </div>

        <div className={styles.projectsGrid}>
          {/* Placeholder Projects */}
          {[1, 2, 3].map((i) => (
            <div key={i} className={`glass-panel ${styles.projectCard}`}>
              <div className={styles.projectPreview}>
                <div className={styles.placeholderSlide}></div>
              </div>
              <div className={styles.projectInfo}>
                <h4>Q3 Marketing Plan {i}</h4>
                <p>Updated 2 days ago</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
