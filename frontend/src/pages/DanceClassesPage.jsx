import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Users, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { danceStyles } from '../data/mock';

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

export default function DanceClassesPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] pt-28">
      {/* Header */}
      <section className="py-20 relative">
        <div className="absolute top-0 left-1/3 w-[500px] h-[300px] bg-gold/[0.04] rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <AnimatedSection>
            <p className="text-gold text-[11px] uppercase tracking-[0.4em] font-inter font-semibold mb-4">Dance Academy</p>
            <h1 className="font-playfair text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6">
              Dance <span className="text-gold">Classes</span>
            </h1>
            <p className="font-inter text-white/40 text-lg max-w-2xl">
              From classical grace to street energy — explore 10+ dance styles taught by professional instructors. All ages, all levels welcome.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Quick Info Strip */}
      <section className="bg-[#0a0a0a] border-y border-white/[0.04] py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {[
              { label: "Dance Styles", value: "10+" },
              { label: "Age Groups", value: "4 yrs – Adults" },
              { label: "Locations", value: "Studio & Home" },
              { label: "Trial Class", value: "Free" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p className="font-playfair text-2xl font-bold text-gold">{item.value}</p>
                <p className="text-white/30 text-[10px] uppercase tracking-[0.2em] font-inter mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dance Styles Grid */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {danceStyles.map((style, i) => (
              <AnimatedSection key={style.id} delay={i * 80}>
                <Card className="group overflow-hidden bg-transparent border-white/[0.06] rounded-none hover:border-gold/20 transition-all duration-500">
                  <div className="grid grid-cols-1 sm:grid-cols-2">
                    <div className="relative overflow-hidden h-56 sm:h-auto">
                      <img
                        src={style.image}
                        alt={style.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#050505]/30 sm:bg-gradient-to-r sm:from-transparent sm:to-[#0a0a0a]" />
                    </div>
                    <div className="p-6 flex flex-col justify-center">
                      <Badge className="bg-gold/10 text-gold border-gold/20 rounded-none text-[9px] uppercase tracking-[0.2em] font-inter w-fit mb-3 hover:bg-gold/10">
                        {style.level}
                      </Badge>
                      <h3 className="font-playfair text-xl font-bold text-white mb-2 group-hover:text-gold transition-colors duration-300">
                        {style.name}
                      </h3>
                      <p className="font-inter text-white/35 text-sm leading-relaxed mb-4">
                        {style.description}
                      </p>
                      <div className="flex items-center gap-2 text-white/25 text-xs font-inter mb-4">
                        <Clock className="w-3 h-3" />
                        <span>{style.schedule}</span>
                      </div>
                      <Link to="/book">
                        <Button
                          variant="outline"
                          className="border-gold/20 text-gold hover:bg-gold/10 hover:border-gold/40 font-inter text-[10px] uppercase tracking-[0.15em] px-5 py-2 rounded-none transition-all duration-300 w-fit group/btn"
                        >
                          Book Trial Class
                          <ChevronRight className="w-3.5 h-3.5 ml-1 group-hover/btn:translate-x-0.5 transition-transform duration-300" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#0a0a0a] relative">
        <div className="absolute inset-0 bg-gradient-to-t from-gold/[0.02] to-transparent" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <AnimatedSection>
            <div className="text-center">
              <h2 className="font-playfair text-4xl sm:text-5xl font-bold text-white mb-6">
                Ready to Start <span className="text-gold">Dancing?</span>
              </h2>
              <p className="font-inter text-white/40 text-lg max-w-xl mx-auto mb-10">
                Your first trial class is free. Join our community of 200+ happy dancers today.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link to="/book">
                  <Button className="bg-gold hover:bg-gold-light text-[#050505] font-inter text-xs uppercase tracking-[0.15em] px-10 py-6 rounded-none font-semibold transition-all duration-300 hover:shadow-[0_0_40px_rgba(201,169,110,0.3)] group">
                    Book a Free Trial
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
