import React, { useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import axios from 'axios';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Plus, Pencil, Trash2, Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

export default function CrudManager({ entityName, apiPath, fields }) {
  const { authHeaders, API } = useAdmin();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get(`${API}${apiPath}`);
      setItems(res.data);
    } catch (e) {
      toast.error(`Failed to load ${entityName}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    const empty = {};
    fields.forEach((f) => (empty[f.key] = ''));
    setForm(empty);
    setEditing(null);
  };

  const startNew = () => {
    resetForm();
    setEditing('new');
  };

  const startEdit = (item) => {
    const data = {};
    fields.forEach((f) => (data[f.key] = item[f.key] || ''));
    setForm(data);
    setEditing(item.id);
  };

  const handleSave = async () => {
    const requiredFields = fields.filter((f) => f.required);
    for (const f of requiredFields) {
      if (!form[f.key]) {
        toast.error(`${f.label} is required`);
        return;
      }
    }
    setSaving(true);
    try {
      if (editing === 'new') {
        await axios.post(`${API}/admin${apiPath}`, form, authHeaders());
        toast.success(`${entityName} created!`);
      } else {
        await axios.put(`${API}/admin${apiPath}/${editing}`, form, authHeaders());
        toast.success(`${entityName} updated!`);
      }
      resetForm();
      fetchItems();
    } catch (e) {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete this ${entityName.toLowerCase()}?`)) return;
    try {
      await axios.delete(`${API}/admin${apiPath}/${id}`, authHeaders());
      setItems(items.filter((i) => i.id !== id));
      toast.success('Deleted');
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-gold animate-spin" /></div>;
  }

  return (
    <div className="max-w-4xl">
      {/* Add/Edit Form */}
      {editing && (
        <Card className="bg-white/[0.02] border-gold/10 rounded-none p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-inter text-white text-sm font-semibold">
              {editing === 'new' ? `Add ${entityName}` : `Edit ${entityName}`}
            </h3>
            <button onClick={resetForm} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((f) => (
              <div key={f.key} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
                <Label className="text-white/40 text-xs uppercase tracking-wider font-inter mb-1 block">{f.label}</Label>
                {f.type === 'textarea' ? (
                  <Textarea
                    value={form[f.key] || ''}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    rows={3}
                    className="bg-white/[0.03] border-white/[0.08] text-white rounded-none font-inter text-sm focus:border-gold/40 focus:ring-0 resize-none"
                  />
                ) : (
                  <Input
                    value={form[f.key] || ''}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder || ''}
                    className="bg-white/[0.03] border-white/[0.08] text-white rounded-none font-inter text-sm focus:border-gold/40 focus:ring-0"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gold hover:bg-gold-light text-[#050505] rounded-none font-inter text-xs uppercase tracking-wider disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
              {editing === 'new' ? 'Create' : 'Update'}
            </Button>
            <Button onClick={resetForm} variant="outline" className="border-white/[0.06] text-white/40 rounded-none font-inter text-xs">
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Header + Add button */}
      {!editing && (
        <div className="flex items-center justify-between mb-6">
          <p className="font-inter text-white/30 text-sm">{items.length} {entityName.toLowerCase()}(s) found</p>
          <Button onClick={startNew} className="bg-gold hover:bg-gold-light text-[#050505] rounded-none font-inter text-xs uppercase tracking-wider">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add {entityName}
          </Button>
        </div>
      )}

      {/* Item List */}
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id} className="bg-white/[0.02] border-white/[0.06] rounded-none p-4 flex items-center gap-4 hover:border-gold/10 transition-all duration-200">
            {item.image && (
              <img src={item.image} alt={item.name || item.title} className="w-14 h-14 object-cover flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-inter text-white text-sm font-semibold truncate">{item.name || item.title}</p>
              <p className="font-inter text-white/30 text-xs truncate">{item.description || item.category || ''}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => startEdit(item)} className="text-white/30 hover:text-gold transition-colors p-1.5 border border-white/[0.06] hover:border-gold/20">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => handleDelete(item.id)} className="text-white/30 hover:text-red-400 transition-colors p-1.5 border border-white/[0.06] hover:border-red-400/20">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </Card>
        ))}
        {items.length === 0 && (
          <div className="text-center py-16">
            <p className="font-inter text-white/20 text-sm">No {entityName.toLowerCase()}s yet. Click "Add" to create your first.</p>
          </div>
        )}
      </div>
    </div>
  );
}
