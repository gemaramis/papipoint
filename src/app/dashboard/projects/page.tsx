import React from 'react';
import Link from 'next/link';
import { MdAdd, MdFolder } from 'react-icons/md';
import styles from '../page.module.css';

export default function ProjectsPage() {
  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>All Projects</h1>
          <p className={styles.subtitle}>Manage your AI generated presentations</p>
        </div>
        <Link href="/dashboard" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <MdAdd size={18} />
          New Presentation
        </Link>
      </div>

      <div className={styles.projectsGrid} style={{ marginTop: '2rem' }}>
        {/* Placeholder Projects */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className={`glass-panel ${styles.projectCard}`}>
            <div className={styles.projectPreview}>
              <div className={styles.placeholderSlide}></div>
            </div>
            <div className={styles.projectInfo}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <MdFolder size={16} color="var(--primary)" />
                <h4 style={{ margin: 0 }}>Q3 Marketing Plan {i}</h4>
              </div>
              <p style={{ margin: 0 }}>Updated 2 days ago</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
