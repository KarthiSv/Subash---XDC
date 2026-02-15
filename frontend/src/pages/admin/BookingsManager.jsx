import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import axios from 'axios';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Loader2, Phone, Mail, Calendar, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function BookingsManager() {
  const { authHeaders, API } = useAdmin();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${API}/admin/bookings`, authHeaders());
      setBookings(res.data);
    } catch (e) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const markReviewed = async (id) => {
    try {
      await axios.put(`${API}/admin/bookings/${id}/status?status=reviewed`, {}, authHeaders());
      setBookings(bookings.map((b) => (b.id === id ? { ...b, status: 'reviewed' } : b)));
      toast.success('Marked as reviewed');
    } catch (e) {
      toast.error('Failed to update');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-gold animate-spin" /></div>;
  }

  return (
    <div className="max-w-4xl">
      <p className="font-inter text-white/30 text-sm mb-6">{bookings.length} booking(s) received</p>

      {bookings.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <p className="font-inter text-white/20 text-sm">No bookings yet. They'll appear here when someone fills the booking form.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="bg-white/[0.02] border-white/[0.06] rounded-none p-5 hover:border-gold/10 transition-all duration-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-inter text-white text-sm font-semibold">{booking.name}</h3>
                    <Badge className={`rounded-none text-[9px] uppercase tracking-wider font-inter border-none hover:bg-transparent ${
                      booking.status === 'new' ? 'bg-gold/10 text-gold' : 'bg-green-500/10 text-green-400'
                    }`}>
                      {booking.status}
                    </Badge>
                  </div>
                  <Badge className="bg-white/5 text-white/50 border-none rounded-none text-[9px] uppercase tracking-wider font-inter mb-3 hover:bg-white/5">
                    {booking.service_type}
                  </Badge>
                  {booking.message && (
                    <p className="font-inter text-white/30 text-sm leading-relaxed mb-3">{booking.message}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-white/25 text-xs font-inter">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{booking.phone}</span>
                    {booking.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{booking.email}</span>}
                  </div>
                </div>
                {booking.status === 'new' && (
                  <Button
                    onClick={() => markReviewed(booking.id)}
                    className="bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-none font-inter text-[10px] uppercase tracking-wider flex-shrink-0"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Mark Reviewed
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
