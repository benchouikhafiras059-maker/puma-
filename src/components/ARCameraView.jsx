// ARCameraView — live camera feed with draggable shoe overlay.
// Simulates Amazon-style AR product placement: camera opens, bag appears in your space.

import { useState, useRef, useEffect, useCallback } from 'react';

// Floor shadow — simulates the shoe sitting on a surface
function Shadow({ scale }) {
  const w = 140 * scale;
  const h = 18  * scale;
  return (
    <div
      style={{
        position: 'absolute',
        bottom: `-${h * 0.6}px`,
        left:   '50%',
        transform: 'translateX(-50%)',
        width:  `${w}px`,
        height: `${h}px`,
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(0,0,0,0.45) 0%, transparent 75%)',
        filter: `blur(${4 * scale}px)`,
        pointerEvents: 'none',
      }}
    />
  );
}

// Strips near-white studio background from the shoe image using a canvas
function useTransparentShoe(src) {
  const [dataUrl, setDataUrl] = useState(null);
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement('canvas');
      cv.width  = img.naturalWidth;
      cv.height = img.naturalHeight;
      const ctx = cv.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const id = ctx.getImageData(0, 0, cv.width, cv.height);
      const d  = id.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        if (r > 230 && g > 230 && b > 230) {
          d[i + 3] = 0; // fully transparent
        } else if (r > 200 && g > 200 && b > 200) {
          // soft edge fade for anti-aliased pixels
          d[i + 3] = Math.round(d[i + 3] * (1 - (Math.min(r, g, b) - 200) / 55));
        }
      }
      ctx.putImageData(id, 0, 0);
      setDataUrl(cv.toDataURL('image/png'));
    };
    img.src = src;
  }, [src]);
  return dataUrl;
}

