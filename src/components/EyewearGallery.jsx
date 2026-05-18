const BASE = import.meta.env.BASE_URL;

export default function EyewearGallery() {
  return (
    <div className="flex gap-3 lg:gap-4 items-start">
      {/* Main viewer */}
      <div className="flex-1 relative bg-[#f2f2f2] overflow-hidden" style={{ aspectRatio: '1 / 1' }}>
        <model-viewer
          src={`${BASE}puma-eyewear.glb`}
          alt="PUMA Eyewear 3D model"
          camera-controls
          auto-rotate
          auto-rotate-delay="1000"
          rotation-per-second="20deg"
          shadow-intensity="1"
          shadow-softness="0.8"
          environment-image="neutral"
          style={{ width: '100%', height: '100%', background: 'transparent' }}
          ar
          ar-modes="webxr scene-viewer quick-look"
        >
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

        <div className="absolute top-4 left-4 bg-[#c8102e] text-white text-[10px] font-black px-2.5 py-1 uppercase tracking-widest z-10 pointer-events-none">
          New
        </div>

        <div className="absolute bottom-4 left-4 text-[10px] font-bold text-gray-400 tracking-widest z-10 pointer-events-none">
          Drag to rotate
        </div>
      </div>
    </div>
  );
}
