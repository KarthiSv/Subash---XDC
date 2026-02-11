import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, GraduationCap, Palette, Crown, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { services } from '../data/mock';

const iconMap = { Sparkles, GraduationCap, Palette, Crown };

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

export default function ServicesPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const serviceImages = [
    'https://images.unsplash.com/photo-1547106500-9b566874481b?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1769694513348-7143316bd433?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1709477542170-f11ee7d471a0?w=800&h=500&fit=crop',
    'https://images.unsplash.com/photo-1763256614642-9dedc87763c7?w=800&h=500&fit=crop',
  ];

  return (
    <main className="min-h-screen bg-[#050505] pt-28">
      {/* Header */}
      <section className="py-20 relative">
        <div className="absolute top-0 left-1/4 w-[400px] h-[300px] bg-gold/[0.04] rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <AnimatedSection>
            <p className="text-gold text-[11px] uppercase tracking-[0.4em] font-inter font-semibold mb-4">What We Offer</p>
            <h1 className="font-playfair text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6">
              Our <span className="text-gold">Services</span>
            </h1>
            <p className="font-inter text-white/40 text-lg max-w-2xl">
              From costume rentals to full event styling — everything your performance needs, under one roof.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Services Grid */}
      <section className="pb-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="space-y-24">
            {services.map((service, i) => {
              const Icon = iconMap[service.icon];
              const isEven = i % 2 === 0;
              return (
                <AnimatedSection key={service.id}>
                  <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${!isEven ? 'lg:flex-row-reverse' : ''}`}>
                    <div className={isEven ? 'order-1' : 'order-1 lg:order-2'}>
                      <div className="relative overflow-hidden group">
                        <img
                          src={serviceImages[i]}
                          alt={service.title}
                          className="w-full h-[400px] object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 border border-white/[0.06] group-hover:border-gold/20 transition-all duration-500" />
                        <div className="absolute top-6 left-6">
                          <Badge className="bg-[#050505]/70 text-gold border-gold/20 rounded-none text-[10px] uppercase tracking-[0.2em] font-inter backdrop-blur-md hover:bg-[#050505]/70">
                            0{i + 1}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className={isEven ? 'order-2' : 'order-2 lg:order-1'}>
                      <div className="w-14 h-14 border border-gold/20 flex items-center justify-center mb-6">
                        {Icon && <Icon className="w-6 h-6 text-gold/70" />}
                      </div>
                      <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-white mb-4">
                        {service.title}
                      </h2>
                      <p className="font-inter text-white/40 text-base leading-relaxed mb-8">
                        {service.description}
                      </p>
                      <ul className="space-y-3 mb-8">
                        {service.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-3">
                            <Check className="w-4 h-4 text-gold/60" />
                            <span className="font-inter text-white/50 text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Link to="/contact">
                        <Button
                          variant="outline"
                          className="border-gold/20 text-gold hover:bg-gold/10 hover:border-gold/40 font-inter text-xs uppercase tracking-[0.15em] px-8 py-5 rounded-none transition-all duration-300 group"
                        >
                          Enquire Now
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
