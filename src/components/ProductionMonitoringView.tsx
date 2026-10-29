import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { COMMODITIES, KECAMATAN_LIST } from '../data/bangkaData';
import { HarvestRecord, CommodityId, KecamatanBangka } from '../types';
import { Plus, X, Scale, Pencil, Trash2 } from 'lucide-react';

export const ProductionMonitoringView: React.FC = () => {
  const { 
    harvestRecords, 
    addHarvestRecord, 
    updateHarvestRecord,
    deleteHarvestRecord,
    role, 
    selectedKecamatan,
    setSelectedKecamatan,
    selectedCommodity,
    setSelectedCommodity
  } = useApp();

  const [isAddHarvestOpen, setIsAddHarvestOpen] = useState(false);
  const [editingHarvest, setEditingHarvest] = useState<HarvestRecord | null>(null);

  // New Harvest Form
  const [newPoktan, setNewPoktan] = useState('');
  const [newPetani, setNewPetani] = useState('');
  const [newKecamatan, setNewKecamatan] = useState<KecamatanBangka>('Mendo Barat');
  const [newKomoditas, setNewKomoditas] = useState<CommodityId>('padi_sawah');
  const [newLuasHa, setNewLuasHa] = useState<number>(2.0);
  const [newUbinanKg, setNewUbinanKg] = useState<number>(4.2);
  const [newEstimasiTon, setNewEstimasiTon] = useState<number>(13.44);
  const [newRealisasiTon, setNewRealisasiTon] = useState<number>(13.9);

  // Edit Harvest Form
  const [editPetani, setEditPetani] = useState('');
  const [editPoktan, setEditPoktan] = useState('');
  const [editKecamatan, setEditKecamatan] = useState<KecamatanBangka>('Mendo Barat');
  const [editKomoditas, setEditKomoditas] = useState<CommodityId>('padi_sawah');
  const [editLuasHa, setEditLuasHa] = useState<number>(1.0);
  const [editEstimasiTon, setEditEstimasiTon] = useState<number>(0);
  const [editRealisasiTon, setEditRealisasiTon] = useState<number>(0);

  const filteredHarvests = harvestRecords.filter(h => {
    const matchKec = selectedKecamatan === 'Semua' || h.kecamatan === selectedKecamatan;
    const matchCom = selectedCommodity === 'semua' || h.komoditas === selectedCommodity;
    return matchKec && matchCom;
  });

  const totalLuasPanenHa = filteredHarvests.reduce((a, b) => a + b.luasPanenHa, 0);
  const totalEstimasiTon = filteredHarvests.reduce((a, b) => a + b.estimasiProduksiTon, 0);
  const totalRealisasiTon = filteredHarvests.reduce((a, b) => a + b.realisasiProduksiTon, 0);
  const avgDeviasi = totalEstimasiTon > 0 ? (((totalRealisasiTon - totalEstimasiTon) / totalEstimasiTon) * 100).toFixed(2) : '0';
  const avgProduktivitasTonHa = totalLuasPanenHa > 0 ? (totalRealisasiTon / totalLuasPanenHa).toFixed(2) : '0.00';

  const handleUbinanCalculate = (ubinanVal: number, luasVal: number) => {
    setNewUbinanKg(ubinanVal);
    const tonPerHa = (ubinanVal * 1600) / 1000;
    const totalEst = Number((tonPerHa * luasVal).toFixed(2));
    setNewEstimasiTon(totalEst);
    setNewRealisasiTon(Number((totalEst * 1.02).toFixed(2)));
  };

  const handleAddHarvestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPetani || !newPoktan) return;

    addHarvestRecord({
      kodePanen: `PANEN-${Date.now().toString().slice(-4)}`,
      kodePetak: `PETAK-${Date.now().toString().slice(-4)}`,
      poktan: newPoktan,
      namaPetani: newPetani,
      kecamatan: newKecamatan,
      komoditas: newKomoditas,
      luasPanenHa: Number(newLuasHa),
      estimasiProduksiTon: Number(newEstimasiTon),
      realisasiProduksiTon: Number(newRealisasiTon),
      tanggalPanen: new Date().toISOString().split('T')[0]
    });

    setIsAddHarvestOpen(false);
    setNewPetani('');
    setNewPoktan('');
  };

  const handleOpenEdit = (harvest: HarvestRecord) => {
    setEditingHarvest(harvest);
    setEditPetani(harvest.namaPetani);
    setEditPoktan(harvest.poktan);
    setEditKecamatan(harvest.kecamatan);
    setEditKomoditas(harvest.komoditas);
    setEditLuasHa(harvest.luasPanenHa);
    setEditEstimasiTon(harvest.estimasiProduksiTon);
    setEditRealisasiTon(harvest.realisasiProduksiTon);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHarvest) return;

    updateHarvestRecord(editingHarvest.id, {
      namaPetani: editPetani,
      poktan: editPoktan,
      kecamatan: editKecamatan,
      komoditas: editKomoditas,
      luasPanenHa: Number(editLuasHa),
      estimasiProduksiTon: Number(editEstimasiTon),
      realisasiProduksiTon: Number(editRealisasiTon)
    });

    setEditingHarvest(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data panen untuk "${name}"?`)) {
      deleteHarvestRecord(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <h2 className="text-xl font-bold text-stone-900">
              Monitoring Produksi
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Data luas panen, estimasi ubinan lapangan, timbangan realisasi produksi, dan produktivitas per hektare di Kabupaten Bangka.
          </p>
        </div>

        {/* Input button only for internal Operator */}
        {role === 'operator' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddHarvestOpen(true)}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>Input Realisasi Panen</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards with Units below title */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-stone-500 font-medium">Total Luas Panen</div>
          <div className="mt-1 text-2xl font-bold font-mono text-stone-900">
            {totalLuasPanenHa.toFixed(1)} <span className="text-sm font-normal text-stone-500">Ha</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Petak komoditas terpantau</p>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-stone-500 font-medium">Estimasi Ubinan</div>
          <div className="mt-1 text-2xl font-bold font-mono text-stone-800">
            {totalEstimasiTon.toFixed(2)} <span className="text-sm font-normal text-stone-500">Ton</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Sampling 2.5m x 2.5m</p>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-stone-500 font-medium">Realisasi Timbangan Riil</div>
          <div className="mt-1 text-2xl font-bold font-mono text-emerald-800">
            {totalRealisasiTon.toFixed(2)} <span className="text-sm font-normal text-stone-500">Ton</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Hasil timbangan bersih</p>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-stone-500 font-medium">Deviasi Estimasi vs Riil</div>
          <div className="mt-1 text-2xl font-bold font-mono text-blue-700">
            {Number(avgDeviasi) >= 0 ? `+${avgDeviasi}%` : `${avgDeviasi}%`}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Akurasi sampling ubinan</p>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-300 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-emerald-900 font-semibold">Produktivitas Rata-rata</div>
          <div className="mt-1 text-2xl font-bold font-mono text-emerald-900">
            {avgProduktivitasTonHa} <span className="text-sm font-normal text-emerald-700">Ton/Ha</span>
          </div>
          <p className="text-[11px] text-emerald-800 mt-1">Standar BPS & Pertanian</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
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
          Menampilkan <span className="font-semibold text-stone-800">{filteredHarvests.length}</span> catatan panen terverifikasi
        </div>
      </div>

      {/* Table: units below column text, cryptic codes removed, edit/delete actions */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 text-stone-700 uppercase font-semibold border-b border-stone-200 text-[11px]">
              <tr>
                <th className="py-3 px-4">
                  <div>Petani & Poktan</div>
                  <span className="text-[10px] text-stone-400 font-normal lowercase block">nama terdaftar</span>
                </th>
                <th className="py-3 px-4">
                  <div>Wilayah & Komoditas</div>
                  <span className="text-[10px] text-stone-400 font-normal lowercase block">kecamatan</span>
                </th>
                <th className="py-3 px-4 text-right">
                  <div>Luas Panen</div>
                  <span className="text-[10px] text-stone-400 font-normal lowercase block">ha</span>
                </th>
                <th className="py-3 px-4 text-right">
                  <div>Estimasi Ubinan</div>
                  <span className="text-[10px] text-stone-400 font-normal lowercase block">ton</span>
                </th>
                <th className="py-3 px-4 text-right">
                  <div>Realisasi Riil</div>
                  <span className="text-[10px] text-stone-400 font-normal lowercase block">ton</span>
                </th>
                <th className="py-3 px-4 text-center">
                  <div>Deviasi</div>
                  <span className="text-[10px] text-stone-400 font-normal lowercase block">%</span>
                </th>
                <th className="py-3 px-4 text-right">
                  <div>Produktivitas</div>
                  <span className="text-[10px] text-stone-400 font-normal lowercase block">ton/ha</span>
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
              {filteredHarvests.length === 0 ? (
                <tr>
                  <td colSpan={role === 'operator' ? 8 : 7} className="py-8 text-center text-stone-400">
                    Tidak ada data panen yang sesuai filter wilayah atau komoditas.
                  </td>
                </tr>
              ) : (
                filteredHarvests.map((h) => {
                  const com = COMMODITIES.find(c => c.id === h.komoditas);
                  const isPositiveDeviasi = h.deviasiPersen >= 0;
                  return (
                    <tr key={h.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-900 text-[13px]">{h.namaPetani}</div>
                        <div className="text-[11px] text-stone-500">{h.poktan} • {h.tanggalPanen}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-stone-800">Kec. {h.kecamatan}</div>
                        <span className="inline-block mt-0.5 px-2 py-0.5 bg-emerald-50 text-emerald-800 font-semibold rounded text-[10px] border border-emerald-200">
                          {com?.nama || h.komoditas}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-stone-800">
                        {h.luasPanenHa.toFixed(1)} Ha
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-stone-600">
                        {h.estimasiProduksiTon.toFixed(2)} Ton
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-800">
                        {h.realisasiProduksiTon.toFixed(2)} Ton
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                          isPositiveDeviasi ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isPositiveDeviasi ? `+${h.deviasiPersen}%` : `${h.deviasiPersen}%`}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-stone-900">
                        {h.produktivitasTonPerHa.toFixed(2)} <span className="text-[10px] font-normal text-stone-500">Ton/Ha</span>
                      </td>
                      {role === 'operator' && (
                        <td className="py-3.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(h)}
                              className="p-1.5 text-stone-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Data Panen"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(h.id, h.namaPetani)}
                              className="p-1.5 text-stone-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Data Panen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Harvest Record (Operator Only) */}
      {isAddHarvestOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-stone-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2 text-stone-900 font-bold">
                <Scale className="w-5 h-5 text-emerald-700" />
                <span>Input Realisasi Panen (Operator)</span>
              </div>
              <button 
                onClick={() => setIsAddHarvestOpen(false)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddHarvestSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Nama Petani *</label>
                  <input
                    type="text"
                    required
                    value={newPetani}
                    onChange={(e) => setNewPetani(e.target.value)}
                    placeholder="Contoh: Zulkifli"
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Kelompok Tani (Poktan) *</label>
                  <input
                    type="text"
                    required
                    value={newPoktan}
                    onChange={(e) => setNewPoktan(e.target.value)}
                    placeholder="Contoh: Poktan Maju Bersama"
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Kecamatan:</label>
                  <select
                    value={newKecamatan}
                    onChange={(e) => setNewKecamatan(e.target.value as KecamatanBangka)}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white cursor-pointer"
                  >
                    {KECAMATAN_LIST.map(k => (
                      <option key={k.nama} value={k.nama}>{k.nama}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Komoditas:</label>
                  <select
                    value={newKomoditas}
                    onChange={(e) => setNewKomoditas(e.target.value as CommodityId)}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white cursor-pointer font-medium"
                  >
                    {COMMODITIES.map(c => (
                      <option key={c.id} value={c.id}>{c.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Luas Panen (Ha):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={newLuasHa}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setNewLuasHa(val);
                    handleUbinanCalculate(newUbinanKg, val);
                  }}
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Estimasi Ubinan (Ton):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newEstimasiTon}
                    onChange={(e) => setNewEstimasiTon(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Realisasi Timbangan (Ton):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newRealisasiTon}
                    onChange={(e) => setNewRealisasiTon(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsAddHarvestOpen(false)}
                  className="px-3.5 py-1.5 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Simpan Catatan Panen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal EDIT Harvest Record (Operator Only) */}
      {editingHarvest && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-stone-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2 text-stone-900 font-bold">
                <Pencil className="w-5 h-5 text-emerald-700" />
                <span>Edit Catatan Panen</span>
              </div>
              <button 
                onClick={() => setEditingHarvest(null)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Nama Petani *</label>
                  <input
                    type="text"
                    required
                    value={editPetani}
                    onChange={(e) => setEditPetani(e.target.value)}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Kelompok Tani (Poktan) *</label>
                  <input
                    type="text"
                    required
                    value={editPoktan}
                    onChange={(e) => setEditPoktan(e.target.value)}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Kecamatan:</label>
                  <select
                    value={editKecamatan}
                    onChange={(e) => setEditKecamatan(e.target.value as KecamatanBangka)}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white cursor-pointer"
                  >
                    {KECAMATAN_LIST.map(k => (
                      <option key={k.nama} value={k.nama}>{k.nama}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Komoditas:</label>
                  <select
                    value={editKomoditas}
                    onChange={(e) => setEditKomoditas(e.target.value as CommodityId)}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white cursor-pointer font-medium"
                  >
                    {COMMODITIES.map(c => (
                      <option key={c.id} value={c.id}>{c.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Luas Panen (Ha):</label>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Estimasi Ubinan (Ton):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editEstimasiTon}
                    onChange={(e) => setEditEstimasiTon(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Realisasi Timbangan (Ton):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editRealisasiTon}
                    onChange={(e) => setEditRealisasiTon(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingHarvest(null)}
                  className="px-3.5 py-1.5 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Perbarui Catatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
