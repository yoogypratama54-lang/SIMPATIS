import { 
  LandParcel, 
  KecamatanBangka, 
  CommodityId, 
  FertilizerNeedRecord, 
  HarvestRecord, 
  PostHarvestLoss 
} from '../types';
import { COMMODITIES, KECAMATAN_LIST } from '../data/bangkaData';

export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzleU7fO-odcpqMpUO4bYipfdDA5SO3PkbWQV57Ib0QZ5z1gCc8OHmgHyn-nyW0O1eK5Q/exec';

// Daftar Nama Sheet Resmi Sesuai Ketentuan Multi-Sheet
export const SHEET_NAMES = {
  DATA_PETANI_LAHAN: 'Data Petani & Lahan',
  KEBUTUHAN_PUPUK: 'Kebutuhan Pupuk',
  MONITORING_PRODUKSI: 'Monitoring Produksi',
  PENGENDALIAN_KEHILANGAN: 'Pengendalian Kehilangan Hasil'
} as const;

export type SupportedSheetName = typeof SHEET_NAMES[keyof typeof SHEET_NAMES];

// ============================================================================
// 1. DATA PETANI & LAHAN PARSERS & TRANSFORMERS
// ============================================================================
export interface SheetParcelRow {
  nama_petani?: string;
  kelompok_tani?: string;
  lokasi?: string;
  komoditas?: string;
  luas_lahan?: string | number;
  kemasaman?: string | number;
  sistem_irigasi?: string;
  timestamp?: string;
  [key: string]: any;
}

