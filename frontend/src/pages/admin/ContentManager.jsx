import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import axios from 'axios';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ContentManager() {
  const { authHeaders, API } = useAdmin();
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const res = await axios.get(`${API}/content`);
      setContent(res.data);
    } catch (e) {
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key, value) => {
    setSaving({ ...saving, [key]: true });
    try {
      await axios.put(`${API}/admin/content/${key}`, { value }, authHeaders());
      toast.success('Content saved & published!');
    } catch (e) {
      toast.error('Failed to save');
    } finally {
      setSaving({ ...saving, [key]: false });
    }
  };

  const handleChange = (key, value) => {
    setContent(content.map((c) => (c.key === key ? { ...c, value } : c)));
  };

  const sections = [...new Set(content.map((c) => c.section))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <p className="font-inter text-white/30 text-sm mb-8">
        Edit your website content below. Changes go live instantly after clicking Save.
      </p>

      {sections.map((section) => (
        <div key={section} className="mb-10">
          <Badge className="bg-gold/10 text-gold border-gold/20 rounded-none text-[9px] uppercase tracking-[0.25em] font-inter mb-4 hover:bg-gold/10">
            {section}
          </Badge>
          <div className="space-y-4">
            {content
              .filter((c) => c.section === section)
              .map((item) => (
                <Card key={item.key} className="bg-white/[0.02] border-white/[0.06] rounded-none p-5">
                  <Label className="text-white/50 text-xs uppercase tracking-[0.1em] font-inter mb-2 block">
                    {item.label || item.key}
                  </Label>
                  {item.value && item.value.length > 80 ? (
                    <Textarea
                      value={item.value}
                      onChange={(e) => handleChange(item.key, e.target.value)}
                      rows={3}
                      className="bg-white/[0.03] border-white/[0.08] text-white rounded-none font-inter text-sm placeholder:text-white/20 focus:border-gold/40 focus:ring-0 resize-none mb-3"
                    />
                  ) : (
                    <Input
                      value={item.value}
                      onChange={(e) => handleChange(item.key, e.target.value)}
                      className="bg-white/[0.03] border-white/[0.08] text-white rounded-none font-inter text-sm placeholder:text-white/20 focus:border-gold/40 focus:ring-0 mb-3"
                    />
                  )}
                  <Button
                    onClick={() => handleSave(item.key, item.value)}
                    disabled={saving[item.key]}
                    className="bg-gold/10 hover:bg-gold/20 text-gold border border-gold/20 rounded-none font-inter text-[10px] uppercase tracking-wider px-4 py-2 disabled:opacity-50"
                  >
                    {saving[item.key] ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
                    Save & Publish
                  </Button>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
