import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PlantingSchedule, KecamatanBangka, CommodityId, PlantingPhase } from '../types';
import { COMMODITIES, KECAMATAN_LIST } from '../data/bangkaData';
import { 
  evaluateCropSuitability, 
  BMKG_CLIMATE_BANGKA, 
  IrrigationType, 
  LandTopography,
  formatIndonesianDate,
  VARIETAS_BSIP_BANGKA
} from '../data/croppingCalendarData';
import { 
  Calendar, 
  CloudRain, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  ChevronRight, 
  Sliders, 
  X, 
  ShieldAlert, 
  Sparkles,
  Droplets,
  Thermometer,
  Wind,
  Layers,
  Sprout,
  Compass,
  CalendarCheck
} from 'lucide-react';

export const PlantingCalendarView: React.FC = () => {
  const { 
    plantingSchedules, 
    addPlantingSchedule, 
    updatePlantingPhase, 
    role, 
    selectedKecamatan 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'kalkulator' | 'tahunan'>('kalkulator');

  // --- Interactive Public Cropping Calendar State ---
  const [calcKomoditas, setCalcKomoditas] = useState<CommodityId>('padi_sawah');
  const [calcKecamatan, setCalcKecamatan] = useState<KecamatanBangka>('Mendo Barat');
  const [calcTanggalTanam, setCalcTanggalTanam] = useState<string>('2026-11-15');
  const [calcIrigasi, setCalcIrigasi] = useState<IrrigationType>('Irigasi Teknis');
  // Dynamic evaluation result based on inputs
  const suitabilityResult = useMemo(() => {
    return evaluateCropSuitability(
      calcKomoditas,
      calcKecamatan,
      calcTanggalTanam,
      calcIrigasi
    );
  }, [calcKomoditas, calcKecamatan, calcTanggalTanam, calcIrigasi]);

  // Current climate for selected month
  const currentMonthClimate = useMemo(() => {
    return BMKG_CLIMATE_BANGKA.find(c => c.bulanAngka === suitabilityResult.bulanTanam) || BMKG_CLIMATE_BANGKA[10];
  }, [suitabilityResult.bulanTanam]);

  // Operator Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedScheduleForEdit, setSelectedScheduleForEdit] = useState<PlantingSchedule | null>(null);

  // Operator Form states
  const [newKecamatan, setNewKecamatan] = useState<KecamatanBangka>('Mendo Barat');
  const [newKomoditas, setNewKomoditas] = useState<CommodityId>('padi_sawah');
  const [newMusimTanam, setNewMusimTanam] = useState<PlantingSchedule['musimTanam']>('MT I (Rendengan/Penghujan)');
  const [newLuasHa, setNewLuasHa] = useState<number>(350);
  const [newTanggalOlah, setNewTanggalOlah] = useState('2026-10-20');
  const [newTanggalTanam, setNewTanggalTanam] = useState('2026-11-10');
  const [newTanggalPupuk1, setNewTanggalPupuk1] = useState('2026-11-25');
  const [newTanggalPupuk2, setNewTanggalPupuk2] = useState('2026-12-30');
  const [newTanggalPanen, setNewTanggalPanen] = useState('2027-02-28');

  const filteredSchedules = plantingSchedules.filter(s => {
    return selectedKecamatan === 'Semua' || s.kecamatan === selectedKecamatan;
  });

  const PHASES: PlantingPhase[] = [
    'Persiapan Lahan',
    'Penyemaian / Penanaman',
    'Vegetatif & Pemupukan I',
    'Generatif & Pemupukan II',
    'Pengendalian OPT',
    'Menjelang Panen',
    'Panen Raya'
  ];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPlantingSchedule({
      kodeJadwal: `SCH-${newKomoditas.toUpperCase()}-${Date.now().toString().slice(-4)}`,
      kecamatan: newKecamatan,
      komoditas: newKomoditas,
      musimTanam: newMusimTanam,
      luasRencanaHa: Number(newLuasHa),
      tanggalMulaiOlah: newTanggalOlah,
      tanggalTanam: newTanggalTanam,
      tanggalPupuk1: newTanggalPupuk1,
      tanggalPupuk2: newTanggalPupuk2,
      tanggalPanenEstimasi: newTanggalPanen,
      faseSaatIni: 'Persiapan Lahan',
      progresFasePersen: 15,
      indeksKlimatologi: 'Optimal',
      rekomendasiAgroklimat: 'Kondisi kelembapan tanah mencukupi, disarankan pembersihan parit drainase.',
      peringatanOpt: ['Waspada OPT musiman pada masa awal penanaman.']
    });
    setIsModalOpen(false);
  };

  const handleUpdatePhase = (scheduleId: string, phase: PlantingPhase, progress: number) => {
    updatePlantingPhase(scheduleId, phase, progress);
    setSelectedScheduleForEdit(null);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <h2 className="text-xl font-bold text-stone-900">
              Kalender Tanam & Musim Pertanian Bangka
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Sistem peramalan agroklimatologi terintegrasi BMKG Stasiun Klimatologi Babel & standar budidaya presisi BSIP Bangka Belitung.
          </p>
        </div>

        {/* Input button strictly for Operator (hidden for public) */}
        {role === 'operator' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Buat Jadwal Musim Tanam Baru</span>
          </button>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-stone-200">
        <button
          onClick={() => setActiveTab('kalkulator')}
          className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'kalkulator'
              ? 'border-emerald-800 text-emerald-900 bg-white'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
          <span>Cek Musim Tanam Interaktif (Petani & Publik)</span>
        </button>

        <button
          onClick={() => setActiveTab('tahunan')}
          className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'tahunan'
              ? 'border-emerald-800 text-emerald-900 bg-white'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-stone-600" />
          <span>Matriks Agroklimat 12 Bulan Bangka</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: INTERACTIVE CROP CALENDAR CHECKER (DINAMIS & INTERAKTIF) */}
      {/* ======================================================== */}
      {activeTab === 'kalkulator' && (
        <div className="space-y-6">
          {/* Interactive Input Form for Public / Farmers */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Compass className="w-4 h-4 text-emerald-800" />
                  </div>
                  <h3 className="font-bold text-base text-stone-900">
                    Simulasi & Verifikasi Musim Tanam Lahan Anda
                  </h3>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Masukkan kondisi lahan dan rencana tanggal tanam Anda untuk menghasilkan jadwal budidaya harian, indeks kesesuaian iklim, dan rekomendasi varietas BSIP Babel.
                </p>
              </div>
            </div>

            {/* Inputs Grid (4 columns) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
              {/* 1. Komoditas */}
              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  1. Komoditas Tanaman:
                </label>
                <select
                  value={calcKomoditas}
                  onChange={(e) => setCalcKomoditas(e.target.value as CommodityId)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white font-medium cursor-pointer"
                >
                  {COMMODITIES.map(c => (
                    <option key={c.id} value={c.id}>{c.nama}</option>
                  ))}
                </select>
                <span className="text-[10px] text-stone-400 mt-0.5 block">5 komoditas prioritas</span>
              </div>

              {/* 2. Kecamatan */}
              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  2. Lokasi Kecamatan:
                </label>
                <select
                  value={calcKecamatan}
                  onChange={(e) => setCalcKecamatan(e.target.value as KecamatanBangka)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white font-medium cursor-pointer"
                >
                  {KECAMATAN_LIST.map(k => (
                    <option key={k.nama} value={k.nama}>{k.nama}</option>
                  ))}
                </select>
                <span className="text-[10px] text-stone-400 mt-0.5 block">Karakter agroklimat lokal</span>
              </div>

              {/* 3. Tanggal Rencana Tanam */}
              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  3. Rencana Tanggal Tanam:
                </label>
                <input
                  type="date"
                  value={calcTanggalTanam}
                  onChange={(e) => setCalcTanggalTanam(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white font-mono font-medium cursor-pointer"
                />
                <span className="text-[10px] text-stone-400 mt-0.5 block">Hari H tanam bibit / tugal</span>
              </div>

              {/* 4. Sistem Irigasi */}
              <div>
                <label className="font-semibold text-stone-700 block mb-1">
                  4. Sistem Irigasi / Air:
                </label>
                <select
                  value={calcIrigasi}
                  onChange={(e) => setCalcIrigasi(e.target.value as IrrigationType)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white font-medium cursor-pointer"
                >
                  <option value="Irigasi Teknis">Irigasi Teknis (Saluran Terjamin)</option>
                  <option value="Tadah Hujan">Tadah Hujan (Bergantung Cuaca)</option>
                  <option value="Embung / Sumur Bor">Embung / Sumur Bor (Pompa)</option>
                  <option value="Lahan Rawa / Lebak">Lahan Rawa / Lebak</option>
                </select>
                <span className="text-[10px] text-stone-400 mt-0.5 block">Faktor penentu kecukupan air</span>
              </div>
            </div>

            {/* Quick Presets for Planting Windows */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100 text-xs">
              <span className="text-stone-400 font-medium text-[11px]">Pilihan Cepat Musim:</span>
              <button
                type="button"
                onClick={() => setCalcTanggalTanam('2026-11-15')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium border cursor-pointer transition-colors ${
                  calcTanggalTanam.includes('-11-') ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' : 'bg-stone-50 text-stone-600 border-stone-200'
                }`}
              >
                MT I Rendengan (November 2026)
              </button>
              <button
                type="button"
                onClick={() => setCalcTanggalTanam('2027-04-10')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium border cursor-pointer transition-colors ${
                  calcTanggalTanam.includes('-04-') ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' : 'bg-stone-50 text-stone-600 border-stone-200'
                }`}
              >
                MT II Gadu (April 2027)
              </button>
              <button
                type="button"
                onClick={() => setCalcTanggalTanam('2027-07-05')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium border cursor-pointer transition-colors ${
                  calcTanggalTanam.includes('-07-') ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' : 'bg-stone-50 text-stone-600 border-stone-200'
                }`}
              >
                MT III Kemarau Terkendali (Juli 2027)
              </button>
            </div>
          </div>

          {/* DYNAMIC RESULTS: SUITABILITY & CLIMATE ADVISORY */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left 2 Cols: Evaluation, Score, Varietas, and Timeline */}
            <div className="lg:col-span-2 space-y-5">
              {/* Suitability Banner */}
              <div className={`rounded-xl p-5 border shadow-2xs space-y-3 ${
                suitabilityResult.skorKesesuaian >= 85 
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' 
                  : suitabilityResult.skorKesesuaian >= 60 
                  ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                  : 'bg-rose-50/80 border-rose-300 text-rose-950'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-2xs shrink-0 ${
                      suitabilityResult.skorKesesuaian >= 85 
                        ? 'bg-emerald-700 text-white' 
                        : suitabilityResult.skorKesesuaian >= 60 
                        ? 'bg-amber-600 text-white'
                        : 'bg-rose-600 text-white'
                    }`}>
                      {suitabilityResult.skorKesesuaian}%
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                        Indeks Kesesuaian Agroklimat Lahan
                      </span>
                      <h4 className="font-bold text-base sm:text-lg leading-tight">
                        {suitabilityResult.statusKesesuaian}
                      </h4>
                      <p className="text-xs opacity-90 mt-0.5">
                        {suitabilityResult.namaKomoditas} di Kec. {suitabilityResult.kecamatan} ({suitabilityResult.irigasi})
                      </p>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-bold border self-start sm:self-auto ${suitabilityResult.badgeColor}`}>
                    Bulan Tanam: {suitabilityResult.namaBulan}
                  </span>
                </div>

                <p className="text-xs leading-relaxed pt-2 border-t border-black/10">
                  <strong>Analisis Saintifik BMKG & PPL:</strong> {suitabilityResult.alasanAgroklimat}
                </p>

                {/* Varietas Rekomendasi BSIP Babel */}
                <div className="pt-2 border-t border-black/10 flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold shrink-0">Varietas Adaptif BSIP Babel:</span>
                  {suitabilityResult.varietasRekomendasi.map((v, i) => (
                    <span key={i} className="px-2 py-0.5 bg-white/90 rounded text-[11px] font-semibold border border-black/15 shadow-2xs">
                      {v}
                    </span>
                  ))}
                </div>
              </div>

              {/* Dynamic Cronological Timeline (Pipeline Tahapan dengan Tanggal Riil) */}
              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-emerald-800" />
                    <h4 className="font-bold text-sm text-stone-900">
                      Rencana Jadwal Budidaya Presisi (Dihitung Berdasarkan Tanggal Tanam Anda)
                    </h4>
                  </div>
                  <span className="text-xs font-mono font-bold text-stone-500">
                    Siklus: {suitabilityResult.totalHariBudidaya} Hari
                  </span>
                </div>

                <div className="space-y-3.5">
                  {suitabilityResult.tahapanBudidaya.map((tahap, idx) => (
                    <div 
                      key={idx} 
                      className="p-3.5 rounded-xl border border-stone-200 hover:border-emerald-700/50 bg-stone-50/60 transition-all text-xs space-y-1.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="font-bold text-stone-900 text-[13px] flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-800 text-white text-[10px] flex items-center justify-center font-mono">
                            {idx + 1}
                          </span>
                          <span>{tahap.fase}</span>
                        </div>
                        <div className="flex items-center gap-2 text-stone-500 font-mono text-[11px]">
                          <span className="px-2 py-0.5 bg-stone-200/80 rounded font-semibold text-stone-800">
                            {tahap.rentangHari}
                          </span>
                          <span className="font-bold text-emerald-800">
                            {tahap.tanggalTarget}
                          </span>
                        </div>
                      </div>

                      <div className="text-stone-700 pl-7 leading-relaxed">
                        <strong>Instruksi Lapangan:</strong> {tahap.aktivitasKunci}
                      </div>

                      <div className="text-stone-500 pl-7 text-[11px]">
                        <span className="font-semibold text-emerald-800">Dosis / Kebutuhan Nutrisi:</span> {tahap.kebutuhanNutrisi}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 1 Col: BMKG Agrometeorology Deep-Dive & Actionable Mitigation */}
            <div className="space-y-5">
              {/* Climate Snapshot for Selected Month */}
              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-stone-200 text-stone-900">
                  <CloudRain className="w-4 h-4 text-emerald-800" />
                  <h4 className="font-bold text-sm">
                    Karakteristik Cuaca Bulan {currentMonthClimate.namaBulan}
                  </h4>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-stone-50 rounded-lg border border-stone-100 flex items-center justify-between">
                    <div>
                      <span className="text-stone-500 block text-[11px]">Prediksi Curah Hujan:</span>
                      <span className="font-mono font-bold text-base text-stone-900">
                        {currentMonthClimate.curahHujanMm} <span className="text-xs font-normal">mm/bulan</span>
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {currentMonthClimate.sifatHujan}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-100">
                      <span className="text-stone-400 block text-[10px]">Hari Hujan:</span>
                      <span className="font-mono font-bold text-stone-800 text-sm">
                        {currentMonthClimate.hariHujan} Hari
                      </span>
                    </div>
                    <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-100">
                      <span className="text-stone-400 block text-[10px]">Kelembapan:</span>
                      <span className="font-mono font-bold text-stone-800 text-sm">
                        {currentMonthClimate.kelembapanPersen}% RH
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-100 text-stone-700 leading-relaxed text-[11px]">
                    <strong className="text-emerald-950 font-semibold block mb-0.5">Catatan BMKG Stasiun Klimatologi Babel:</strong>
                    {currentMonthClimate.deskripsiBMKG}
                  </div>
                </div>
              </div>

              {/* Hama Penyakit (OPT) Waspada Musiman */}
              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-stone-200 text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  <h4 className="font-bold text-sm">
                    Peringatan OPT Kritis Terkait Musim Ini
                  </h4>
                </div>

                <div className="space-y-2 text-xs">
                  {suitabilityResult.hamaPenyakitUtama.map((hama, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-950">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold block">{hama}</strong>
                        <span className="text-[11px] text-amber-800/90">
                          Pengawasan intensif pada fase pembungaan dan kelembapan ekstrem.
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Langkah Mitigasi Teknis Lapangan */}
              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-stone-200 text-stone-900">
                  <CheckCircle className="w-4 h-4 text-emerald-800" />
                  <h4 className="font-bold text-sm">
                    Rekomendasi Rekayasa Teknis Lahan
                  </h4>
                </div>

                <ul className="space-y-2 text-xs text-stone-700">
                  {suitabilityResult.mitigasiRisiko.map((m, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 shrink-0 mt-1.5" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MATRIKS AGROKLIMAT 12 BULAN KABUPATEN BANGKA */}
      {/* ======================================================== */}
      {activeTab === 'tahunan' && (
        <div className="space-y-5">
          <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 gap-2">
              <div>
                <h3 className="font-bold text-sm text-stone-900">
                  Matriks Agroklimat & Pola Musim Tanam Tahunan Kabupaten Bangka (12 Bulan)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Sumber data: BMKG Stasiun Klimatologi Kepulauan Bangka Belitung & Kalender Tanam Terpadu (KATAM) Kementan.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> MT I Rendengan
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> MT II Gadu
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> MT III Kemarau
                </span>
              </div>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 text-stone-700 uppercase font-semibold border-b border-stone-200 text-[11px]">
                  <tr>
                    <th className="py-3 px-3">Bulan</th>
                    <th className="py-3 px-3 text-center">Curah Hujan</th>
                    <th className="py-3 px-3 text-center">Hari Hujan</th>
                    <th className="py-3 px-3 text-center">Karakter Agroklimat</th>
                    <th className="py-3 px-3 text-center">Padi Sawah</th>
                    <th className="py-3 px-3 text-center">Padi Ladang</th>
                    <th className="py-3 px-3 text-center">Cabai Rawit / Keriting</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {BMKG_CLIMATE_BANGKA.map((b) => {
                    const isPadiSawahPrime = [10, 11, 12, 1, 2].includes(b.bulanAngka);
                    const isPadiLadangPrime = [10, 11, 12].includes(b.bulanAngka);
                    const isCabaiPrime = [3, 4, 5, 6].includes(b.bulanAngka);

                    return (
                      <tr key={b.bulanAngka} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3 px-3 font-bold text-stone-900">
                          {b.namaBulan}
                        </td>
                        <td className="py-3 px-3 text-center font-mono tabular-nums font-semibold text-stone-800">
                          {b.curahHujanMm} mm
                        </td>
                        <td className="py-3 px-3 text-center font-mono tabular-nums text-stone-600">
                          {b.hariHujan} hari
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            b.karakterIklim.includes('Rendengan') 
                              ? 'bg-emerald-100 text-emerald-800'
                              : b.karakterIklim.includes('Gadu')
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {b.karakterIklim}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isPadiSawahPrime 
                              ? 'bg-emerald-600 text-white' 
                              : [3, 4, 5].includes(b.bulanAngka)
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-100 text-stone-400'
                          }`}>
                            {isPadiSawahPrime ? 'Sangat Optimal' : [3, 4, 5].includes(b.bulanAngka) ? 'Irigasi Teknis' : 'Bera / Sayuran'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isPadiLadangPrime 
                              ? 'bg-emerald-600 text-white' 
                              : b.bulanAngka === 9
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-stone-100 text-stone-400'
                          }`}>
                            {isPadiLadangPrime ? 'Tanam Serentak' : b.bulanAngka === 9 ? 'Olah Tanah' : 'Tidak Disarankan'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCabaiPrime 
                              ? 'bg-emerald-600 text-white' 
                              : [7, 8].includes(b.bulanAngka)
                              ? 'bg-cyan-100 text-cyan-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {isCabaiPrime ? 'Optimal (Matahari Penuh)' : [7, 8].includes(b.bulanAngka) ? 'Irigasi Tetes/Kocor' : 'Bedengan Tinggi + Mulsa'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Operator Modal: Update Fase Tanam */}
      {selectedScheduleForEdit && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-bold text-stone-900 text-sm">
                Perbarui Fase Tanam ({selectedScheduleForEdit.kodeJadwal})
              </h3>
              <button 
                onClick={() => setSelectedScheduleForEdit(null)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Pilih Fase Tanam Saat Ini:</label>
                <select
                  defaultValue={selectedScheduleForEdit.faseSaatIni}
                  id="phaseSelect"
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-emerald-700"
                >
                  {PHASES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Estimasi Persentase Progres Fase (%):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={selectedScheduleForEdit.progresFasePersen}
                  id="progressInput"
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setSelectedScheduleForEdit(null)}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  const selectEl = document.getElementById('phaseSelect') as HTMLSelectElement;
                  const inputEl = document.getElementById('progressInput') as HTMLInputElement;
                  handleUpdatePhase(
                    selectedScheduleForEdit.id, 
                    selectEl.value as PlantingPhase, 
                    Number(inputEl.value) || 50
                  );
                }}
                className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Operator Modal: Buat Jadwal Musim Tanam Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 space-y-4 shadow-xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-stone-900 text-base">Buat Kalender Musim Tanam Baru</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Kecamatan Sentra *</label>
                  <select
                    value={newKecamatan}
                    onChange={(e) => setNewKecamatan(e.target.value as KecamatanBangka)}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-emerald-700 cursor-pointer"
                  >
                    {KECAMATAN_LIST.map(k => (
                      <option key={k.nama} value={k.nama}>{k.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Komoditas *</label>
                  <select
                    value={newKomoditas}
                    onChange={(e) => setNewKomoditas(e.target.value as CommodityId)}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-emerald-700 cursor-pointer"
                  >
                    {COMMODITIES.map(c => (
                      <option key={c.id} value={c.id}>{c.nama}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Periode Musim Tanam</label>
                  <select
                    value={newMusimTanam}
                    onChange={(e) => setNewMusimTanam(e.target.value as any)}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-emerald-700 cursor-pointer"
                  >
                    <option value="MT I (Rendengan/Penghujan)">MT I (Rendengan/Penghujan)</option>
                    <option value="MT II (Gadu/Transisi)">MT II (Gadu/Transisi)</option>
                    <option value="MT III (Kemarau Terkendali)">MT III (Kemarau Terkendali)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Luas Rencana Tanam (Ha)</label>
                  <input
                    type="number"
                    min="1"
                    value={newLuasHa}
                    onChange={(e) => setNewLuasHa(Number(e.target.value))}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Mulai Olah Lahan</label>
                  <input
                    type="date"
                    value={newTanggalOlah}
                    onChange={(e) => setNewTanggalOlah(e.target.value)}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Tanggal Tanam Serempak</label>
                  <input
                    type="date"
                    value={newTanggalTanam}
                    onChange={(e) => setNewTanggalTanam(e.target.value)}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Pemupukan I (Vegetatif)</label>
                  <input
                    type="date"
                    value={newTanggalPupuk1}
                    onChange={(e) => setNewTanggalPupuk1(e.target.value)}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Perkiraan Panen Raya</label>
                  <input
                    type="date"
                    value={newTanggalPanen}
                    onChange={(e) => setNewTanggalPanen(e.target.value)}
                    className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-medium cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Daftarkan Jadwal Tanam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
