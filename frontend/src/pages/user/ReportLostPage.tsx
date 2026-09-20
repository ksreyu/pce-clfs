import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useDarkMode } from '../../context/DarkModeContext';
import { CATEGORIES, LOCATIONS } from '../../lib/utils';

export default function ReportLostPage() {
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', category: '', description: '', date: '', time: '',
    location: '', color: '', brand: '', model: '', identifyingFeatures: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.category || !form.description || !form.date || !form.location) {
      toast.error('Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('category', form.category);
      formData.append('description', form.description);
      formData.append('date', new Date(form.date).toISOString());
      if (form.time) formData.append('time', form.time);
      formData.append('location', form.location);
      if (form.color) formData.append('color', form.color);
      if (form.brand) formData.append('brand', form.brand);
      if (form.model) formData.append('model', form.model);
      if (form.identifyingFeatures) formData.append('identifyingFeatures', form.identifyingFeatures);
      if (imageFile) formData.append('image', imageFile);

      await api.createLostItem(formData);
      toast.success('Lost item reported successfully! We will notify you if a match is found.');
      navigate('/my-items');
    } catch (err: any) {
      toast.error(err.message || 'Failed to report item');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition ${
    darkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'
  }`;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
          <Search className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Report Lost Item</h1>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Help us find your lost belongings</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={`rounded-xl shadow-sm p-6 space-y-6 transition-colors ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100'}`}>
        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Item Name *</label>
          <input name="name" value={form.name} onChange={handleChange} required
            className={inputClass}
            placeholder="e.g., Black Dell Laptop" />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Category *</label>
          <select name="category" value={form.category} onChange={handleChange} required className={inputClass}>
            <option value="">Select category</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Description *</label>
          <textarea name="description" value={form.description} onChange={handleChange} required rows={3}
            className={inputClass}
            placeholder="Describe the item in detail (color, condition, any unique marks...)" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Date Lost *</label>
            <input name="date" type="date" value={form.date} onChange={handleChange} required className={inputClass} />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Approximate Time</label>
            <input name="time" type="time" value={form.time} onChange={handleChange} className={inputClass} />
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Location Lost *</label>
          <select name="location" value={form.location} onChange={handleChange} required className={inputClass}>
            <option value="">Select campus location</option>
            {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Color</label>
            <input name="color" value={form.color} onChange={handleChange} className={inputClass} placeholder="e.g., Black" />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Brand</label>
            <input name="brand" value={form.brand} onChange={handleChange} className={inputClass} placeholder="e.g., Dell" />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Model</label>
            <input name="model" value={form.model} onChange={handleChange} className={inputClass} placeholder="e.g., Inspiron 15" />
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Identifying Features</label>
          <textarea name="identifyingFeatures" value={form.identifyingFeatures} onChange={handleChange} rows={2}
            className={inputClass}
            placeholder="Scratches, stickers, engravings, unique marks..." />
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Photo (Optional)</label>
          {imagePreview ? (
            <div className="relative inline-block">
              <img src={imagePreview} alt="Preview" className="h-32 w-32 object-cover rounded-lg" />
              <button type="button" onClick={removeImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className={`flex items-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer transition ${
              darkMode ? 'border-gray-600 hover:border-primary-500' : 'border-gray-300 hover:border-primary-400'
            }`}>
              <Upload className="h-5 w-5 text-gray-400" />
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Click to upload image</span>
              <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
            </label>
          )}
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-95">
          {loading ? 'Submitting...' : 'Report Lost Item'}
        </button>
      </form>
    </div>
  );
}
