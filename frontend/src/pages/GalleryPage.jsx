import React, { useState, useEffect } from 'react';
import { X, ZoomIn } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { galleryImages, galleryCategories } from '../data/mock';

const AnimatedSection = ({ children, className = '', delay = 0 }) => {
  const [ref, isVisible] = useScrollAnimation();
  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${className} ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default function GalleryPage() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filtered = activeFilter === 'All'
    ? galleryImages
    : galleryImages.filter((img) => img.category === activeFilter);

  return (
    <main className="min-h-screen bg-[#050505] pt-28">
      {/* Header */}
      <section className="py-20 relative">
        <div className="absolute top-0 right-1/3 w-[500px] h-[300px] bg-gold/[0.04] rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <AnimatedSection>
            <p className="text-gold text-[11px] uppercase tracking-[0.4em] font-inter font-semibold mb-4">Our Moments</p>
            <h1 className="font-playfair text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6">
              <span className="text-gold">Gallery</span>
            </h1>
            <p className="font-inter text-white/40 text-lg max-w-2xl">
              A glimpse into our world — performances, classes, events, and costumes that define XDC.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Filters */}
      <section className="pb-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <AnimatedSection>
            <div className="flex flex-wrap gap-2 border-b border-white/[0.06] pb-8">
              {galleryCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`px-5 py-2 text-xs uppercase tracking-[0.2em] font-inter transition-all duration-300 border ${
                    activeFilter === cat
                      ? 'bg-gold/10 border-gold/30 text-gold'
                      : 'border-white/[0.06] text-white/40 hover:text-white hover:border-white/20'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Gallery Grid - Masonry style */}
      <section className="pb-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {filtered.map((img, i) => (
              <AnimatedSection key={img.id} delay={i * 50}>
                <div
                  className="group relative overflow-hidden cursor-pointer break-inside-avoid"
                  onClick={() => setLightboxImage(img)}
                >
                  <img
                    src={img.src}
                    alt={img.caption}
                    className="w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-[#050505]/0 group-hover:bg-[#050505]/60 transition-all duration-500 flex flex-col items-center justify-center">
                    <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0 mb-2" />
                    <p className="font-inter text-white text-sm opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                      {img.caption}
                    </p>
                    <Badge className="mt-2 bg-gold/20 text-gold/80 border-none rounded-none text-[9px] uppercase tracking-[0.15em] font-inter opacity-0 group-hover:opacity-100 transition-all duration-500 hover:bg-gold/20">
                      {img.category}
                    </Badge>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="font-inter text-white/30 text-lg">No images in this category yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-[#050505]/95 backdrop-blur-xl flex items-center justify-center p-6"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors duration-300"
            onClick={() => setLightboxImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          <div className="max-w-4xl max-h-[80vh] relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImage.src}
              alt={lightboxImage.caption}
              className="max-w-full max-h-[75vh] object-contain"
            />
            <div className="mt-4 text-center">
              <p className="font-inter text-white text-sm">{lightboxImage.caption}</p>
              <p className="font-inter text-gold/50 text-xs uppercase tracking-wider mt-1">{lightboxImage.category}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