export function parseSheetRowToParcel(row: SheetParcelRow, index: number): LandParcel {
  const namaPetani = (row.nama_petani || row['Nama Petani'] || `Petani ${index + 1}`).toString().trim();
  const poktan = (row.kelompok_tani || row['Kelompok Tani'] || 'Poktan Mandiri Bangka').toString().trim();
  const lokasi = (row.lokasi || row['Lokasi'] || 'Desa Kemuja, Kec. Mendo Barat').toString();

  let kecamatan: KecamatanBangka = 'Mendo Barat';
  let desa = 'Kemuja';

  const kecamatanNames: KecamatanBangka[] = [
    'Sungailiat', 'Belinyu', 'Merawang', 'Mendo Barat', 'Pemali', 'Bakam', 'Riau Silip', 'Puding Besar'
  ];

  for (const kec of kecamatanNames) {
    if (new RegExp(kec, 'i').test(lokasi)) {
      kecamatan = kec;
      break;
    }
  }

  const desaMatch = lokasi.match(/Desa\s+([A-Za-z\s]+?)(?:,|$)/i);
  if (desaMatch && desaMatch[1]) {
    desa = desaMatch[1].trim();
  } else {
    const parts = lokasi.split(',');
    if (parts.length > 0 && parts[0].trim()) {
      desa = parts[0].replace(/Desa\s+/i, '').trim();
    }
  }

  const rawKomoditas = (row.komoditas || row['Komoditas'] || 'Padi Sawah (Inpari 32 HDB)').toString();
  let komoditas: CommodityId = 'padi_sawah';
  const lowerKomoditas = rawKomoditas.toLowerCase();

  if (lowerKomoditas.includes('padi ladang') || lowerKomoditas.includes('padi gogo') || lowerKomoditas.includes('inpago')) {
    komoditas = 'padi_ladang';
  } else if (lowerKomoditas.includes('cabai rawit') || lowerKomoditas.includes('ori 212')) {
    komoditas = 'cabai_rawit';
  } else if (lowerKomoditas.includes('cabai merah keriting') || lowerKomoditas.includes('lado')) {
    komoditas = 'cabai_merah_keriting';
  } else if (lowerKomoditas.includes('cabai besar') || lowerKomoditas.includes('gada')) {
    komoditas = 'cabai_besar';
  } else if (lowerKomoditas.includes('padi')) {
    komoditas = 'padi_sawah';
  }

  let varietas = 'Varietas Unggul Bangka';
  const varMatch = rawKomoditas.match(/\(([^)]+)\)/);
  if (varMatch && varMatch[1]) {
    varietas = varMatch[1].trim();
  } else {
    varietas = rawKomoditas.replace(/Padi Sawah|Padi Ladang|Cabai Rawit|Cabai Merah Keriting|Cabai Besar/i, '').trim() || 'Unggul Standar';
  }

  const luasRaw = (row.luas_lahan || row['Luas Lahan'] || '1.5').toString().replace(',', '.');
  const luasMatch = luasRaw.match(/([0-9.]+)/);
  const luasHa = luasMatch ? parseFloat(luasMatch[1]) : 1.5;

  const phRaw = (row.kemasaman || row['Kemasaman (pH)'] || row['Kemasaman pH'] || '5.2').toString().replace(',', '.');
  const phMatch = phRaw.match(/([0-9.]+)/);
  const phTanah = phMatch ? parseFloat(phMatch[1]) : 5.2;

  let sistemIrigasi: LandParcel['sistemIrigasi'] = 'Irigasi Teknis';
  const rawIrigasi = (row.sistem_irigasi || row['Sistem Irigasi'] || '').toString().toLowerCase();
  if (rawIrigasi.includes('tadah') || rawIrigasi.includes('hujan')) {
    sistemIrigasi = 'Tadah Hujan';
  } else if (rawIrigasi.includes('embung') || rawIrigasi.includes('sumur') || rawIrigasi.includes('bor')) {
    sistemIrigasi = 'Embung / Sumur Bor';
  } else {
    sistemIrigasi = 'Irigasi Teknis';
  }

  const kecCoords: Record<KecamatanBangka, { lat: number; lng: number }> = {
    'Sungailiat': { lat: -1.8624, lng: 106.1212 },
    'Belinyu': { lat: -1.6372, lng: 105.7725 },
    'Merawang': { lat: -2.0465, lng: 106.0963 },
    'Mendo Barat': { lat: -2.1554, lng: 105.9782 },
    'Pemali': { lat: -1.8901, lng: 106.0504 },
    'Bakam': { lat: -1.9723, lng: 105.8895 },
    'Riau Silip': { lat: -1.7482, lng: 105.9125 },
    'Puding Besar': { lat: -2.0125, lng: 105.9912 }
  };

  const baseCoord = kecCoords[kecamatan] || { lat: -1.95, lng: 106.05 };
  const jitterLat = ((index * 37) % 50 - 25) * 0.0015;
  const jitterLng = ((index * 43) % 50 - 25) * 0.0015;

  return {
    id: `LP-SHEET-${index + 1}`,
    kodePetak: `PETAK-GS-${String(index + 1).padStart(3, '0')}`,
    namaPetani,
    nik: `19010${(index % 8) + 1}${String(1000000000 + index * 9871).slice(-10)}`,
    poktan,
    kecamatan,
    desa,
    komoditas,
    varietas,
    luasHa: Number(luasHa.toFixed(2)),
    phTanah: Number(phTanah.toFixed(1)),
    jenisTanah: phTanah < 5.0 ? 'Podsolik Merah Kuning (Ultisol)' : phTanah < 5.8 ? 'Aluvial' : 'Latosol',
    koordinat: {
      lat: Number((baseCoord.lat + jitterLat).toFixed(4)),
      lng: Number((baseCoord.lng + jitterLng).toFixed(4))
    },
    tahunTanam: 2026,
    sistemIrigasi,
    terakhirDiperbarui: new Date().toISOString().split('T')[0]
  };
}

export function parcelToSheetRow(parcel: LandParcel) {
  const commodityObj = COMMODITIES.find(c => c.id === parcel.komoditas);
  const commodityName = commodityObj ? commodityObj.nama : 'Padi Sawah';
  const varLabel = parcel.varietas ? `(${parcel.varietas})` : '';

  return {
    sheetName: SHEET_NAMES.DATA_PETANI_LAHAN,
    nama_petani: parcel.namaPetani,
    kelompok_tani: parcel.poktan,
    lokasi: `Desa ${parcel.desa}, Kec. ${parcel.kecamatan}`,
    komoditas: `${commodityName} ${varLabel}`.trim(),
    luas_lahan: `${parcel.luasHa} Ha`,
    kemasaman: `pH ${parcel.phTanah}`,
    sistem_irigasi: parcel.sistemIrigasi
  };
}

