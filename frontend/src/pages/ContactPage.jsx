import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, Send, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
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

const contactInfo = [
  {
    icon: MapPin,
    title: 'Visit Us',
    details: ['Koramangala, Bangalore', 'Karnataka 560034, India'],
  },
  {
    icon: Phone,
    title: 'Call / WhatsApp',
    details: ['+91 98765 43210', 'DM us on Instagram for quick replies'],
  },
  {
    icon: Mail,
    title: 'Email Us',
    details: ['xstaticdance@gmail.com', 'bookings@xstaticdance.in'],
  },
  {
    icon: Clock,
    title: 'Working Hours',
    details: ['Mon - Sat: 10:00 AM - 7:00 PM', 'Peak Season: Oct – Mar (book early!)'],
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventType: '',
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
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setIsSubmitting(true);
    // Mock submission
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast.success('Thank you! We\'ll get back to you within 24 hours.');
    setFormData({ name: '', email: '', phone: '', eventType: '', message: '' });
    setIsSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-[#050505] pt-28">
      {/* Header */}
      <section className="py-20 relative">
        <div className="absolute top-0 left-1/3 w-[400px] h-[300px] bg-gold/[0.04] rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <AnimatedSection>
            <p className="text-gold text-[11px] uppercase tracking-[0.4em] font-inter font-semibold mb-4">Book With Us</p>
            <h1 className="font-playfair text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6">
              Get in <span className="text-gold">Touch</span>
            </h1>
            <p className="font-inter text-white/40 text-lg max-w-2xl">
              Have an event coming up? Need costumes for your next performance? Drop us a message and we'll create a custom package just for you.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Contact Content */}
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
                      <Label className="text-white/50 text-xs uppercase tracking-[0.15em] font-inter">Email *</Label>
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        className="bg-white/[0.03] border-white/[0.08] text-white rounded-none font-inter text-sm placeholder:text-white/20 focus:border-gold/40 focus:ring-0 py-6 transition-colors duration-300"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-white/50 text-xs uppercase tracking-[0.15em] font-inter">Phone</Label>
                      <Input
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                        className="bg-white/[0.03] border-white/[0.08] text-white rounded-none font-inter text-sm placeholder:text-white/20 focus:border-gold/40 focus:ring-0 py-6 transition-colors duration-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/50 text-xs uppercase tracking-[0.15em] font-inter">Event Type</Label>
                      <Input
                        name="eventType"
                        value={formData.eventType}
                        onChange={handleChange}
                        placeholder="e.g. School Annual Day"
                        className="bg-white/[0.03] border-white/[0.08] text-white rounded-none font-inter text-sm placeholder:text-white/20 focus:border-gold/40 focus:ring-0 py-6 transition-colors duration-300"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/50 text-xs uppercase tracking-[0.15em] font-inter">Message *</Label>
                    <Textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us about your event, number of costumes needed, dance styles, dates..."
                      rows={6}
                      className="bg-white/[0.03] border-white/[0.08] text-white rounded-none font-inter text-sm placeholder:text-white/20 focus:border-gold/40 focus:ring-0 resize-none transition-colors duration-300"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gold hover:bg-gold-light text-[#050505] font-inter text-xs uppercase tracking-[0.15em] px-10 py-6 rounded-none font-semibold transition-all duration-300 hover:shadow-[0_0_40px_rgba(201,169,110,0.3)] disabled:opacity-50 group w-full sm:w-auto"
                  >
                    {isSubmitting ? (
                      'Sending...'
                    ) : (
                      <>
                        Send Message
                        <Send className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                      </>
                    )}
                  </Button>
                </form>
              </AnimatedSection>
            </div>

            {/* Contact Info */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {contactInfo.map((info, i) => (
                  <AnimatedSection key={info.title} delay={i * 100}>
                    <Card className="bg-white/[0.02] border-white/[0.06] rounded-none p-6 hover:border-gold/15 transition-all duration-500 group">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 border border-gold/20 flex items-center justify-center flex-shrink-0 group-hover:border-gold/40 group-hover:bg-gold/5 transition-all duration-500">
                          <info.icon className="w-4 h-4 text-gold/70" />
                        </div>
                        <div>
                          <h3 className="font-inter text-white text-sm font-semibold mb-2">{info.title}</h3>
                          {info.details.map((detail) => (
                            <p key={detail} className="font-inter text-white/35 text-sm leading-relaxed">
                              {detail}
                            </p>
                          ))}
                        </div>
                      </div>
                    </Card>
                  </AnimatedSection>
                ))}
              </div>

              <AnimatedSection delay={400}>
                <div className="mt-8 p-6 bg-gold/[0.05] border border-gold/10">
                  <p className="font-playfair text-lg font-bold text-gold mb-2">Quick Response</p>
                  <p className="font-inter text-white/40 text-sm leading-relaxed">
                    We typically respond within 2-4 hours during business hours. For urgent requirements, call us directly.
                  </p>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
