import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Music, Home, Clapperboard, Heart, PartyPopper, Building2, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { danceServices, services } from '../data/mock';

const danceIconMap = { Music, Home, Clapperboard, Heart, PartyPopper, Building2 };

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

export default function AllServicesPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
              From costume rentals to dance classes, event choreography to corporate workshops — XDC is your complete performance partner.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Dance Services */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <AnimatedSection>
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px flex-1 bg-gradient-to-r from-gold/20 to-transparent" />
              <h2 className="font-playfair text-2xl font-bold text-gold">Dance & Choreography</h2>
              <div className="h-px flex-1 bg-gradient-to-l from-gold/20 to-transparent" />
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {danceServices.map((service, i) => {
              const Icon = danceIconMap[service.icon];
              return (
                <AnimatedSection key={service.id} delay={i * 80}>
                  <Card className="group overflow-hidden bg-transparent border-white/[0.06] rounded-none hover:border-gold/20 transition-all duration-500 h-full flex flex-col">
                    <div className="relative overflow-hidden h-48">
                      <img
                        src={service.image}
                        alt={service.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/30 to-transparent" />
                      <div className="absolute bottom-4 left-4">
                        <div className="w-10 h-10 bg-[#050505]/60 backdrop-blur-md border border-gold/20 flex items-center justify-center">
                          {Icon && <Icon className="w-4 h-4 text-gold" />}
                        </div>
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="font-playfair text-xl font-bold text-white mb-2 group-hover:text-gold transition-colors duration-300">
                        {service.title}
                      </h3>
                      <p className="font-inter text-white/35 text-sm leading-relaxed mb-3 flex-1">
                        {service.description}
                      </p>
                      <div className="flex items-center gap-2 mb-5">
                        <Users className="w-3 h-3 text-gold/40" />
                        <span className="font-inter text-white/25 text-xs">{service.forWhom}</span>
                      </div>
                      <Link to="/book">
                        <Button className="bg-gold/10 hover:bg-gold/20 text-gold border border-gold/20 hover:border-gold/40 font-inter text-[10px] uppercase tracking-[0.15em] px-5 py-2.5 rounded-none transition-all duration-300 w-full group/btn">
                          Enquire Now
                          <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover/btn:translate-x-0.5 transition-transform duration-300" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* Costume Services */}
      <section className="py-24 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <AnimatedSection>
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px flex-1 bg-gradient-to-r from-gold/20 to-transparent" />
              <h2 className="font-playfair text-2xl font-bold text-gold">Costume Rentals</h2>
              <div className="h-px flex-1 bg-gradient-to-l from-gold/20 to-transparent" />
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, i) => (
              <AnimatedSection key={service.id} delay={i * 100}>
                <Card className="bg-white/[0.02] border-white/[0.06] rounded-none p-8 hover:border-gold/15 transition-all duration-500 group">
                  <Badge className="bg-gold/10 text-gold border-gold/20 rounded-none text-[9px] uppercase tracking-[0.2em] font-inter mb-4 hover:bg-gold/10">
                    0{i + 1}
                  </Badge>
                  <h3 className="font-playfair text-2xl font-bold text-white mb-3 group-hover:text-gold transition-colors duration-300">
                    {service.title}
                  </h3>
                  <p className="font-inter text-white/35 text-sm leading-relaxed mb-5">
                    {service.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {service.features.map((feat) => (
                      <span key={feat} className="px-3 py-1 bg-white/[0.03] border border-white/[0.06] text-white/40 text-xs font-inter">
                        {feat}
                      </span>
                    ))}
                  </div>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-gold/[0.02] to-transparent" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <AnimatedSection>
            <div className="text-center">
              <h2 className="font-playfair text-4xl sm:text-5xl font-bold text-white mb-6">
                Need Something <span className="text-gold">Custom?</span>
              </h2>
              <p className="font-inter text-white/40 text-lg max-w-xl mx-auto mb-10">
                We tailor every service to your unique needs. Let's discuss your vision.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link to="/book">
                  <Button className="bg-gold hover:bg-gold-light text-[#050505] font-inter text-xs uppercase tracking-[0.15em] px-10 py-6 rounded-none font-semibold transition-all duration-300 hover:shadow-[0_0_40px_rgba(201,169,110,0.3)] group">
                    Get a Quote
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </Link>
                <a href="https://wa.me/919074345925" target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="outline"
                    className="border-white/10 text-white/60 hover:bg-white/5 hover:border-gold/30 hover:text-gold font-inter text-xs uppercase tracking-[0.15em] px-10 py-6 rounded-none transition-all duration-300"
                  >
                    WhatsApp Us
                  </Button>
                </a>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </main>
  );
}
