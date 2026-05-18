// PhotoTryOn — AI foot detection via TF.js CDN + real shoe photo overlay.
// Uses the actual side-profile product photo so the shoe looks real, not illustrated.

import { useState, useRef, useCallback, useEffect } from 'react';

// ─── Load TF.js + pose-detection from CDN (avoids Vite/ESM bundling issues) ───
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.onload  = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function loadTF() {
  await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js');
  await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection@2.1.3/dist/pose-detection.min.js');
  return { tf: window.tf, pd: window.poseDetection };
}

// ─── Shoe overlay — uses the real side-profile product photo ─────────────────
// kg-03-side.png is an actual photograph → looks realistic on top of user's photo.
// mix-blend-mode:multiply removes the gray/white studio background automatically.
function ShoeOverlay({ flip }) {
  return (
    <img
      src="/kg-03-side.png"
      alt="PUMA KING GROUND"
      draggable={false}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        mixBlendMode: 'multiply',       // removes studio background
        transform: flip ? 'scaleX(-1)' : undefined,
        pointerEvents: 'none',
        filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.45)) contrast(1.05)',
      }}
    />
  );
}

// ─── Coordinate helper — natural image px → container % (object-cover aware) ─
function natToContainerPct(natX, natY, imgEl, containerEl) {
  const { naturalWidth: nw, naturalHeight: nh } = imgEl;
  const { width: cw, height: ch } = containerEl.getBoundingClientRect();
  let rw, offX, offY;
  if (nw / nh > cw / ch) { rw = nw * (ch / nh); offX = (cw - rw) / 2; offY = 0; }
  else                    { rw = cw; offX = 0; offY = (ch - nh * (cw / nw)) / 2; }
  const s = rw / nw;
  return { xPct: ((natX * s + offX) / cw) * 100, yPct: ((natY * s + offY) / ch) * 100 };
}

// ─── Default positions ────────────────────────────────────────────────────────
const DEFAULTS = [
  { id: 'right', pos: { x: 38, y: 75 }, flip: false },
  { id: 'left',  pos: { x: 62, y: 75 }, flip: true  },
];

