import { useState, useRef, useCallback } from 'react';

const images = [
  { id: 1, src: '/puma-bag.png', alt: 'PUMA Mostro Bag — front view' },
];

function SoundOnIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    </svg>
  );
}

function SoundOffIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <line x1="23" y1="9" x2="17" y2="15"/>
      <line x1="17" y1="9" x2="23" y2="15"/>
    </svg>
  );
}

export default function ProductGallery() {
  const [active,  setActive]  = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  const playSnarl = useCallback(() => {
    if (!soundOn) return;
    if (!audioRef.current) {
      audioRef.current = new Audio('/puma-snarl.mp3');
      audioRef.current.volume = 0.7;
    }
    const audio = audioRef.current;
    clearTimeout(timerRef.current);
    audio.currentTime = 0;
    audio.play().catch(() => {});
    timerRef.current = setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
    }, 600);
  }, [soundOn]);

  return (
    <div className="flex gap-3 lg:gap-4 items-start">

      {/* ── Vertical thumbnail strip ── */}
      <div className="flex flex-col gap-2 flex-shrink-0">
        {images.map((img, i) => (
          <button
            key={img.id}
            onClick={() => setActive(i)}
            className={`w-[72px] h-[72px] overflow-hidden flex-shrink-0 border-2 transition-all bg-[#f2f2f2] ${
              active === i ? 'border-black' : 'border-transparent hover:border-gray-300'
            }`}
          >
            <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {/* ── Main viewer ── */}
      <div className="flex-1 relative bg-[#f2f2f2] overflow-hidden" style={{ aspectRatio: '1 / 1' }}>

        {/* 3D model viewer */}
        <model-viewer
          src="/mostro-bag.glb"
          alt="PUMA Mostro Bag 3D model"
          camera-controls
          auto-rotate
          auto-rotate-delay="1000"
          rotation-per-second="20deg"
          shadow-intensity="1"
          shadow-softness="0.8"
          environment-image="neutral"
          style={{ width: '100%', height: '100%', background: 'transparent' }}
          onMouseEnter={playSnarl}
          ar
          ar-modes="webxr scene-viewer quick-look"
        >
          {/* AR button — shows on mobile automatically */}
          <button
            slot="ar-button"
            style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              background: '#000',
              color: '#fff',
              border: 'none',
              padding: '8px 14px',
              fontSize: '10px',
              fontWeight: '900',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            View in AR
          </button>
        </model-viewer>

        {/* New badge */}
        <div className="absolute top-4 left-4 bg-[#c8102e] text-white text-[10px] font-black px-2.5 py-1 uppercase tracking-widest z-10 pointer-events-none">
          New
        </div>

        {/* Sound toggle */}
        <button
          onClick={() => setSoundOn(s => !s)}
          title={soundOn ? 'Mute hover sound' : 'Enable hover sound'}
          className={`absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center transition-all ${
            soundOn
              ? 'bg-black text-white hover:bg-[#333]'
              : 'bg-white/80 text-gray-400 hover:bg-white hover:text-black border border-gray-200'
          }`}
        >
          {soundOn ? <SoundOnIcon /> : <SoundOffIcon />}
        </button>

        {/* Rotate hint */}
        <div className="absolute bottom-4 left-4 text-[10px] font-bold text-gray-400 tracking-widest z-10 pointer-events-none">
          Drag to rotate
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0.6 } to { opacity: 1 } }
      `}</style>
    </div>
  );
}
