'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MdTextFields,
  MdImage,
  MdFormatShapes,
  MdLayers,
  MdDownload,
  MdUndo,
  MdRedo,
  MdPlayArrow,
  MdFormatBold,
  MdFormatItalic,
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdPalette,
  MdAutoAwesome
} from 'react-icons/md';
import styles from './page.module.css';

export default function EditorPage({ params }: { params: { id: string } }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTab, setActiveTab] = useState<'design' | 'animate' | 'agent'>('design');
  const [projectData, setProjectData] = useState<any>(null);
  const generatingRef = useRef<Set<number>>(new Set());

  // AI Agent Chat State
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAgentThinking, setIsAgentThinking] = useState(false);

  useEffect(() => {
    const storedData = sessionStorage.getItem('current_project_data');
    if (storedData) {
      setProjectData(JSON.parse(storedData));
    }
  }, []);

  // Generate images for ALL slides that have imagePrompt but no imageSrc
  useEffect(() => {
    if (!projectData?.slides) return;

    projectData.slides.forEach((slide: any, idx: number) => {
      if (slide.imagePrompt && !slide.imageSrc && !generatingRef.current.has(idx)) {
        generatingRef.current.add(idx);

        const seed = Math.floor(Math.random() * 1000000);
        const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(slide.imagePrompt)}?width=1920&height=1080&nologo=true&seed=${seed}&model=flux`;

        const img = new window.Image();
        img.src = imgUrl;

        img.onload = () => {
          setProjectData((prev: any) => {
            if (!prev) return prev;
            const newData = JSON.parse(JSON.stringify(prev));
            newData.slides[idx].imageSrc = imgUrl;
            sessionStorage.setItem('current_project_data', JSON.stringify(newData));
            return newData;
          });
        };

        img.onerror = () => {
          console.warn(`[Papipoint] Image generation failed for slide ${idx + 1}:`, imgUrl);
          generatingRef.current.delete(idx); // allow retry
        };
      }
    });
  }, [projectData?.slides?.length]); // only fire when slides are first loaded

  const handleAgentChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isAgentThinking) return;

    const newMsgs = [...chatMessages, { role: 'user', content: chatInput }];
    setChatMessages(newMsgs);
    setChatInput('');
    setIsAgentThinking(true);

    try {
      const customApiKey = localStorage.getItem('papipoint_custom_key');
      const res = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMsgs,
          projectData,
          customApiKey,
          aiModel: 'anthropic/claude-3.5-sonnet' // Default for agent
        })
      });

      if (!res.ok) throw new Error('Agent failed to respond');
      const data = await res.json();
      setChatMessages([...newMsgs, data]);
    } catch (err) {
      console.error('Agent error:', err);
    } finally {
      setIsAgentThinking(false);
    }
  };

  const currentSlideData = projectData?.slides?.[activeSlide];
  const hasBackground = !!currentSlideData?.imageSrc;

  return (
    <div className={styles.editorContainer}>
      {/* Editor Header */}
      <header className={styles.editorHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.documentTitle}>{projectData ? projectData.title : 'Untitled Presentation'}</h1>
          <span className={styles.saveStatus}>Saved just now</span>
        </div>
        <div className={styles.headerCenter}>
          <button className={styles.iconBtn} title="Undo"><MdUndo size={20} /></button>
          <button className={styles.iconBtn} title="Redo"><MdRedo size={20} /></button>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.secondaryBtn}>
            <MdPlayArrow size={18} /> Present
          </button>
          <button className={styles.primaryBtn}>
            <MdDownload size={18} /> Export .pptx
          </button>
        </div>
      </header>

      <div className={styles.editorBody}>
        {/* Left Toolbar */}
        <aside className={styles.toolbarLeft}>
          <button className={`${styles.toolBtn} ${styles.active}`} title="Text">
            <MdTextFields size={24} />
            <span>Text</span>
          </button>
          <button className={styles.toolBtn} title="Shapes">
            <MdFormatShapes size={24} />
            <span>Shapes</span>
          </button>
          <button className={styles.toolBtn} title="Images">
            <MdImage size={24} />
            <span>Media</span>
          </button>
          <button className={styles.toolBtn} title="Layers">
            <MdLayers size={24} />
            <span>Layers</span>
          </button>
        </aside>

        {/* Slide Thumbnails */}
        <aside className={styles.slideThumbnails}>
          {(projectData?.slides || [1, 2, 3, 4, 5]).map((slide: any, idx: number) => (
            <div
              key={idx}
              className={`${styles.thumbnailWrapper} ${activeSlide === idx ? styles.active : ''}`}
              onClick={() => setActiveSlide(idx)}
            >
              <span className={styles.slideNumber}>{idx + 1}</span>
              <div
                className={styles.thumbnail}
                style={slide?.imageSrc ? { backgroundImage: `url(${slide.imageSrc})`, backgroundSize: 'cover' } : {}}
              />
            </div>
          ))}
          <button className={styles.addSlideBtn}>+ New Slide</button>
        </aside>

        {/* Main Canvas Area */}
        <main className={styles.canvasArea}>
          <div className={styles.canvasWrapper}>
            <div
              className={`${styles.slideCanvas} ${hasBackground ? styles.hasBackground : ''}`}
              style={hasBackground ? { backgroundImage: `url(${currentSlideData.imageSrc})` } : {}}
            >
              {/* Dark overlay for readability when background exists */}
              {hasBackground && <div className={styles.canvasOverlay} />}

              {/* Image generating indicator */}
              {currentSlideData?.imagePrompt && !currentSlideData?.imageSrc && (
                <div className={styles.imageGeneratingBadge}>
                  <MdAutoAwesome size={14} />
                  <span>AI painting background…</span>
                </div>
              )}

              {/* Slide Content */}
              {currentSlideData ? (
                <div className={styles.slideContent}>
                  <div className={`${styles.slideTitle} ${hasBackground ? styles.lightText : ''}`}>
                    {currentSlideData.title}
                  </div>
                  {currentSlideData.subtitle && (
                    <div className={`${styles.slideSubtitle} ${hasBackground ? styles.lightTextMuted : ''}`}>
                      {currentSlideData.subtitle}
                    </div>
                  )}
                  {currentSlideData.bullets && currentSlideData.bullets.length > 0 && (
                    <div className={`${styles.bulletBox} ${hasBackground ? styles.bulletBoxDark : ''}`}>
                      <ul className={styles.bulletList}>
                        {currentSlideData.bullets.map((bullet: string, i: number) => (
                          <li key={i} className={`${styles.bulletItem} ${hasBackground ? styles.lightText : ''}`}>
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                /* Placeholder when no project data */
                <div className={styles.slideContent}>
                  <div className={styles.slideTitle}>Quarterly Marketing Review</div>
                  <div className={styles.slideSubtitle}>Analyzing Q3 Performance & Q4 Strategy</div>
                  <div className={styles.bulletBox}>
                    <ul className={styles.bulletList}>
                      <li className={styles.bulletItem}>+15% Growth in User Base</li>
                      <li className={styles.bulletItem}>CAC reduced by $4.50</li>
                      <li className={styles.bulletItem}>Retention up to 92%</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.canvasControls}>
            <span>Zoom: 80%</span>
            <span>Fit to screen</span>
          </div>
        </main>

        {/* Right Sidebar - Properties */}
        <aside className={styles.propertiesSidebar}>
          <div className={styles.propertiesTabs}>
            <button
              className={`${styles.tabBtn} ${activeTab === 'design' ? styles.active : ''}`}
              onClick={() => setActiveTab('design')}
            >
              Design
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'animate' ? styles.active : ''}`}
              onClick={() => setActiveTab('animate')}
            >
              Animate
            </button>
            <button
              className={`${styles.tabBtn} ${activeTab === 'agent' ? styles.active : ''}`}
              onClick={() => setActiveTab('agent')}
            >
              AI Agent
            </button>
          </div>

          {activeTab === 'agent' && (
            <div className={styles.agentContainer}>
              <div className={styles.chatHistory}>
                {chatMessages.length === 0 && (
                  <div className={styles.emptyChat}>
                    <MdAutoAwesome size={32} style={{ opacity: 0.2, marginBottom: 12 }} />
                    <p>I am your AI Co-Pilot. Ask me to refine slides, brainstorm points, or suggest designs!</p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={msg.role === 'user' ? styles.userMsg : styles.aiMsg}>
                    {msg.content}
                  </div>
                ))}
                {isAgentThinking && <div className={styles.aiMsg}>...</div>}
              </div>
              <form onSubmit={handleAgentChat} className={styles.chatInputRow}>
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask AI..."
                  className={styles.chatInput}
                />
              </form>
            </div>
          )}
      </div>
    </aside>
      </div >
    </div >
  );
}
