/**
 * ==============================================================================
 * KODE BACKEND GOOGLE APPS SCRIPT - SI PETIK BANGKA (MULTI-SHEET)
 * ==============================================================================
 * 
 * Sistem Informasi Peningkatan Efisiensi Tanam & Hasil Produksi Komoditas Utama
 * Dinas Pangan dan Pertanian Pemerintah Kabupaten Bangka
 * 
 * Panduan Penggunaan di Google Spreadsheet:
 * 1. Buka Google Spreadsheet baru / yang sudah ada di akun Google Anda.
 * 2. Klik menu "Ekstensi" (Extensions) -> "Apps Script".
 * 3. Hapus seluruh kode default di editor, lalu salin dan tempel (paste) seluruh kode ini.
 * 4. Klik ikon "Simpan" (Ctrl+S / Cmd+S).
 * 5. Klik tombol "Terapkan" (Deploy) di kanan atas -> "Kelola Penerapan" (Manage Deployments) 
 *    atau "Penerapan Baru" (New Deployment).
 * 6. Pilih Jenis (Select type): "Aplikasi Web" (Web app).
 * 7. Konfigurasi:
 *    - Deskripsi: SI PETIK BANGKA Multi-Sheet API v2
 *    - Jalankan sebagai (Execute as): "Saya" (Me - akun Anda)
 *    - Siapa yang memiliki akses (Who has access): "Siapa saja" (Anyone) -> PENTING!
 * 8. Klik "Terapkan" (Deploy) dan berikan izin otorisasi Google jika diminta.
 * 9. Salin URL Web App yang dihasilkan (berakhiran /exec).
 * ==============================================================================
 */

// Konfigurasi Header untuk Setiap Tab Sheet
var SHEET_CONFIGS = {
  "Data Petani & Lahan": {
    headers: [
      "Timestamp",
      "Nama Petani",
      "Kelompok Tani",
      "Lokasi",
      "Komoditas",
      "Luas Lahan",
      "Kemasaman (pH)",
      "Sistem Irigasi"
    ],
    mapRow: function(data, timestamp) {
      return [
        timestamp,
        data.nama_petani || data.namaPetani || "",
        data.kelompok_tani || data.poktan || "",
        data.lokasi || ("Desa " + (data.desa || "") + ", Kec. " + (data.kecamatan || "")),
        data.komoditas || "",
        data.luas_lahan || (data.luasHa ? data.luasHa + " Ha" : ""),
        data.kemasaman || (data.phTanah ? "pH " + data.phTanah : ""),
        data.sistem_irigasi || data.sistemIrigasi || "Irigasi Teknis"
      ];
    }
  },
  "Kebutuhan Pupuk": {
    headers: [
      "Timestamp",
      "Kelompok Tani",
      "Lokasi",
      "Komoditas",
      "Luas Lahan (Ha)",
      "Kios Penyalur Resmi",
      "Kebutuhan Urea (Kg)",
      "Kebutuhan NPK (Kg)",
      "Kebutuhan Organik (Kg)",
      "Musim Tanam",
      "Keterangan"
    ],
    mapRow: function(data, timestamp) {
      return [
        timestamp,
        data.kelompok_tani || data.poktan || "",
        data.lokasi || ("Desa " + (data.desa || "") + ", Kec. " + (data.kecamatan || "")),
        data.komoditas || "",
        data.luas_lahan || data.luasLahanHa || 0,
        data.kios_penyalur || data.kiosPenyalur || "",
        data.urea_kg || data.kebutuhanUreaKg || 0,
        data.npk_kg || data.kebutuhanNpkKg || 0,
        data.organik_kg || data.kebutuhanOrganikKg || 0,
        data.musim_tanam || data.musimTanam || "",
        data.keterangan || ""
      ];
    }
  },
  "Monitoring Produksi": {
    headers: [
      "Timestamp",
      "Kode Panen",
      "Nama Petani",
      "Kelompok Tani",
      "Kecamatan",
      "Komoditas",
      "Luas Panen (Ha)",
      "Estimasi Produksi (Ton)",
      "Realisasi Produksi (Ton)",
      "Produktivitas (Ton/Ha)",
      "Deviasi (%)",
      "Tanggal Panen"
    ],
    mapRow: function(data, timestamp) {
      return [
        timestamp,
        data.kode_panen || data.kodePanen || "",
        data.nama_petani || data.namaPetani || "",
        data.kelompok_tani || data.poktan || "",
        data.lokasi || data.kecamatan || "",
        data.komoditas || "",
        data.luas_panen_ha || data.luasPanenHa || 0,
        data.estimasi_ton || data.estimasiProduksiTon || 0,
        data.realisasi_ton || data.realisasiProduksiTon || 0,
        data.produktivitas || data.produktivitasTonPerHa || 0,
        data.deviasi_persen || data.deviasiPersen || 0,
        data.tanggal_panen || data.tanggalPanen || ""
      ];
    }
  },
  "Pengendalian Kehilangan Hasil": {
    headers: [
      "Timestamp",
      "Komoditas",
      "Kecamatan",
      "Kelompok Tani",
      "Tahap Kehilangan",
      "Persentase Susut (%)",
      "Bobot Susut (Kg)",
      "Harga Satuan (Rp/Kg)",
      "Total Nilai Kerugian (Rp)",
      "Penyebab Utama",
      "Intervensi Mekanisasi"
    ],
    mapRow: function(data, timestamp) {
      return [
        timestamp,
        data.komoditas || "",
        data.lokasi || data.kecamatan || "",
        data.kelompok_tani || data.poktan || "",
        data.tahap_kehilangan || data.tahapKehilangan || "",
        data.persentase_susut || data.persentaseSusut || 0,
        data.bobot_susut_kg || data.bobotSusutKg || 0,
        data.harga_satuan_rp || data.hargaSatuanRp || 0,
        data.total_kerugian_rp || data.totalKerugianRp || 0,
        data.penyebab_utama || data.penyebabUtama || "",
        data.intervensi_mekanisasi || data.intervensiMekanisasi || ""
      ];
    }
  }
};

