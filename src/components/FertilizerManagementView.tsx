import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { COMMODITIES, KECAMATAN_LIST, DESA_PER_KECAMATAN } from '../data/bangkaData';
import { CommodityId, KecamatanBangka, FertilizerNeedRecord } from '../types';
import { Store, Plus, MapPin, Building2, Pencil, Trash2, X, Calculator, Sparkles, Info } from 'lucide-react';

export const FertilizerManagementView: React.FC = () => {
  const { 
    fertilizerNeeds, 
    addFertilizerNeed, 
    updateFertilizerNeed,
    deleteFertilizerNeed,
    kiosPupukList, 
    role, 
    selectedKecamatan,
    setSelectedKecamatan,
    selectedCommodity,
    setSelectedCommodity
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'kebutuhan' | 'kios'>('kebutuhan');

  // Interactive BSIP Calculator State (BSIP Babel)
  const [calcKomoditas, setCalcKomoditas] = useState<CommodityId>('padi_sawah');
  const [calcLuasHa, setCalcLuasHa] = useState<number>(1.0);
  const [calcPhTanah, setCalcPhTanah] = useState<number>(5.2);

  // Modal State for New Fertilizer Need (Operator only)
  const [isAddNeedOpen, setIsAddNeedOpen] = useState(false);
  const [editingNeed, setEditingNeed] = useState<FertilizerNeedRecord | null>(null);

  // New form fields
  const [newPoktan, setNewPoktan] = useState('');
  const [newKecamatan, setNewKecamatan] = useState<KecamatanBangka>('Mendo Barat');
  const [newDesa, setNewDesa] = useState(DESA_PER_KECAMATAN['Mendo Barat'][0]);
  const [newKomoditas, setNewKomoditas] = useState<CommodityId>('padi_sawah');
  const [newLuasHa, setNewLuasHa] = useState<number>(10.0);
  const [newKios, setNewKios] = useState('UD Sumber Rejeki Tani');
  const [newUreaKg, setNewUreaKg] = useState<number>(2000);
  const [newNpkKg, setNewNpkKg] = useState<number>(3000);
  const [newOrganikKg, setNewOrganikKg] = useState<number>(5000);
  const [newMusim, setNewMusim] = useState('MT I 2026/2027');
  const [newKeterangan, setNewKeterangan] = useState('Alokasi kebutuhan pupuk berimbang sesuai luas lahan.');

  // Edit form fields
  const [editPoktan, setEditPoktan] = useState('');
  const [editKecamatan, setEditKecamatan] = useState<KecamatanBangka>('Mendo Barat');
  const [editDesa, setEditDesa] = useState('');
  const [editKomoditas, setEditKomoditas] = useState<CommodityId>('padi_sawah');
  const [editLuasHa, setEditLuasHa] = useState<number>(10.0);
  const [editKios, setEditKios] = useState('');
  const [editUreaKg, setEditUreaKg] = useState<number>(0);
  const [editNpkKg, setEditNpkKg] = useState<number>(0);
  const [editOrganikKg, setEditOrganikKg] = useState<number>(0);
  const [editMusim, setEditMusim] = useState('');
  const [editKeterangan, setEditKeterangan] = useState('');

  const filteredNeeds = fertilizerNeeds.filter(item => {
    const matchKec = selectedKecamatan === 'Semua' || item.kecamatan === selectedKecamatan;
    const matchCom = selectedCommodity === 'semua' || item.komoditas === selectedCommodity;
    return matchKec && matchCom;
  });

  const filteredKios = kiosPupukList.filter(k => {
    return selectedKecamatan === 'Semua' || k.kecamatan === selectedKecamatan;
  });

  const totalUreaKg = filteredNeeds.reduce((a, b) => a + b.kebutuhanUreaKg, 0);
  const totalNpkKg = filteredNeeds.reduce((a, b) => a + b.kebutuhanNpkKg, 0);
  const totalOrganikKg = filteredNeeds.reduce((a, b) => a + b.kebutuhanOrganikKg, 0);

  // Dynamic calculations for BSIP recommendation
  const selectedCommInfo = COMMODITIES.find(c => c.id === calcKomoditas) || COMMODITIES[0];
  const safeLuas = Math.max(0.01, Number(calcLuasHa) || 0);
  const safePh = Math.max(3.0, Math.min(8.5, Number(calcPhTanah) || 5.0));
  // Dynamic Dolomite calculation based on soil pH (Ultisol Bangka)
  const dolomitMultiplier = safePh < 4.8 ? 1.5 : safePh < 5.5 ? 1.25 : safePh <= 6.2 ? 1.0 : 0.5;

  const recUreaKg = Math.round(selectedCommInfo.dosisPupukPerHa.ureaKg * safeLuas);
  const recNpkKg = Math.round(selectedCommInfo.dosisPupukPerHa.npkKg * safeLuas);
  const recSp36Kg = Math.round(selectedCommInfo.dosisPupukPerHa.sp36Kg * safeLuas);
  const recDolomitKg = Math.round(selectedCommInfo.dosisPupukPerHa.dolomitKg * dolomitMultiplier * safeLuas);
  const recOrganikKg = Math.round(selectedCommInfo.dosisPupukPerHa.organikKg * safeLuas);

  const handleKecamatanChange = (kec: KecamatanBangka) => {
    setNewKecamatan(kec);
    const availableDesa = DESA_PER_KECAMATAN[kec];
    if (availableDesa && availableDesa.length > 0) {
      setNewDesa(availableDesa[0]);
    }
  };

  const handleEditKecamatanChange = (kec: KecamatanBangka) => {
    setEditKecamatan(kec);
    const availableDesa = DESA_PER_KECAMATAN[kec];
    if (availableDesa && availableDesa.length > 0) {
      setEditDesa(availableDesa[0]);
    }
  };

  const handleAddNeedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPoktan) return;

    addFertilizerNeed({
      poktan: newPoktan,
      kecamatan: newKecamatan,
      desa: newDesa,
      komoditas: newKomoditas,
      luasLahanHa: Number(newLuasHa),
      kiosPenyalur: newKios,
      kebutuhanUreaKg: Number(newUreaKg),
      kebutuhanNpkKg: Number(newNpkKg),
      kebutuhanOrganikKg: Number(newOrganikKg),
      musimTanam: newMusim,
      keterangan: newKeterangan
    });

    setIsAddNeedOpen(false);
    setNewPoktan('');
  };

  const handleOpenEdit = (need: FertilizerNeedRecord) => {
    setEditingNeed(need);
    setEditPoktan(need.poktan);
    setEditKecamatan(need.kecamatan);
    setEditDesa(need.desa);
    setEditKomoditas(need.komoditas);
    setEditLuasHa(need.luasLahanHa);
    setEditKios(need.kiosPenyalur);
    setEditUreaKg(need.kebutuhanUreaKg);
    setEditNpkKg(need.kebutuhanNpkKg);
    setEditOrganikKg(need.kebutuhanOrganikKg);
    setEditMusim(need.musimTanam);
    setEditKeterangan(need.keterangan);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNeed) return;

    updateFertilizerNeed(editingNeed.id, {
      poktan: editPoktan,
      kecamatan: editKecamatan,
      desa: editDesa,
      komoditas: editKomoditas,
      luasLahanHa: Number(editLuasHa),
      kiosPenyalur: editKios,
      kebutuhanUreaKg: Number(editUreaKg),
      kebutuhanNpkKg: Number(editNpkKg),
      kebutuhanOrganikKg: Number(editOrganikKg),
      musimTanam: editMusim,
      keterangan: editKeterangan
    });

    setEditingNeed(null);
  };

  const handleDelete = (id: string, poktan: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data kebutuhan pupuk untuk "${poktan}"?`)) {
      deleteFertilizerNeed(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <h2 className="text-xl font-bold text-stone-900">
              Kebutuhan Pupuk
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Data kebutuhan pupuk bersubsidi per kelompok tani dan informasi direktori kios penyalur pupuk resmi (KPL) Kabupaten Bangka.
          </p>
        </div>

        {/* Input button strictly for Operator (hidden for public) */}
        {role === 'operator' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddNeedOpen(true)}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>Input Kebutuhan Pupuk</span>
            </button>
          </div>
        )}
      </div>

      {/* KALKULATOR REKOMENDASI PUPUK BERIMBANG & KAPUR PERTANIAN (BSIP BABEL) */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                <Calculator className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-stone-900 text-base">
                Kalkulator Rekomendasi Pupuk Berimbang & Kapur Pertanian (BSIP Babel)
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Interaktif Petani & Publik
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Hitung otomatis takaran pupuk berimbang dan penetral keasaman tanah Ultisol Bangka mengacu pada formula resmi BSIP Kepulauan Bangka Belitung.
            </p>
          </div>

          <div className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 self-start md:self-auto shrink-0">
            Standar BSIP Bangka Belitung
          </div>
        </div>

        {/* Input Form Interaktif 3 Kolom */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200/80">
          {/* 1. Pilih Komoditas */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              1. Pilih Komoditas Tanaman:
            </label>
            <select
              value={calcKomoditas}
              onChange={(e) => setCalcKomoditas(e.target.value as CommodityId)}
              className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg font-medium text-stone-900 focus:outline-emerald-700 shadow-2xs cursor-pointer"
            >
              {COMMODITIES.map(c => (
                <option key={c.id} value={c.id}>{c.nama} ({c.kategori})</option>
              ))}
            </select>
            <span className="text-[10px] text-stone-400 mt-1 block">
              Siklus budidaya: {selectedCommInfo.siklusTanamHari} hari
            </span>
          </div>

          {/* 2. Luas Lahan (Ha) */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              2. Luas Hamparan / Petak (Ha):
            </label>
            <input
              type="number"
              step="0.1"
              min="0.05"
              max="500"
              value={calcLuasHa}
              onChange={(e) => setCalcLuasHa(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg font-mono font-bold text-stone-900 focus:outline-emerald-700 shadow-2xs"
              placeholder="Contoh: 1.0"
            />
            <span className="text-[10px] text-stone-400 mt-1 block">
              Setara {(safeLuas * 10000).toLocaleString('id-ID')} m²
            </span>
          </div>

          {/* 3. pH Tanah Lahan */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-stone-700">
                3. pH Tanah Lahan:
              </label>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                safePh < 4.8 ? 'bg-rose-100 text-rose-800' :
                safePh < 5.5 ? 'bg-amber-100 text-amber-800' :
                safePh <= 6.2 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {safePh < 4.8 ? 'Sangat Masam' : safePh < 5.5 ? 'Masam' : safePh <= 6.2 ? 'Agak Masam (Ideal)' : 'Netral'}
              </span>
            </div>
            <input
              type="number"
              step="0.1"
              min="3.5"
              max="8.0"
              value={calcPhTanah}
              onChange={(e) => setCalcPhTanah(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg font-mono font-bold text-stone-900 focus:outline-emerald-700 shadow-2xs"
              placeholder="Contoh: 5.0"
            />
            <span className="text-[10px] text-stone-400 mt-1 block">
              Tanah Ultisol Bangka rata-rata pH 4.5 – 5.3
            </span>
          </div>
        </div>

        {/* 5 Kartu Hasil Rekomendasi Pupuk & Dolomit */}
        <div>
          <div className="text-xs font-bold text-stone-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>Hasil Rekomendasi Kebutuhan Pupuk & Kapur Pertanian:</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Urea */}
            <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-xl p-3.5 space-y-1">
              <div className="text-[11px] font-semibold text-emerald-950">Pupuk Urea (46% N)</div>
              <div className="text-xl font-bold font-mono text-emerald-900">
                {recUreaKg.toLocaleString('id-ID')} <span className="text-xs font-normal text-emerald-700">Kg</span>
              </div>
              <p className="text-[10px] text-emerald-800 leading-tight">
                Pertumbuhan vegetatif & pembentukan klorofil daun
              </p>
            </div>

            {/* NPK Phonska */}
            <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-xl p-3.5 space-y-1">
              <div className="text-[11px] font-semibold text-emerald-950">NPK Phonska (15-15-15)</div>
              <div className="text-xl font-bold font-mono text-emerald-900">
                {recNpkKg.toLocaleString('id-ID')} <span className="text-xs font-normal text-emerald-700">Kg</span>
              </div>
              <p className="text-[10px] text-emerald-800 leading-tight">
                Nutrisi makro berimbang daun, batang & kekuatan akar
              </p>
            </div>

            {/* SP-36 */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-1">
              <div className="text-[11px] font-semibold text-stone-800">SP-36 (Fosfat)</div>
              <div className="text-xl font-bold font-mono text-stone-900">
                {recSp36Kg.toLocaleString('id-ID')} <span className="text-xs font-normal text-stone-500">Kg</span>
              </div>
              <p className="text-[10px] text-stone-500 leading-tight">
                Merangsang perakaran awal & pembungaan serempak
              </p>
            </div>

            {/* Kapur Pertanian / Dolomit */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-1">
              <div className="text-[11px] font-semibold text-amber-950">Kapur Dolomit (Mg+Ca)</div>
              <div className="text-xl font-bold font-mono text-amber-900">
                {recDolomitKg.toLocaleString('id-ID')} <span className="text-xs font-normal text-amber-700">Kg</span>
              </div>
              <p className="text-[10px] text-amber-800 leading-tight">
                {safePh < 5.0 ? 'Kritis: Netralkan racun Al & Fe' : 'Menjaga kestabilan pH Ultisol Bangka'}
              </p>
            </div>

            {/* Pupuk Organik */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-1 col-span-2 sm:col-span-1">
              <div className="text-[11px] font-semibold text-stone-800">Pupuk Organik / Kompos</div>
              <div className="text-xl font-bold font-mono text-stone-900">
                {recOrganikKg.toLocaleString('id-ID')} <span className="text-xs font-normal text-stone-500">Kg</span>
              </div>
              <p className="text-[10px] text-stone-500 leading-tight">
                Meningkatkan C-Organik & kapasitas tukar kation tanah
              </p>
            </div>
          </div>
        </div>

        {/* Panduan Aplikasi Singkat BSIP Babel */}
        <div className="bg-emerald-50/50 border border-emerald-200/70 rounded-lg p-3 text-xs text-stone-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-950">Jadwal Aplikasi Pemupukan Berimbang BSIP Babel: </span>
              <span className="text-stone-600">
                Tabur <strong>Kapur Dolomit & Pupuk Organik</strong> 10–14 hari sebelum tanam saat olah tanah. 
                Pupuk dasar: 100% SP-36 + 30% Urea & NPK saat tanam, dilanjutkan pemupukan susulan I (21 HST) dan susulan II (42 HST).
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section Switcher Tabs */}
      <div className="flex border-b border-stone-200">
        <button
          onClick={() => setActiveSubTab('kebutuhan')}
          className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'kebutuhan'
              ? 'border-emerald-800 text-emerald-900 bg-white'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <span>Tabel Kebutuhan Pupuk Kelompok Tani</span>
          <span className="ml-1 px-1.5 py-0.2 bg-stone-100 rounded text-[10px] font-mono">
            {filteredNeeds.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('kios')}
          className={`px-4 py-2.5 text-xs font-bold transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'kios'
              ? 'border-emerald-800 text-emerald-900 bg-white'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Store className="w-3.5 h-3.5 text-stone-600" />
          <span>Informasi Kios Penyalur Resmi (KPL)</span>
          <span className="ml-1 px-1.5 py-0.2 bg-stone-100 rounded text-[10px] font-mono">
            {filteredKios.length}
          </span>
        </button>
      </div>

      {/* SUBTAB 1: TABEL KEBUTUHAN PUPUK (5 KOLOM + AKSI UNTUK OPERATOR) */}
      {activeSubTab === 'kebutuhan' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[11px] text-stone-500 mb-1">Kecamatan:</label>
                <select
                  value={selectedKecamatan}
                  onChange={(e) => setSelectedKecamatan(e.target.value as any)}
                  className="px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-800 font-medium cursor-pointer"
                >
                  <option value="Semua">Semua Kecamatan (8 Wilayah)</option>
                  {KECAMATAN_LIST.map(k => (
                    <option key={k.nama} value={k.nama}>{k.nama}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-stone-500 mb-1">Komoditas:</label>
                <select
                  value={selectedCommodity}
                  onChange={(e) => setSelectedCommodity(e.target.value as any)}
                  className="px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg text-stone-800 font-medium cursor-pointer"
                >
                  <option value="semua">Semua Komoditas (5 Pilihan)</option>
                  {COMMODITIES.map(c => (
                    <option key={c.id} value={c.id}>{c.nama}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-xs text-stone-500">
              Menampilkan <span className="font-semibold text-stone-800">{filteredNeeds.length}</span> usulan kebutuhan kelompok tani
            </div>
          </div>

          {/* TABLE WITH 5 CORE COLUMNS + OPERATOR ACTIONS */}
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 text-stone-700 uppercase font-semibold border-b border-stone-200 text-[11px]">
                  <tr>
                    <th className="py-3 px-4">
                      <div>Kelompok Tani</div>
                      <span className="text-[10px] text-stone-400 font-normal lowercase block">poktan & musim</span>
                    </th>
                    <th className="py-3 px-3">
                      <div>Kecamatan</div>
                      <span className="text-[10px] text-stone-400 font-normal lowercase block">kab. bangka</span>
                    </th>
                    <th className="py-3 px-3">
                      <div>Kios Penyalur</div>
                      <span className="text-[10px] text-stone-400 font-normal lowercase block">kios resmi kpl</span>
                    </th>
                    <th className="py-3 px-3">
                      <div>Komoditas</div>
                      <span className="text-[10px] text-stone-400 font-normal lowercase block">luas lahan (ha)</span>
                    </th>
                    <th className="py-3 px-4">
                      <div>Jenis Pupuk</div>
                      <span className="text-[10px] text-stone-400 font-normal lowercase block">alokasi (kg)</span>
                    </th>
                    {role === 'operator' && (
                      <th className="py-3 px-3 text-center">
                        <div>Aksi</div>
                        <span className="text-[10px] text-stone-400 font-normal lowercase block">edit / hapus</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredNeeds.length > 0 ? (
                    filteredNeeds.map((need) => {
                      const comm = COMMODITIES.find(c => c.id === need.komoditas);
                      return (
                        <tr key={need.id} className="hover:bg-stone-50/80 transition-colors">
                          {/* 1. Kelompok Tani */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-stone-900 text-[13px]">{need.poktan}</div>
                            <div className="text-stone-500 text-[11px] font-mono mt-0.5">
                              Desa {need.desa} • {need.musimTanam}
                            </div>
                          </td>

                          {/* 2. Kecamatan */}
                          <td className="py-3.5 px-3">
                            <div className="text-stone-900 font-semibold">{need.kecamatan}</div>
                            <div className="text-stone-400 text-[11px]">Kab. Bangka</div>
                          </td>

                          {/* 3. Kios Penyalur */}
                          <td className="py-3.5 px-3">
                            <div className="font-medium text-stone-900 flex items-center gap-1.5">
                              <Store className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span>{need.kiosPenyalur}</span>
                            </div>
                            <div className="text-emerald-700 text-[10px] mt-0.5 font-medium">
                              Kios Resmi KPL
                            </div>
                          </td>

                          {/* 4. Komoditas */}
                          <td className="py-3.5 px-3">
                            <span className="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-800 font-bold rounded text-[11px] border border-emerald-200">
                              {comm?.nama || need.komoditas}
                            </span>
                            <div className="font-mono text-stone-600 text-[11px] font-medium mt-1">
                              Luas: <strong className="text-stone-800">{need.luasLahanHa.toFixed(1)} Ha</strong>
                            </div>
                          </td>

                          {/* 5. Jenis Pupuk */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-2 items-center">
                              {/* Urea */}
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 text-stone-800 rounded-md border border-stone-200">
                                <span className="text-[10px] font-semibold text-stone-500 uppercase">Urea:</span>
                                <span className="font-mono font-bold text-stone-900 text-xs">
                                  {need.kebutuhanUreaKg.toLocaleString('id-ID')} Kg
                                </span>
                              </div>

                              {/* NPK Phonska */}
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-900 rounded-md border border-emerald-200">
                                <span className="text-[10px] font-semibold text-emerald-700 uppercase">NPK:</span>
                                <span className="font-mono font-bold text-emerald-800 text-xs">
                                  {need.kebutuhanNpkKg.toLocaleString('id-ID')} Kg
                                </span>
                              </div>

                              {/* Organik */}
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-900 rounded-md border border-amber-200">
                                <span className="text-[10px] font-semibold text-amber-700 uppercase">Organik:</span>
                                <span className="font-mono font-bold text-amber-800 text-xs">
                                  {need.kebutuhanOrganikKg.toLocaleString('id-ID')} Kg
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Operator Actions: Edit & Hapus */}
                          {role === 'operator' && (
                            <td className="py-3.5 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleOpenEdit(need)}
                                  className="p-1.5 text-stone-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Kebutuhan Pupuk"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(need.id, need.poktan)}
                                  className="p-1.5 text-stone-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus Kebutuhan Pupuk"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={role === 'operator' ? 6 : 5} className="py-8 text-center text-stone-400">
                        Tidak ada data kebutuhan pupuk untuk kriteria filter yang dipilih.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: INFORMASI KIOS PENYALUR RESMI (KPL) */}
      {activeSubTab === 'kios' && (
        <div className="space-y-6">
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-emerald-950 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-800 shrink-0" />
              <span>
                Direktori resmi Kios Penyalur Pupuk Lengkap (KPL) yang memiliki izin penyaluran pupuk bersubsidi dan terdaftar di Dinas Pertanian Kab. Bangka.
              </span>
            </div>
            <span className="font-mono font-bold text-emerald-900 shrink-0 ml-4">
              {filteredKios.length} Kios Resmi
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredKios.map((kios) => (
              <div 
                key={kios.id}
                className="bg-white border border-stone-200 rounded-xl p-5 shadow-2xs hover:border-emerald-700/40 transition-colors space-y-3"
              >
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-stone-100">
                  <div>
                    <h4 className="font-bold text-sm text-stone-900">{kios.namaKios}</h4>
                    <div className="text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-emerald-700" />
                      <span>Desa {kios.desa}, Kec. {kios.kecamatan}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                    {kios.statusOperasional}
                  </span>
                </div>

                <div className="text-xs space-y-1.5 text-stone-600">
                  <div>
                    <span className="text-stone-400 block text-[10px]">Alamat:</span>
                    <span className="text-stone-800">{kios.alamat}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-stone-400 block text-[10px]">Penanggung Jawab:</span>
                      <span className="font-medium text-stone-800">{kios.penanggungJawab}</span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px]">Kontak:</span>
                      <span className="font-mono text-emerald-800 font-semibold">{kios.kontak}</span>
                    </div>
                  </div>
                </div>

                {/* Stock in Kiosk */}
                <div className="pt-2 border-t border-stone-100 bg-stone-50 -mx-5 -mb-5 p-3 rounded-b-xl">
                  <div className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                    Ketersediaan Stok di Kios:
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white p-1.5 rounded border border-stone-200">
                      <div className="text-[10px] text-stone-400">Urea</div>
                      <div className="font-bold text-stone-900">{kios.stokTersedia.ureaTon} T</div>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-stone-200">
                      <div className="text-[10px] text-stone-400">NPK</div>
                      <div className="font-bold text-emerald-800">{kios.stokTersedia.npkTon} T</div>
                    </div>
                    <div className="bg-white p-1.5 rounded border border-stone-200">
                      <div className="text-[10px] text-stone-400">Organik</div>
                      <div className="font-bold text-amber-700">{kios.stokTersedia.organikTon} T</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Add Fertilizer Need (Operator only) */}
      {isAddNeedOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-stone-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2 text-stone-900 font-bold">
                <Plus className="w-5 h-5 text-emerald-700" />
                <span>Input Kebutuhan Pupuk Kelompok Tani</span>
              </div>
              <button 
                onClick={() => setIsAddNeedOpen(false)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNeedSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Nama Kelompok Tani (Poktan):</label>
                  <input
                    type="text"
                    required
                    value={newPoktan}
                    onChange={(e) => setNewPoktan(e.target.value)}
                    placeholder="Contoh: Poktan Subur Makmur"
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Musim Tanam:</label>
                  <input
                    type="text"
                    value={newMusim}
                    onChange={(e) => setNewMusim(e.target.value)}
                    placeholder="Contoh: MT I 2026/2027"
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Kecamatan:</label>
                  <select
                    value={newKecamatan}
                    onChange={(e) => handleKecamatanChange(e.target.value as KecamatanBangka)}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white cursor-pointer"
                  >
                    {KECAMATAN_LIST.map(k => (
                      <option key={k.nama} value={k.nama}>{k.nama}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Desa:</label>
                  <select
                    value={newDesa}
                    onChange={(e) => setNewDesa(e.target.value)}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white cursor-pointer font-medium"
                  >
                    {DESA_PER_KECAMATAN[newKecamatan]?.map(d => (
                      <option key={d} value={d}>Desa {d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Komoditas:</label>
                  <select
                    value={newKomoditas}
                    onChange={(e) => setNewKomoditas(e.target.value as CommodityId)}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white cursor-pointer"
                  >
                    {COMMODITIES.map(c => (
                      <option key={c.id} value={c.id}>{c.nama}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Luas Lahan (Ha):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={newLuasHa}
                    onChange={(e) => setNewLuasHa(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Kios Penyalur Ditunjuk:</label>
                <select
                  value={newKios}
                  onChange={(e) => setNewKios(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white cursor-pointer"
                >
                  {kiosPupukList.map(k => (
                    <option key={k.id} value={k.namaKios}>{k.namaKios} ({k.kecamatan})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Urea (Kg):</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newUreaKg}
                    onChange={(e) => setNewUreaKg(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">NPK (Kg):</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newNpkKg}
                    onChange={(e) => setNewNpkKg(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Organik (Kg):</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newOrganikKg}
                    onChange={(e) => setNewOrganikKg(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Keterangan / Catatan Teknis:</label>
                <textarea
                  rows={2}
                  value={newKeterangan}
                  onChange={(e) => setNewKeterangan(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsAddNeedOpen(false)}
                  className="px-3.5 py-1.5 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Simpan Kebutuhan Pupuk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal EDIT Fertilizer Need (Operator only) */}
      {editingNeed && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-stone-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2 text-stone-900 font-bold">
                <Pencil className="w-5 h-5 text-emerald-700" />
                <span>Edit Kebutuhan Pupuk Kelompok Tani</span>
              </div>
              <button 
                onClick={() => setEditingNeed(null)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Nama Kelompok Tani (Poktan):</label>
                  <input
                    type="text"
                    required
                    value={editPoktan}
                    onChange={(e) => setEditPoktan(e.target.value)}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Musim Tanam:</label>
                  <input
                    type="text"
                    value={editMusim}
                    onChange={(e) => setEditMusim(e.target.value)}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Kecamatan:</label>
                  <select
                    value={editKecamatan}
                    onChange={(e) => handleEditKecamatanChange(e.target.value as KecamatanBangka)}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white cursor-pointer"
                  >
                    {KECAMATAN_LIST.map(k => (
                      <option key={k.nama} value={k.nama}>{k.nama}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Desa:</label>
                  <select
                    value={editDesa}
                    onChange={(e) => setEditDesa(e.target.value)}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white cursor-pointer font-medium"
                  >
                    {DESA_PER_KECAMATAN[editKecamatan]?.map(d => (
                      <option key={d} value={d}>Desa {d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Komoditas:</label>
                  <select
                    value={editKomoditas}
                    onChange={(e) => setEditKomoditas(e.target.value as CommodityId)}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white cursor-pointer"
                  >
                    {COMMODITIES.map(c => (
                      <option key={c.id} value={c.id}>{c.nama}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Luas Lahan (Ha):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={editLuasHa}
                    onChange={(e) => setEditLuasHa(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Kios Penyalur Ditunjuk:</label>
                <select
                  value={editKios}
                  onChange={(e) => setEditKios(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white cursor-pointer"
                >
                  {kiosPupukList.map(k => (
                    <option key={k.id} value={k.namaKios}>{k.namaKios} ({k.kecamatan})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Urea (Kg):</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editUreaKg}
                    onChange={(e) => setEditUreaKg(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">NPK (Kg):</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editNpkKg}
                    onChange={(e) => setEditNpkKg(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Organik (Kg):</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editOrganikKg}
                    onChange={(e) => setEditOrganikKg(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Keterangan / Catatan Teknis:</label>
                <textarea
                  rows={2}
                  value={editKeterangan}
                  onChange={(e) => setEditKeterangan(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingNeed(null)}
                  className="px-3.5 py-1.5 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Perbarui Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
