// AR3DCameraView — live camera background + Three.js 3D model rendered on top.
// Gives true 3D-in-camera without requiring WebXR/mobile.

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const BASE = import.meta.env.BASE_URL;

export default function AR3DCameraView() {
  const [stage,    setStage]   = useState('idle');   // idle | requesting | live | denied
  const [loading,  setLoading] = useState(false);
  const [scale,    setScale]   = useState(1);
  const [facingMode, setFacingMode] = useState('environment');

  const videoRef     = useRef(null);
  const canvasRef    = useRef(null);
  const containerRef = useRef(null);
  const streamRef    = useRef(null);
  const rendererRef  = useRef(null);
  const sceneRef     = useRef(null);
  const threeCamera  = useRef(null);
  const modelRef     = useRef(null);
  const baseScale    = useRef(1);
  const rafRef       = useRef(null);
  const dragRef      = useRef(null);

  // ── Camera ─────────────────────────────────────────────────────────────────
  const startCamera = useCallback(async (facing = facingMode) => {
    setStage('requesting');
    streamRef.current?.getTracks().forEach(t => t.stop());
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setStage('live');
    } catch (err) {
      setStage(err.name === 'NotAllowedError' ? 'denied' : 'idle');
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    cancelAnimationFrame(rafRef.current);
    rendererRef.current?.dispose();
    rendererRef.current = null;
    modelRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStage('idle');
  }, []);

  const flipCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    startCamera(next);
  };

  // ── Set up Three.js once camera is live ────────────────────────────────────
  useEffect(() => {
    if (stage !== 'live') return;
    if (!videoRef.current || !canvasRef.current || !containerRef.current) return;

    // Attach stream to video
    videoRef.current.srcObject = streamRef.current;
    videoRef.current.play().catch(console.warn);

    const container = containerRef.current;
    const W = container.clientWidth;
    const H = container.clientHeight;

    // Scene + camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const cam = new THREE.PerspectiveCamera(45, W / H, 0.01, 100);
    cam.position.set(0, 0, 3);
    threeCamera.current = cam;

    // Renderer — transparent so video shows through
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 1.8));
    const sun = new THREE.DirectionalLight(0xffffff, 2.5);
    sun.position.set(3, 5, 4);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xffffff, 1);
    fill.position.set(-3, 0, 3);
    scene.add(fill);

    // Load GLB
    setLoading(true);
    const loader = new GLTFLoader();
    loader.load(
      `${BASE}mostro-bag.glb`,
      (gltf) => {
        const model = gltf.scene;

        // Normalise — centre and fit within a unit cube
        const box = new THREE.Box3().setFromObject(model);
        const centre = box.getCenter(new THREE.Vector3());
        const size   = box.getSize(new THREE.Vector3());
        const fit    = 1.6 / Math.max(size.x, size.y, size.z);
        model.scale.setScalar(fit);
        model.position.copy(centre.multiplyScalar(-fit));

        baseScale.current = fit;
        scene.add(model);
        modelRef.current = model;
        setLoading(false);
      },
      undefined,
      (err) => { console.error('GLB load error:', err); setLoading(false); }
    );

    // Render loop — no auto-rotation, user controls it
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      renderer.render(scene, cam);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      renderer.dispose();
    };
  }, [stage]);

  // Apply scale slider to model
  useEffect(() => {
    if (!modelRef.current) return;
    modelRef.current.scale.setScalar(baseScale.current * scale);
  }, [scale]);

  // ── Drag to reposition ─────────────────────────────────────────────────────
  const onPointerDown = (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerMove = useCallback((e) => {
    if (!dragRef.current || !modelRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    // Horizontal drag → spin around Y axis, vertical drag → tilt on X axis
    modelRef.current.rotation.y += dx * 0.01;
    modelRef.current.rotation.x += dy * 0.01;
    dragRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onPointerUp = () => { dragRef.current = null; };

  // Cleanup on unmount
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    cancelAnimationFrame(rafRef.current);
  }, []);

  // ── Idle screen ─────────────────────────────────────────────────────────────
  if (stage !== 'live') {
    return (
      <div className="space-y-3">
        <div className="bg-black aspect-video flex flex-col items-center justify-center gap-5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
          />
          <div className="relative z-10 text-center px-6">
            <p className="text-white text-sm font-black uppercase tracking-widest mb-1">See it in your space</p>
            <p className="text-gray-400 text-xs">The 3D bag will appear in your camera feed</p>
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
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Opening camera…</>
          ) : (
            <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>Open Camera</>
          )}
        </button>
      </div>
    );
  }

  // ── Live view ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Top bar */}
      <div className="relative">
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-2 pointer-events-none">
          <div className="bg-black/75 text-white text-[10px] px-2.5 py-1 flex items-center gap-1.5 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c8102e] animate-pulse" />
            AR Preview — Live 3D
          </div>
          <div className="flex items-center gap-1.5 pointer-events-auto">
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

        {/* Camera feed + Three.js canvas stacked */}
        <div
          ref={containerRef}
          className="relative w-full overflow-hidden bg-black select-none"
          style={{ aspectRatio: '4/3', maxHeight: '420px' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {/* Camera video — fills the container */}
          <video
            ref={videoRef}
            autoPlay playsInline muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : undefined }}
          />

          {/* Three.js canvas — transparent bg, sits on top */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full touch-none"
            style={{ cursor: dragRef.current ? 'grabbing' : 'grab' }}
          />

          {/* Loading spinner */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/30">
              <div className="text-center text-white space-y-2">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-widest">Loading 3D model…</p>
              </div>
            </div>
          )}

          {/* Hint */}
          {!loading && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-black/65 text-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest pointer-events-none whitespace-nowrap">
              Drag to rotate 360°
            </div>
          )}
        </div>
      </div>

      {/* Scale control */}
      <div className="bg-[#f9f9f9] border border-gray-100 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Scale</h4>
          <button
            onClick={() => setScale(1)}
            className="text-[10px] text-gray-400 hover:text-black font-bold uppercase tracking-widest transition-colors"
          >Reset</button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-black w-10 flex-shrink-0">Size</span>
          <input type="range" min="0.3" max="3" step="0.05" value={scale}
            onChange={e => setScale(parseFloat(e.target.value))}
            className="flex-1 h-1 accent-black cursor-pointer" />
          <span className="text-[11px] text-gray-500 w-9 text-right tabular-nums">{Math.round(scale * 100)}%</span>
        </div>
      </div>

    </div>
  );
}
