import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, KeyRound, Info, CheckCircle2, ArrowRight, Lock, LogOut, PlusCircle } from 'lucide-react';

interface RoleActionBannerProps {
  onNavigateTab: (tab: string) => void;
}

export const RoleActionBanner: React.FC<RoleActionBannerProps> = ({ onNavigateTab }) => {
  const { 
    role, 
    setShowOfficialModal, 
    unlockOperator, 
    lockOperator, 
    isOperatorUnlocked 
  } = useApp();

  const [isQuickLoginOpen, setIsQuickLoginOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const handleQuickLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = unlockOperator(pinInput);
    if (success) {
      setPinError(false);
      setPinInput('');
      setIsQuickLoginOpen(false);
    } else {
      setPinError(true);
    }
  };

  if (role === 'operator') {
    return (
      <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-800 text-amber-300 rounded-lg shadow-2xs shrink-0 mt-0.5">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  Operator Internal Aktif
                </span>
                <span className="text-stone-300">·</span>
                <h3 className="font-bold text-sm text-stone-900">
                  Dinas Pangan & Pertanian Kabupaten Bangka
                </h3>
              </div>
              <p className="text-xs text-stone-600 mt-1 max-w-3xl leading-relaxed">
                Anda memiliki hak penginputan data petak lahan tani, kebutuhan pupuk subsidi, hasil ubinan & timbangan panen, serta pelaporan susut hasil pasca panen.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={() => onNavigateTab('lahan')}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>Input Data Lahan</span>
            </button>
            <button
              onClick={() => onNavigateTab('pupuk')}
              className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-lg transition-colors cursor-pointer"
            >
              <span>Kebutuhan Pupuk</span>
            </button>
            <button
              onClick={() => onNavigateTab('produksi')}
              className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-lg transition-colors cursor-pointer"
            >
              <span>Input Ubinan</span>
            </button>
            <button
              onClick={lockOperator}
              className="px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              title="Keluar dari sesi Operator"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Public Role (Default)
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-stone-100 text-stone-600 rounded-lg shadow-2xs shrink-0 mt-0.5 border border-stone-200">
            <Info className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                Mode Publik (Hanya Baca)
              </span>
              <span className="text-stone-300">·</span>
              <h3 className="font-bold text-sm text-stone-900">
                Sistem Informasi Pertanian Terbuka Kab. Bangka
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-1 max-w-3xl leading-relaxed">
              Seluruh data spasial lahan, kebutuhan pupuk, dan monitoring produksi disajikan untuk transparansi publik dan kelompok tani. Penginputan dan pengubahan data dikhususkan untuk <strong>Operator Internal Dinas</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isQuickLoginOpen ? (
            <button
              onClick={() => setIsQuickLoginOpen(true)}
              className="px-3.5 py-1.5 text-xs font-medium text-stone-700 bg-stone-50 hover:bg-stone-100 hover:text-stone-900 border border-stone-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-stone-500" />
              <span>Petugas / Operator Internal</span>
            </button>
          ) : (
            <form onSubmit={handleQuickLogin} className="flex items-center gap-2">
              <input
                type="password"
                value={pinInput}
                onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
                placeholder="PIN (2026)"
                autoFocus
                className={`w-24 px-2 py-1 text-xs font-mono tracking-widest bg-stone-50 border rounded-lg focus:outline-emerald-700 ${
                  pinError ? 'border-rose-500 bg-rose-50' : 'border-stone-300'
                }`}
              />
              <button
                type="submit"
                className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer"
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => { setIsQuickLoginOpen(false); setPinError(false); setPinInput(''); }}
                className="px-2 py-1 text-xs text-stone-500 hover:text-stone-700 cursor-pointer"
              >
                Batal
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