// ============================================================================
// 2. KEBUTUHAN PUPUK PARSERS & TRANSFORMERS
// ============================================================================
export interface SheetFertilizerRow {
  kelompok_tani?: string;
  lokasi?: string;
  komoditas?: string;
  luas_lahan?: string | number;
  luas_lahan_ha?: string | number;
  kios_penyalur?: string;
  kios_penyalur_resmi?: string;
  urea_kg?: string | number;
  kebutuhan_urea_kg?: string | number;
  npk_kg?: string | number;
  kebutuhan_npk_kg?: string | number;
  organik_kg?: string | number;
  kebutuhan_organik_kg?: string | number;
  musim_tanam?: string;
  keterangan?: string;
  [key: string]: any;
}

export function parseSheetRowToFertilizerNeed(row: SheetFertilizerRow, index: number): FertilizerNeedRecord {
  const poktan = (row.kelompok_tani || row['Kelompok Tani'] || `Poktan Bangka ${index + 1}`).toString().trim();
  const lokasi = (row.lokasi || row['Lokasi'] || 'Desa Kemuja, Kec. Mendo Barat').toString();

  let kecamatan: KecamatanBangka = 'Mendo Barat';
  let desa = 'Kemuja';
  const kecamatanNames: KecamatanBangka[] = [
    'Sungailiat', 'Belinyu', 'Merawang', 'Mendo Barat', 'Pemali', 'Bakam', 'Riau Silip', 'Puding Besar'
  ];
  for (const kec of kecamatanNames) {
    if (new RegExp(kec, 'i').test(lokasi)) {
      kecamatan = kec;
      break;
    }
  }
  const desaMatch = lokasi.match(/Desa\s+([A-Za-z\s]+?)(?:,|$)/i);
  if (desaMatch && desaMatch[1]) {
    desa = desaMatch[1].trim();
  }

  const rawKom = (row.komoditas || row['Komoditas'] || 'padi_sawah').toString().toLowerCase();
  let komoditas: CommodityId = 'padi_sawah';
  if (rawKom.includes('ladang') || rawKom.includes('gogo')) komoditas = 'padi_ladang';
  else if (rawKom.includes('rawit')) komoditas = 'cabai_rawit';
  else if (rawKom.includes('keriting')) komoditas = 'cabai_merah_keriting';
  else if (rawKom.includes('besar')) komoditas = 'cabai_besar';

  const luasRaw = (row.luas_lahan || row.luas_lahan_ha || row['Luas Lahan (Ha)'] || '5.0').toString().replace(',', '.');
  const luasMatch = luasRaw.match(/([0-9.]+)/);
  const luasLahanHa = luasMatch ? parseFloat(luasMatch[1]) : 5.0;

  const kiosPenyalur = (row.kios_penyalur || row.kios_penyalur_resmi || row['Kios Penyalur Resmi'] || 'UD Sumber Rejeki Tani').toString();

  const parseNumber = (val: any, def: number) => {
    if (val === undefined || val === null || val === '') return def;
    const num = parseFloat(val.toString().replace(/[^0-9.]/g, ''));
    return isNaN(num) ? def : num;
  };

  const kebutuhanUreaKg = parseNumber(row.urea_kg || row.kebutuhan_urea_kg || row['Kebutuhan Urea (Kg)'], 1000);
  const kebutuhanNpkKg = parseNumber(row.npk_kg || row.kebutuhan_npk_kg || row['Kebutuhan NPK (Kg)'], 1500);
  const kebutuhanOrganikKg = parseNumber(row.organik_kg || row.kebutuhan_organik_kg || row['Kebutuhan Organik (Kg)'], 2500);
  const musimTanam = (row.musim_tanam || row['Musim Tanam'] || 'MT I 2026/2027').toString();
  const keterangan = (row.keterangan || row['Keterangan'] || 'Alokasi kebutuhan pupuk berimbang.').toString();

  return {
    id: `FND-GS-${index + 1}`,
    poktan,
    kecamatan,
    desa,
    komoditas,
    luasLahanHa,
    kiosPenyalur,
    kebutuhanUreaKg,
    kebutuhanNpkKg,
    kebutuhanOrganikKg,
    musimTanam,
    keterangan
  };
}

