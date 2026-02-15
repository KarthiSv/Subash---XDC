import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import axios from 'axios';
import { Card } from '../../components/ui/card';
import { Music, Shirt, Image, Calendar, FileText, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboardHome() {
  const { authHeaders, API } = useAdmin();
  const [stats, setStats] = useState({ classes: 0, services: 0, costumes: 0, gallery: 0, bookings: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [classes, services, costumes, gallery, bookings] = await Promise.all([
          axios.get(`${API}/dance-classes`),
          axios.get(`${API}/dance-services`),
          axios.get(`${API}/costumes`),
          axios.get(`${API}/gallery`),
          axios.get(`${API}/admin/bookings`, authHeaders()),
        ]);
        setStats({
          classes: classes.data.length,
          services: services.data.length,
          costumes: costumes.data.length,
          gallery: gallery.data.length,
          bookings: bookings.data.length,
        });
      } catch (e) {
        console.error(e);
      }
    };
    fetchStats();
  }, [API, authHeaders]);

  const cards = [
    { label: 'Dance Classes', value: stats.classes, icon: Music, path: '/admin/dashboard/classes', color: 'text-gold' },
    { label: 'Dance Services', value: stats.services, icon: Sparkles, path: '/admin/dashboard/services', color: 'text-gold' },
    { label: 'Costumes', value: stats.costumes, icon: Shirt, path: '/admin/dashboard/costumes', color: 'text-gold' },
    { label: 'Gallery Images', value: stats.gallery, icon: Image, path: '/admin/dashboard/gallery', color: 'text-gold' },
    { label: 'Bookings', value: stats.bookings, icon: Calendar, path: '/admin/dashboard/bookings', color: 'text-gold' },
    { label: 'Content Blocks', value: '11', icon: FileText, path: '/admin/dashboard/content', color: 'text-gold' },
  ];

  return (
    <div>
      <h2 className="font-playfair text-2xl font-bold text-white mb-6">Welcome to XDC Admin</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} to={card.path}>
              <Card className="bg-white/[0.02] border-white/[0.06] rounded-none p-6 hover:border-gold/20 transition-all duration-300 cursor-pointer group">
                <div className="flex items-center justify-between mb-4">
                  <Icon className={`w-5 h-5 ${card.color} opacity-60`} />
                  <span className="font-playfair text-3xl font-bold text-white group-hover:text-gold transition-colors">
                    {card.value}
                  </span>
                </div>
                <p className="font-inter text-white/40 text-sm">{card.label}</p>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="bg-gold/[0.05] border-gold/10 rounded-none p-6 mt-8">
        <h3 className="font-playfair text-lg font-bold text-gold mb-2">Quick Start Guide</h3>
        <ul className="space-y-2 font-inter text-white/40 text-sm">
          <li>1. Use <strong className="text-white/60">Site Content</strong> to edit homepage text, contact info, and announcements</li>
          <li>2. Manage your <strong className="text-white/60">Gallery</strong> by uploading photos organized by category</li>
          <li>3. Add or edit <strong className="text-white/60">Dance Classes</strong>, <strong className="text-white/60">Services</strong>, and <strong className="text-white/60">Costumes</strong></li>
          <li>4. Check <strong className="text-white/60">Bookings</strong> for new enquiries from your website</li>
          <li>5. All changes go live instantly after saving!</li>
        </ul>
      </Card>
    </div>
  );
}
