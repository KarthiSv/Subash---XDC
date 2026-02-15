import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone as PhoneIcon, Mail, Instagram, ArrowUpRight } from 'lucide-react';
import { Separator } from './ui/separator';

export const Footer = () => {
  return (
    <footer className="bg-[#050505] border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-20 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block mb-6">
              <span className="font-playfair text-3xl font-bold text-white">
                X<span className="text-gold">DC</span>
              </span>
            </Link>
            <p className="text-white/40 text-sm leading-relaxed font-inter mb-6">
              India's premier dance costume rental service. 3,000+ costumes, pan-India delivery. Dressing performers for the spotlight since 2015.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://www.instagram.com/xstatic_dance_costumes/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-gold hover:border-gold/40 transition-all duration-300"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.3em] text-gold/80 font-inter font-semibold mb-6">
              Navigate
            </h4>
            <ul className="space-y-3">
              {[
                { label: 'Home', to: '/' },
                { label: 'Costumes', to: '/costumes' },
                { label: 'Dance Classes', to: '/dance-classes' },
                { label: 'Services', to: '/services' },
                { label: 'Gallery', to: '/gallery' },
                { label: 'Book Now', to: '/book' },
                { label: 'Contact', to: '/contact' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="text-white/40 hover:text-white text-sm font-inter transition-colors duration-300 flex items-center gap-1 group"
                  >
                    {item.label}
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all duration-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.3em] text-gold/80 font-inter font-semibold mb-6">
              Services
            </h4>
            <ul className="space-y-3">
              {['Costume Rentals', 'Annual Day Packages', 'Makeup Services', 'Accessories', 'Bulk Orders'].map((item) => (
                <li key={item}>
                  <span className="text-white/40 text-sm font-inter">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.3em] text-gold/80 font-inter font-semibold mb-6">
              Get in Touch
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gold/60 mt-0.5 flex-shrink-0" />
                <span className="text-white/40 text-sm font-inter leading-relaxed">
                  Koramangala, Bangalore<br />Karnataka, India
                </span>
              </li>
              <li className="flex items-center gap-3">
                <PhoneIcon className="w-4 h-4 text-gold/60 flex-shrink-0" />
                <a href="tel:+919876543210" className="text-white/40 hover:text-white text-sm font-inter transition-colors duration-300">
                  +91 98765 43210
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gold/60 flex-shrink-0" />
                <a href="mailto:xstaticdance@gmail.com" className="text-white/40 hover:text-white text-sm font-inter transition-colors duration-300">
                  xstaticdance@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-10 bg-white/[0.06]" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/25 text-xs font-inter">
            &copy; {new Date().getFullYear()} Xstatic Dance Costumes. All rights reserved.
          </p>
          <p className="text-white/25 text-xs font-inter">
            Crafted with passion in Bangalore
          </p>
        </div>
      </div>
    </footer>
  );
};
