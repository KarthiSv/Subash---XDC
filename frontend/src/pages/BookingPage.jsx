import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, Send, MessageCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { contactDetails } from '../data/mock';
import { toast } from 'sonner';

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

const serviceOptions = [
  "Dance Class Enquiry",
  "Costume Rental",
  "Sangeet Choreography",
  "Event Choreography",
  "Wedding Performance",
  "Corporate Workshop",
  "Annual Day Package",
  "Apartment / Community Classes",
  "Other"
];

export default function BookingPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    serviceType: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.serviceType) {
      toast.error('Please fill in Name, Phone, and Service Type.');
      return;
    }
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast.success('Booking request sent! We\'ll get back to you within 24 hours.');
    setFormData({ name: '', email: '', phone: '', serviceType: '', message: '' });
    setIsSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-[#050505] pt-28">
      {/* Header */}
      <section className="py-20 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gold/[0.04] rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <AnimatedSection>
            <p className="text-gold text-[11px] uppercase tracking-[0.4em] font-inter font-semibold mb-4">Book With Us</p>
            <h1 className="font-playfair text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6">
              Book <span className="text-gold">Now</span>
            </h1>
            <p className="font-inter text-white/40 text-lg max-w-2xl">
              Whether it's dance classes, costume rentals, or event choreography — fill in the form and we'll create a custom plan for you.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Booking Content */}
      <section className="pb-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
            {/* Form */}
            <div className="lg:col-span-3">
              <AnimatedSection>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-white/50 text-xs uppercase tracking-[0.15em] font-inter">Name *</Label>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        className="bg-white/[0.03] border-white/[0.08] text-white rounded-none font-inter text-sm placeholder:text-white/20 focus:border-gold/40 focus:ring-0 py-6 transition-colors duration-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/50 text-xs uppercase tracking-[0.15em] font-inter">Phone *</Label>
                      <Input
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 90743 45925"
                        className="bg-white/[0.03] border-white/[0.08] text-white rounded-none font-inter text-sm placeholder:text-white/20 focus:border-gold/40 focus:ring-0 py-6 transition-colors duration-300"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-white/50 text-xs uppercase tracking-[0.15em] font-inter">Email</Label>
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        className="bg-white/[0.03] border-white/[0.08] text-white rounded-none font-inter text-sm placeholder:text-white/20 focus:border-gold/40 focus:ring-0 py-6 transition-colors duration-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/50 text-xs uppercase tracking-[0.15em] font-inter">Service Type *</Label>
                      <select
                        name="serviceType"
                        value={formData.serviceType}
                        onChange={handleChange}
                        className="w-full bg-white/[0.03] border border-white/[0.08] text-white rounded-none font-inter text-sm py-3 px-3 focus:border-gold/40 focus:ring-0 focus:outline-none transition-colors duration-300 appearance-none"
                      >
                        <option value="" className="bg-[#111]" disabled>Select a service</option>
                        {serviceOptions.map((opt) => (
                          <option key={opt} value={opt} className="bg-[#111]">{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/50 text-xs uppercase tracking-[0.15em] font-inter">Message</Label>
                    <Textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us about your requirements — event date, number of people, dance style preference, costume needs..."
                      rows={5}
                      className="bg-white/[0.03] border-white/[0.08] text-white rounded-none font-inter text-sm placeholder:text-white/20 focus:border-gold/40 focus:ring-0 resize-none transition-colors duration-300"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gold hover:bg-gold-light text-[#050505] font-inter text-xs uppercase tracking-[0.15em] px-10 py-6 rounded-none font-semibold transition-all duration-300 hover:shadow-[0_0_40px_rgba(201,169,110,0.3)] disabled:opacity-50 group w-full sm:w-auto"
                  >
                    {isSubmitting ? 'Sending...' : (
                      <>
                        Submit Booking Request
                        <Send className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                      </>
                    )}
                  </Button>
                </form>
              </AnimatedSection>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                <AnimatedSection>
                  <Card className="bg-white/[0.02] border-white/[0.06] rounded-none p-6 hover:border-gold/15 transition-all duration-500">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-4 h-4 text-gold/70" />
                      </div>
                      <div>
                        <h3 className="font-inter text-white text-sm font-semibold mb-2">WhatsApp Quick Contact</h3>
                        <p className="font-inter text-white/35 text-sm mb-3">Get instant replies on WhatsApp</p>
                        <a
                          href="https://wa.me/919074345925"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] px-4 py-2 text-xs font-inter uppercase tracking-wider hover:bg-[#25D366]/20 transition-all duration-300"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Chat on WhatsApp
                        </a>
                      </div>
                    </div>
                  </Card>
                </AnimatedSection>

                <AnimatedSection delay={100}>
                  <Card className="bg-white/[0.02] border-white/[0.06] rounded-none p-6 hover:border-gold/15 transition-all duration-500">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-gold/70" />
                      </div>
                      <div>
                        <h3 className="font-inter text-white text-sm font-semibold mb-1">Call Us</h3>
                        <a href="tel:+919074345925" className="font-inter text-white/40 text-sm hover:text-white transition-colors duration-300">
                          +91 {contactDetails.phone}
                        </a>
                      </div>
                    </div>
                  </Card>
                </AnimatedSection>

                <AnimatedSection delay={200}>
                  <Card className="bg-white/[0.02] border-white/[0.06] rounded-none p-6 hover:border-gold/15 transition-all duration-500">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-gold/70" />
                      </div>
                      <div>
                        <h3 className="font-inter text-white text-sm font-semibold mb-1">Email Us</h3>
                        <a href={`mailto:${contactDetails.email}`} className="font-inter text-white/40 text-sm hover:text-white transition-colors duration-300">
                          {contactDetails.email}
                        </a>
                      </div>
                    </div>
                  </Card>
                </AnimatedSection>

                <AnimatedSection delay={300}>
                  <Card className="bg-white/[0.02] border-white/[0.06] rounded-none p-6 hover:border-gold/15 transition-all duration-500">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-gold/70" />
                      </div>
                      <div>
                        <h3 className="font-inter text-white text-sm font-semibold mb-1">Visit Us</h3>
                        <p className="font-inter text-white/35 text-sm">{contactDetails.address}</p>
                        <p className="font-inter text-white/35 text-sm">{contactDetails.addressLine2}</p>
                      </div>
                    </div>
                  </Card>
                </AnimatedSection>

                <AnimatedSection delay={400}>
                  <div className="p-6 bg-gold/[0.05] border border-gold/10">
                    <p className="font-playfair text-lg font-bold text-gold mb-2">Quick Response</p>
                    <p className="font-inter text-white/40 text-sm leading-relaxed">
                      We typically respond within 2-4 hours during business hours. For urgent requirements, call or WhatsApp us directly.
                    </p>
                  </div>
                </AnimatedSection>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