export function fertilizerNeedToSheetRow(need: FertilizerNeedRecord) {
  const comm = COMMODITIES.find(c => c.id === need.komoditas);
  return {
    sheetName: SHEET_NAMES.KEBUTUHAN_PUPUK,
    kelompok_tani: need.poktan,
    lokasi: `Desa ${need.desa}, Kec. ${need.kecamatan}`,
    komoditas: comm ? comm.nama : 'Padi Sawah',
    luas_lahan: `${need.luasLahanHa} Ha`,
    kios_penyalur: need.kiosPenyalur,
    urea_kg: need.kebutuhanUreaKg,
    npk_kg: need.kebutuhanNpkKg,
    organik_kg: need.kebutuhanOrganikKg,
    musim_tanam: need.musimTanam,
    keterangan: need.keterangan
  };
}

// ============================================================================
// 3. MONITORING PRODUKSI PARSERS & TRANSFORMERS
// ============================================================================
export interface SheetHarvestRow {
  kode_panen?: string;
  nama_petani?: string;
  kelompok_tani?: string;
  lokasi?: string;
  kecamatan?: string;
  komoditas?: string;
  luas_panen_ha?: string | number;
  estimasi_ton?: string | number;
  estimasi_produksi_ton?: string | number;
  realisasi_ton?: string | number;
  realisasi_produksi_ton?: string | number;
  produktivitas?: string | number;
  produktivitas_ton_ha?: string | number;
  deviasi_persen?: string | number;
  tanggal_panen?: string;
  [key: string]: any;
}

export function parseSheetRowToHarvestRecord(row: SheetHarvestRow, index: number): HarvestRecord {
  const kodePanen = (row.kode_panen || row['Kode Panen'] || `PAN-GS-${String(index + 1).padStart(3, '0')}`).toString();
  const namaPetani = (row.nama_petani || row['Nama Petani'] || `Petani ${index + 1}`).toString();
  const poktan = (row.kelompok_tani || row['Kelompok Tani'] || 'Poktan Maju Bersama').toString();
  const lokasi = (row.lokasi || row.kecamatan || row['Kecamatan'] || 'Mendo Barat').toString();

  let kecamatan: KecamatanBangka = 'Mendo Barat';
  const kecamatanNames: KecamatanBangka[] = [
    'Sungailiat', 'Belinyu', 'Merawang', 'Mendo Barat', 'Pemali', 'Bakam', 'Riau Silip', 'Puding Besar'
  ];
  for (const kec of kecamatanNames) {
    if (new RegExp(kec, 'i').test(lokasi)) {
      kecamatan = kec;
      break;
    }
  }

  const rawKom = (row.komoditas || row['Komoditas'] || 'padi_sawah').toString().toLowerCase();
  let komoditas: CommodityId = 'padi_sawah';
  if (rawKom.includes('ladang') || rawKom.includes('gogo')) komoditas = 'padi_ladang';
  else if (rawKom.includes('rawit')) komoditas = 'cabai_rawit';
  else if (rawKom.includes('keriting')) komoditas = 'cabai_merah_keriting';
  else if (rawKom.includes('besar')) komoditas = 'cabai_besar';

  const parseNum = (v: any, def: number) => {
    if (v === undefined || v === null || v === '') return def;
    const num = parseFloat(v.toString().replace(/[^0-9.]/g, ''));
    return isNaN(num) ? def : num;
  };

  const luasPanenHa = parseNum(row.luas_panen_ha || row['Luas Panen (Ha)'], 2.0);
  const estimasiProduksiTon = parseNum(row.estimasi_ton || row.estimasi_produksi_ton || row['Estimasi Produksi (Ton)'], 12.0);
  const realisasiProduksiTon = parseNum(row.realisasi_ton || row.realisasi_produksi_ton || row['Realisasi Produksi (Ton)'], 12.5);
  const deviasiPersen = estimasiProduksiTon > 0 ? Number((((realisasiProduksiTon - estimasiProduksiTon) / estimasiProduksiTon) * 100).toFixed(2)) : 0;
  const produktivitasTonPerHa = luasPanenHa > 0 ? Number((realisasiProduksiTon / luasPanenHa).toFixed(2)) : 0;
  const tanggalPanen = (row.tanggal_panen || row['Tanggal Panen'] || new Date().toISOString().split('T')[0]).toString();

  return {
    id: `HRV-GS-${index + 1}`,
    kodePanen,
    kodePetak: `PETAK-PAN-${index + 1}`,
    poktan,
    namaPetani,
    kecamatan,
    komoditas,
    luasPanenHa,
    estimasiProduksiTon,
    realisasiProduksiTon,
    deviasiPersen,
    produktivitasTonPerHa,
    tanggalPanen
  };
}

