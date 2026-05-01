'use client';

import React, { useState, useEffect } from 'react';
import { 
  MdTextFields, 
  MdImage, 
  MdFormatShapes, 
  MdLayers, 
  MdSave, 
  MdDownload, 
  MdUndo, 
  MdRedo,
  MdPlayArrow,
  MdFormatBold,
  MdFormatItalic,
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdPalette
} from 'react-icons/md';
import styles from './page.module.css';

export default function EditorPage({ params }: { params: { id: string } }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTab, setActiveTab] = useState('design');
  const [projectData, setProjectData] = useState<any>(null);

  useEffect(() => {
    // Load AI data if we just created a new project
    const storedData = sessionStorage.getItem('current_project_data');
    if (storedData) {
      setProjectData(JSON.parse(storedData));
    }
  }, []);

  const currentSlideData = projectData?.slides?.[activeSlide];

  return (
    <div className={styles.editorContainer}>
      {/* Editor Header */}
      <header className={styles.editorHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.documentTitle}>{projectData ? projectData.title : 'Q3 Marketing Plan - AI Generated'}</h1>
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
        {/* Left Toolbar - Tools */}
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

        {/* Slides Navigation (Thumbnails) */}
        <aside className={styles.slideThumbnails}>
          {(projectData?.slides || [1, 2, 3, 4, 5]).map((slide: any, idx: number) => (
            <div 
              key={idx} 
              className={`${styles.thumbnailWrapper} ${activeSlide === idx ? styles.active : ''}`}
              onClick={() => setActiveSlide(idx)}
            >
              <span className={styles.slideNumber}>{idx + 1}</span>
              <div className={styles.thumbnail}></div>
            </div>
          ))}
          <button className={styles.addSlideBtn}>+ New Slide</button>
        </aside>

        {/* Main Canvas Area */}
        <main className={styles.canvasArea}>
          <div className={styles.canvasWrapper}>
            <div className={styles.slideCanvas}>
              {currentSlideData ? (
                <>
                  <div className={styles.canvasElement} style={{ top: '15%', left: '10%', fontSize: '48px', fontWeight: 800 }}>
                    {currentSlideData.title}
                  </div>
                  {currentSlideData.subtitle && (
                    <div className={styles.canvasElement} style={{ top: '35%', left: '10%', fontSize: '24px', color: 'var(--foreground-muted)' }}>
                      {currentSlideData.subtitle}
                    </div>
                  )}
                  {currentSlideData.bullets && currentSlideData.bullets.length > 0 && (
                    <div className={styles.canvasElementBox} style={{ top: '50%', left: '10%', width: '80%', height: '40%', background: '#f1f3f5', borderRadius: '12px' }}>
                      <ul style={{ padding: '24px', fontSize: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {currentSlideData.bullets.map((bullet: string, i: number) => (
                          <li key={i}>{bullet}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Fallback Example elements */}
                  <div className={styles.canvasElement} style={{ top: '15%', left: '10%', fontSize: '48px', fontWeight: 800 }}>
                    Quarterly Marketing Review
                  </div>
              <div className={styles.canvasElement} style={{ top: '35%', left: '10%', fontSize: '24px', color: 'var(--foreground-muted)' }}>
                Analyzing Q3 Performance & Q4 Strategy
              </div>
              <div className={styles.canvasElementBox} style={{ top: '50%', left: '10%', width: '40%', height: '30%', background: 'var(--primary-light)', borderRadius: '12px', border: '2px solid var(--primary)' }}>
                {/* Chart Placeholder */}
              </div>
              <div className={styles.canvasElementBox} style={{ top: '50%', right: '10%', width: '35%', height: '30%', background: '#f1f3f5', borderRadius: '12px' }}>
                <ul style={{ padding: '24px', fontSize: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <li>+15% Growth in User Base</li>
                  <li>CAC reduced by $4.50</li>
                  <li>Retention up to 92%</li>
                </ul>
              </div>
                </>
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
          </div>

          <div className={styles.propertiesContent}>
            <div className={styles.propertyGroup}>
              <h3>Typography</h3>
              <select className={styles.select}>
                <option>Google Sans Flex</option>
                <option>Inter</option>
                <option>Outfit</option>
              </select>
              
              <div className={styles.row}>
                <select className={styles.select} style={{ width: '60%' }}>
                  <option>Bold</option>
                  <option>Regular</option>
                  <option>Light</option>
                </select>
                <input type="number" defaultValue={48} className={styles.input} style={{ width: '35%' }} />
              </div>

              <div className={styles.buttonGroup}>
                <button className={styles.iconBtn}><MdFormatBold size={20} /></button>
                <button className={styles.iconBtn}><MdFormatItalic size={20} /></button>
                <div className={styles.divider}></div>
                <button className={styles.iconBtn}><MdFormatAlignLeft size={20} /></button>
                <button className={styles.iconBtn}><MdFormatAlignCenter size={20} /></button>
                <button className={styles.iconBtn}><MdFormatAlignRight size={20} /></button>
              </div>
            </div>

            <div className={styles.propertyGroup}>
              <h3>Color</h3>
              <div className={styles.colorPicker}>
                <div className={styles.colorSwatch} style={{ background: '#1a1b1e' }}></div>
                <span className={styles.colorHex}>#1a1b1e</span>
                <button className={styles.iconBtn} style={{ marginLeft: 'auto' }}><MdPalette size={18} /></button>
              </div>
            </div>

            <div className={styles.propertyGroup}>
              <h3>Position</h3>
              <div className={styles.row}>
                <div className={styles.inputLabel}>
                  <span>X</span>
                  <input type="number" defaultValue={100} className={styles.input} />
                </div>
                <div className={styles.inputLabel}>
                  <span>Y</span>
                  <input type="number" defaultValue={150} className={styles.input} />
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.inputLabel}>
                  <span>W</span>
                  <input type="number" defaultValue={800} className={styles.input} />
                </div>
                <div className={styles.inputLabel}>
                  <span>H</span>
                  <input type="number" defaultValue={60} className={styles.input} />
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
