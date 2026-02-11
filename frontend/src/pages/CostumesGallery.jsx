import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, ArrowUpRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { galleryCostumes, galleryFilters } from '../data/mock';

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

export default function CostumesGallery() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filteredCostumes = galleryCostumes.filter((costume) => {
    const matchesFilter = activeFilter === 'All' || costume.category === activeFilter;
    const matchesSearch = costume.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      costume.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-[#050505] pt-28">
      {/* Page Header */}
      <section className="py-20 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gold/[0.04] rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <AnimatedSection>
            <p className="text-gold text-[11px] uppercase tracking-[0.4em] font-inter font-semibold mb-4">Our Collection</p>
            <h1 className="font-playfair text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6">
              Costume <span className="text-gold">Gallery</span>
            </h1>
            <p className="font-inter text-white/40 text-lg max-w-2xl">
              Browse our extensive collection of professionally maintained dance costumes. Each piece is curated for stage-ready performance.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Filters */}
      <section className="pb-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <AnimatedSection>
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between border-b border-white/[0.06] pb-8">
              <div className="flex flex-wrap gap-2">
                {galleryFilters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-5 py-2 text-xs uppercase tracking-[0.2em] font-inter transition-all duration-300 border ${
                      activeFilter === filter
                        ? 'bg-gold/10 border-gold/30 text-gold'
                        : 'border-white/[0.06] text-white/40 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  placeholder="Search costumes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/[0.03] border-white/[0.06] text-white pl-10 rounded-none font-inter text-sm placeholder:text-white/20 focus:border-gold/30 focus:ring-0"
                />
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="pb-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {filteredCostumes.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-inter text-white/30 text-lg">No costumes found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCostumes.map((costume, i) => (
                <AnimatedSection key={costume.id} delay={i * 60}>
                  <Card className="group overflow-hidden bg-transparent border-white/[0.06] rounded-none hover:border-gold/20 transition-all duration-500 cursor-pointer">
                    <div className="relative overflow-hidden aspect-[4/5]">
                      <img
                        src={costume.image}
                        alt={costume.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/80 via-transparent to-transparent" />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-[#050505]/60 text-white/70 border-none rounded-none text-[10px] uppercase tracking-[0.15em] font-inter backdrop-blur-md hover:bg-[#050505]/60">
                          {costume.category}
                        </Badge>
                      </div>
                      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                        <div className="w-10 h-10 bg-gold flex items-center justify-center">
                          <ArrowUpRight className="w-5 h-5 text-[#050505]" />
                        </div>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-playfair text-lg font-bold text-white mb-1 group-hover:text-gold transition-colors duration-300">
                        {costume.name}
                      </h3>
                      <p className="font-inter text-gold/60 text-sm">{costume.price}</p>
                    </div>
                  </Card>
                </AnimatedSection>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
