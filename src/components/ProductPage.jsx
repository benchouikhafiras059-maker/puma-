// ProductPage — root layout component. Composes all sections of the PUMA PDP.
// The TryOnModal is mounted here and controlled via isModalOpen state.

import { useState } from 'react';
import { Link } from 'react-router-dom';
import ProductGallery from './ProductGallery';
import ProductInfo from './ProductInfo';
import TryOnModal from './TryOnModal';

// Simple PUMA nav bar
function Navbar() {
  return (
    <nav className="border-b border-gray-100 bg-white sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link to="/" className="text-2xl text-black select-none" style={{ fontFamily: "'MyPUMA', 'FFDINforPUMA', sans-serif", fontWeight: 400 }}>
          PUMA
        </Link>

        {/* Nav links — desktop */}
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

        {/* Icons */}
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

// Product description tabs
function ProductTabs() {
  const [tab, setTab] = useState('details');

  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'tech', label: 'Technology' },
    { id: 'reviews', label: 'Reviews (284)' },
  ];

  const content = {
    details: (
      <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
        <p>
          The <strong className="text-black">PUMA Mostro Bag</strong> is inspired by the existing PUMA Mostro shoe.
          The PUMA logo is seamlessly integrated into the handle, which also incorporates cat scratches
          evoking the fierce spirit of the puma. The spiked base blends Mostro material and style.
        </p>
        <ul className="space-y-2">
          {[
            'PUMA logo seamlessly integrated into the sculptural top handle',
            'Cat scratch detailing on handle evokes the fierce spirit of the puma',
            'Spiked base constructed from Mostro shoe material and style',
            'Detachable bottom sleeve — swap colorways to personalize your look',
            'Inspired by the iconic PUMA Mostro silhouette',
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
          { name: 'Integrated Logo Handle', desc: 'The PUMA leaping cat logo is seamlessly built into the top handle, etched with cat scratches that evoke the puma\'s fierce spirit.' },
          { name: 'Mostro Spike Base', desc: 'The spiked base is directly inspired by the PUMA Mostro shoe — same material, same aggressive texture, translated into a bag.' },
          { name: 'Detachable Sleeve', desc: 'The bottom of the bag attaches and detaches like a sleeve, offering room for personalization across a multitude of colorways.' },
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
          { name: 'Marcus T.', rating: 5, text: 'The chrome handle is insane in person. Everyone asked where I got it.', fit: 'Statement', size: 'M' },
          { name: 'Jordan K.', rating: 5, text: 'The spike detail on the bottom is such a flex. This bag is genuinely a piece of art.', fit: 'Structured', size: 'S' },
          { name: 'Alex R.', rating: 5, text: 'Never seen anything like it. The cat handle is both the logo and the handle — brilliant design.', fit: 'Boxy', size: 'M' },
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
            <div className="flex gap-2">
              <span className="text-[10px] bg-gray-100 px-2 py-0.5 font-medium uppercase tracking-wider">{r.fit} build</span>
              <span className="text-[10px] bg-gray-100 px-2 py-0.5 font-medium uppercase tracking-wider">Size {r.size}</span>
            </div>
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

// Coming Soon section — three placeholder slots for future drops
function ComingSoonSection() {
  return (
    <section className="border-t border-gray-100 bg-[#f5f5f5] py-14">
      <div className="max-w-6xl mx-auto px-4">

        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#c8102e] mb-1">
              What's Next
            </p>
            <h2 className="text-2xl font-black uppercase tracking-tight text-black leading-none">
              Coming Soon
            </h2>
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-gray-400 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-[#c8102e] animate-pulse inline-block" />
            Dropping this season
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Eyewear — live */}
          <Link
            to="/eyewear"
            className="border-2 border-black min-h-[320px] flex flex-col items-center justify-center gap-3 text-center p-8 hover:bg-black group transition-all"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-black group-hover:text-white transition-colors">
              <circle cx="7" cy="12" r="4"/><circle cx="17" cy="12" r="4"/>
              <path d="M3 12H1m22 0h-2M11 12h2"/>
            </svg>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-black group-hover:text-white transition-colors">Available Now</p>
              <p className="text-sm font-black uppercase tracking-tight text-black group-hover:text-white transition-colors mt-0.5">Sport Eyewear</p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#c8102e] group-hover:text-white transition-colors">Shop →</span>
          </Link>

          {['placeholder-2', 'placeholder-3'].map((id) => (
            <div
              key={id}
              className="border-2 border-dashed border-gray-200 min-h-[320px] flex flex-col items-center justify-center gap-3 text-center p-8"
            >
              <div className="w-10 h-10 border-2 border-dashed border-gray-300 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
                More drops coming
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default function ProductPage() {
  const [selectedColor, setSelectedColor] = useState('black');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cartSize, setCartSize] = useState('');

  const handleAddToCart = (size) => {
    setCartSize(size);
    // In a real app, dispatch to cart store
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 uppercase tracking-widest">
          {['Home', 'Women', 'Accessories', 'Bags'].map((crumb, i, arr) => (
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
          {/* Gallery */}
          <ProductGallery />

          {/* Info — ProductInfo contains the "Try the Fit" button that opens TryOnModal */}
          <ProductInfo
            selectedColor={selectedColor}
            onColorChange={setSelectedColor}
            onOpenTryOn={() => setIsModalOpen(true)}
            addedSize={cartSize}
          />
        </div>
      </main>

      {/* Product details tabs */}
      <ProductTabs />

      {/* Coming Soon — new drops teaser */}
      <ComingSoonSection />

      {/* ↓ TryOnModal is mounted here, triggered by the "Try the Fit" button in ProductInfo */}
      <TryOnModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedColor={selectedColor}
      />
    </div>
  );
}
