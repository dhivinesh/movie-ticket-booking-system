import React, { useState } from 'react';
import { X, Film, Info, Clock, Globe, Star, Image as ImageIcon } from 'lucide-react';
import api from '../lib/axios';
import toast from 'react-hot-toast';

export default function AddMovieModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    genre: '',
    duration: '',
    description: '',
    poster_url: '',
    language: 'English',
    rating: '0.0'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/movies', formData);
      toast.success(`Movie "${formData.title}" added to global catalog!`);
      setFormData({
        title: '',
        genre: '',
        duration: '',
        description: '',
        poster_url: '',
        language: 'English',
        rating: '0.0'
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add movie.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-[slideUp_0.3s_ease-out] max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Film size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Add New Movie to Catalog</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <Film size={16} className="text-gray-400" /> Title
              </label>
              <input
                required
                placeholder="e.g. Inception"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition"
              />
            </div>

            {/* Genre */}
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <Info size={16} className="text-gray-400" /> Genre
              </label>
              <input
                required
                placeholder="e.g. Sci-Fi, Action"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition"
              />
            </div>

            {/* Duration */}
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <Clock size={16} className="text-gray-400" /> Duration (mins)
              </label>
              <input
                required
                type="number"
                min="1"
                placeholder="e.g. 148"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition"
              />
            </div>

            {/* Language */}
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <Globe size={16} className="text-gray-400" /> Language
              </label>
              <input
                required
                placeholder="e.g. English"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition"
              />
            </div>

            {/* Rating */}
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <Star size={16} className="text-gray-400" /> IMDB Rating
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                placeholder="e.g. 8.8"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition"
              />
            </div>

            {/* Poster URL */}
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                <ImageIcon size={16} className="text-gray-400" /> Poster URL
              </label>
              <input
                placeholder="https://image.tmdb.org/..."
                value={formData.poster_url}
                onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <Info size={16} className="text-gray-400" /> Synopsis / Description
            </label>
            <textarea
              rows="3"
              placeholder="Provide a brief summary of the movie..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none"
            ></textarea>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg disabled:bg-indigo-400 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Adding to Catalog...
                </>
              ) : (
                'Add Movie to Catalog'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
