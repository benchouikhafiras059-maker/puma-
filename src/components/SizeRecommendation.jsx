// SizeRecommendation — dummy logic maps height + bodyType + fitPreference → recommended size

const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

// Simulated lookup table
function computeSize(height, bodyType, fitPreference) {
  if (!height || !bodyType || !fitPreference) return null;

  const h = parseInt(height, 10);

  // Base size from height
  let base = 2; // M by default
  if (h <= 165) base = 1;       // S
  else if (h <= 172) base = 2;  // M
  else if (h <= 180) base = 3;  // L
  else if (h <= 188) base = 4;  // XL
  else base = 5;                 // XXL

  // Body type adjustment
  const bodyOffset = { slim: -1, athletic: 0, regular: 0, broad: 1 };
  base += bodyOffset[bodyType] ?? 0;

  // Fit preference adjustment (relaxed = size up, tight = size down)
  const fitOffset = { tight: -1, regular: 0, relaxed: 1 };
  base += fitOffset[fitPreference] ?? 0;

  return sizes[Math.max(0, Math.min(base, sizes.length - 1))];
}

function getConfidence(bodyType, fitPreference) {
  if (bodyType && fitPreference) return 97;
  if (bodyType || fitPreference) return 82;
  return 70;
}

export default function SizeRecommendation({ height, bodyType, fitPreference, onAddToCart }) {
  const recommended = computeSize(height, bodyType, fitPreference);
  const confidence = getConfidence(bodyType, fitPreference);
  const isComplete = height && bodyType && fitPreference;

  if (!isComplete) {
    return (
      <div className="border-2 border-dashed border-gray-200 p-6 text-center">
        <div className="text-3xl mb-2">👟</div>
        <p className="text-sm text-gray-400 uppercase tracking-wider font-medium">
          Complete your profile above to get your recommended size
        </p>
      </div>
    );
  }

  const idx = sizes.indexOf(recommended);
  const smaller = idx > 0 ? sizes[idx - 1] : null;
  const larger = idx < sizes.length - 1 ? sizes[idx + 1] : null;

  return (
    <div className="space-y-4">
      {/* Main recommendation card */}
      <div className="bg-black text-white p-5 relative overflow-hidden">
        {/* Background accent stripe */}
        <div className="absolute top-0 right-0 w-24 h-full bg-[#c8102e] opacity-20 skew-x-[-12deg] translate-x-8" />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">
                Recommended Size
              </p>
              <div className="flex items-end gap-3">
                <span className="text-6xl font-black leading-none">{recommended}</span>
                <div className="mb-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#c8102e] rounded-full transition-all"
                        style={{ width: `${confidence}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-[#c8102e]">{confidence}% match</span>
                  </div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Fit confidence</p>
                </div>
              </div>
            </div>

            {/* Checkmark */}
            <div className="w-10 h-10 rounded-full border-2 border-[#c8102e] flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l3.5 3.5L13 5" stroke="#c8102e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed">
            Based on your {height}cm height, {bodyType} build, and {fitPreference} fit preference.
          </p>
        </div>
      </div>

      {/* Size comparison row */}
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Compare Sizes</p>
        <div className="flex gap-2">
          {[smaller, recommended, larger].filter(Boolean).map((s) => (
            <div
              key={s}
              className={`flex-1 py-3 border-2 text-center transition-all ${
                s === recommended
                  ? 'border-black bg-black text-white font-black'
                  : 'border-gray-200 text-gray-500 font-medium'
              }`}
            >
              <div className="text-sm font-bold">{s}</div>
              {s === recommended && (
                <div className="text-[9px] uppercase tracking-widest text-[#c8102e] font-bold mt-0.5">
                  Best fit
                </div>
              )}
              {s === smaller && (
                <div className="text-[9px] uppercase tracking-widest text-gray-400 mt-0.5">
                  Tighter
                </div>
              )}
              {s === larger && (
                <div className="text-[9px] uppercase tracking-widest text-gray-400 mt-0.5">
                  Roomier
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => onAddToCart(recommended)}
        className="w-full bg-[#c8102e] hover:bg-[#a00d24] text-white py-4 text-sm font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 01-8 0"/>
        </svg>
        Add Size {recommended} to Cart
      </button>
    </div>
  );
}
