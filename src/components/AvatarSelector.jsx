// AvatarSelector — lets the user pick a body type and gender for the fit preview

const avatars = [
  {
    id: 'slim',
    label: 'Slim',
    description: 'Lean, defined build',
    svg: (
      <svg viewBox="0 0 60 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <ellipse cx="30" cy="14" rx="9" ry="9" fill="currentColor" opacity="0.85"/>
        <rect x="22" y="26" width="16" height="38" rx="4" fill="currentColor" opacity="0.75"/>
        <rect x="12" y="27" width="8" height="30" rx="4" fill="currentColor" opacity="0.65"/>
        <rect x="40" y="27" width="8" height="30" rx="4" fill="currentColor" opacity="0.65"/>
        <rect x="22" y="62" width="7" height="42" rx="3" fill="currentColor" opacity="0.7"/>
        <rect x="31" y="62" width="7" height="42" rx="3" fill="currentColor" opacity="0.7"/>
      </svg>
    ),
  },
  {
    id: 'athletic',
    label: 'Athletic',
    description: 'Muscular, performance build',
    svg: (
      <svg viewBox="0 0 60 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <ellipse cx="30" cy="14" rx="10" ry="10" fill="currentColor" opacity="0.85"/>
        <rect x="18" y="26" width="24" height="40" rx="4" fill="currentColor" opacity="0.75"/>
        <rect x="8" y="27" width="9" height="32" rx="4" fill="currentColor" opacity="0.65"/>
        <rect x="43" y="27" width="9" height="32" rx="4" fill="currentColor" opacity="0.65"/>
        <rect x="19" y="64" width="9" height="42" rx="3" fill="currentColor" opacity="0.7"/>
        <rect x="32" y="64" width="9" height="42" rx="3" fill="currentColor" opacity="0.7"/>
      </svg>
    ),
  },
  {
    id: 'regular',
    label: 'Regular',
    description: 'Average everyday build',
    svg: (
      <svg viewBox="0 0 60 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <ellipse cx="30" cy="14" rx="10" ry="10" fill="currentColor" opacity="0.85"/>
        <rect x="17" y="26" width="26" height="42" rx="5" fill="currentColor" opacity="0.75"/>
        <rect x="7" y="27" width="9" height="33" rx="4" fill="currentColor" opacity="0.65"/>
        <rect x="44" y="27" width="9" height="33" rx="4" fill="currentColor" opacity="0.65"/>
        <rect x="18" y="66" width="10" height="42" rx="3" fill="currentColor" opacity="0.7"/>
        <rect x="32" y="66" width="10" height="42" rx="3" fill="currentColor" opacity="0.7"/>
      </svg>
    ),
  },
  {
    id: 'broad',
    label: 'Broad',
    description: 'Wide shoulders, fuller frame',
    svg: (
      <svg viewBox="0 0 60 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <ellipse cx="30" cy="13" rx="11" ry="11" fill="currentColor" opacity="0.85"/>
        <rect x="14" y="26" width="32" height="42" rx="5" fill="currentColor" opacity="0.75"/>
        <rect x="4" y="27" width="10" height="34" rx="4" fill="currentColor" opacity="0.65"/>
        <rect x="46" y="27" width="10" height="34" rx="4" fill="currentColor" opacity="0.65"/>
        <rect x="16" y="66" width="12" height="42" rx="3" fill="currentColor" opacity="0.7"/>
        <rect x="32" y="66" width="12" height="42" rx="3" fill="currentColor" opacity="0.7"/>
      </svg>
    ),
  },
];

export default function AvatarSelector({ selected, onChange }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Body Type</h3>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {avatars.map((avatar) => {
          const isSelected = selected === avatar.id;
          return (
            <button
              key={avatar.id}
              onClick={() => onChange(avatar.id)}
              className={`flex flex-col items-center gap-1.5 p-2 border-2 transition-all group ${
                isSelected
                  ? 'border-black bg-black text-white'
                  : 'border-gray-200 hover:border-gray-400 text-gray-700 bg-white'
              }`}
            >
              <div
                className={`w-10 h-20 flex items-center justify-center ${
                  isSelected ? 'text-white' : 'text-gray-700'
                }`}
              >
                {avatar.svg}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider leading-tight text-center">
                {avatar.label}
              </span>
            </button>
          );
        })}
      </div>
      {selected && (
        <p className="text-xs text-gray-400 mt-2 text-center">
          {avatars.find((a) => a.id === selected)?.description}
        </p>
      )}
    </div>
  );
}
