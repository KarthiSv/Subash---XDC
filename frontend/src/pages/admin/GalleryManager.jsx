import React, { useState, useEffect, useRef } from 'react';
import { useAdmin } from '../../context/AdminContext';
import axios from 'axios';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Upload, Trash2, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['Performances', 'Classes', 'Events', 'Costumes', 'General'];

export default function GalleryManager() {
  const { authHeaders, API } = useAdmin();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('All');
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('General');
  const fileRef = useRef(null);

  useEffect(() => { fetchImages(); }, []);

  const fetchImages = async () => {
    try {
      const res = await axios.get(`${API}/gallery`);
      setImages(res.data);
    } catch (e) {
      toast.error('Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caption', caption || file.name);
      formData.append('category', category);
      await axios.post(`${API}/admin/gallery/upload`, formData, {
        ...authHeaders(),
        headers: { ...authHeaders().headers, 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Image uploaded!');
      setCaption('');
      fetchImages();
    } catch (e) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this image?')) return;
    try {
      await axios.delete(`${API}/admin/gallery/${id}`, authHeaders());
      setImages(images.filter((i) => i.id !== id));
      toast.success('Image deleted');
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  const filtered = filter === 'All' ? images : images.filter((i) => i.category === filter);
  const backendBase = process.env.REACT_APP_BACKEND_URL;

  return (
    <div>
      {/* Upload Area */}
      <Card className="bg-white/[0.02] border-white/[0.06] rounded-none p-6 mb-8">
        <h3 className="font-inter text-white text-sm font-semibold mb-4">Upload New Image</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-white/40 text-xs font-inter block mb-1">Caption</label>
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Image caption"
              className="bg-white/[0.03] border-white/[0.08] text-white rounded-none font-inter text-sm placeholder:text-white/20 focus:border-gold/40 focus:ring-0"
            />
          </div>
          <div>
            <label className="text-white/40 text-xs font-inter block mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/[0.08] text-white rounded-none font-inter text-sm py-2 px-3 focus:border-gold/40 focus:ring-0 focus:outline-none"
            >
              {CATEGORIES.map((c) => <option key={c} value={c} className="bg-[#111]">{c}</option>)}
            </select>
          </div>
          <div>
            <input type="file" accept="image/*" ref={fileRef} onChange={handleUpload} className="hidden" />
            <Button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="bg-gold hover:bg-gold-light text-[#050505] rounded-none font-inter text-xs uppercase tracking-wider w-full disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['All', ...CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-4 py-1.5 text-xs uppercase tracking-wider font-inter border transition-all duration-200 ${
              filter === c ? 'bg-gold/10 border-gold/30 text-gold' : 'border-white/[0.06] text-white/40 hover:text-white'
            }`}
          >
            {c} {c !== 'All' && `(${images.filter(i => i.category === c).length})`}
          </button>
        ))}
      </div>

      {/* Image Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-gold animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <ImageIcon className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <p className="font-inter text-white/30 text-sm">No images yet. Upload your first image above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((img) => (
            <div key={img.id} className="group relative overflow-hidden border border-white/[0.06] hover:border-gold/20 transition-all duration-300">
              <img
                src={img.src.startsWith('/api') ? `${backendBase}${img.src}` : img.src}
                alt={img.caption}
                className="w-full aspect-square object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-[#050505]/0 group-hover:bg-[#050505]/70 transition-all duration-300 flex flex-col items-center justify-center">
                <button
                  onClick={() => handleDelete(img.id)}
                  className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-red-500/20 border border-red-500/30 text-red-400 p-2 hover:bg-red-500/30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-[#050505]/90 to-transparent">
                <p className="font-inter text-white text-[10px] truncate">{img.caption}</p>
                <Badge className="mt-1 bg-white/10 text-white/50 border-none rounded-none text-[8px] uppercase hover:bg-white/10">{img.category}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