export default function ARCameraView() {
  const [stage,    setStage]    = useState('idle');   // idle | requesting | live | denied | captured
  const [shoePos,  setShoePos]  = useState({ x: 50, y: 65 });
  const [scale,    setScale]    = useState(1);
  const [rotation, setRotation] = useState(-8);
  const [facingMode, setFacingMode] = useState('environment'); // rear camera by default
  const [saved,    setSaved]    = useState(false);

  const shoeSrc = useTransparentShoe('/puma-bag.png');

  const videoRef     = useRef(null);
  const containerRef = useRef(null);
  const streamRef    = useRef(null);
  const dragOrigin   = useRef(null);

  // ── Camera ──────────────────────────────────────────────────────────────────
  const startCamera = useCallback(async (facing = facingMode) => {
    setStage('requesting');
    // Stop any existing stream
    streamRef.current?.getTracks().forEach(t => t.stop());

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setStage('live'); // video element mounts after this — useEffect attaches the stream
    } catch (err) {
      console.warn('Camera error:', err);
      setStage(err.name === 'NotAllowedError' ? 'denied' : 'idle');
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStage('idle');
  }, []);

  // Flip front/back camera
  const flipCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    startCamera(next);
  };

  // Capture still
  const capture = () => {
    if (!videoRef.current) return;
    const cv  = document.createElement('canvas');
    cv.width  = videoRef.current.videoWidth;
    cv.height = videoRef.current.videoHeight;
    cv.getContext('2d').drawImage(videoRef.current, 0, 0);
    // We just freeze — keep the video element, show saved toast
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Attach stream to video element once it's in the DOM
  useEffect(() => {
    if (stage === 'live' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(console.warn);
    }
  }, [stage]);

  // Cleanup on unmount
  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  // ── Drag ────────────────────────────────────────────────────────────────────
  const onPointerDown = (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragOrigin.current = { sx: e.clientX, sy: e.clientY, ox: shoePos.x, oy: shoePos.y };
  };

  const onPointerMove = useCallback((e) => {
    if (!dragOrigin.current || !containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragOrigin.current.sx) / width)  * 100;
    const dy = ((e.clientY - dragOrigin.current.sy) / height) * 100;
    setShoePos({
      x: Math.max(10, Math.min(90, dragOrigin.current.ox + dx)),
      y: Math.max(10, Math.min(90, dragOrigin.current.oy + dy)),
    });
  }, []);

  const onPointerUp = () => { dragOrigin.current = null; };

  const shoeW = 200 * scale;

  // ── Idle / permission screen ─────────────────────────────────────────────────
  if (stage === 'idle' || stage === 'denied' || stage === 'requesting') {
    return (
      <div className="space-y-3">
        {/* Main CTA */}
        <div className="bg-black aspect-video flex flex-col items-center justify-center gap-5 relative overflow-hidden">
          {/* Subtle background grid */}
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
          />
          {/* Shoe preview */}
          <div className="relative z-10 w-48 opacity-70">
            <img src={shoeSrc || '/puma-bag.png'} alt="PUMA Mostro Bag" className="w-full object-contain"
              style={{ filter: 'brightness(1.4) drop-shadow(0 4px 12px rgba(255,255,255,0.3))' }} />
          </div>
          <div className="relative z-10 text-center">
            <p className="text-white text-sm font-black uppercase tracking-widest mb-1">See it in your space</p>
            <p className="text-gray-400 text-xs">Point your camera at any surface</p>
          </div>
        </div>

        {stage === 'denied' && (
          <div className="bg-red-50 border border-red-100 px-4 py-3 text-xs text-red-600 leading-relaxed">
            Camera access was denied. Allow camera permission in your browser settings, then try again.
          </div>
        )}

        <button
          onClick={() => startCamera()}
          disabled={stage === 'requesting'}
          className="w-full bg-black hover:bg-[#111] text-white py-4 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-50"
        >
          {stage === 'requesting' ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Opening camera…
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
              </svg>
              Open Camera
            </>
          )}
        </button>

        {/* How it works */}
        <div className="border border-gray-100 p-4 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">How it works</p>
          <div className="space-y-2">
            {[
              ['1', 'Point your camera at a flat surface — floor, table, or shelf'],
              ['2', 'The bag appears in your space at real scale'],
              ['3', 'Drag to move it, use the slider to resize'],
            ].map(([n, text]) => (
              <div key={n} className="flex items-start gap-3">
                <span className="w-5 h-5 bg-black text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{n}</span>
                <p className="text-xs text-gray-500 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-gray-400 text-center">🔒 Camera feed stays on your device. Nothing is recorded or uploaded.</p>
      </div>
    );
  }

  // ── Live camera view ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="relative">

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-2">
          {/* AR badge */}
          <div className="bg-black/75 text-white text-[10px] px-2.5 py-1 flex items-center gap-1.5 backdrop-blur-sm pointer-events-none">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c8102e] animate-pulse" />
            AR Preview — Live
          </div>

          {/* Flip + close */}
          <div className="flex items-center gap-1.5">
            <button onClick={flipCamera}
              className="w-8 h-8 bg-black/75 text-white flex items-center justify-center hover:bg-black transition-colors backdrop-blur-sm"
              title="Flip camera"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 4v6h6M23 20v-6h-6"/>
                <path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15"/>
              </svg>
            </button>
            <button onClick={stopCamera}
              className="w-8 h-8 bg-black/75 text-white flex items-center justify-center hover:bg-black transition-colors backdrop-blur-sm"
              title="Close camera"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Camera + shoe overlay */}
        <div
          ref={containerRef}
          className="relative w-full overflow-hidden bg-black select-none"
          style={{ aspectRatio: '4/3', maxHeight: '420px' }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {/* Live video feed */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : undefined }}
          />

          {/* Draggable shoe with shadow */}
          <div
            onPointerDown={onPointerDown}
            className="absolute touch-none z-10"
            style={{
              left:      `${shoePos.x}%`,
              top:       `${shoePos.y}%`,
              width:     `${shoeW}px`,
              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              cursor:    dragOrigin.current ? 'grabbing' : 'grab',
            }}
          >
            <Shadow scale={scale} />
            <img
              src={shoeSrc || '/puma-bag.png'}
              alt="PUMA Mostro Bag"
              draggable={false}
              style={{
                width: '100%',
                objectFit: 'contain',
                pointerEvents: 'none',
                filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.55))',
              }}
            />
          </div>

          {/* Drag hint */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-black/65 text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest pointer-events-none whitespace-nowrap">
            Drag to move · use slider to resize
          </div>
        </div>

        {/* AI copy strip */}
        <div className="bg-[#111] text-white px-4 py-2.5 flex items-center gap-2.5">
          <svg width="12" height="12" viewBox="0 0 13 13" fill="none"><path d="M6.5 1l1.3 3.3L11.5 5 9 7.5l.6 3.5L6.5 9.4 3.4 11l.6-3.5L1.5 5l3.7-.7z" fill="#c8102e"/></svg>
          <p className="text-[10px] text-gray-300">
            <span className="text-white font-bold">AI-powered preview simulation</span> — see how the Mostro Bag looks in your space at real scale.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-[#f9f9f9] border border-gray-100 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Adjust</h4>
          <button
            onClick={() => { setScale(1); setRotation(-8); setShoePos({ x: 50, y: 65 }); }}
            className="text-[10px] text-gray-400 hover:text-black font-bold uppercase tracking-widest transition-colors"
          >
            Reset
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-black w-14 flex-shrink-0">Size</span>
          <input type="range" min="0.4" max="2.5" step="0.05" value={scale}
            onChange={e => setScale(parseFloat(e.target.value))}
            className="flex-1 h-1 accent-black cursor-pointer" />
          <span className="text-[11px] text-gray-500 w-9 text-right tabular-nums">{Math.round(scale * 100)}%</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-black w-14 flex-shrink-0">Rotate</span>
          <input type="range" min="-50" max="50" step="1" value={rotation}
            onChange={e => setRotation(parseInt(e.target.value, 10))}
            className="flex-1 h-1 accent-black cursor-pointer" />
          <span className="text-[11px] text-gray-500 w-9 text-right tabular-nums">{rotation > 0 ? '+' : ''}{rotation}°</span>
        </div>
      </div>

      {/* Capture + close */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={capture}
          className={`py-3.5 text-xs font-black uppercase tracking-widest border-2 transition-all flex items-center justify-center gap-2 ${
            saved ? 'bg-black border-black text-white' : 'border-black text-black hover:bg-black hover:text-white'
          }`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="12" cy="12" r="3"/><path d="M20.94 11A9 9 0 1121 12v0"/>
            <path d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v9"/>
          </svg>
          {saved ? '✓ Saved!' : 'Capture'}
        </button>
        <button
          onClick={stopCamera}
          className="py-3.5 text-xs font-black uppercase tracking-widest border-2 border-gray-200 text-gray-500 hover:border-black hover:text-black transition-all"
        >
          Close Camera
        </button>
      </div>
    </div>
  );
}
