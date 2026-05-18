import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const BASE = import.meta.env.BASE_URL;

// ── Tuning constants ──────────────────────────────────────────────────────────
const GLASSES_SCALE = 1.45;   // multiplier on outer-eye-corner distance
const PITCH_MULT    = 1.3;
const SMOOTH_POS    = 0.30;
const SMOOTH_ROT    = 0.15;
const SMOOTH_SCALE  = 0.22;
const STABLE_NEEDED = 10;     // frames of stable tracking before glasses appear
const FADE_IN_STEP  = 0.06;
const FADE_OUT_STEP = 0.10;
const ADJ_STEP      = 6;      // px per nudge
const SCALE_STEP    = 0.08;   // scale per press

function ema(prev, curr, alpha) {
  return prev === null ? curr : alpha * curr + (1 - alpha) * prev;
}

function injectScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const el = Object.assign(document.createElement('script'), {
      src, crossOrigin: 'anonymous', onload: resolve,
      onerror: () => reject(new Error(`script failed: ${src}`)),
    });
    document.head.appendChild(el);
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function EyewearFaceAR({ productName = 'PUMA Sport Eyewear', colorName = 'Matte Black' }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);

  const [status, setStatus] = useState('cam-loading');
  // cam-loading | cam-denied | cam-in-use | det-loading | detecting | tracking | det-error
  const [hasFace, setHasFace] = useState(false);
  const [aspect,  setAspect]  = useState(4 / 3);

  // Manual adjustment (offset on top of tracked position)
  const [adj, setAdj] = useState({ dx: 0, dy: 0, ds: 1 });
  const adjRef = useRef({ dx: 0, dy: 0, ds: 1 });
  function nudge(key, delta) {
    const next = { ...adjRef.current };
    if (key === 'ds') next.ds = Math.max(0.2, +(next.ds + delta).toFixed(2));
    else next[key] = next[key] + delta;
    adjRef.current = next;
    setAdj({ ...next });
  }
  function resetAdj() {
    adjRef.current = { dx: 0, dy: 0, ds: 1 };
    setAdj({ dx: 0, dy: 0, ds: 1 });
  }

  // Tracking state (refs — read by RAF without stale closure)
  const lmRef     = useRef(null);
  const posRef    = useRef({ x: null, y: null });
  const rotRef    = useRef({ roll: null, yaw: null, pitch: null });
  const scaleRef  = useRef(null);
  const stableRef = useRef(0);

  useEffect(() => {
    let active       = true;
    let rafId        = null;
    let renderer     = null;
    let scene, cam3;
    let glassesGroup = null;
    let glassesOpacity = 0;

    async function init() {
      // ── Camera ─────────────────────────────────────────────────────────────
      let stream;
      try {
        // Try front camera first with exact constraint
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: 'user' } },
          audio: false,
        }).catch(() =>
          // Fallback: hint only (some desktops don't support 'exact')
          navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false,
          })
        );
      } catch (err) {
        setStatus(err.name === 'NotReadableError' ? 'cam-in-use' : 'cam-denied');
        return;
      }
      if (!active) { stream.getTracks().forEach(t => t.stop()); return; }

      const video = videoRef.current;
      video.srcObject = stream;
      await video.play().catch(() => {});
      await new Promise(res => {
        if (video.readyState >= 2) return res();
        video.addEventListener('loadeddata', res, { once: true });
      });
      if (!active) return;

      const vw = video.videoWidth  || 1280;
      const vh = video.videoHeight || 720;
      setAspect(vw / vh);

      // Feed canvas for MediaPipe (avoids <video> quirks in Safari)
      const feed    = Object.assign(document.createElement('canvas'), { width: vw, height: vh });
      const feedCtx = feed.getContext('2d');

      // ── Three.js ────────────────────────────────────────────────────────────
      renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, alpha: true, antialias: true });
      renderer.setSize(vw, vh);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);

      cam3 = new THREE.OrthographicCamera(-vw/2, vw/2, vh/2, -vh/2, -2000, 2000);
      cam3.position.z = 600;

      scene = new THREE.Scene();
      scene.add(new THREE.AmbientLight(0xffffff, 2.8));
      const dL1 = new THREE.DirectionalLight(0xffffff, 1.4);
      dL1.position.set(0, 3, 5);
      scene.add(dL1);
      const dL2 = new THREE.DirectionalLight(0xffffff, 0.5);
      dL2.position.set(0, -1, -2);
      scene.add(dL2);

      // ── Load glasses ─────────────────────────────────────────────────────
      new GLTFLoader().load(`${BASE}puma-eyewear.glb`, gltf => {
        if (!active) return;
        const model = gltf.scene;
        model.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(model);
        const siz = box.getSize(new THREE.Vector3());
        model.scale.setScalar(1 / Math.max(siz.x, siz.z, 0.001));
        model.updateMatrixWorld(true);
        const cen = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
        model.position.sub(cen);
        glassesGroup = new THREE.Group();
        glassesGroup.add(model);
        glassesGroup.visible = false;
        scene.add(glassesGroup);
      });

      // ── Render loop ──────────────────────────────────────────────────────
      const fmRef = { current: null };
      let busy = false;

      async function renderLoop() {
        if (!active) return;
        rafId = requestAnimationFrame(renderLoop);

        // Face detection (throttled by busy flag)
        const fm = fmRef.current;
        if (fm && !busy && video.readyState >= 2) {
          busy = true;
          try { feedCtx.drawImage(video, 0, 0, vw, vh); await fm.send({ image: feed }); } catch (_) {}
          busy = false;
        }

        if (glassesGroup) {
          const lm = lmRef.current;

          if (lm) {
            // Outer eye corners → roll, yaw, scale anchor
            const lO = lm[33],  rO = lm[263];
            // Forehead + chin → pitch
            const fh = lm[10],  ch = lm[152];

            const eyeCX  = (lO.x + rO.x) / 2;
            const eyeCY  = (lO.y + rO.y) / 2;
            const eyeDx  = (rO.x - lO.x) * vw;
            const eyeDy  = (rO.y - lO.y) * vh;
            const eyeDz  = (rO.z - lO.z) * vw;
            const eyeDist = Math.hypot(eyeDx, eyeDy);

            const faceH  = Math.max((ch.y - fh.y) * vh, 1);
            const zSpan  = (ch.z - fh.z) * vw;

            // Three.js X: canvas is CSS scaleX(-1)
            //   screen_x = vw/2 - tx  →  tx = (eyeCX - 0.5) * vw
            // Three.js Y: in a typical selfie scenario the camera is below
            //   eye level — tilting up makes eyeCY increase, so we use
            //   (eyeCY - 0.5) * vh so the glasses move up when face tilts up.
            posRef.current.x = ema(posRef.current.x, (eyeCX - 0.5) * vw,    SMOOTH_POS);
            posRef.current.y = ema(posRef.current.y, (0.5 - eyeCY) * vh,    SMOOTH_POS);
            scaleRef.current  = ema(scaleRef.current, eyeDist * GLASSES_SCALE, SMOOTH_SCALE);

            rotRef.current.roll  = ema(rotRef.current.roll,  Math.atan2(eyeDy, eyeDx),                  SMOOTH_ROT);
            rotRef.current.yaw   = ema(rotRef.current.yaw,  -Math.atan2(eyeDz, eyeDist) * 1.5,          SMOOTH_ROT);
            rotRef.current.pitch = ema(rotRef.current.pitch, Math.atan2(zSpan, faceH) * PITCH_MULT,     SMOOTH_ROT);

            stableRef.current = Math.min(stableRef.current + 1, STABLE_NEEDED + 20);
          } else {
            stableRef.current = Math.max(stableRef.current - 2, 0);
          }

          const p      = posRef.current;
          const r      = rotRef.current;
          const s      = scaleRef.current;
          const stable = stableRef.current >= STABLE_NEEDED && p.x !== null && s !== null;

          if (stable) {
            const a = adjRef.current;
            glassesGroup.position.set(p.x + a.dx, p.y + a.dy, 0);
            glassesGroup.rotation.set(
               (r.pitch ?? 0),
              -(r.yaw   ?? 0),
              -(r.roll  ?? 0),
            );
            glassesGroup.scale.setScalar(s * a.ds);
            glassesGroup.visible = true;
            glassesOpacity = Math.min(glassesOpacity + FADE_IN_STEP, 1);
          } else {
            glassesOpacity = Math.max(glassesOpacity - FADE_OUT_STEP, 0);
            if (glassesOpacity === 0) glassesGroup.visible = false;
          }

          // Drive opacity via DOM ref (avoids React re-renders)
          if (canvasRef.current) canvasRef.current.style.opacity = glassesOpacity;
        }

        renderer.render(scene, cam3);
      }
      renderLoop();

      // ── Load FaceMesh (non-blocking) ────────────────────────────────────
      setStatus('det-loading');
      injectScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js')
        .then(() => {
          if (!active || !window.FaceMesh) { setStatus('det-error'); return; }

          const fm = new window.FaceMesh({
            locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${f}`,
          });
          fm.setOptions({
            maxNumFaces: 1,
            refineLandmarks: false,
            minDetectionConfidence: 0.6,
            minTrackingConfidence: 0.6,
          });
          fm.onResults(({ multiFaceLandmarks }) => {
            if (!active) return;
            const found = !!multiFaceLandmarks?.length;
            lmRef.current = found ? multiFaceLandmarks[0] : null;
            setHasFace(found);
            setStatus(found ? 'tracking' : 'detecting');
          });
          fmRef.current = fm;
          setStatus('detecting');
        })
        .catch(() => setStatus('det-error'));
    }

    init();
    return () => {
      active = false;
      cancelAnimationFrame(rafId);
      videoRef.current?.srcObject?.getTracks().forEach(t => t.stop());
      renderer?.dispose();
    };
  }, []);

  // ── JSX ──────────────────────────────────────────────────────────────────
  const isTracking = status === 'tracking';
  const isDetecting = status === 'detecting';

  return (
    <div className="relative w-full bg-black overflow-hidden select-none" style={{ aspectRatio: aspect }}>

      {/* Camera feed — selfie mirror */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline muted
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* Three.js glasses overlay — mirrored to match video */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ transform: 'scaleX(-1)', opacity: 0 }}
      />

      {/* Face alignment guide — only while detecting */}
      {isDetecting && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <mask id="face-guide-mask">
                <rect width="100" height="100" fill="white" />
                <ellipse cx="50" cy="47" rx="25" ry="35" fill="black" />
              </mask>
            </defs>
            <rect width="100" height="100" fill="rgba(0,0,0,0.45)" mask="url(#face-guide-mask)" />
            <ellipse
              cx="50" cy="47" rx="25" ry="35"
              fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.5" strokeDasharray="3 2"
            />
          </svg>
          <div className="absolute bottom-[22%] inset-x-0 flex justify-center">
            <div className="bg-black/60 px-5 py-2 text-[11px] font-black uppercase tracking-widest text-white">
              Position your face in the frame
            </div>
          </div>
        </div>
      )}

      {/* Adjustment controls + product bar — visible while tracking */}
      {isTracking && (
        <div className="absolute bottom-0 inset-x-0 z-20">
          {/* Adjustment pad */}
          <div className="bg-black/70 px-4 py-2 flex items-center justify-between gap-3">
            {/* Move */}
            <div className="flex flex-col items-center gap-0.5">
              <button onPointerDown={() => nudge('dy',  ADJ_STEP)} className="w-8 h-8 bg-white/15 hover:bg-white/30 text-white text-xs font-black flex items-center justify-center active:scale-95 select-none">↑</button>
              <div className="flex gap-0.5">
                <button onPointerDown={() => nudge('dx',  ADJ_STEP)} className="w-8 h-8 bg-white/15 hover:bg-white/30 text-white text-xs font-black flex items-center justify-center active:scale-95 select-none">←</button>
                <button onPointerDown={() => nudge('dy', -ADJ_STEP)} className="w-8 h-8 bg-white/15 hover:bg-white/30 text-white text-xs font-black flex items-center justify-center active:scale-95 select-none">↓</button>
                <button onPointerDown={() => nudge('dx', -ADJ_STEP)} className="w-8 h-8 bg-white/15 hover:bg-white/30 text-white text-xs font-black flex items-center justify-center active:scale-95 select-none">→</button>
              </div>
              <span className="text-[7px] font-black uppercase tracking-widest text-white/40">Move</span>
            </div>

            {/* Scale */}
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex gap-0.5">
                <button onPointerDown={() => nudge('ds', -SCALE_STEP)} className="w-8 h-8 bg-white/15 hover:bg-white/30 text-white text-sm font-black flex items-center justify-center active:scale-95 select-none">−</button>
                <button onPointerDown={() => nudge('ds',  SCALE_STEP)} className="w-8 h-8 bg-white/15 hover:bg-white/30 text-white text-sm font-black flex items-center justify-center active:scale-95 select-none">+</button>
              </div>
              <span className="text-[7px] font-black uppercase tracking-widest text-white/40">Size</span>
            </div>

            {/* Reset */}
            <button
              onClick={resetAdj}
              className="text-[8px] font-black uppercase tracking-widest text-white/50 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-2 transition-colors"
            >
              Reset
            </button>

            {/* Product + CTA */}
            <div className="flex items-center gap-3 ml-auto">
              <div className="text-right hidden sm:block">
                <p className="text-[8px] font-black uppercase tracking-widest text-white/50 leading-none mb-0.5">Virtual try-on</p>
                <p className="text-[10px] font-black uppercase text-white leading-none">{productName}</p>
                <p className="text-[8px] text-white/50 uppercase tracking-wider">{colorName} · $195</p>
              </div>
              <button className="bg-white text-black text-[9px] font-black uppercase tracking-widest px-4 py-2.5 hover:bg-[#c8102e] hover:text-white transition-all active:scale-95 shrink-0 whitespace-nowrap">
                Select Lenses →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live badge — tracking only */}
      {isTracking && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-black/50 px-2.5 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest text-white">Live</span>
        </div>
      )}

      {/* ── Status overlays ── */}

      {status === 'cam-loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-30 gap-4">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <p className="text-white text-[10px] font-black uppercase tracking-widest">Starting camera…</p>
        </div>
      )}

      {status === 'det-loading' && (
        <div className="absolute top-4 inset-x-0 flex justify-center z-20 pointer-events-none">
          <div className="flex items-center gap-2 bg-black/65 px-4 py-2">
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <p className="text-white text-[10px] font-black uppercase tracking-widest">
              Initializing face tracking…
            </p>
          </div>
        </div>
      )}

      {status === 'cam-denied' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-30">
          <div className="text-center px-8 space-y-4 max-w-xs">
            <div className="w-12 h-12 border border-white/20 flex items-center justify-center mx-auto">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" />
                <line x1="2" y1="2" x2="22" y2="22" stroke="#c8102e" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-white text-xs font-black uppercase tracking-widest">Camera access needed</p>
            <p className="text-white/50 text-[11px] leading-relaxed">
              In Safari tap <strong className="text-white">Aa</strong> in the address bar →
              Website Settings → Camera → <strong className="text-white">Allow</strong>,
              then reopen this panel.
            </p>
          </div>
        </div>
      )}

      {status === 'cam-in-use' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-30">
          <div className="text-center px-8 space-y-3">
            <p className="text-white text-xs font-black uppercase tracking-widest">Camera in use</p>
            <p className="text-white/50 text-[11px]">
              Another app is using the camera. Close it and try again.
            </p>
          </div>
        </div>
      )}

      {status === 'det-error' && (
        <div className="absolute top-4 inset-x-0 flex justify-center z-20 pointer-events-none">
          <div className="bg-[#c8102e]/90 px-4 py-2">
            <p className="text-white text-[9px] font-black uppercase tracking-widest">
              Face tracking unavailable in this browser
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