export function harvestRecordToSheetRow(record: HarvestRecord) {
  const comm = COMMODITIES.find(c => c.id === record.komoditas);
  return {
    sheetName: SHEET_NAMES.MONITORING_PRODUKSI,
    kode_panen: record.kodePanen,
    nama_petani: record.namaPetani,
    kelompok_tani: record.poktan,
    lokasi: `Kec. ${record.kecamatan}`,
    komoditas: comm ? comm.nama : 'Padi Sawah',
    luas_panen_ha: `${record.luasPanenHa} Ha`,
    estimasi_ton: `${record.estimasiProduksiTon} Ton`,
    realisasi_ton: `${record.realisasiProduksiTon} Ton`,
    produktivitas: `${record.produktivitasTonPerHa} Ton/Ha`,
    deviasi_persen: `${record.deviasiPersen}%`,
    tanggal_panen: record.tanggalPanen
  };
}

// ============================================================================
// 4. PENGENDALIAN KEHILANGAN HASIL (LOSS CONTROL) PARSERS & TRANSFORMERS
// ============================================================================
export interface SheetLossRow {
  komoditas?: string;
  lokasi?: string;
  kecamatan?: string;
  kelompok_tani?: string;
  tahap_kehilangan?: string;
  persentase_susut?: string | number;
  bobot_susut_kg?: string | number;
  harga_satuan_rp?: string | number;
  total_kerugian_rp?: string | number;
  penyebab_utama?: string;
  intervensi_mekanisasi?: string;
  [key: string]: any;
}

export function parseSheetRowToLossRecord(row: SheetLossRow, index: number): PostHarvestLoss {
  const rawKom = (row.komoditas || row['Komoditas'] || 'padi_sawah').toString().toLowerCase();
  let komoditas: CommodityId = 'padi_sawah';
  if (rawKom.includes('ladang') || rawKom.includes('gogo')) komoditas = 'padi_ladang';
  else if (rawKom.includes('rawit')) komoditas = 'cabai_rawit';
  else if (rawKom.includes('keriting')) komoditas = 'cabai_merah_keriting';
  else if (rawKom.includes('besar')) komoditas = 'cabai_besar';

  const lokasi = (row.lokasi || row.kecamatan || row['Kecamatan'] || 'Mendo Barat').toString();
  let kecamatan: KecamatanBangka = 'Mendo Barat';
  const kecamatanNames: KecamatanBangka[] = [
    'Sungailiat', 'Belinyu', 'Merawang', 'Mendo Barat', 'Pemali', 'Bakam', 'Riau Silip', 'Puding Besar'
  ];
  for (const kec of kecamatanNames) {
    if (new RegExp(kec, 'i').test(lokasi)) {
      kecamatan = kec;
      break;
    }
  }

  const poktan = (row.kelompok_tani || row['Kelompok Tani'] || 'Poktan Maju Bersama').toString();

  const rawTahap = (row.tahap_kehilangan || row['Tahap Kehilangan'] || 'Pengeringan / Penjemuran Lantai').toString();
  let tahapKehilangan: PostHarvestLoss['tahapKehilangan'] = 'Pengeringan / Penjemuran Lantai';
  if (rawTahap.includes('Pemanenan')) tahapKehilangan = 'Pemanenan & Sortasi Batang';
  else if (rawTahap.includes('Perontokan')) tahapKehilangan = 'Perontokan & Pengangkutan Lahan';
  else if (rawTahap.includes('Penyortiran')) tahapKehilangan = 'Penyortiran & Pengemasan Keranjang';
  else if (rawTahap.includes('Penyimpanan') || rawTahap.includes('Gudang')) tahapKehilangan = 'Penyimpanan Gudang & Truk Distribusi';

  const parseNum = (v: any, def: number) => {
    if (v === undefined || v === null || v === '') return def;
    const num = parseFloat(v.toString().replace(/[^0-9.]/g, ''));
    return isNaN(num) ? def : num;
  };

  const persentaseSusut = parseNum(row.persentase_susut || row['Persentase Susut (%)'], 3.5);
  const bobotSusutKg = parseNum(row.bobot_susut_kg || row['Bobot Susut (Kg)'], 250);
  const hargaSatuanRp = parseNum(row.harga_satuan_rp || row['Harga Satuan (Rp/Kg)'] || row['Harga Satuan (Rp)'], 6900);
  const totalKerugianRp = parseNum(row.total_kerugian_rp || row['Total Nilai Kerugian (Rp)'] || row['Total Kerugian (Rp)'], bobotSusutKg * hargaSatuanRp);
  const penyebabUtama = (row.penyebab_utama || row['Penyebab Utama'] || 'Rentan kelembapan tinggi saat penjemuran').toString();
  const intervensiMekanisasi = (row.intervensi_mekanisasi || row['Intervensi Mekanisasi'] || 'Bantuan terpal UV dan mesin pengering dryer').toString();

  return {
    id: `PHL-GS-${index + 1}`,
    harvestRecordId: `HRV-REF-${index + 1}`,
    komoditas,
    kecamatan,
    poktan,
    tahapKehilangan,
    persentaseSusut,
    bobotSusutKg,
    hargaSatuanRp,
    totalKerugianRp,
    penyebabUtama,
    intervensiMekanisasi
  };
}