/**
 * Inisialisasi Header dan format tabel jika sheet baru dibuat / kosong
 */
function initializeSheetHeaders(sheet, sheetName) {
  var config = SHEET_CONFIGS[sheetName];
  if (!config) return;

  var headers = config.headers;
  sheet.clear();
  sheet.appendRow(headers);

  // Format header row
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#047857"); // Emerald Pemkab Bangka
  headerRange.setFontColor("#FFFFFF");
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  headerRange.setVerticalAlignment("middle");
  sheet.setRowHeight(1, 35);
  sheet.setFrozenRows(1);

  // Otomatis sesuaikan lebar kolom
  for (var col = 1; col <= headers.length; col++) {
    sheet.autoResizeColumn(col);
    var currentWidth = sheet.getColumnWidth(col);
    if (currentWidth < 120) {
      sheet.setColumnWidth(col, 130);
    }
  }
}

/**
 * Mengambil atau membuat sheet berdasarkan nama target
 */
function getOrCreateSheet(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    initializeSheetHeaders(sheet, sheetName);
  } else if (sheet.getLastRow() === 0) {
    initializeSheetHeaders(sheet, sheetName);
  }

  return sheet;
}

/**
 * Helper untuk normalisasi nama header ke format field key camelCase / snake_case
 */
function normalizeKey(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[()/%.-]/g, "")
    .replace(/_+$/, "");
}

/**
 * Handler GET Request
 * Contoh URL: https://script.google.com/macros/s/.../exec?sheetName=Data%20Petani%20%26%20Lahan
 */