// ─── Main component ───────────────────────────────────────────────────────────
export default function PhotoTryOn() {
  const [photo,          setPhoto]          = useState(null);
  const [dropHighlight,  setDropHighlight]  = useState(false);
  const [detecting,      setDetecting]      = useState(false);
  const [detMsg,         setDetMsg]         = useState(null);
  const [shoes,          setShoes]          = useState(DEFAULTS);
  const [globalScale,    setGlobalScale]    = useState(1);
  const [globalRotation, setGlobalRotation] = useState(-8);
  const [activeId,       setActiveId]       = useState('right');
  const [showHint,       setShowHint]       = useState(true);
  const [saved,          setSaved]          = useState(false);
  const [shared,         setShared]         = useState(false);

  const imgRef       = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const dragOrigin   = useRef(null);

  // ── File read ───────────────────────────────────────────────────────────────
  const readFile = (file) => {
    if (!file?.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhoto(e.target.result);
      setDetMsg(null);
      setShowHint(true);
      setShoes(DEFAULTS);
      setGlobalScale(1);
      setGlobalRotation(-8);
    };
    reader.readAsDataURL(file);
  };

  // ── Pose detection via CDN TF.js ────────────────────────────────────────────
  const runDetection = useCallback(async () => {
    if (!imgRef.current || !containerRef.current) return;
    setDetecting(true);
    setDetMsg(null);

    try {
      const { tf, pd } = await loadTF();

      // Try WebGL → CPU fallback
      try { await tf.setBackend('webgl'); }
      catch { await tf.setBackend('cpu'); }
      await tf.ready();

      const detector = await pd.createDetector(pd.SupportedModels.MoveNet, {
        modelType: pd.movenet.modelType.SINGLEPOSE_LIGHTNING,
      });

      // Downscale for faster inference
      const img = imgRef.current;
      const ds = Math.min(512 / img.naturalWidth, 512 / img.naturalHeight, 1);
      const cv = document.createElement('canvas');
      cv.width  = Math.round(img.naturalWidth  * ds);
      cv.height = Math.round(img.naturalHeight * ds);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);

      const poses = await detector.estimatePoses(cv);
      detector.dispose();

      if (!poses.length) {
        setDetMsg({ type: 'miss', text: 'No person detected. Upload a real full-body photo of yourself standing.' });
        return;
      }

      // Keypoints scaled back to natural image space
      const kps     = poses[0].keypoints.map(kp => ({ ...kp, x: kp.x / ds, y: kp.y / ds }));
      const rAnkle  = kps[16], lAnkle = kps[15];
      const rKnee   = kps[14], lKnee  = kps[13];
      const CONF    = 0.25;
      const rightOk = (rAnkle?.score ?? 0) > CONF;
      const leftOk  = (lAnkle?.score ?? 0) > CONF;

      if (!rightOk && !leftOk) {
        setDetMsg({ type: 'miss', text: 'Feet not visible. Try a front-facing full-body photo with feet on the floor.' });
        return;
      }

      // Estimate scale from lower-leg pixel length on screen
      const legScreenPx = (ankle, knee) => {
        if (!ankle || !knee) return null;
        const cont = containerRef.current.getBoundingClientRect();
        const s    = Math.min(cont.width / img.naturalWidth, cont.height / img.naturalHeight);
        return Math.hypot((ankle.x - knee.x) * s, (ankle.y - knee.y) * s);
      };
      const lens      = [rightOk && legScreenPx(rAnkle, rKnee), leftOk && legScreenPx(lAnkle, lKnee)].filter(Boolean);
      const avgLen    = lens.reduce((a, b) => a + b, 0) / lens.length || 170;
      const estScale  = Math.max(0.3, Math.min(2.0, avgLen / 160));

      const place = (ankle) => {
        const p = natToContainerPct(ankle.x, ankle.y, img, containerRef.current);
        return { x: p.xPct, y: p.yPct + 2 }; // +2% nudge below ankle landmark
      };

      setShoes([
        { id: 'right', flip: false, pos: rightOk ? place(rAnkle) : DEFAULTS[0].pos },
        { id: 'left',  flip: true,  pos: leftOk  ? place(lAnkle) : DEFAULTS[1].pos },
      ]);
      setGlobalScale(estScale);
      setShowHint(false);

      const count = [rightOk, leftOk].filter(Boolean).length;
      setDetMsg({
        type: 'ok',
        text: count === 2
          ? '✓ Both feet detected — shoes placed automatically'
          : '✓ One foot detected — drag the other shoe into position',
      });

    } catch (err) {
      console.error('Pose detection error:', err);
      setDetMsg({ type: 'miss', text: `Detection failed: ${String(err.message || err).slice(0, 60)}. Drag shoes manually.` });
    } finally {
      setDetecting(false);
    }
  }, []);

  // ── Pointer drag ────────────────────────────────────────────────────────────
  const onPointerDown = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const shoe = shoes.find(s => s.id === id);
    dragOrigin.current = { sx: e.clientX, sy: e.clientY, ox: shoe.pos.x, oy: shoe.pos.y, id };
    setActiveId(id);
    setShowHint(false);
  };

  const onPointerMove = useCallback((e) => {
    if (!dragOrigin.current || !containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragOrigin.current.sx) / width)  * 100;
    const dy = ((e.clientY - dragOrigin.current.sy) / height) * 100;
    setShoes(prev => prev.map(s =>
      s.id === dragOrigin.current.id
        ? { ...s, pos: { x: Math.max(5, Math.min(95, dragOrigin.current.ox + dx)), y: Math.max(5, Math.min(95, dragOrigin.current.oy + dy)) } }
        : s
    ));
  }, []);

  const onPointerUp = () => { dragOrigin.current = null; };

  const shoeW = 165 * globalScale;

  // ── Upload screen ───────────────────────────────────────────────────────────
  if (!photo) {
    return (
      <div className="space-y-3">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDropHighlight(true); }}
          onDragLeave={() => setDropHighlight(false)}
          onDrop={(e)    => { e.preventDefault(); setDropHighlight(false); readFile(e.dataTransfer.files[0]); }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-4 py-12 px-6 transition-all group ${
            dropHighlight ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-black hover:bg-gray-50'
          }`}
        >
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => readFile(e.target.files[0])} />
          <div className={`w-14 h-14 border-2 flex items-center justify-center transition-all ${dropHighlight ? 'border-black' : 'border-gray-300 group-hover:border-black'}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-gray-400 group-hover:text-black transition-colors">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-widest text-black mb-1">Upload Your Photo</p>
            <p className="text-xs text-gray-400">Click or drag & drop</p>
          </div>
        </div>

        {/* What kind of photo */}
        <div className="bg-black text-white p-4 space-y-3">
          <p className="text-xs font-black uppercase tracking-widest">What photo to upload</p>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-300 leading-relaxed">
            <div className="space-y-1.5">
              <p className="text-[#c8102e] font-bold uppercase tracking-wider text-[10px]">✓ Works</p>
              <p>Real photo of <strong className="text-white">you</strong> standing</p>
              <p>Full body, both feet on the floor</p>
              <p>Front-facing, good lighting</p>
              <p>Taken on your phone — selfie or someone else</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">✗ Won't work</p>
              <p>Sitting, crouching, jumping</p>
              <p>Feet cut off at the ankle</p>
              <p>Drawings or illustrations</p>
              <p>Very dark or blurry photos</p>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-gray-400 text-center">🔒 Your photo never leaves your browser.</p>
      </div>
    );
  }

  // ── Try-on preview ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      <div className="relative">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-2 pointer-events-none">
          <div className="bg-black/80 text-white text-[10px] px-2.5 py-1 flex items-center gap-1.5">
            <svg width="9" height="9" viewBox="0 0 10 10"><path d="M5 .5l1.1 3L9.5 4 7 6.5l.7 3.5L5 8.2 2.3 10l.7-3.5L.5 4l3.4-.6z" fill="#c8102e"/></svg>
            AI-powered preview simulation
          </div>
          <button onClick={() => setPhoto(null)} className="bg-black/80 text-white text-[10px] px-2.5 py-1 hover:bg-black transition-colors pointer-events-auto">
            Change photo
          </button>
        </div>

        {/* Detecting overlay */}
        {detecting && (
          <div className="absolute inset-0 z-30 bg-black/65 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-2 border-white/20 border-t-[#c8102e] rounded-full animate-spin" />
            <p className="text-white text-xs font-black uppercase tracking-widest">Detecting your feet…</p>
          </div>
        )}

        {/* Photo + shoe overlays */}
        <div
          ref={containerRef}
          className="relative w-full overflow-hidden bg-black select-none"
          style={{ aspectRatio: '3/4', maxHeight: '440px' }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <img
            ref={imgRef}
            src={photo}
            alt="Your photo"
            draggable={false}
            className="w-full h-full object-cover"
            onLoad={runDetection}
          />

          {shoes.map(shoe => (
            <div
              key={shoe.id}
              onPointerDown={e => onPointerDown(e, shoe.id)}
              className="absolute touch-none z-10"
              style={{
                left:      `${shoe.pos.x}%`,
                top:       `${shoe.pos.y}%`,
                width:     `${shoeW}px`,
                transform: `translate(-50%, -50%) rotate(${globalRotation}deg)`,
                cursor:    dragOrigin.current?.id === shoe.id ? 'grabbing' : 'grab',
                outline:   activeId === shoe.id ? '2px solid rgba(200,16,46,0.8)' : 'none',
                outlineOffset: '2px',
              }}
            >
              <ShoeOverlay flip={shoe.flip} />
            </div>
          ))}

          {showHint && !detecting && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-black/70 text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest pointer-events-none whitespace-nowrap">
              Tap a shoe to select · drag to move
            </div>
          )}
        </div>

        {/* Detection result */}
        {detMsg && (
          <div className={`px-4 py-2.5 flex items-start gap-2.5 text-[11px] leading-relaxed ${
            detMsg.type === 'ok' ? 'bg-black text-white' : 'bg-[#fff3f3] text-gray-700'
          }`}>
            {detMsg.type === 'ok'
              ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#c8102e" strokeWidth="2.2" className="flex-shrink-0 mt-px"><path d="M1.5 6l3 3 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              : <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0 mt-px"><circle cx="6" cy="6" r="5.5" stroke="#aaa" strokeWidth="1.3"/><path d="M6 5v3M6 3.8h.01" stroke="#aaa" strokeWidth="1.3" strokeLinecap="round"/></svg>
            }
            <span className="flex-1">{detMsg.text}</span>
            {detMsg.type !== 'ok' && (
              <button onClick={runDetection} className="text-[10px] font-black uppercase tracking-wider text-[#c8102e] flex-shrink-0">Retry</button>
            )}
          </div>
        )}

        {/* AI copy */}
        <div className="bg-[#111] text-white px-4 py-2.5 flex items-start gap-2.5">
          <svg width="12" height="12" viewBox="0 0 13 13" fill="none" className="flex-shrink-0 mt-0.5"><path d="M6.5 1l1.3 3.3L11.5 5 9 7.5l.6 3.5L6.5 9.4 3.4 11l.6-3.5L1.5 5l3.7-.7z" fill="#c8102e"/></svg>
          <p className="text-[10px] text-gray-300 leading-relaxed">
            <span className="text-white font-bold">AI-powered preview simulation</span> — see how the shoe could look on you. Tap a shoe to select, then drag to fine-tune.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-[#f9f9f9] border border-gray-100 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Adjust Shoes</h4>
          <button
            onClick={() => { setShoes(DEFAULTS); setGlobalScale(1); setGlobalRotation(-8); setShowHint(true); }}
            className="text-[10px] text-gray-400 hover:text-black font-bold uppercase tracking-widest flex items-center gap-1 transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 5A4 4 0 111 5" strokeLinecap="round"/><path d="M9 5V2l-2.5 1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Reset
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-black w-14 flex-shrink-0">Size</span>
          <input type="range" min="0.3" max="2.2" step="0.05" value={globalScale}    onChange={e => setGlobalScale(parseFloat(e.target.value))}   className="flex-1 h-1 accent-black cursor-pointer" />
          <span className="text-[11px] text-gray-500 w-9 text-right tabular-nums">{Math.round(globalScale * 100)}%</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-black w-14 flex-shrink-0">Rotate</span>
          <input type="range" min="-50" max="50"  step="1"    value={globalRotation} onChange={e => setGlobalRotation(parseInt(e.target.value, 10))} className="flex-1 h-1 accent-black cursor-pointer" />
          <span className="text-[11px] text-gray-500 w-9 text-right tabular-nums">{globalRotation > 0 ? '+' : ''}{globalRotation}°</span>
        </div>

        <p className="text-[10px] text-gray-400">Red outline = selected shoe. Drag each one independently.</p>
      </div>

      {/* Save / Share */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2500); }}
          className={`py-3.5 text-xs font-black uppercase tracking-widest border-2 transition-all flex items-center justify-center gap-2 ${saved ? 'bg-black border-black text-white' : 'border-black text-black hover:bg-black hover:text-white'}`}>
          {saved ? '✓ Saved' : 'Save Preview'}
        </button>
        <button onClick={() => { setShared(true); setTimeout(() => setShared(false), 2000); }}
          className={`py-3.5 text-xs font-black uppercase tracking-widest border-2 transition-all flex items-center justify-center gap-2 ${shared ? 'bg-[#c8102e] border-[#c8102e] text-white' : 'border-[#c8102e] text-[#c8102e] hover:bg-[#c8102e] hover:text-white'}`}>
          {shared ? 'Copied!' : 'Share Fit'}
        </button>
      </div>

      <p className="text-[10px] text-gray-400 text-center">🔒 Your photo stays in your browser. Nothing is uploaded.</p>
    </div>
  );
}