export function lossRecordToSheetRow(loss: PostHarvestLoss) {
  const comm = COMMODITIES.find(c => c.id === loss.komoditas);
  return {
    sheetName: SHEET_NAMES.PENGENDALIAN_KEHILANGAN,
    komoditas: comm ? comm.nama : 'Padi Sawah',
    lokasi: `Kec. ${loss.kecamatan}`,
    kelompok_tani: loss.poktan,
    tahap_kehilangan: loss.tahapKehilangan,
    persentase_susut: `${loss.persentaseSusut}%`,
    bobot_susut_kg: `${loss.bobotSusutKg} Kg`,
    harga_satuan_rp: `Rp ${loss.hargaSatuanRp.toLocaleString('id-ID')}`,
    total_kerugian_rp: `Rp ${loss.totalKerugianRp.toLocaleString('id-ID')}`,
    penyebab_utama: loss.penyebabUtama,
    intervensi_mekanisasi: loss.intervensiMekanisasi
  };
}

// ============================================================================
// 5. GENERALIZED SPREADSHEET API CLIENT (MULTI-SHEET)
// ============================================================================

/**
 * Mengambil data dari Google Spreadsheet dengan parameter sheetName via server proxy atau direct Apps Script
 */
export async function fetchFromSpreadsheet<T = any>(sheetName: SupportedSheetName): Promise<{ rows: T[]; source: string }> {
  const encodedSheet = encodeURIComponent(sheetName);

  // 1. Coba Server Proxy terlebih dahulu
  try {
    const res = await fetch(`/api/sheets/data?sheetName=${encodedSheet}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.rows)) {
        return {
          rows: data.rows,
          source: 'Google Spreadsheet via Server Proxy'
        };
      }
    }
  } catch (proxyErr) {
    // Silent fail over to direct fetch
  }

  // 2. Direct Fallback ke Google Apps Script Web App URL dengan parameter ?sheetName=...
  try {
    const directUrl = `${APPS_SCRIPT_URL}?sheetName=${encodedSheet}`;
    const res = await fetch(directUrl, {
      method: 'GET',
      redirect: 'follow'
    });
    if (res.ok) {
      const rows = await res.json();
      if (Array.isArray(rows)) {
        return {
          rows,
          source: 'Google Spreadsheet (Direct Web App)'
        };
      }
    }
  } catch (directErr) {
    // Silently continue
  }

  return { rows: [], source: 'Fallback' };
}

/**
 * Menyimpan data ke Google Spreadsheet dengan parameter sheetName baik di URL maupun di JSON Body
 */
export async function saveToSpreadsheet(sheetName: SupportedSheetName, payload: Record<string, any>): Promise<{ success: boolean; message: string }> {
  const enrichedPayload = {
    ...payload,
    sheetName: sheetName
  };
  const encodedSheet = encodeURIComponent(sheetName);

  // 1. Kirim via Server Proxy
  try {
    const res = await fetch(`/api/sheets/data?sheetName=${encodedSheet}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enrichedPayload)
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, message: data.message || `Data berhasil disimpan ke sheet ${sheetName}` };
    }
  } catch (err) {
    // Continue to direct post
  }

  // 2. Direct POST ke Apps Script Web App dengan parameter sheetName di URL & Body
  try {
    const directUrl = `${APPS_SCRIPT_URL}?sheetName=${encodedSheet}`;
    const directRes = await fetch(directUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(enrichedPayload),
      redirect: 'follow'
    });

    if (directRes.ok) {
      return { success: true, message: `Data berhasil disimpan langsung ke sheet ${sheetName}` };
    }
  } catch (directErr) {
    // Background failure
  }

  return { success: false, message: `Gagal mengirim ke sheet ${sheetName}` };
}

