'use client';

import React, { useState } from 'react';
import { MdKey, MdInfo, MdCheckCircle } from 'react-icons/md';
import styles from './page.module.css';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [aiProvider, setAiProvider] = useState('gemini');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would save to the database securely
    console.log('Saved settings:', { aiProvider, apiKey });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Manage your account preferences and API integrations.</p>
      </div>

      <div className={styles.settingsGrid}>
        <div className={`glass-panel ${styles.settingsCard}`}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <MdKey size={20} />
            </div>
            <div>
              <h2>AI Provider Configuration</h2>
              <p>Choose your preferred AI model for generating presentations.</p>
            </div>
          </div>

          <form onSubmit={handleSave} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="provider">Select AI Provider</label>
              <select 
                id="provider" 
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value)}
                className={styles.select}
              >
                <option value="gemini">Gemini (Default Free Tier)</option>
                <option value="openai">OpenAI (GPT-4o)</option>
                <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
              </select>
            </div>

            {aiProvider !== 'gemini' && (
              <div className={styles.inputGroup}>
                <label htmlFor="apiKey">Your API Key</label>
                <input 
                  type="password" 
                  id="apiKey" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`Enter your ${aiProvider} API key...`}
                  className={styles.input}
                  required
                />
                <div className={styles.helpText}>
                  <MdInfo size={14} />
                  <span>Your API key is securely stored and never shared.</span>
                </div>
              </div>
            )}

            {aiProvider === 'gemini' && (
              <div className={styles.infoBox}>
                <MdCheckCircle size={16} className={styles.successIcon} />
                <p>You are using the default free tier powered by Google Gemini. No API key required.</p>
              </div>
            )}

            <div className={styles.formActions}>
              <button type="submit" className="btn-primary">
                Save Changes
              </button>
              {isSaved && <span className={styles.savedMessage}>Settings saved!</span>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
