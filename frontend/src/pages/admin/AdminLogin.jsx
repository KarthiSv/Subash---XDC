import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card } from '../../components/ui/card';
import { Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAdmin();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6">
      <Card className="w-full max-w-md bg-[#0a0a0a] border-white/[0.06] rounded-none p-8">
        <div className="text-center mb-8">
          <span className="font-playfair text-3xl font-bold text-white">
            X<span className="text-gold">DC</span>
          </span>
          <p className="text-white/30 text-sm font-inter mt-2">Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-white/50 text-xs uppercase tracking-[0.15em] font-inter">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@xdc.in"
                className="bg-white/[0.03] border-white/[0.08] text-white rounded-none font-inter text-sm pl-10 placeholder:text-white/20 focus:border-gold/40 focus:ring-0 py-5"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-white/50 text-xs uppercase tracking-[0.15em] font-inter">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="bg-white/[0.03] border-white/[0.08] text-white rounded-none font-inter text-sm pl-10 placeholder:text-white/20 focus:border-gold/40 focus:ring-0 py-5"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-gold hover:bg-gold-light text-[#050505] font-inter text-xs uppercase tracking-[0.15em] px-8 py-5 rounded-none font-semibold transition-all duration-300 w-full disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="text-white/15 text-xs font-inter text-center mt-6">
          Authorized personnel only
        </p>
      </Card>
    </div>
  );
}
