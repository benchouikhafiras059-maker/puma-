import { useEffect, useRef, useState } from 'react';
import AR3DCameraView from './AR3DCameraView';

const BASE = import.meta.env.BASE_URL;

export default function TryOnModal({ isOpen, onClose }) {
  const [view, setView]   = useState('3d'); // '3d' | 'camera'
  const modelRef          = useRef(null);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Reset to 3D when modal opens
  useEffect(() => { if (isOpen) setView('3d'); }, [isOpen]);

  const handleCameraBtn = () => {
    // On mobile try native WebXR AR first; fall back to camera view
    const mv = modelRef.current;
    if (mv && mv.canActivateAR) {
      mv.activateAR();
    } else {
      setView('camera');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-lg max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <svg width="60" height="14" viewBox="0 0 60 14" fill="none">
              <text x="0" y="13" fontFamily="Helvetica Neue, Arial" fontWeight="900" fontSize="14" fill="#000" letterSpacing="-0.5">PUMA</text>
            </svg>
            <div className="w-px h-5 bg-gray-200" />
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-black leading-none">AR Preview</h2>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Mostro Bag · 3D</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {view === 'camera' && (
              <button
                onClick={() => setView('3d')}
                className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black px-3 py-1 transition-colors"
              >
                ← 3D View
              </button>
            )}
            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors" aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 2l12 12M14 2L2 14" stroke="#000" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── 3D view ── */}
        {view === '3d' && (
          <>
            <div className="relative bg-[#f0f0f0] flex-1" style={{ minHeight: '340px' }}>
              <model-viewer
                ref={modelRef}
                src={`${BASE}mostro-bag.glb`}
                alt="PUMA Mostro Bag"
                camera-controls
                auto-rotate
                auto-rotate-delay="600"
                rotation-per-second="18deg"
                shadow-intensity="1.2"
                shadow-softness="0.8"
                environment-image="neutral"
                ar
                ar-modes="webxr scene-viewer quick-look"
                style={{ width: '100%', minHeight: '340px', background: 'transparent' }}
              />
              <p className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 tracking-widest uppercase pointer-events-none whitespace-nowrap">
                Drag to rotate · pinch to zoom
              </p>
            </div>

            <div className="p-4 flex-shrink-0 border-t border-gray-100">
              <button
                onClick={handleCameraBtn}
                className="w-full bg-black hover:bg-[#111] text-white py-4 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
                Open Camera — See it in Your Space
              </button>
            </div>
          </>
        )}

        {/* ── Camera view ── */}
        {view === 'camera' && (
          <div className="flex-1 overflow-y-auto p-5">
            <AR3DCameraView />
          </div>
        )}

      </div>
    </div>
  );
}
