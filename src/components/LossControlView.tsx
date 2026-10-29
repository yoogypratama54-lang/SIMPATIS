import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { COMMODITIES, KECAMATAN_LIST } from '../data/bangkaData';
import { PostHarvestLoss, CommodityId, KecamatanBangka } from '../types';
import { Plus, X, Pencil, Trash2, ShieldAlert } from 'lucide-react';

export const LossControlView: React.FC = () => {
  const { 
    postHarvestLosses, 
    addPostHarvestLoss, 
    updatePostHarvestLoss,
    deletePostHarvestLoss,
    role, 
    selectedKecamatan,
    setSelectedKecamatan,
    selectedCommodity,
    setSelectedCommodity
  } = useApp();

  const [isAddLossOpen, setIsAddLossOpen] = useState(false);
  const [editingLoss, setEditingLoss] = useState<PostHarvestLoss | null>(null);

  // New Loss Form
  const [lossKomoditas, setLossKomoditas] = useState<CommodityId>('padi_sawah');
  const [lossKecamatan, setLossKecamatan] = useState<KecamatanBangka>('Mendo Barat');
  const [lossPoktan, setLossPoktan] = useState('Poktan Maju Bersama');
  const [lossTahap, setLossTahap] = useState<PostHarvestLoss['tahapKehilangan']>('Pengeringan / Penjemuran Lantai');
  const [lossPersen, setLossPersen] = useState<number>(3.5);
  const [lossBobotKg, setLossBobotKg] = useState<number>(250);
  const [lossHargaSatuan, setLossHargaSatuan] = useState<number>(6900);
  const [lossPenyebab, setLossPenyebab] = useState('');
  const [lossIntervensi, setLossIntervensi] = useState('Bantuan Terpal Pengering UV & Lantai Jemur Semen');

  // Edit Loss Form
  const [editKomoditas, setEditKomoditas] = useState<CommodityId>('padi_sawah');
  const [editKecamatan, setEditKecamatan] = useState<KecamatanBangka>('Mendo Barat');
  const [editPoktan, setEditPoktan] = useState('');
  const [editTahap, setEditTahap] = useState<PostHarvestLoss['tahapKehilangan']>('Pengeringan / Penjemuran Lantai');
  const [editPersen, setEditPersen] = useState<number>(3.0);
  const [editBobotKg, setEditBobotKg] = useState<number>(200);
  const [editHargaSatuan, setEditHargaSatuan] = useState<number>(6900);
  const [editPenyebab, setEditPenyebab] = useState('');
  const [editIntervensi, setEditIntervensi] = useState('');

  const filteredLosses = postHarvestLosses.filter(l => {
    const matchKec = selectedKecamatan === 'Semua' || l.kecamatan === selectedKecamatan;
    const matchCom = selectedCommodity === 'semua' || l.komoditas === selectedCommodity;
    return matchKec && matchCom;
  });

  const totalKerugianRp = filteredLosses.reduce((a, b) => a + b.totalKerugianRp, 0);
  const totalBobotSusutKg = filteredLosses.reduce((a, b) => a + b.bobotSusutKg, 0);
  const avgSusutPersen = filteredLosses.length > 0 
    ? (filteredLosses.reduce((a, b) => a + b.persentaseSusut, 0) / filteredLosses.length).toFixed(1)
    : '0.0';

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const handleAddLossSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPostHarvestLoss({
      harvestRecordId: `HRV-REF-${Date.now().toString().slice(-4)}`,
      komoditas: lossKomoditas,
      kecamatan: lossKecamatan,
      poktan: lossPoktan,
      tahapKehilangan: lossTahap,
      persentaseSusut: Number(lossPersen),
      bobotSusutKg: Number(lossBobotKg),
      hargaSatuanRp: Number(lossHargaSatuan),
      penyebabUtama: lossPenyebab || 'Penjemuran tradisional rentan kelembapan tinggi',
      intervensiMekanisasi: lossIntervensi
    });

    setIsAddLossOpen(false);
  };

  const handleOpenEdit = (loss: PostHarvestLoss) => {
    setEditingLoss(loss);
    setEditKomoditas(loss.komoditas);
    setEditKecamatan(loss.kecamatan);
    setEditPoktan(loss.poktan);
    setEditTahap(loss.tahapKehilangan);
    setEditPersen(loss.persentaseSusut);
    setEditBobotKg(loss.bobotSusutKg);
    setEditHargaSatuan(loss.hargaSatuanRp);
    setEditPenyebab(loss.penyebabUtama);
    setEditIntervensi(loss.intervensiMekanisasi);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLoss) return;

    updatePostHarvestLoss(editingLoss.id, {
      komoditas: editKomoditas,
      kecamatan: editKecamatan,
      poktan: editPoktan,
      tahapKehilangan: editTahap,
      persentaseSusut: Number(editPersen),
      bobotSusutKg: Number(editBobotKg),
      hargaSatuanRp: Number(editHargaSatuan),
      penyebabUtama: editPenyebab,
      intervensiMekanisasi: editIntervensi
    });

    setEditingLoss(null);
  };

  const handleDelete = (id: string, poktan: string) => {
    if (window.confirm(`Hapus catatan kehilangan hasil untuk "${poktan}"?`)) {
      deletePostHarvestLoss(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <h2 className="text-xl font-bold text-stone-900">
              Pengendalian Kehilangan Hasil (Loss Control)
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Audit kuantitas susut pasca panen dan implementasi mekanisasi pertanian untuk menekan persentase kehilangan di Bangka.
          </p>
        </div>

        {/* Operator Button */}
        {role === 'operator' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddLossOpen(true)}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>Input Data Susut Hasil</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards with Units below title */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-stone-500 font-medium">Rata-rata Tingkat Susut</div>
          <div className="mt-1 text-2xl font-bold font-mono text-stone-900">
            {avgSusutPersen} <span className="text-sm font-normal text-stone-500">%</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Target Bappeda Bangka: &lt; 5.0%</p>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-stone-500 font-medium">Total Bobot Susut</div>
          <div className="mt-1 text-2xl font-bold font-mono text-stone-800">
            {(totalBobotSusutKg / 1000).toFixed(2)} <span className="text-sm font-normal text-stone-500">Ton</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">{totalBobotSusutKg.toLocaleString('id-ID')} Kg komoditas</p>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-stone-500 font-medium">Estimasi Nilai Kerugian</div>
          <div className="mt-1 text-xl font-bold font-mono text-rose-800">
            {formatRupiah(totalKerugianRp)}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Potensi pendapatan petani</p>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-300 rounded-xl p-4 shadow-2xs">
          <div className="text-xs text-emerald-900 font-semibold">Terselamatkan Lewat Mekanisasi</div>
          <div className="mt-1 text-xl font-bold font-mono text-emerald-900">
            {formatRupiah(Math.round(totalKerugianRp * 0.68))}
          </div>
          <p className="text-[11px] text-emerald-800 mt-1">68% kerugian berhasil ditekan</p>
        </div>
      </div>

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
          Menampilkan <span className="font-semibold text-stone-800">{filteredLosses.length}</span> laporan pemantauan susut hasil
        </div>
      </div>

      {/* Table: units below column text, codes removed, edit/delete actions */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">
                  <div>Lokasi Wilayah</div>
                  <span className="text-[10px] text-stone-400 font-normal lowercase block">kecamatan</span>
                </th>
                <th className="py-3 px-4">
                  <div>Komoditas & Poktan</div>
                  <span className="text-[10px] text-stone-400 font-normal lowercase block">kelompok tani</span>
                </th>
                <th className="py-3 px-4">
                  <div>Tahap Kehilangan</div>
                  <span className="text-[10px] text-stone-400 font-normal lowercase block">fase panen</span>
                </th>
                <th className="py-3 px-4 text-center">
                  <div>Tingkat Susut</div>
                  <span className="text-[10px] text-stone-400 font-normal lowercase block">%</span>
                </th>
                <th className="py-3 px-4 text-right">
                  <div>Bobot Susut</div>
                  <span className="text-[10px] text-stone-400 font-normal lowercase block">kg</span>
                </th>
                <th className="py-3 px-4 text-right">
                  <div>Nilai Kerugian</div>
                  <span className="text-[10px] text-stone-400 font-normal lowercase block">rupiah (rp)</span>
                </th>
                <th className="py-3 px-4">
                  <div>Penyebab & Solusi</div>
                  <span className="text-[10px] text-stone-400 font-normal lowercase block">mekanisasi</span>
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
              {filteredLosses.length === 0 ? (
                <tr>
                  <td colSpan={role === 'operator' ? 8 : 7} className="py-8 text-center text-stone-400">
                    Tidak ada catatan kehilangan hasil untuk filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredLosses.map((loss) => {
                  const com = COMMODITIES.find(c => c.id === loss.komoditas);
                  return (
                    <tr key={loss.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-stone-900">
                        <div>Kec. {loss.kecamatan}</div>
                        <div className="text-[10px] text-stone-400 font-normal">Kab. Bangka</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-800 font-semibold rounded text-[10px] border border-emerald-200">
                          {com?.nama || loss.komoditas}
                        </span>
                        <div className="text-[11px] text-stone-600 mt-1 font-medium">{loss.poktan}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-stone-900">
                        {loss.tahapKehilangan}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex px-2 py-0.5 bg-rose-100 text-rose-800 font-mono font-bold rounded text-[11px]">
                          {loss.persentaseSusut}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-stone-800">
                        {loss.bobotSusutKg.toLocaleString('id-ID')} <span className="text-[10px] font-normal text-stone-500">Kg</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-700">
                        {formatRupiah(loss.totalKerugianRp)}
                      </td>
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="text-stone-900 font-medium leading-snug">{loss.penyebabUtama}</div>
                        <div className="text-stone-500 text-[11px] mt-1 flex items-center gap-1 font-sans">
                          <span className="font-semibold text-emerald-800">Solusi:</span>
                          <span>{loss.intervensiMekanisasi}</span>
                        </div>
                      </td>
                      {role === 'operator' && (
                        <td className="py-3.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(loss)}
                              className="p-1.5 text-stone-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Data Susut"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(loss.id, loss.poktan)}
                              className="p-1.5 text-stone-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Data Susut"
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

      {/* Modal Add Loss Record (Operator Only) */}
      {isAddLossOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-stone-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2 text-stone-900 font-bold">
                <ShieldAlert className="w-5 h-5 text-emerald-700" />
                <span>Input Pencatatan Susut Hasil (Operator)</span>
              </div>
              <button 
                onClick={() => setIsAddLossOpen(false)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddLossSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Kecamatan:</label>
                  <select
                    value={lossKecamatan}
                    onChange={(e) => setLossKecamatan(e.target.value as KecamatanBangka)}
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
                    value={lossKomoditas}
                    onChange={(e) => {
                      const c = e.target.value as CommodityId;
                      setLossKomoditas(c);
                      const info = COMMODITIES.find(com => com.id === c);
                      if (info) setLossHargaSatuan(info.hargaAcuanRp);
                    }}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white cursor-pointer font-medium"
                  >
                    {COMMODITIES.map(c => (
                      <option key={c.id} value={c.id}>{c.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Kelompok Tani (Poktan):</label>
                <input
                  type="text"
                  required
                  value={lossPoktan}
                  onChange={(e) => setLossPoktan(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Tahap Kehilangan Terjadi:</label>
                <select
                  value={lossTahap}
                  onChange={(e) => setLossTahap(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white cursor-pointer"
                >
                  <option value="Pemanenan & Sortasi Batang">1. Pemanenan & Sortasi Batang</option>
                  <option value="Perontokan & Pengangkutan Lahan">2. Perontokan & Pengangkutan Lahan</option>
                  <option value="Pengeringan / Penjemuran Lantai">3. Pengeringan / Penjemuran Lantai</option>
                  <option value="Penyortiran & Pengemasan Keranjang">4. Penyortiran & Pengemasan Keranjang</option>
                  <option value="Penyimpanan Gudang & Truk Distribusi">5. Penyimpanan Gudang & Truk Distribusi</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Persentase Susut (%):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={lossPersen}
                    onChange={(e) => setLossPersen(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Bobot Susut (Kg):</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={lossBobotKg}
                    onChange={(e) => setLossBobotKg(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Penyebab Utama Kehilangan:</label>
                <input
                  type="text"
                  required
                  value={lossPenyebab}
                  onChange={(e) => setLossPenyebab(e.target.value)}
                  placeholder="Contoh: Cuaca hujan saat penjemuran atau lantai jemur tanah"
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Intervensi Mekanisasi / Solusi:</label>
                <input
                  type="text"
                  required
                  value={lossIntervensi}
                  onChange={(e) => setLossIntervensi(e.target.value)}
                  placeholder="Contoh: Bantuan Mesin Dryer UV / Terpal Silo / Combine Harvester"
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsAddLossOpen(false)}
                  className="px-3.5 py-1.5 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Simpan Catatan Susut
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal EDIT Loss Record (Operator Only) */}
      {editingLoss && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-stone-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2 text-stone-900 font-bold">
                <Pencil className="w-5 h-5 text-emerald-700" />
                <span>Edit Catatan Kehilangan Hasil</span>
              </div>
              <button 
                onClick={() => setEditingLoss(null)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
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
                <label className="font-semibold text-stone-700 block mb-1">Kelompok Tani (Poktan):</label>
                <input
                  type="text"
                  required
                  value={editPoktan}
                  onChange={(e) => setEditPoktan(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Tahap Kehilangan Terjadi:</label>
                <select
                  value={editTahap}
                  onChange={(e) => setEditTahap(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white cursor-pointer"
                >
                  <option value="Pemanenan & Sortasi Batang">1. Pemanenan & Sortasi Batang</option>
                  <option value="Perontokan & Pengangkutan Lahan">2. Perontokan & Pengangkutan Lahan</option>
                  <option value="Pengeringan / Penjemuran Lantai">3. Pengeringan / Penjemuran Lantai</option>
                  <option value="Penyortiran & Pengemasan Keranjang">4. Penyortiran & Pengemasan Keranjang</option>
                  <option value="Penyimpanan Gudang & Truk Distribusi">5. Penyimpanan Gudang & Truk Distribusi</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Persentase Susut (%):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={editPersen}
                    onChange={(e) => setEditPersen(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Bobot Susut (Kg):</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editBobotKg}
                    onChange={(e) => setEditBobotKg(Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Penyebab Utama Kehilangan:</label>
                <input
                  type="text"
                  required
                  value={editPenyebab}
                  onChange={(e) => setEditPenyebab(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Intervensi Mekanisasi / Solusi:</label>
                <input
                  type="text"
                  required
                  value={editIntervensi}
                  onChange={(e) => setEditIntervensi(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-300 rounded-lg focus:outline-emerald-700 focus:bg-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setEditingLoss(null)}
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