function doGet(e) {
  try {
    var sheetName = (e && e.parameter && e.parameter.sheetName) ? e.parameter.sheetName : "Data Petani & Lahan";
    
    // Normalisasi alias jika ada sedikit variasi nama
    if (sheetName.toLowerCase().indexOf("petani") !== -1 || sheetName.toLowerCase().indexOf("lahan") !== -1) {
      sheetName = "Data Petani & Lahan";
    } else if (sheetName.toLowerCase().indexOf("pupuk") !== -1) {
      sheetName = "Kebutuhan Pupuk";
    } else if (sheetName.toLowerCase().indexOf("produksi") !== -1 || sheetName.toLowerCase().indexOf("panen") !== -1) {
      sheetName = "Monitoring Produksi";
    } else if (sheetName.toLowerCase().indexOf("kehilangan") !== -1 || sheetName.toLowerCase().indexOf("susut") !== -1 || sheetName.toLowerCase().indexOf("loss") !== -1) {
      sheetName = "Pengendalian Kehilangan Hasil";
    }

    var sheet = getOrCreateSheet(sheetName);
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();

    if (lastRow <= 1 || lastCol === 0) {
      return ContentService.createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var dataRange = sheet.getRange(1, 1, lastRow, lastCol);
    var values = dataRange.getValues();
    var rawHeaders = values[0];
    var rows = [];

    for (var r = 1; r < values.length; r++) {
      var rowObj = {};
      for (var c = 0; c < rawHeaders.length; c++) {
        var headerName = String(rawHeaders[c]).trim();
        var normalizedKey = normalizeKey(headerName);
        var val = values[r][c];

        // Format Date ke string ISO jika objek Date
        if (val instanceof Date) {
          val = Utilities.formatDate(val, "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
        }

        rowObj[normalizedKey] = val;
        rowObj[headerName] = val;
      }
      rows.push(rowObj);
    }

    return ContentService.createTextOutput(JSON.stringify(rows))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    var errorOutput = {
      success: false,
      error: error.toString(),
      message: "Gagal memproses permintaan GET"
    };
    return ContentService.createTextOutput(JSON.stringify(errorOutput))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handler POST Request
 * Menerima JSON body yang memuat sheetName dan data baris baru
 */
function doPost(e) {
  try {
    var postData = {};
    if (e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        postData = e.parameter || {};
      }
    } else if (e.parameter) {
      postData = e.parameter;
    }

    var sheetName = (e.parameter && e.parameter.sheetName) || postData.sheetName || "Data Petani & Lahan";

    // Normalisasi alias jika ada sedikit variasi nama
    if (sheetName.toLowerCase().indexOf("petani") !== -1 || sheetName.toLowerCase().indexOf("lahan") !== -1) {
      sheetName = "Data Petani & Lahan";
    } else if (sheetName.toLowerCase().indexOf("pupuk") !== -1) {
      sheetName = "Kebutuhan Pupuk";
    } else if (sheetName.toLowerCase().indexOf("produksi") !== -1 || sheetName.toLowerCase().indexOf("panen") !== -1) {
      sheetName = "Monitoring Produksi";
    } else if (sheetName.toLowerCase().indexOf("kehilangan") !== -1 || sheetName.toLowerCase().indexOf("susut") !== -1 || sheetName.toLowerCase().indexOf("loss") !== -1) {
      sheetName = "Pengendalian Kehilangan Hasil";
    }

    var sheet = getOrCreateSheet(sheetName);
    var config = SHEET_CONFIGS[sheetName];
    var timestamp = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");

    var rowValues = [];
    if (config && typeof config.mapRow === "function") {
      rowValues = config.mapRow(postData, timestamp);
    } else {
      // Fallback: simpan raw data
      rowValues = [timestamp, JSON.stringify(postData)];
    }

    sheet.appendRow(rowValues);

    var response = {
      success: true,
      message: "Data berhasil ditambahkan ke sheet: " + sheetName,
      sheetName: sheetName,
      insertedRow: rowValues,
      timestamp: timestamp
    };

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    var errResponse = {
      success: false,
      error: error.toString(),
      message: "Gagal menyimpan data ke Google Spreadsheet"
    };
    return ContentService.createTextOutput(JSON.stringify(errResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
