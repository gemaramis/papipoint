'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MdAdd,
  MdFileUpload,
  MdAccessTime,
  MdLayers,
  MdAutoAwesome,
  MdPictureAsPdf,
  MdDashboard,
  MdCheck,
} from 'react-icons/md';
import styles from './page.module.css';

// ------------------------------------
// Loading step definitions
// ------------------------------------
type LoadStep = {
  label: string;
  detail: string;
  weight: number; // portion of 0-100 this step takes
};

const STEPS_REIMAGINE: LoadStep[] = [
  { label: 'Reading file', detail: 'Parsing your PowerPoint file…', weight: 10 },
  { label: 'Extracting text', detail: 'Pulling text from every slide…', weight: 20 },
  { label: 'Analysing content', detail: 'Understanding the narrative structure…', weight: 20 },
  { label: 'AI redesigning', detail: 'Reimagining your presentation with AI…', weight: 40 },
  { label: 'Finalising', detail: 'Polishing the output…', weight: 10 },
];

const STEPS_MANUAL: LoadStep[] = [
  { label: 'Reading file', detail: 'Parsing your PowerPoint file…', weight: 30 },
  { label: 'Extracting text', detail: 'Pulling text from every slide…', weight: 40 },
  { label: 'Organising', detail: 'Building your slides for the editor…', weight: 30 },
];

interface PdfSlide {
  title?: string;
  subtitle?: string;
  bullets?: string[];
}

interface PdfData {
  title?: string;
  slides?: PdfSlide[];
}

type AiModel = 'sonnet' | 'gpt4o' | 'o1pro' | 'deepseek' | 'kimi' | 'gemma4' | 'llama' | 'qwen' | 'hunyuan';

type Persona = 'corporate' | 'creative' | 'tech' | 'minimalist';

// Helper: compute cumulative start % for each step
function stepStartPct(steps: LoadStep[], idx: number) {
  return steps.slice(0, idx).reduce((s, st) => s + st.weight, 0);
}

