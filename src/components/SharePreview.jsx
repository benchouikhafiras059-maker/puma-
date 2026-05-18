// SharePreview — social/save moment at the end of the try-on flow
import { useState } from 'react';

export default function SharePreview({ bodyType, fitPreference, recommendedSize }) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleCopy = () => {
    // Simulate copy to clipboard
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!recommendedSize) return null;

  return (
    <div className="border-t-2 border-gray-100 pt-5 space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Share Your Fit
        </span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {/* Fit card preview */}
      <div className="bg-[#f5f5f5] p-4 flex items-center gap-4">
        <div className="w-12 h-12 bg-black flex items-center justify-center flex-shrink-0">
          <span className="text-white font-black text-lg">{recommendedSize}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black uppercase tracking-wider truncate">
            PUMA Deviate NITRO™ 3
          </p>
          <p className="text-[11px] text-gray-500 capitalize">
            {bodyType} build · {fitPreference} fit · Size {recommendedSize}
          </p>
        </div>
        <div className="w-6 h-6 flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#c8102e" opacity="0.9"/>
            <path d="M2 17l10 5 10-5" stroke="#c8102e" strokeWidth="2" strokeLinecap="round"/>
            <path d="M2 12l10 5 10-5" stroke="#c8102e" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={handleSave}
          className={`flex flex-col items-center gap-1.5 py-3 border-2 transition-all text-center ${
            saved
              ? 'border-black bg-black text-white'
              : 'border-gray-200 hover:border-gray-400 text-gray-700'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? 'white' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-wider leading-none">
            {saved ? 'Saved!' : 'Save'}
          </span>
        </button>

        <button
          onClick={handleCopy}
          className={`flex flex-col items-center gap-1.5 py-3 border-2 transition-all ${
            copied
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-gray-200 hover:border-gray-400 text-gray-700'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-wider leading-none">
            {copied ? 'Copied!' : 'Share'}
          </span>
        </button>

        <button className="flex flex-col items-center gap-1.5 py-3 border-2 border-gray-200 hover:border-gray-400 text-gray-700 transition-all">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3"/>
            <circle cx="6" cy="12" r="3"/>
            <circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-wider leading-none">
            Send
          </span>
        </button>
      </div>

      <p className="text-[10px] text-gray-400 text-center leading-relaxed">
        Share your fit preview with friends or save it to your PUMA profile for later.
      </p>
    </div>
  );
}
