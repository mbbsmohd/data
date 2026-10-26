import React, { useState, useEffect } from 'react';
import { Palette, Check, Sparkles, X, Globe } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../services/api';

export interface ThemeOption {
  id: string;
  name: string;
  primary: string;
  accent: string;
  description: string;
}

export const THEME_PRESETS: ThemeOption[] = [
  {
    id: 'cobalt-emerald',
    name: 'Electric Cobalt & Mint',
    primary: '#1E5BF9',
    accent: '#10B981',
    description: 'Crisp FinTech contrast with high-trust cobalt and fresh mint highlights.'
  },
  {
    id: 'indigo-cyan',
    name: 'Royal Indigo & Cyan',
    primary: '#4F46E5',
    accent: '#06B6D4',
    description: 'Modern developer AI aesthetic with indigo surfaces and vibrant cyan accents.'
  },
  {
    id: 'emerald-teal',
    name: 'Deep Emerald & Teal',
    primary: '#059669',
    accent: '#0D9488',
    description: 'Clean organic financial theme with deep pine and rich teal tones.'
  },
  {
    id: 'violet-purple',
    name: 'Electric Violet & Fuchsia',
    primary: '#7C3AED',
    accent: '#A855F7',
    description: 'Bold luxury tech styling with ultra-modern violet gradient hues.'
  },
  {
    id: 'ocean-sky',
    name: 'Ocean Cobalt & Sky',
    primary: '#0284C7',
    accent: '#38BDF8',
    description: 'Vibrant telecommunication blue and clear sky highlights.'
  },
  {
    id: 'crimson-amber',
    name: 'Crimson Rose & Amber',
    primary: '#E11D48',
    accent: '#F59E0B',
    description: 'Energetic merchant palette with crimson urgency and warm amber badges.'
  }
];

export function applyTheme(primary: string, accent: string) {
  document.documentElement.style.setProperty('--primary-color', primary);
  document.documentElement.style.setProperty('--accent-color', accent);
}

export const ThemeSwitcher: React.FC<{
  user?: any;
  onThemeChanged?: () => void;
}> = ({ user, onThemeChanged }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeThemeId, setActiveThemeId] = useState('cobalt-emerald');
  const [savingDefault, setSavingDefault] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('bds_selected_theme') || localStorage.getItem('abk_selected_theme');
    if (saved) {
      const match = THEME_PRESETS.find(t => t.id === saved);
      if (match) {
        setActiveThemeId(match.id);
        applyTheme(match.primary, match.accent);
      }
    }
  }, []);

  const handleSelectTheme = (t: ThemeOption) => {
    setActiveThemeId(t.id);
    localStorage.setItem('bds_selected_theme', t.id);
    localStorage.setItem('abk_selected_theme', t.id);
    applyTheme(t.primary, t.accent);
    if (onThemeChanged) onThemeChanged();
  };

  const handleSaveAsDefault = async (t: ThemeOption) => {
    setSavingDefault(true);
    try {
      await api.updateSettings({
        primaryColor: t.primary,
        accentColor: t.accent
      });
      Swal.fire({
        icon: 'success',
        title: 'Platform Theme Updated',
        text: `${t.name} is now the default theme for all users across the platform.`,
        confirmButtonColor: t.primary
      });
      setIsOpen(false);
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'Failed to update theme', text: err.message });
    } finally {
      setSavingDefault(false);
    }
  };

  const isAdmin = user && (user.role === 'super_admin' || user.role === 'sub_admin');

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2.5 bg-white border border-slate-200/90 rounded-2xl text-slate-700 hover:bg-slate-50 transition shadow-sm flex items-center space-x-1.5 text-xs font-bold"
        title="Customize Color Theme"
      >
        <Palette className="w-4 h-4 text-blue-600" />
        <span className="hidden sm:inline">Theme</span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl relative space-y-5">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <Palette className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">System Color Palette</h3>
                <p className="text-xs text-slate-500">Curated 2-color high-contrast themes</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {THEME_PRESETS.map(t => {
                const isSelected = activeThemeId === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTheme(t)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-slate-900">{t.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                    </div>

                    {/* Color Swatch Circles */}
                    <div className="flex items-center space-x-2 mb-2">
                      <div
                        className="w-7 h-7 rounded-xl shadow-sm border border-black/10 flex items-center justify-center text-[10px] text-white font-bold"
                        style={{ backgroundColor: t.primary }}
                      >
                        P
                      </div>
                      <div
                        className="w-7 h-7 rounded-xl shadow-sm border border-black/10 flex items-center justify-center text-[10px] text-white font-bold"
                        style={{ backgroundColor: t.accent }}
                      >
                        A
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-snug">{t.description}</p>

                    {isAdmin && isSelected && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleSaveAsDefault(t);
                        }}
                        disabled={savingDefault}
                        className="mt-3 w-full bg-slate-900 hover:bg-black text-white text-[10px] font-bold py-1.5 rounded-lg transition flex items-center justify-center space-x-1"
                      >
                        <Globe className="w-3 h-3" />
                        <span>{savingDefault ? 'Saving...' : 'Set as System Default'}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs text-slate-400 font-medium">
              <span>Theme applies instantly across all application screens.</span>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