// ============================================================================
// CONVENIENCE MODULE FUNCTIONS
// ============================================================================

// 1. Data Petani & Lahan
export async function fetchParcelsFromSpreadsheet(): Promise<{ parcels: LandParcel[]; source: string; rawCount: number }> {
  const result = await fetchFromSpreadsheet<SheetParcelRow>(SHEET_NAMES.DATA_PETANI_LAHAN);
  const parcels = result.rows.map((row, idx) => parseSheetRowToParcel(row, idx));
  return {
    parcels,
    source: result.source,
    rawCount: result.rows.length
  };
}

export async function saveParcelToSpreadsheet(parcel: LandParcel): Promise<{ success: boolean; message: string }> {
  const rowPayload = parcelToSheetRow(parcel);
  return saveToSpreadsheet(SHEET_NAMES.DATA_PETANI_LAHAN, rowPayload);
}

// 2. Kebutuhan Pupuk
export async function fetchFertilizerNeedsFromSpreadsheet(): Promise<{ needs: FertilizerNeedRecord[]; rawCount: number }> {
  const result = await fetchFromSpreadsheet<SheetFertilizerRow>(SHEET_NAMES.KEBUTUHAN_PUPUK);
  const needs = result.rows.map((row, idx) => parseSheetRowToFertilizerNeed(row, idx));
  return {
    needs,
    rawCount: result.rows.length
  };
}

export async function saveFertilizerNeedToSpreadsheet(need: FertilizerNeedRecord): Promise<{ success: boolean; message: string }> {
  const rowPayload = fertilizerNeedToSheetRow(need);
  return saveToSpreadsheet(SHEET_NAMES.KEBUTUHAN_PUPUK, rowPayload);
}

// 3. Monitoring Produksi
export async function fetchHarvestRecordsFromSpreadsheet(): Promise<{ harvests: HarvestRecord[]; rawCount: number }> {
  const result = await fetchFromSpreadsheet<SheetHarvestRow>(SHEET_NAMES.MONITORING_PRODUKSI);
  const harvests = result.rows.map((row, idx) => parseSheetRowToHarvestRecord(row, idx));
  return {
    harvests,
    rawCount: result.rows.length
  };
}

export async function saveHarvestRecordToSpreadsheet(record: HarvestRecord): Promise<{ success: boolean; message: string }> {
  const rowPayload = harvestRecordToSheetRow(record);
  return saveToSpreadsheet(SHEET_NAMES.MONITORING_PRODUKSI, rowPayload);
}

// 4. Pengendalian Kehilangan Hasil
export async function fetchLossRecordsFromSpreadsheet(): Promise<{ losses: PostHarvestLoss[]; rawCount: number }> {
  const result = await fetchFromSpreadsheet<SheetLossRow>(SHEET_NAMES.PENGENDALIAN_KEHILANGAN);
  const losses = result.rows.map((row, idx) => parseSheetRowToLossRecord(row, idx));
  return {
    losses,
    rawCount: result.rows.length
  };
}

export async function saveLossRecordToSpreadsheet(loss: PostHarvestLoss): Promise<{ success: boolean; message: string }> {
  const rowPayload = lossRecordToSheetRow(loss);
  return saveToSpreadsheet(SHEET_NAMES.PENGENDALIAN_KEHILANGAN, rowPayload);
}

/**
 * Helper untuk inisialisasi tab sheet jika kosong
 */
export async function seedGoogleSheetIfEmpty(): Promise<{ success: boolean; count: number }> {
  try {
    const res = await fetch('/api/sheets/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, count: data.count || 0 };
    }
  } catch (err) {
    // Background
  }
  return { success: false, count: 0 };
}
