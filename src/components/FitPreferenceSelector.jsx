// FitPreferenceSelector — tight / regular / relaxed fit toggle

const fits = [
  {
    id: 'tight',
    label: 'Tight',
    icon: (
      <svg viewBox="0 0 32 48" fill="none" className="w-6 h-9">
        <rect x="10" y="0" width="12" height="28" rx="3" fill="currentColor" opacity="0.8"/>
        <rect x="10" y="28" width="5" height="20" rx="2" fill="currentColor" opacity="0.7"/>
        <rect x="17" y="28" width="5" height="20" rx="2" fill="currentColor" opacity="0.7"/>
      </svg>
    ),
    description: 'Compressive, second-skin feel. Best for speed training and racing.',
  },
  {
    id: 'regular',
    label: 'Regular',
    icon: (
      <svg viewBox="0 0 32 48" fill="none" className="w-6 h-9">
        <rect x="8" y="0" width="16" height="28" rx="3" fill="currentColor" opacity="0.8"/>
        <rect x="8" y="28" width="6" height="20" rx="2" fill="currentColor" opacity="0.7"/>
        <rect x="18" y="28" width="6" height="20" rx="2" fill="currentColor" opacity="0.7"/>
      </svg>
    ),
    description: 'Balanced mobility and structure. Works for training and everyday wear.',
  },
  {
    id: 'relaxed',
    label: 'Relaxed',
    icon: (
      <svg viewBox="0 0 32 48" fill="none" className="w-6 h-9">
        <rect x="5" y="0" width="22" height="28" rx="4" fill="currentColor" opacity="0.8"/>
        <rect x="5" y="28" width="8" height="20" rx="3" fill="currentColor" opacity="0.7"/>
        <rect x="19" y="28" width="8" height="20" rx="3" fill="currentColor" opacity="0.7"/>
      </svg>
    ),
    description: 'Loose and breathable. Ideal for warm-up, recovery, and lifestyle.',
  },
];

export default function FitPreferenceSelector({ selected, onChange }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
        Fit Preference
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {fits.map((fit) => {
          const isSelected = selected === fit.id;
          return (
            <button
              key={fit.id}
              onClick={() => onChange(fit.id)}
              className={`flex flex-col items-center gap-2 p-3 border-2 transition-all ${
                isSelected
                  ? 'border-black bg-black text-white'
                  : 'border-gray-200 hover:border-gray-400 text-gray-700 bg-white'
              }`}
            >
              <div className={isSelected ? 'text-white' : 'text-gray-700'}>
                {fit.icon}
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {fit.label}
              </span>
            </button>
          );
        })}
      </div>
      {selected && (
        <p className="text-xs text-gray-400 mt-2 leading-relaxed">
          {fits.find((f) => f.id === selected)?.description}
        </p>
      )}
    </div>
  );
}
