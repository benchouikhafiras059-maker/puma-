import { useState, useEffect } from 'react';

const colors = [
  { id: 'black', label: 'Black', hex: '#1a1a1a', border: '#1a1a1a' },
];

const sizes = ['XS', 'S', 'M', 'L', 'XL'];
const outOfStock = [];

export default function ProductInfo({ selectedColor, onColorChange, onOpenTryOn, addedSize }) {
  const [selectedSize, setSelectedSize] = useState(addedSize || '');
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    if (!selectedSize) return;
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  useEffect(() => {
    if (addedSize) setSelectedSize(addedSize);
  }, [addedSize]);

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="text-[11px] text-gray-400 uppercase tracking-widest">
        Women / Accessories / Bags
      </div>

      {/* Product name */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-[#c8102e] text-white text-[10px] font-black px-2 py-0.5 uppercase tracking-widest">
            New
          </span>
          <span className="text-[10px] text-gray-400 uppercase tracking-widest">
            Accessories
          </span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-tight leading-none text-black mb-1">
          PUMA MOSTRO BAG
        </h1>
        <p className="text-sm text-gray-500 font-medium leading-relaxed">
          Inspired by the PUMA Mostro shoe, the Mostro Bag seamlessly integrates the PUMA logo into the handle — etched with cat scratches evoking the fierce spirit of the puma. The spiked base blends Mostro material and style, while the detachable bottom sleeve allows for a multitude of colorways.
        </p>
      </div>

      {/* Price */}
      <div className="flex items-center gap-3">
        <span className="text-2xl font-black text-black">$395.00</span>
      </div>

      {/* Reviews */}
      <div className="flex items-center gap-2">
        <div className="flex">
          {[1,2,3,4,5].map((s) => (
            <svg key={s} width="14" height="14" viewBox="0 0 14 14" fill={s <= 5 ? '#c8102e' : '#e5e5e5'}>
              <path d="M7 1l1.5 3.5L12 5l-2.5 2.5.6 3.5L7 9.5 3.9 11l.6-3.5L2 5l3.5-.5z"/>
            </svg>
          ))}
        </div>
        <span className="text-xs text-gray-500">5.0 (8 reviews)</span>
      </div>

      <div className="w-full h-px bg-gray-100" />

      {/* Color */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black uppercase tracking-widest text-black">Color</span>
          <span className="text-xs text-gray-500 font-medium">Black / Chrome</span>
        </div>
        <div className="flex gap-2">
          {colors.map((c) => (
            <button
              key={c.id}
              title={c.label}
              onClick={() => onColorChange(c.id)}
              className={`w-9 h-9 rounded-full border-2 transition-all ${
                selectedColor === c.id
                  ? 'ring-2 ring-black ring-offset-2'
                  : 'hover:ring-1 hover:ring-gray-400 hover:ring-offset-1'
              }`}
              style={{ background: c.hex, borderColor: c.border }}
            />
          ))}
        </div>
      </div>

      {/* Size selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black uppercase tracking-widest text-black">Size</span>
          <button className="text-xs text-gray-400 underline hover:text-black transition-colors">
            Size guide
          </button>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {sizes.map((s) => {
            const oos = outOfStock.includes(s);
            const isSelected = selectedSize === s;
            return (
              <button
                key={s}
                onClick={() => !oos && setSelectedSize(s)}
                disabled={oos}
                className={`py-2.5 text-xs font-bold border-2 transition-all ${
                  isSelected
                    ? 'border-black bg-black text-white'
                    : oos
                    ? 'border-gray-100 text-gray-300 cursor-not-allowed line-through'
                    : 'border-gray-200 text-black hover:border-black'
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>

        {/* AR preview button */}
        <button
          onClick={onOpenTryOn}
          className="mt-3 w-full border-2 border-dashed border-gray-300 hover:border-black py-3 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-black transition-all flex items-center justify-center gap-2 group"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:scale-110 transition-transform">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          See it in your space — AR Preview
        </button>
      </div>

      <div className="w-full h-px bg-gray-100" />

      {/* Add to cart */}
      <div className="space-y-2">
        <button
          onClick={handleAddToCart}
          disabled={!selectedSize}
          className={`w-full py-4 text-sm font-black uppercase tracking-widest transition-all ${
            added
              ? 'bg-green-600 text-white'
              : selectedSize
              ? 'bg-[#c8102e] hover:bg-[#a00d24] text-white'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {added ? '✓ Added to Cart' : selectedSize ? `Add to Cart — ${selectedSize}` : 'Select a Size'}
        </button>
        <button className="w-full py-3 border-2 border-black text-sm font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">
          Save to Wishlist
        </button>
      </div>

      {/* Trust badges */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        {[
          { icon: '🚚', label: 'Free shipping', sub: 'Orders $150+' },
          { icon: '↩️', label: 'Free returns', sub: '30 days' },
          { icon: '🔒', label: 'Secure checkout', sub: 'SSL encrypted' },
        ].map((b) => (
          <div key={b.label} className="text-center py-2 border border-gray-100">
            <div className="text-base mb-0.5">{b.icon}</div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-black">{b.label}</p>
            <p className="text-[10px] text-gray-400">{b.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
