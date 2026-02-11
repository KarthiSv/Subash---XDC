import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Heart, Sparkles, GraduationCap, Palette, Crown, Shirt, MapPin, Award, MessageCircle, CheckCircle, Shield, ArrowUpRight, Play } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { costumeCategories, whyChooseUs, testimonials, instagramPosts, stats } from '../data/mock';

const iconMap = {
  Sparkles, GraduationCap, Palette, Crown, Shirt, MapPin, Award, MessageCircle, CheckCircle, Shield
};

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

const HeroSection = () => {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setLoaded(true); }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1758670335648-8277bcf1b9df?w=1920&h=1080&fit=crop)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/90 to-[#050505]/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/40" />
      </div>

      {/* Decorative elements */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-gold/3 rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full pt-32 pb-20">
        <div className="max-w-3xl">
          <div
            className={`transition-all duration-1000 delay-300 ${
              loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <Badge className="bg-gold/10 text-gold border-gold/20 rounded-none px-4 py-1.5 text-[10px] uppercase tracking-[0.3em] font-inter mb-8 hover:bg-gold/10">
              Bangalore's Premier Costume House
            </Badge>
          </div>

          <h1
            className={`font-playfair text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold text-white leading-[1.05] mb-8 transition-all duration-1000 delay-500 ${
              loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Dress the<br />
            <span className="text-gold">Performance.</span><br />
            Own the Stage.
          </h1>

          <p
            className={`font-inter text-white/50 text-lg sm:text-xl leading-relaxed max-w-xl mb-12 transition-all duration-1000 delay-700 ${
              loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Premium dance costume rentals for schools, colleges, academies & events. 3,000+ costumes across every genre, delivered to your doorstep pan-India.
          </p>

          <div
            className={`flex flex-wrap gap-4 transition-all duration-1000 delay-900 ${
              loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <Link to="/costumes">
              <Button className="bg-gold hover:bg-gold-light text-[#050505] font-inter text-xs uppercase tracking-[0.15em] px-8 py-6 rounded-none font-semibold transition-all duration-300 hover:shadow-[0_0_40px_rgba(201,169,110,0.3)] group">
                Explore Collection
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/5 hover:border-white/40 font-inter text-xs uppercase tracking-[0.15em] px-8 py-6 rounded-none transition-all duration-300"
              >
                Book Consultation
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div
          className={`mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-white/[0.06] pt-10 transition-all duration-1000 delay-[1100ms] ${
            loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="font-playfair text-3xl sm:text-4xl font-bold text-gold mb-1">{stat.value}</p>
              <p className="text-white/30 text-xs uppercase tracking-[0.2em] font-inter">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CategoriesSection = () => (
  <section className="py-32 bg-[#050505] relative">
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <AnimatedSection>
        <p className="text-gold text-[11px] uppercase tracking-[0.4em] font-inter font-semibold mb-4">Our Collection</p>
        <h2 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
          Costume <span className="text-gold">Categories</span>
        </h2>
        <p className="font-inter text-white/40 text-lg max-w-2xl mb-16">
          From classical grace to contemporary flair — find the perfect costume for every performance style.
        </p>
      </AnimatedSection>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {costumeCategories.map((cat, i) => (
          <AnimatedSection key={cat.id} delay={i * 100}>
            <Link to="/costumes">
              <Card className="group relative overflow-hidden bg-transparent border-white/[0.06] rounded-none cursor-pointer h-[420px] hover:border-gold/20 transition-all duration-500">
                <div className="absolute inset-0">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
                </div>
                <div className="relative z-10 h-full flex flex-col justify-end p-6">
                  <Badge className="bg-white/10 text-white/70 border-none rounded-none text-[10px] uppercase tracking-[0.2em] font-inter w-fit mb-3 backdrop-blur-sm hover:bg-white/10">
                    {cat.tag}
                  </Badge>
                  <h3 className="font-playfair text-2xl font-bold text-white mb-2 group-hover:text-gold transition-colors duration-300">
                    {cat.name}
                  </h3>
                  <p className="font-inter text-white/40 text-sm leading-relaxed mb-3">
                    {cat.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-gold/60 text-xs font-inter uppercase tracking-wider">
                      {cat.count} costumes
                    </span>
                    <ArrowUpRight className="w-5 h-5 text-white/30 group-hover:text-gold group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                  </div>
                </div>
              </Card>
            </Link>
          </AnimatedSection>
        ))}
      </div>

      <AnimatedSection className="mt-12 text-center">
        <Link to="/costumes">
          <Button
            variant="outline"
            className="border-white/10 text-white/60 hover:bg-white/5 hover:border-gold/30 hover:text-gold font-inter text-xs uppercase tracking-[0.15em] px-8 py-5 rounded-none transition-all duration-300 group"
          >
            View Full Collection
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
        </Link>
      </AnimatedSection>
    </div>
  </section>
);

const WhyChooseSection = () => (
  <section className="py-32 bg-[#0a0a0a] relative">
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <AnimatedSection>
        <div className="text-center mb-20">
          <p className="text-gold text-[11px] uppercase tracking-[0.4em] font-inter font-semibold mb-4">Why XDC</p>
          <h2 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Why Choose <span className="text-gold">Us</span>
          </h2>
          <p className="font-inter text-white/40 text-lg max-w-2xl mx-auto">
            We don't just rent costumes — we craft complete performance experiences.
          </p>
        </div>
      </AnimatedSection>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.04]">
        {whyChooseUs.map((item, i) => {
          const Icon = iconMap[item.icon];
          return (
            <AnimatedSection key={item.id} delay={i * 80}>
              <div className="bg-[#0a0a0a] p-10 group hover:bg-[#0f0f0f] transition-all duration-500 h-full">
                <div className="w-12 h-12 border border-gold/20 flex items-center justify-center mb-6 group-hover:border-gold/50 group-hover:bg-gold/5 transition-all duration-500">
                  {Icon && <Icon className="w-5 h-5 text-gold/70" />}
                </div>
                <h3 className="font-playfair text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="font-inter text-white/35 text-sm leading-relaxed">{item.description}</p>
              </div>
            </AnimatedSection>
          );
        })}
      </div>
    </div>
  </section>
);

const TestimonialsSection = () => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-32 bg-[#050505] relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-gold/3 rounded-full blur-[150px] -translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <AnimatedSection>
          <p className="text-gold text-[11px] uppercase tracking-[0.4em] font-inter font-semibold mb-4">Testimonials</p>
          <h2 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-16">
            What Our <span className="text-gold">Partners</span> Say
          </h2>
        </AnimatedSection>

        <AnimatedSection>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="min-h-[280px]">
              {testimonials.map((t, i) => (
                <div
                  key={t.id}
                  className={`transition-all duration-700 absolute max-w-xl ${
                    i === active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                  }`}
                  style={{ position: i === active ? 'relative' : 'absolute' }}
                >
                  <div className="flex gap-1 mb-6">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-gold fill-gold" />
                    ))}
                  </div>
                  <p className="font-inter text-white/60 text-lg leading-relaxed mb-8 italic">
                    "{t.content}"
                  </p>
                  <div>
                    <p className="font-playfair text-lg font-bold text-white">{t.name}</p>
                    <p className="font-inter text-gold/60 text-sm">{t.role}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`transition-all duration-300 ${
                    i === active
                      ? 'w-10 h-1 bg-gold'
                      : 'w-6 h-1 bg-white/15 hover:bg-white/30'
                  }`}
                  aria-label={`View testimonial ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

const CTASection = () => (
  <section className="py-32 bg-[#0a0a0a] relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-gold/[0.03] to-transparent" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/[0.04] rounded-full blur-[150px]" />

    <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
      <AnimatedSection>
        <div className="text-center">
          <p className="text-gold text-[11px] uppercase tracking-[0.4em] font-inter font-semibold mb-6">Ready to Perform?</p>
          <h2 className="font-playfair text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-8 leading-tight">
            Let's Dress Your<br />
            <span className="text-gold">Next Performance</span>
          </h2>
          <p className="font-inter text-white/40 text-lg max-w-2xl mx-auto mb-12">
            Whether it's a school annual day, a college fest, or a dance recital — we've got the perfect costumes waiting for you.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/contact">
              <Button className="bg-gold hover:bg-gold-light text-[#050505] font-inter text-xs uppercase tracking-[0.15em] px-10 py-6 rounded-none font-semibold transition-all duration-300 hover:shadow-[0_0_50px_rgba(201,169,110,0.25)] group">
                Get a Quote
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </Link>
            <Link to="/costumes">
              <Button
                variant="outline"
                className="border-white/10 text-white/60 hover:bg-white/5 hover:border-gold/30 hover:text-gold font-inter text-xs uppercase tracking-[0.15em] px-10 py-6 rounded-none transition-all duration-300"
              >
                Browse Costumes
              </Button>
            </Link>
          </div>
        </div>
      </AnimatedSection>
    </div>
  </section>
);

const InstagramSection = () => (
  <section className="py-24 bg-[#050505] relative">
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <AnimatedSection>
        <div className="text-center mb-12">
          <p className="text-gold text-[11px] uppercase tracking-[0.4em] font-inter font-semibold mb-4">Follow Us</p>
          <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-white">
            @xstatic_dance_costumes
          </h2>
          <p className="font-inter text-white/30 text-sm mt-2">15K+ followers · Costume showcases, rental tips & event highlights</p>
        </div>
      </AnimatedSection>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {instagramPosts.map((post, i) => (
          <AnimatedSection key={post.id} delay={i * 60}>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden aspect-square block"
            >
              <img
                src={post.image}
                alt="Instagram post"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-[#050505]/0 group-hover:bg-[#050505]/60 transition-all duration-500 flex items-center justify-center">
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                  <Heart className="w-4 h-4 text-white" />
                  <span className="text-white text-sm font-inter">{post.likes}</span>
                </div>
              </div>
            </a>
          </AnimatedSection>
        ))}
      </div>
    </div>
  </section>
);

export default function HomePage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main>
      <HeroSection />
      <CategoriesSection />
      <WhyChooseSection />
      <TestimonialsSection />
      <CTASection />
      <InstagramSection />
    </main>
  );
}
