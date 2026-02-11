import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Quote } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { teamMembers, stats } from '../data/mock';

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

export default function AboutPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] pt-28">
      {/* Header */}
      <section className="py-20 relative">
        <div className="absolute top-0 right-1/4 w-[400px] h-[300px] bg-gold/[0.04] rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <AnimatedSection>
            <p className="text-gold text-[11px] uppercase tracking-[0.4em] font-inter font-semibold mb-4">Our Story</p>
            <h1 className="font-playfair text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6">
              About <span className="text-gold">XDC</span>
            </h1>
            <p className="font-inter text-white/40 text-lg max-w-2xl">
              Born from a passion for dance and a love for performance culture, Xstatic Dance Costumes has been Bangalore's trusted costume partner since 2015.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Story Section */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <AnimatedSection>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="relative">
                <div className="relative overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1547106510-6aec13ee41ff?w=800&h=600&fit=crop"
                    alt="XDC Studio"
                    className="w-full h-[500px] object-cover"
                  />
                  <div className="absolute inset-0 border border-white/[0.06]" />
                </div>
                <div className="absolute -bottom-6 -right-6 w-48 h-48 border border-gold/20 hidden lg:block" />
              </div>
              <div>
                <Quote className="w-10 h-10 text-gold/30 mb-6" />
                <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-white mb-6">
                  Where Performance<br />Meets <span className="text-gold">Perfection</span>
                </h2>
                <div className="space-y-4">
                  <p className="font-inter text-white/40 leading-relaxed">
                    What started as a small collection of classical dance costumes in Koramangala has grown into India's most comprehensive dance costume rental service. Our founder, Kavitha Suresh, a lifelong dancer herself, understood a simple truth — when a performer looks extraordinary, they feel extraordinary.
                  </p>
                  <p className="font-inter text-white/40 leading-relaxed">
                    Today, XDC houses over 500 meticulously curated costumes spanning Bharatanatyam, Kathak, Bollywood, contemporary, folk, and hip-hop. We've dressed performers for over 1,200 events and partnered with 200+ institutions across India.
                  </p>
                  <p className="font-inter text-white/40 leading-relaxed">
                    Every costume in our collection is more than just an outfit — it's a statement. Professionally maintained, authentically designed, and stage-ready, our pieces are crafted to elevate every performance.
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <AnimatedSection>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <div key={stat.label} className="text-center">
                  <p className="font-playfair text-4xl sm:text-5xl font-bold text-gold mb-2">{stat.value}</p>
                  <p className="text-white/30 text-xs uppercase tracking-[0.25em] font-inter">{stat.label}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Team */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <AnimatedSection>
            <p className="text-gold text-[11px] uppercase tracking-[0.4em] font-inter font-semibold mb-4">The People</p>
            <h2 className="font-playfair text-4xl sm:text-5xl font-bold text-white mb-16">
              Meet the <span className="text-gold">Team</span>
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member, i) => (
              <AnimatedSection key={member.id} delay={i * 100}>
                <Card className="bg-transparent border-white/[0.06] rounded-none p-8 hover:border-gold/20 transition-all duration-500 group">
                  <div className="w-16 h-16 bg-gold/10 border border-gold/20 flex items-center justify-center mb-6">
                    <span className="font-playfair text-xl font-bold text-gold">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <h3 className="font-playfair text-xl font-bold text-white mb-1 group-hover:text-gold transition-colors duration-300">
                    {member.name}
                  </h3>
                  <p className="text-gold/60 text-xs uppercase tracking-[0.2em] font-inter mb-4">
                    {member.role}
                  </p>
                  <Separator className="bg-white/[0.06] mb-4" />
                  <p className="font-inter text-white/35 text-sm leading-relaxed">
                    {member.bio}
                  </p>
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
                Ready to Work <span className="text-gold">Together?</span>
              </h2>
              <p className="font-inter text-white/40 text-lg max-w-xl mx-auto mb-10">
                We'd love to be part of your next event. Let's create something unforgettable.
              </p>
              <Link to="/contact">
                <Button className="bg-gold hover:bg-gold-light text-[#050505] font-inter text-xs uppercase tracking-[0.15em] px-10 py-6 rounded-none font-semibold transition-all duration-300 hover:shadow-[0_0_40px_rgba(201,169,110,0.3)] group">
                  Get in Touch
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </main>
  );
}
