import { useState } from 'react';
import { Link } from 'react-router-dom';
import EyewearGallery from './EyewearGallery';
import EyewearInfo from './EyewearInfo';
import EyewearTryOnModal from './EyewearTryOnModal';

function Navbar() {
  return (
    <nav className="border-b border-gray-100 bg-white sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link to="/" className="text-2xl text-black select-none" style={{ fontFamily: "'MyPUMA', 'FFDINforPUMA', sans-serif", fontWeight: 400 }}>
          PUMA
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {['Women', 'Men', 'Kids', 'Sports', 'Sale'].map((link) => (
            <a
              key={link}
              href="#"
              className={`text-xs font-bold uppercase tracking-widest hover:text-[#c8102e] transition-colors ${
                link === 'Sale' ? 'text-[#c8102e]' : 'text-black'
              }`}
            >
              {link}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button className="p-1.5 hover:bg-gray-100 transition-colors" aria-label="Search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
          </button>
          <button className="p-1.5 hover:bg-gray-100 transition-colors" aria-label="Account">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </button>
          <button className="p-1.5 hover:bg-gray-100 transition-colors relative" aria-label="Cart">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}

function ProductTabs() {
  const [tab, setTab] = useState('details');

  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'tech', label: 'Technology' },
    { id: 'reviews', label: 'Reviews (12)' },
  ];

  const content = {
    details: (
      <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
        <p>
          The <strong className="text-black">PUMA Sport Eyewear</strong> merges athletic performance with street-ready style.
          Built with a lightweight frame and UV400 lens protection, they're engineered to stay in place
          through any movement — on the track or off it.
        </p>
        <ul className="space-y-2">
          {[
            'UV400 lens protection blocks 100% of harmful UVA and UVB rays',
            'Lightweight wraparound frame for secure, comfortable fit',
            'Anti-slip nose pads and temple tips',
            'Impact-resistant polycarbonate lenses',
            'Available in three colorways',
          ].map((f) => (
            <li key={f} className="flex items-start gap-2">
              <span className="text-[#c8102e] font-black mt-0.5 flex-shrink-0">—</span>
              {f}
            </li>
          ))}
        </ul>
      </div>
    ),
    tech: (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { name: 'UV400 Lenses', desc: 'Full-spectrum UV protection blocks 100% of UVA and UVB rays, keeping your eyes safe in any condition.' },
          { name: 'Grip Frame', desc: 'Anti-slip temple tips and nose pads use rubber-coated contact points to lock the frame in place during intense movement.' },
          { name: 'Polycarbonate Build', desc: 'Impact-resistant polycarbonate lenses and frame deliver durability at a fraction of the weight of traditional materials.' },
        ].map((t) => (
          <div key={t.name} className="border-l-4 border-[#c8102e] pl-4 py-1">
            <h4 className="text-sm font-black text-black uppercase tracking-wider mb-1">{t.name}</h4>
            <p className="text-xs text-gray-500 leading-relaxed">{t.desc}</p>
          </div>
        ))}
      </div>
    ),
    reviews: (
      <div className="space-y-4">
        {[
          { name: 'Sasha M.', rating: 5, text: 'Wore these during a half marathon — didn\'t slip once. Lightweight and look great off the track too.', fit: 'Athletic' },
          { name: 'Tyler K.', rating: 5, text: 'The matte black colorway is clean. Solid UV protection and the fit is snug without being tight.', fit: 'Standard' },
          { name: 'Priya L.', rating: 5, text: 'Love the wraparound style. The red PUMA colorway is a head-turner.', fit: 'Slim' },
        ].map((r) => (
          <div key={r.name} className="border-b border-gray-100 pb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold text-black">{r.name}</span>
              <div className="flex">
                {[1,2,3,4,5].map((s) => (
                  <svg key={s} width="12" height="12" viewBox="0 0 12 12" fill={s <= r.rating ? '#c8102e' : '#e5e5e5'}>
                    <path d="M6 1l1.2 2.8L10 4.2l-2 2 .5 3L6 7.8 3.5 9.2l.5-3-2-2 2.8-.4z"/>
                  </svg>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-1.5">{r.text}</p>
            <span className="text-[10px] bg-gray-100 px-2 py-0.5 font-medium uppercase tracking-wider">{r.fit} fit</span>
          </div>
        ))}
      </div>
    ),
  };

  return (
    <div className="mt-12 mb-16 max-w-6xl mx-auto px-4">
      <div className="flex border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-3 text-xs font-black uppercase tracking-widest transition-all border-b-2 -mb-px ${
              tab === t.id ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="pt-6">{content[tab]}</div>
    </div>
  );
}

export default function EyewearPage() {
  const [selectedColor, setSelectedColor] = useState('black');
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 uppercase tracking-widest">
          {['Home', 'Accessories', 'Eyewear'].map((crumb, i, arr) => (
            <span key={crumb} className="flex items-center gap-1.5">
              <a href="#" className="hover:text-black transition-colors">{crumb}</a>
              {i < arr.length - 1 && <span>/</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Main product grid */}
      <main className="max-w-6xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <EyewearGallery />
          <EyewearInfo
            selectedColor={selectedColor}
            onColorChange={setSelectedColor}
            onOpenTryOn={() => setIsModalOpen(true)}
          />
        </div>
      </main>

      <ProductTabs />

      {/* Also see — link back to bag */}
      <section className="border-t border-gray-100 bg-[#f5f5f5] py-14">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#c8102e] mb-1">Also See</p>
          <h2 className="text-2xl font-black uppercase tracking-tight text-black mb-6">Mostro Bag</h2>
          <Link
            to="/"
            className="inline-block bg-black text-white text-xs font-black uppercase tracking-widest px-8 py-3 hover:bg-[#c8102e] transition-colors"
          >
            Shop the Bag →
          </Link>
        </div>
      </section>

      <EyewearTryOnModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedColor={selectedColor}
      />
    </div>
  );
}
