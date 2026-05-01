'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MdAdd, MdFileUpload, MdAccessTime, MdRefresh } from 'react-icons/md';
import styles from './page.module.css';

export default function DashboardOverview() {
  const router = useRouter();
  const [isUploading, setIsUploading] = React.useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    // Check if user set a custom key in localStorage
    const customKey = localStorage.getItem('papipoint_custom_key');
    if (customKey) {
      formData.append('custom_api_key', customKey);
    }

    try {
      const response = await fetch('http://localhost:8000/api/process-pptx', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Failed to process presentation');
      
      const aiData = await response.json();
      
      // Store the result temporarily in sessionStorage to load in the editor
      sessionStorage.setItem('current_project_data', JSON.stringify(aiData));
      
      // Navigate to the editor
      router.push('/dashboard/projects/new');
      
    } catch (error) {
      console.error(error);
      alert('Error processing presentation with AI.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome back, Jane</h1>
          <p className={styles.subtitle}>Here's an overview of your presentations.</p>
        </div>
        
        <div style={{ position: 'relative' }}>
          <input 
            type="file" 
            accept=".pptx" 
            onChange={handleFileUpload} 
            style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 10 }}
            disabled={isUploading}
          />
          <button className="btn-primary" disabled={isUploading}>
            {isUploading ? <MdRefresh size={18} className="spin" /> : <MdAdd size={18} />}
            {isUploading ? 'Processing with AI...' : 'New Presentation'}
          </button>
        </div>
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
