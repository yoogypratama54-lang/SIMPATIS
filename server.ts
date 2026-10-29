import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { db } from './src/db/index.ts';
import * as schema from './src/db/schema.ts';
import { eq, desc } from 'drizzle-orm';
import { seedDatabaseIfEmpty } from './src/db/seed.ts';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json());

  const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzleU7fO-odcpqMpUO4bYipfdDA5SO3PkbWQV57Ib0QZ5z1gCc8OHmgHyn-nyW0O1eK5Q/exec';

  const DUMMY_PARCELS_FOR_SHEET = [
    {
      nama_petani: "Zulkifli Mansur",
      kelompok_tani: "Poktan Maju Bersama",
      lokasi: "Desa Kemuja, Kec. Mendo Barat",
      komoditas: "Padi Sawah (Inpari 32 HDB)",
      luas_lahan: "2.5 Ha",
      kemasaman: "pH 5.4",
      sistem_irigasi: "Irigasi Teknis"
    },
    {
      nama_petani: "H. Ruslan Effendi",
      kelompok_tani: "Gapoktan Sahabat Tani",
      lokasi: "Desa Gunung Muda, Kec. Belinyu",
      komoditas: "Padi Ladang (Lokal Inpago 9)",
      luas_lahan: "3.0 Ha",
      kemasaman: "pH 4.8",
      sistem_irigasi: "Tadah Hujan"
    },
    {
      nama_petani: "Bujang Sanusi",
      kelompok_tani: "Poktan Sinar Harapan",
      lokasi: "Desa Rebo, Kec. Sungailiat",
      komoditas: "Cabai Merah Keriting (Lado F1)",
      luas_lahan: "1.2 Ha",
      kemasaman: "pH 6.0",
      sistem_irigasi: "Embung / Sumur Bor"
    },
    {
      nama_petani: "Samsuri",
      kelompok_tani: "Poktan Makmur Sentosa",
      lokasi: "Desa Kimak, Kec. Merawang",
      komoditas: "Cabai Rawit (Ori 212)",
      luas_lahan: "1.0 Ha",
      kemasaman: "pH 5.6",
      sistem_irigasi: "Embung / Sumur Bor"
    },
    {
      nama_petani: "M. Taufik Hidayat",
      kelompok_tani: "Poktan Tunas Baru",
      lokasi: "Desa Kayu Besi, Kec. Puding Besar",
      komoditas: "Cabai Besar (Gada MK F1)",
      luas_lahan: "1.5 Ha",
      kemasaman: "pH 5.8",
      sistem_irigasi: "Irigasi Teknis"
    },
    {
      nama_petani: "Junaidi Arsyad",
      kelompok_tani: "Poktan Sumber Rejeki",
      lokasi: "Desa Cit, Kec. Riau Silip",
      komoditas: "Padi Sawah (Inpari 42 Agritan)",
      luas_lahan: "2.0 Ha",
      kemasaman: "pH 5.2",
      sistem_irigasi: "Irigasi Teknis"
    }
  ];

  async function seedSheetIfEmpty(currentRows: any[]) {
    if (!Array.isArray(currentRows) || currentRows.length === 0) {
      console.log('Google Spreadsheet is empty. Automatically seeding dummy data...');
      for (const item of DUMMY_PARCELS_FOR_SHEET) {
        try {
          await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
            redirect: 'follow',
          });
        } catch (e) {
          console.error('Error posting dummy item to Google Sheet:', e);
        }
      }
      try {
        const refetchRes = await fetch(GOOGLE_APPS_SCRIPT_URL, { redirect: 'follow' });
        if (refetchRes.ok) {
          return await refetchRes.json();
        }
      } catch (err) {
        console.warn('Failed to refetch after sheet seed:', err);
      }
      return DUMMY_PARCELS_FOR_SHEET;
    }
    return currentRows;
  }

  // Multi-Sheet Google Spreadsheet Proxy Endpoints
  app.get('/api/sheets/data', async (req, res) => {
    try {
      const sheetName = (req.query.sheetName as string) || 'Data Petani & Lahan';
      const targetUrl = `${GOOGLE_APPS_SCRIPT_URL}?sheetName=${encodeURIComponent(sheetName)}`;
      const response = await fetch(targetUrl, { redirect: 'follow' });
      if (!response.ok) {
        throw new Error(`Google Apps Script responded with ${response.status}`);
      }
      const rows = await response.json();
      res.json({
        rows: Array.isArray(rows) ? rows : [],
        count: Array.isArray(rows) ? rows.length : 0,
        sheetName,
        source: 'Google Spreadsheet Web App (Multi-Sheet)',
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Error fetching sheet data:', err);
      res.status(500).json({ error: 'Failed to fetch from Google Spreadsheet', details: err.message });
    }
  });

  app.post('/api/sheets/data', async (req, res) => {
    try {
      const body = req.body || {};
      const sheetName = (req.query.sheetName as string) || body.sheetName || 'Data Petani & Lahan';
      const payload = { ...body, sheetName };

      const targetUrl = `${GOOGLE_APPS_SCRIPT_URL}?sheetName=${encodeURIComponent(sheetName)}`;
      const gRes = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        redirect: 'follow',
      });

      const responseText = await gRes.text();
      let resultJson;
      try {
        resultJson = JSON.parse(responseText);
      } catch {
        resultJson = { raw: responseText };
      }

      res.json({
        success: true,
        message: `Data berhasil disimpan ke sheet ${sheetName}`,
        sheetName,
        result: resultJson,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Error posting sheet data:', err);
      res.status(500).json({ error: 'Failed to save to Google Spreadsheet', details: err.message });
    }
  });

  // Google Spreadsheet Real-Time Endpoints (Backward compatibility)
  app.get('/api/sheets/parcels', async (req, res) => {
    try {
      const targetUrl = `${GOOGLE_APPS_SCRIPT_URL}?sheetName=${encodeURIComponent('Data Petani & Lahan')}`;
      const response = await fetch(targetUrl, { redirect: 'follow' });
      if (!response.ok) {
        throw new Error(`Google Apps Script responded with ${response.status}`);
      }
      let rows = await response.json();
      let wasSeeded = false;

      if (!Array.isArray(rows) || rows.length === 0) {
        rows = await seedSheetIfEmpty(rows);
        wasSeeded = true;
      }

      res.json({
        rows: Array.isArray(rows) ? rows : [],
        count: Array.isArray(rows) ? rows.length : 0,
        sheetName: 'Data Petani & Lahan',
        source: 'Google Spreadsheet Web App',
        seeded: wasSeeded,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Error fetching from Google Spreadsheet:', err);
      res.status(500).json({ error: 'Failed to fetch from Google Spreadsheet', details: err.message });
    }
  });

  app.post('/api/sheets/parcels', async (req, res) => {
    try {
      const body = req.body;
      const sheetPayload = {
        sheetName: 'Data Petani & Lahan',
        nama_petani: body.nama_petani || body.namaPetani || '',
        kelompok_tani: body.kelompok_tani || body.poktan || '',
        lokasi: body.lokasi || `Desa ${body.desa || 'Kemuja'}, Kec. ${body.kecamatan || 'Mendo Barat'}`,
        komoditas: body.komoditas || 'Padi Sawah',
        luas_lahan: body.luas_lahan || (body.luasHa ? `${body.luasHa} Ha` : '1.5 Ha'),
        kemasaman: body.kemasaman || (body.phTanah ? `pH ${body.phTanah}` : 'pH 5.4'),
        sistem_irigasi: body.sistem_irigasi || body.sistemIrigasi || 'Irigasi Teknis'
      };

      const targetUrl = `${GOOGLE_APPS_SCRIPT_URL}?sheetName=${encodeURIComponent('Data Petani & Lahan')}`;
      const gRes = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sheetPayload),
        redirect: 'follow',
      });

      const responseText = await gRes.text();
      let resultJson;
      try {
        resultJson = JSON.parse(responseText);
      } catch {
        resultJson = { raw: responseText };
      }

      res.json({
        success: true,
        message: 'Data berhasil disimpan langsung ke Google Spreadsheet',
        result: resultJson,
        savedData: sheetPayload,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Error posting to Google Spreadsheet:', err);
      res.status(500).json({ error: 'Failed to save to Google Spreadsheet', details: err.message });
    }
  });

  app.post('/api/sheets/seed', async (req, res) => {
    try {
      const result = await seedSheetIfEmpty([]);
      res.json({
        success: true,
        message: 'Berhasil memasukkan data dummy ke Google Spreadsheet',
        rows: result,
        count: Array.isArray(result) ? result.length : 0
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Gagal memasukkan data dummy ke Google Spreadsheet', details: err.message });
    }
  });

  app.get('/api/sheets/status', async (req, res) => {
    try {
      const start = Date.now();
      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, { redirect: 'follow' });
      const latencyMs = Date.now() - start;
      const data = await response.json();
      res.json({
        status: 'connected',
        url: GOOGLE_APPS_SCRIPT_URL,
        totalRows: Array.isArray(data) ? data.length : 0,
        latencyMs,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // 1. Land Parcels API
  app.get('/api/land-parcels', async (req, res) => {
    try {
      const records = await db.select().from(schema.landParcels).orderBy(desc(schema.landParcels.createdAt));
      res.json(records);
    } catch (err: any) {
      console.error('Error fetching land parcels:', err);
      res.status(500).json({ error: 'Failed to fetch land parcels' });
    }
  });

  app.post('/api/land-parcels', async (req, res) => {
    try {
      const body = req.body;
      const id = body.id || `PARCEL-${Date.now()}`;
      const [inserted] = await db.insert(schema.landParcels).values({
        id,
        kodePetak: body.kodePetak || `PETAK-${Math.floor(Math.random() * 900 + 100)}`,
        namaPetani: body.namaPetani,
        nik: body.nik,
        poktan: body.poktan,
        kecamatan: body.kecamatan,
        desa: body.desa,
        komoditas: body.komoditas,
        varietas: body.varietas,
        luasHa: Number(body.luasHa),
        phTanah: Number(body.phTanah),
        sistemIrigasi: body.sistemIrigasi,
        tahunTanam: body.tahunTanam || 2026,
        lat: body.lat ?? (body.koordinat?.lat ?? -1.95),
        lng: body.lng ?? (body.koordinat?.lng ?? 106.12),
        terakhirDiperbarui: body.terakhirDiperbarui || new Date().toISOString().split('T')[0],
      }).returning();
      res.status(201).json(inserted);
    } catch (err: any) {
      console.error('Error creating land parcel:', err);
      res.status(500).json({ error: 'Failed to create land parcel' });
    }
  });

  app.put('/api/land-parcels/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const body = req.body;
      const [updated] = await db.update(schema.landParcels)
        .set({
          namaPetani: body.namaPetani,
          nik: body.nik,
          poktan: body.poktan,
          kecamatan: body.kecamatan,
          desa: body.desa,
          komoditas: body.komoditas,
          varietas: body.varietas,
          luasHa: Number(body.luasHa),
          phTanah: Number(body.phTanah),
          sistemIrigasi: body.sistemIrigasi,
          terakhirDiperbarui: new Date().toISOString().split('T')[0],
        })
        .where(eq(schema.landParcels.id, id))
        .returning();
      res.json(updated);
    } catch (err: any) {
      console.error('Error updating land parcel:', err);
      res.status(500).json({ error: 'Failed to update land parcel' });
    }
  });

  app.delete('/api/land-parcels/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(schema.landParcels).where(eq(schema.landParcels.id, id));
      res.json({ success: true, id });
    } catch (err: any) {
      console.error('Error deleting land parcel:', err);
      res.status(500).json({ error: 'Failed to delete land parcel' });
    }
  });

  // 2. Fertilizer Needs API
  app.get('/api/fertilizer-needs', async (req, res) => {
    try {
      const records = await db.select().from(schema.fertilizerNeeds).orderBy(desc(schema.fertilizerNeeds.createdAt));
      res.json(records);
    } catch (err: any) {
      console.error('Error fetching fertilizer needs:', err);
      res.status(500).json({ error: 'Failed to fetch fertilizer needs' });
    }
  });

  app.post('/api/fertilizer-needs', async (req, res) => {
    try {
      const body = req.body;
      const id = body.id || `PUPUK-${Date.now()}`;
      const [inserted] = await db.insert(schema.fertilizerNeeds).values({
        id,
        poktan: body.poktan,
        kecamatan: body.kecamatan,
        desa: body.desa,
        komoditas: body.komoditas,
        luasLahanHa: Number(body.luasLahanHa),
        kiosPenyalur: body.kiosPenyalur,
        kebutuhanUreaKg: Number(body.kebutuhanUreaKg),
        kebutuhanNpkKg: Number(body.kebutuhanNpkKg),
        kebutuhanOrganikKg: Number(body.kebutuhanOrganikKg),
        musimTanam: body.musimTanam,
        keterangan: body.keterangan || '',
      }).returning();
      res.status(201).json(inserted);
    } catch (err: any) {
      console.error('Error creating fertilizer need:', err);
      res.status(500).json({ error: 'Failed to create fertilizer need' });
    }
  });

  app.put('/api/fertilizer-needs/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const body = req.body;
      const [updated] = await db.update(schema.fertilizerNeeds)
        .set({
          poktan: body.poktan,
          kecamatan: body.kecamatan,
          desa: body.desa,
          komoditas: body.komoditas,
          luasLahanHa: Number(body.luasLahanHa),
          kiosPenyalur: body.kiosPenyalur,
          kebutuhanUreaKg: Number(body.kebutuhanUreaKg),
          kebutuhanNpkKg: Number(body.kebutuhanNpkKg),
          kebutuhanOrganikKg: Number(body.kebutuhanOrganikKg),
          musimTanam: body.musimTanam,
          keterangan: body.keterangan || '',
        })
        .where(eq(schema.fertilizerNeeds.id, id))
        .returning();
      res.json(updated);
    } catch (err: any) {
      console.error('Error updating fertilizer need:', err);
      res.status(500).json({ error: 'Failed to update fertilizer need' });
    }
  });

  app.delete('/api/fertilizer-needs/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(schema.fertilizerNeeds).where(eq(schema.fertilizerNeeds.id, id));
      res.json({ success: true, id });
    } catch (err: any) {
      console.error('Error deleting fertilizer need:', err);
      res.status(500).json({ error: 'Failed to delete fertilizer need' });
    }
  });

  // 3. Kios Pupuk API
  app.get('/api/kios-pupuk', async (req, res) => {
    try {
      const records = await db.select().from(schema.kiosPupuk);
      res.json(records);
    } catch (err: any) {
      console.error('Error fetching kios pupuk:', err);
      res.status(500).json({ error: 'Failed to fetch kios pupuk' });
    }
  });

  // 4. Planting Schedules API
  app.get('/api/planting-schedules', async (req, res) => {
    try {
      const records = await db.select().from(schema.plantingSchedules);
      res.json(records);
    } catch (err: any) {
      console.error('Error fetching planting schedules:', err);
      res.status(500).json({ error: 'Failed to fetch planting schedules' });
    }
  });

  // 5. Harvest Records API
  app.get('/api/harvest-records', async (req, res) => {
    try {
      const records = await db.select().from(schema.harvestRecords).orderBy(desc(schema.harvestRecords.createdAt));
      res.json(records);
    } catch (err: any) {
      console.error('Error fetching harvest records:', err);
      res.status(500).json({ error: 'Failed to fetch harvest records' });
    }
  });

  app.post('/api/harvest-records', async (req, res) => {
    try {
      const body = req.body;
      const id = body.id || `PANEN-${Date.now()}`;
      const estimasi = Number(body.estimasiProduksiTon) || 0;
      const realisasi = Number(body.realisasiProduksiTon) || 0;
      const luas = Number(body.luasPanenHa) || 1;
      const deviasi = estimasi > 0 ? ((realisasi - estimasi) / estimasi) * 100 : 0;
      const produktivitas = luas > 0 ? realisasi / luas : 0;

      const [inserted] = await db.insert(schema.harvestRecords).values({
        id,
        kodePanen: body.kodePanen || `PAN-${Date.now().toString().slice(-4)}`,
        kodePetak: body.kodePetak || 'PTK-01',
        poktan: body.poktan,
        namaPetani: body.namaPetani,
        kecamatan: body.kecamatan,
        komoditas: body.komoditas,
        luasPanenHa: luas,
        estimasiProduksiTon: estimasi,
        realisasiProduksiTon: realisasi,
        deviasiPersen: Number(deviasi.toFixed(2)),
        produktivitasTonPerHa: Number(produktivitas.toFixed(2)),
        tanggalPanen: body.tanggalPanen || new Date().toISOString().split('T')[0],
      }).returning();
      res.status(201).json(inserted);
    } catch (err: any) {
      console.error('Error creating harvest record:', err);
      res.status(500).json({ error: 'Failed to create harvest record' });
    }
  });

  app.put('/api/harvest-records/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const body = req.body;
      const estimasi = Number(body.estimasiProduksiTon) || 0;
      const realisasi = Number(body.realisasiProduksiTon) || 0;
      const luas = Number(body.luasPanenHa) || 1;
      const deviasi = estimasi > 0 ? ((realisasi - estimasi) / estimasi) * 100 : 0;
      const produktivitas = luas > 0 ? realisasi / luas : 0;

      const [updated] = await db.update(schema.harvestRecords)
        .set({
          poktan: body.poktan,
          namaPetani: body.namaPetani,
          kecamatan: body.kecamatan,
          komoditas: body.komoditas,
          luasPanenHa: luas,
          estimasiProduksiTon: estimasi,
          realisasiProduksiTon: realisasi,
          deviasiPersen: Number(deviasi.toFixed(2)),
          produktivitasTonPerHa: Number(produktivitas.toFixed(2)),
          tanggalPanen: body.tanggalPanen,
        })
        .where(eq(schema.harvestRecords.id, id))
        .returning();
      res.json(updated);
    } catch (err: any) {
      console.error('Error updating harvest record:', err);
      res.status(500).json({ error: 'Failed to update harvest record' });
    }
  });

  app.delete('/api/harvest-records/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(schema.harvestRecords).where(eq(schema.harvestRecords.id, id));
      res.json({ success: true, id });
    } catch (err: any) {
      console.error('Error deleting harvest record:', err);
      res.status(500).json({ error: 'Failed to delete harvest record' });
    }
  });

  // 6. Post Harvest Losses API
  app.get('/api/post-harvest-losses', async (req, res) => {
    try {
      const records = await db.select().from(schema.postHarvestLosses).orderBy(desc(schema.postHarvestLosses.createdAt));
      res.json(records);
    } catch (err: any) {
      console.error('Error fetching post harvest losses:', err);
      res.status(500).json({ error: 'Failed to fetch post harvest losses' });
    }
  });

  app.post('/api/post-harvest-losses', async (req, res) => {
    try {
      const body = req.body;
      const id = body.id || `LOSS-${Date.now()}`;
      const bobot = Number(body.bobotSusutKg) || 0;
      const harga = Number(body.hargaSatuanRp) || 0;
      const totalKerugian = bobot * harga;

      const [inserted] = await db.insert(schema.postHarvestLosses).values({
        id,
        harvestRecordId: body.harvestRecordId || 'HR-001',
        komoditas: body.komoditas,
        kecamatan: body.kecamatan,
        poktan: body.poktan,
        tahapKehilangan: body.tahapKehilangan,
        persentaseSusut: Number(body.persentaseSusut),
        bobotSusutKg: bobot,
        hargaSatuanRp: harga,
        totalKerugianRp: totalKerugian,
        penyebabUtama: body.penyebabUtama,
        intervensiMekanisasi: body.intervensiMekanisasi,
      }).returning();
      res.status(201).json(inserted);
    } catch (err: any) {
      console.error('Error creating post harvest loss:', err);
      res.status(500).json({ error: 'Failed to create post harvest loss' });
    }
  });

  app.put('/api/post-harvest-losses/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const body = req.body;
      const bobot = Number(body.bobotSusutKg) || 0;
      const harga = Number(body.hargaSatuanRp) || 0;
      const totalKerugian = bobot * harga;

      const [updated] = await db.update(schema.postHarvestLosses)
        .set({
          komoditas: body.komoditas,
          kecamatan: body.kecamatan,
          poktan: body.poktan,
          tahapKehilangan: body.tahapKehilangan,
          persentaseSusut: Number(body.persentaseSusut),
          bobotSusutKg: bobot,
          hargaSatuanRp: harga,
          totalKerugianRp: totalKerugian,
          penyebabUtama: body.penyebabUtama,
          intervensiMekanisasi: body.intervensiMekanisasi,
        })
        .where(eq(schema.postHarvestLosses.id, id))
        .returning();
      res.json(updated);
    } catch (err: any) {
      console.error('Error updating post harvest loss:', err);
      res.status(500).json({ error: 'Failed to update post harvest loss' });
    }
  });

  app.delete('/api/post-harvest-losses/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(schema.postHarvestLosses).where(eq(schema.postHarvestLosses.id, id));
      res.json({ success: true, id });
    } catch (err: any) {
      console.error('Error deleting post harvest loss:', err);
      res.status(500).json({ error: 'Failed to delete post harvest loss' });
    }
  });

  // 7. Field Issues API
  app.get('/api/field-issues', async (req, res) => {
    try {
      const records = await db.select().from(schema.fieldIssues).orderBy(desc(schema.fieldIssues.createdAt));
      res.json(records);
    } catch (err: any) {
      console.error('Error fetching field issues:', err);
      res.status(500).json({ error: 'Failed to fetch field issues' });
    }
  });

  app.post('/api/field-issues', async (req, res) => {
    try {
      const body = req.body;
      const id = body.id || `ISSUE-${Date.now()}`;
      const [inserted] = await db.insert(schema.fieldIssues).values({
        id,
        kodeTiket: `TKT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        pelaporNama: body.pelaporNama,
        pelaporPeran: body.pelaporPeran || 'operator',
        poktan: body.poktan,
        kecamatan: body.kecamatan,
        desa: body.desa,
        kategoriMasalah: body.kategoriMasalah,
        prioritas: body.prioritas,
        deskripsi: body.deskripsi,
        tanggalLapor: new Date().toISOString().split('T')[0],
        status: 'Menunggu Disposisi',
      }).returning();
      res.status(201).json(inserted);
    } catch (err: any) {
      console.error('Error creating field issue:', err);
      res.status(500).json({ error: 'Failed to create field issue' });
    }
  });

  app.put('/api/field-issues/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const body = req.body;
      const [updated] = await db.update(schema.fieldIssues)
        .set({
          status: body.status,
          tindakLanjutPetugas: body.tindakLanjutPetugas,
          petugasPpl: body.petugasPpl,
          tanggalPenyelesaian: body.status === 'Selesai & Terverifikasi' ? new Date().toISOString().split('T')[0] : body.tanggalPenyelesaian,
        })
        .where(eq(schema.fieldIssues.id, id))
        .returning();
      res.json(updated);
    } catch (err: any) {
      console.error('Error updating field issue:', err);
      res.status(500).json({ error: 'Failed to update field issue' });
    }
  });

  // 8. Activities API
  app.get('/api/activities', async (req, res) => {
    try {
      const records = await db.select().from(schema.activities).orderBy(desc(schema.activities.createdAt));
      res.json(records);
    } catch (err: any) {
      console.error('Error fetching activities:', err);
      res.status(500).json({ error: 'Failed to fetch activities' });
    }
  });

  app.post('/api/activities', async (req, res) => {
    try {
      const body = req.body;
      const id = body.id || `ACT-${Date.now()}`;
      const [inserted] = await db.insert(schema.activities).values({
        id,
        judul: body.judul,
        tanggal: body.tanggal,
        waktu: body.waktu,
        lokasi: body.lokasi,
        kecamatan: body.kecamatan,
        penyelenggara: body.penyelenggara,
        kategori: body.kategori,
        targetPeserta: body.targetPeserta,
        status: body.status || 'Akan Datang',
        deskripsi: body.deskripsi,
      }).returning();
      res.status(201).json(inserted);
    } catch (err: any) {
      console.error('Error creating activity:', err);
      res.status(500).json({ error: 'Failed to create activity' });
    }
  });

  // Database status endpoint
  app.get('/api/db-status', async (req, res) => {
    try {
      const parcelCount = await db.select().from(schema.landParcels);
      res.json({
        status: 'connected',
        engine: 'Cloud SQL PostgreSQL',
        database: process.env.SQL_DB_NAME,
        parcels: parcelCount.length,
      });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    if (process.env.SQL_HOST) {
      await seedDatabaseIfEmpty().catch(err => console.warn('SQL seed skipped:', err.message));
    }
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