// ------------------------------------
// Component
// ------------------------------------
export default function DashboardOverview() {
  const router = useRouter();

  // Upload state
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [showWorkflowModal, setShowWorkflowModal] = React.useState(false);
  const [showBriefModal, setShowBriefModal] = React.useState(false);

  // Brief form
  const [redesignGoal, setRedesignGoal] = React.useState('Professional Pitch Deck');
  const [redesignInstructions, setRedesignInstructions] = React.useState('');
  const [referenceImage, setReferenceImage] = React.useState<File | null>(null);
  const [outputFormat, setOutputFormat] = React.useState<'editor' | 'pdf'>('editor');
  const [aiModel, setAiModel] = React.useState<AiModel>('sonnet');
  const [persona, setPersona] = React.useState<Persona>('corporate');
  const [customApiKey, setCustomApiKey] = React.useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('papipoint_custom_key') || '';
    }
    return '';
  });

  // Save custom key
  const saveCustomKey = (key: string) => {
    setCustomApiKey(key);
    localStorage.setItem('papipoint_custom_key', key);
  };

  // Loading overlay
  const [isUploading, setIsUploading] = React.useState(false);
  const [loadingProgress, setLoadingProgress] = React.useState(0);
  const [activeStepIdx, setActiveStepIdx] = React.useState(0);
  const [currentMode, setCurrentMode] = React.useState<'manual' | 'reimagine'>('reimagine');

  // ----- file pick -----
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setShowWorkflowModal(true);
    e.target.value = '';
  };

  // ----- PDF generation (client-side) -----
  const generateAndDownloadPDF = async (data: PdfData) => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });

    const W = 297;
    const H = 210;
    const HEADER_H = 65;

    // Helper: Colors
    const colors = {
      primary: '#6d28d9',   // Deep Purple
      accent: '#a855f7',    // Light Purple
      dark: '#0f172a',      // Slate 900
      body: '#1e293b',      // Slate 800
      muted: '#94a3b8',     // Slate 400
      white: '#ffffff',
      light: '#f8fafc',
    };

    const fill = (c: keyof typeof colors) => {
      const hex = colors[c];
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      doc.setFillColor(r, g, b);
    };
    const txt = (c: keyof typeof colors) => {
      const hex = colors[c];
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      doc.setTextColor(r, g, b);
    };

    // ── Title / Closing slide (Modern Design) ─────────────────
    const drawTitleSlide = (slide: PdfSlide) => {
      // Modern gradient background
      for (let i = 0; i < H; i += 30) {
        const alpha = i / H;
        const r = Math.floor(15 + alpha * 20);
        const g = Math.floor(23 + alpha * 30);
        const b = Math.floor(42 + alpha * 40);
        doc.setFillColor(r, g, b);
        doc.rect(0, i, W, 30, 'F');
      }

      // Decorative geometric elements
      fill('primary');
      doc.circle(0, 0, 100, 'F');
      fill('accent');
      doc.circle(W, H, 140, 'F');

      // Modern accent line
      fill('accent');
      doc.rect(0, H - 4, W, 4, 'F');

      // Title with modern typography
      doc.setFontSize(42);
      doc.setFont('helvetica', 'bold');
      txt('white');
      const tLines = doc.splitTextToSize(slide.title || 'Presentation', W - 80);
      const tY = H / 2 - (tLines.length * 18);
      doc.text(tLines, W / 2, tY, { align: 'center' });

      // Modern accent underline
      fill('accent');
      doc.rect(W / 2 - 60, tY + tLines.length * 18 + 8, 120, 3, 'F');

      // Subtitle
      if (slide.subtitle) {
        doc.setFontSize(18);
        doc.setFont('helvetica', 'normal');
        txt('muted');
        const sLines = doc.splitTextToSize(slide.subtitle, W - 100);
        doc.text(sLines, W / 2, tY + tLines.length * 18 + 30, { align: 'center' });
      }

      // Modern brand footer
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      txt('accent');
      doc.text('PAPIPOINT.ID', W / 2, H - 25, { align: 'center' });
    };

    // ── Content slide (Modern Design) ─────────────────
    const drawContentSlide = (slide: PdfSlide, idx: number, total: number) => {
      // Clean white background
      fill('light'); doc.rect(0, 0, W, H, 'F');

      // Modern header with gradient effect
      for (let i = 0; i < HEADER_H; i += 20) {
        const alpha = i / HEADER_H;
        const r = Math.floor(15 + alpha * 5);
        const g = Math.floor(23 + alpha * 5);
        const b = Math.floor(42 + alpha * 8);
        doc.setFillColor(r, g, b);
        doc.rect(0, i, W, 20, 'F');
      }

      // Modern accent bar
      fill('accent');
      doc.rect(0, HEADER_H - 3, W, 3, 'F');

      // Title with modern styling
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      txt('white');
      const tLines = doc.splitTextToSize(slide.title || 'Slide Title', W - 60);
      doc.text(tLines, 30, 32);

      // Subtitle (if exists)
      if (slide.subtitle) {
        doc.setFontSize(13);
        doc.setFont('helvetica', 'normal');
        txt('muted');
        const sLines = doc.splitTextToSize(slide.subtitle, W - 60);
        doc.text(sLines, 30, 32 + tLines.length * 12 + 6);
      }

      // Content area with modern bullet styling
      if (slide.bullets?.length) {
        let cur = HEADER_H + 30;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'normal');

        slide.bullets.forEach((b: string) => {
          if (cur > H - 40) return;

          // Modern bullet point (circle)
          fill('primary');
          doc.circle(35, cur - 2, 2, 'F');

          // Bullet text
          txt('body');
          const bLines = doc.splitTextToSize(b, W - 70);
          doc.text(bLines, 45, cur);
          cur += bLines.length * 9 + 8;
        });
      }

      // Modern footer with slide number
      fill('dark');
      doc.rect(0, H - 18, W, 18, 'F');

      // Progress bar
      const progW = (W - 40) * ((idx + 1) / total);
      fill('accent');
      doc.rect(20, H - 9, progW, 2, 'F');
      fill('muted');
      doc.rect(20 + progW, H - 9, (W - 40) - progW, 1.5, 'F');

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      txt('muted');
      doc.text(`SLIDE ${idx + 1} / ${total}`, 20, H - 12);
      doc.text('PAPIPOINT.ID', W - 20, H - 12, { align: 'right' });
    };

    // ── Render all slides ──────────────────────
    const slides = data.slides || [];
    for (let idx = 0; idx < slides.length; idx++) {
      const slide = slides[idx];
      if (idx > 0) doc.addPage();

      const isTitle = idx === 0 || idx === slides.length - 1;
      if (isTitle) drawTitleSlide(slide);
      else drawContentSlide(slide, idx, slides.length);
    }

    // ── Download as a proper .pdf file ────────
    const safeName = (data.title || 'papipoint-export')
      .replace(/[^a-zA-Z0-9 _-]/g, '').trim() || 'papipoint-export';

    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ----- main processing -----
  const startProcessing = async (mode: 'manual' | 'reimagine') => {
    if (!selectedFile) return;

    setShowWorkflowModal(false);
    setShowBriefModal(false);
    setIsUploading(true);
    setCurrentMode(mode);
    setLoadingProgress(0);
    setActiveStepIdx(0);

    const steps = mode === 'reimagine' ? STEPS_REIMAGINE : STEPS_MANUAL;

    // Animate progress through steps
    let stepIdx = 0;
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        const start = stepStartPct(steps, stepIdx);
        const end = start + steps[stepIdx].weight;
        const next = prev + 0.6;

        if (next >= end - 2 && stepIdx < steps.length - 1) {
          stepIdx += 1;
          setActiveStepIdx(stepIdx);
        }

        return Math.min(next, 92); // cap at 92 — final 8% on completion
      });
    }, 300);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('mode', mode);
    if (mode === 'reimagine') {
      formData.append('goal', redesignGoal);
      formData.append('instructions', redesignInstructions);
      formData.append('aiModel', aiModel);
      formData.append('persona', persona);
      if (customApiKey) formData.append('customApiKey', customApiKey);
      if (referenceImage) formData.append('referenceImage', referenceImage);
    }

    if (typeof window !== 'undefined') {
      const customKey = localStorage.getItem('papipoint_custom_key');
      if (customKey) formData.append('custom_api_key', customKey);
    }

    try {
      const response = await fetch('/api/process-pptx', { method: 'POST', body: formData });
      clearInterval(progressInterval);

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.detail || `Server error: ${response.status}`);
      }

      setLoadingProgress(100);
      setActiveStepIdx(steps.length - 1);
      const aiData = await response.json();

      if (outputFormat === 'pdf') {
        await generateAndDownloadPDF(aiData);
        setTimeout(() => setIsUploading(false), 600);
      } else {
        sessionStorage.setItem('current_project_data', JSON.stringify(aiData));
        setTimeout(() => router.push('/dashboard/projects/new'), 500);
      }
    } catch (error: unknown) {
      clearInterval(progressInterval);
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      alert(`Error: ${errorMessage}`);
      setIsUploading(false);
    }
  };

  // Derived for loading UI
  const activeSteps = currentMode === 'reimagine' ? STEPS_REIMAGINE : STEPS_MANUAL;

  return (
    <div>
      {/* ── Header ─────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome back, Jane</h1>
          {/* eslint-disable-next-line react/no-unescaped-entities */}
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
            <MdAdd size={18} />
            New Presentation
          </button>
        </div>
      </div>

      {/* ── Workflow Modal ──────────────────────── */}
      {showWorkflowModal && (
        <div className={styles.loadingOverlay}>
          <div className={`glass-panel ${styles.briefModal}`} style={{ padding: '40px', maxWidth: '700px', width: '100%' }}>
            <h2 style={{ marginBottom: '8px', textAlign: 'center' }}>How would you like to proceed?</h2>
            <p style={{ color: 'var(--foreground-muted)', marginBottom: '32px', textAlign: 'center' }}>
              Choose whether to build it yourself or let our AI redesign it.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Manual */}
              <div
                className={styles.projectCard}
                style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                onClick={() => startProcessing('manual')}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div style={{ height: 48, width: 48, background: '#f8f9fa', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <MdLayers size={24} color="var(--foreground)" />
                </div>
                <h3 style={{ marginBottom: 8 }}>Manual Editor</h3>
                <p style={{ color: 'var(--foreground-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  Extract the raw text and jump straight into the editor to build your slides manually.
                </p>
              </div>

              {/* Reimagine */}
              <div
                className={styles.projectCard}
                style={{ background: 'var(--primary-light)', border: '2px solid var(--primary)', borderRadius: '12px', padding: '24px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                onClick={() => { setShowWorkflowModal(false); setShowBriefModal(true); }}
              >
                <div style={{ height: 48, width: 48, background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: 'var(--primary)' }}>
                  <MdAutoAwesome size={24} />
                </div>
                <h3 style={{ marginBottom: 8 }}>Reimagine: Design by AI</h3>
                <p style={{ color: 'var(--foreground-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  Let our AI completely restructure and redesign your presentation based on your goals.
                </p>
              </div>
            </div>

            <div style={{ marginTop: 28, textAlign: 'center' }}>
              <button onClick={() => setShowWorkflowModal(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', fontWeight: 500, color: 'var(--foreground-muted)' }}>
                Cancel Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Redesign Brief Modal ────────────────── */}
      {showBriefModal && (
        <div className={styles.loadingOverlay}>
          <div className={`glass-panel ${styles.briefModal}`} style={{ padding: '36px', maxWidth: '560px', width: '100%' }}>
            <h2 style={{ marginBottom: 6 }}>Redesign Brief</h2>
            <p style={{ color: 'var(--foreground-muted)', marginBottom: 24 }}>Tell us how you want to redesign this presentation.</p>

            {/* Primary Goal */}
            <label className={styles.fieldLabel}>Primary Goal</label>
            <select
              value={redesignGoal}
              onChange={(e) => setRedesignGoal(e.target.value)}
              className={styles.briefSelect}
            >
              <option value="Professional Pitch Deck">Professional Pitch Deck</option>
              <option value="Educational / Course Material">Educational / Course Material</option>
              <option value="Minimalist & Modern">Minimalist &amp; Modern</option>
              <option value="Playful & Creative">Playful &amp; Creative</option>
            </select>

            {/* Instructions */}
            <label className={styles.fieldLabel}>Additional Instructions (Optional)</label>
            <textarea
              value={redesignInstructions}
              onChange={(e) => setRedesignInstructions(e.target.value)}
              placeholder="E.g., Keep the tone serious. Emphasise the Q3 metrics…"
              className={styles.briefTextarea}
            />

            {/* Reference Image */}
            <label className={styles.fieldLabel}>Reference Image (Optional)</label>
            <label className={styles.fileDropZone}>
              <MdFileUpload size={20} style={{ marginRight: 8 }} />
              {referenceImage ? referenceImage.name : 'Click to upload a reference image…'}
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => setReferenceImage(e.target.files?.[0] || null)}
              />
            </label>

            {/* AI Model Selector */}
            <label className={styles.fieldLabel} style={{ marginTop: 16 }}>AI Engine (via OpenRouter)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { key: 'sonnet', emoji: '🎭', name: 'Claude 3.5', desc: 'Best Storytelling' },
                { key: 'gpt4o', emoji: '🧠', name: 'GPT-4o', desc: 'Smarter logic' },
                { key: 'o1pro', emoji: '💎', name: 'OpenAI o1', desc: 'Deep Reasoning' },
                { key: 'deepseek', emoji: '🇨🇳', name: 'DeepSeek V3', desc: 'Elite JSON accuracy' },
                { key: 'kimi', emoji: '🌙', name: 'Kimi Latest', desc: 'Moonshot AI' },
                { key: 'gemma4', emoji: '⚡', name: 'Gemma 4 26B', desc: 'Recommended · Fast' },
                { key: 'llama', emoji: '🦙', name: 'Llama 3.3 70B', desc: 'Solid · Open Source' },
                { key: 'hunyuan', emoji: '🌐', name: 'Hunyuan Hy3', desc: 'Tencent · Free' },
              ].map(({ key, emoji, name, desc }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAiModel(key as AiModel)}
                  className={aiModel === key ? styles.formatBtnActive : styles.formatBtn}
                  style={{ justifyContent: 'flex-start', gap: 10, padding: '10px 14px' }}
                >
                  <span style={{ fontSize: '1.3rem' }}>{emoji}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{name}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.65 }}>{desc}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Creative Persona Selector */}
            <label className={styles.fieldLabel} style={{ marginTop: 16 }}>Creative Persona</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {[
                { key: 'corporate', emoji: '👔', name: 'Corporate', desc: 'Formal & Polished' },
                { key: 'creative', emoji: '🎨', name: 'Storyteller', desc: 'Evocative & Bold' },
                { key: 'tech', emoji: '🚀', name: 'Disruptor', desc: 'Tech-focused & Edgy' },
                { key: 'minimalist', emoji: '⚪', name: 'Minimalist', desc: 'Clean & Direct' },
              ].map(({ key, emoji, name, desc }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPersona(key as Persona)}
                  className={persona === key ? styles.formatBtnActive : styles.formatBtn}
                  style={{ justifyContent: 'flex-start', gap: 10, padding: '10px 14px' }}
                >
                  <span style={{ fontSize: '1.3rem' }}>{emoji}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{name}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.65 }}>{desc}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Custom API Key */}
            <div style={{ marginBottom: 20 }}>
              <label className={styles.fieldLabel}>Custom OpenRouter API Key (Optional)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="password"
                  value={customApiKey}
                  onChange={(e) => saveCustomKey(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className={styles.briefTextarea}
                  style={{ marginBottom: 0, minHeight: 42, padding: '8px 12px' }}
                />
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--foreground-muted)', marginTop: 4 }}>
                If provided, this will be used instead of the system default. We never store this on our servers.
              </p>
            </div>

            {/* Output Format */}
            <label className={styles.fieldLabel} style={{ marginTop: 20 }}>Output Format</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
              <button
                type="button"
                onClick={() => setOutputFormat('editor')}
                className={outputFormat === 'editor' ? styles.formatBtnActive : styles.formatBtn}
              >
                <MdDashboard size={20} />
                <span>Open in Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setOutputFormat('pdf')}
                className={outputFormat === 'pdf' ? styles.formatBtnActive : styles.formatBtn}
              >
                <MdPictureAsPdf size={20} />
                <span>Download as PDF</span>
              </button>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowBriefModal(false)} className={styles.cancelBtn}>
                Cancel
              </button>
              <button onClick={() => startProcessing('reimagine')} className={styles.submitBtn}>
                {outputFormat === 'pdf' ? <MdPictureAsPdf size={18} /> : <MdAutoAwesome size={18} />}
                {outputFormat === 'pdf' ? 'Generate & Download PDF' : 'Generate Redesign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Loading Overlay (step-based) ───────── */}
      {isUploading && (
        <div className={styles.loadingOverlay}>
          <div className={`glass-panel ${styles.loadingModal}`}>
            {/* Top icon */}
            <div className={styles.loadingIconWrap}>
              <MdAutoAwesome size={28} className={`spin ${styles.loadingIcon}`} color="white" />
            </div>

            <h2 style={{ margin: '20px 0 4px', fontSize: '1.3rem' }}>
              {loadingProgress < 100
                ? (currentMode === 'reimagine' ? 'AI is working its magic…' : 'Building your presentation…')
                : outputFormat === 'pdf' ? '✓ Downloading PDF!' : '✓ Done! Opening editor…'}
            </h2>
            <p style={{ color: 'var(--foreground-muted)', fontSize: '0.9rem', marginBottom: 28 }}>
              {loadingProgress < 100 ? activeSteps[activeStepIdx]?.detail : ''}
            </p>

            {/* Step indicators */}
            <div className={styles.stepsTrack}>
              {activeSteps.map((step, i) => {
                const done = i < activeStepIdx || loadingProgress >= 100;
                const current = i === activeStepIdx && loadingProgress < 100;
                return (
                  <div key={i} className={styles.stepRow}>
                    <div className={`${styles.stepDot} ${done ? styles.stepDone : current ? styles.stepCurrent : styles.stepPending}`}>
                      {done ? <MdCheck size={12} /> : i + 1}
                    </div>
                    <span className={`${styles.stepLabel} ${current ? styles.stepLabelActive : ''}`}>
                      {step.label}
                    </span>
                    {i < activeSteps.length - 1 && (
                      <div className={`${styles.stepConnector} ${done ? styles.stepConnectorDone : ''}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className={styles.progressBarBg} style={{ marginTop: 28 }}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${loadingProgress}%`, transition: 'width 0.3s ease' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.8rem', color: 'var(--foreground-muted)' }}>
              <span>{activeSteps[activeStepIdx]?.label}</span>
              <span>{Math.round(loadingProgress)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Stats ──────────────────────────────── */}
      <div className={styles.statsGrid}>
        <div className={`glass-panel ${styles.statCard}`}>
          <div className={styles.statIconWrapper}><MdFileUpload size={24} className={styles.statIcon} /></div>
          <div className={styles.statInfo}>
            <h3>Total Projects</h3>
            <p className={styles.statValue}>12</p>
          </div>
        </div>
        <div className={`glass-panel ${styles.statCard}`}>
          <div className={styles.statIconWrapper}><MdAccessTime size={24} className={styles.statIcon} /></div>
          <div className={styles.statInfo}>
            <h3>Hours Saved</h3>
            <p className={styles.statValue}>~34h</p>
          </div>
        </div>
      </div>

      {/* ── Recent Projects ─────────────────────── */}
      <div className={styles.recentProjects}>
        <div className={styles.sectionHeader}>
          <h2>Recent Projects</h2>
          <Link href="/dashboard/projects" className={styles.viewAll}>View All</Link>
        </div>
        <div className={styles.projectsGrid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={`glass-panel ${styles.projectCard}`}>
              <div className={styles.projectPreview}>
                <div className={styles.placeholderSlide} />
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
