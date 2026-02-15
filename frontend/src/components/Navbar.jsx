import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone } from 'lucide-react';
import { Button } from './ui/button';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/costumes', label: 'Costumes' },
    { path: '/dance-classes', label: 'Dance Classes' },
    { path: '/services', label: 'Services' },
    { path: '/gallery', label: 'Gallery' },
    { path: '/contact', label: 'Contact' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-[#050505]/80 backdrop-blur-xl border-b border-white/[0.06] py-3'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <span className="font-playfair text-2xl font-bold text-white tracking-wide">
              X<span className="text-gold">DC</span>
            </span>
            <span className="hidden sm:block h-5 w-px bg-white/20" />
            <span className="hidden sm:block text-[11px] uppercase tracking-[0.25em] text-white/50 font-inter">
              Xstatic Dance Costumes
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-[13px] uppercase tracking-[0.2em] font-inter transition-colors duration-300 relative ${
                  isActive(link.path)
                    ? 'text-gold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {link.label}
                {isActive(link.path) && (
                  <span className="absolute -bottom-1 left-0 right-0 h-px bg-gold" />
                )}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <Link to="/book">
              <Button className="bg-gold hover:bg-gold-light text-[#050505] font-inter text-xs uppercase tracking-[0.15em] px-6 py-2.5 rounded-none font-semibold transition-all duration-300 hover:shadow-[0_0_30px_rgba(201,169,110,0.3)]">
                <Phone className="w-3.5 h-3.5 mr-2" />
                Book Now
              </Button>
            </Link>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-white/80 hover:text-gold transition-colors duration-300 p-2"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 bg-[#050505]/98 backdrop-blur-2xl transition-all duration-500 lg:hidden ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8">
          {navLinks.map((link, i) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-3xl font-playfair transition-all duration-500 ${
                isActive(link.path) ? 'text-gold' : 'text-white/70 hover:text-white'
              }`}
              style={{ transitionDelay: mobileOpen ? `${i * 80}ms` : '0ms' }}
            >
              {link.label}
            </Link>
          ))}
          <Link to="/book" className="mt-4">
            <Button className="bg-gold hover:bg-gold-light text-[#050505] font-inter text-sm uppercase tracking-[0.15em] px-8 py-3 rounded-none font-semibold">
              Book Now
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
};
