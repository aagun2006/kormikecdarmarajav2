export interface GasFileCode {
  filename: string;
  description: string;
  code: string;
}

export const APPS_SCRIPT_FILES: GasFileCode[] = [
  {
    filename: 'Config.gs',
    description: 'Konfigurasi Spreadsheet, Drive Folder, dan Konstanta',
    code: `/**
 * ====================================================================
 * LAPORAN SENAM KORMI DARMARAJA V.2
 * CONFIGURATION FILE (Config.gs)
 * ====================================================================
 */

// Ganti SPREADSHEET_ID dengan ID Google Spreadsheet Anda jika tidak menggunakan Container-Bound Script
var SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID") || "";

// Nama folder utama di Google Drive untuk foto laporan
var DRIVE_FOLDER_NAME = "Laporan Senam KORMI Darmaraja";

// Daftar nama sheet dalam database Google Sheets
var SHEETS = {
  USERS: "USERS",
  DESA: "DESA",
  JENIS_SENAM: "JENIS_SENAM",
  LAPORAN_SENAM: "LAPORAN_SENAM",
  AUDIT_LOG: "AUDIT_LOG"
};

// Header kolom untuk masing-masing sheet
var HEADERS = {
  USERS: ["ID_USER", "NAMA", "USERNAME", "PASSWORD_HASH", "ROLE", "ID_DESA", "NAMA_DESA", "STATUS", "CREATED_AT", "UPDATED_AT"],
  DESA: ["ID_DESA", "NAMA_DESA", "STATUS", "CREATED_AT", "UPDATED_AT"],
  JENIS_SENAM: ["ID_JENIS", "NAMA_JENIS", "STATUS", "CREATED_AT", "UPDATED_AT"],
  LAPORAN_SENAM: ["ID_LAPORAN", "ID_DESA", "NAMA_DESA", "ID_KADER", "NAMA_KADER", "TANGGAL", "JUMLAH_PESERTA", "JENIS_SENAM", "STATUS_ABSENSI", "FOTO_URL", "FOTO_FILE_ID", "CAPTION_FOTO", "SOURCE_TYPE", "CREATED_AT", "UPDATED_AT"],
  AUDIT_LOG: ["ID_LOG", "TIMESTAMP", "ID_USER", "NAMA_USER", "ROLE", "ACTION", "TABLE_NAME", "RECORD_ID", "DESCRIPTION"]
};

// Role yang tersedia
var ROLES = {
  ADMIN: "Admin",
  KOORDINATOR: "Koordinator",
  KADER: "Kader"
};
`
  },
  {
    filename: 'Utils.gs',
    description: 'Fungsi Utility, Hashing Password, LockService, dan ID Generator',
    code: `/**
 * ====================================================================
 * UTILITY & HELPER FUNCTIONS (Utils.gs)
 * ====================================================================
 */

function getSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID !== "") {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  try {
    return SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    throw new Error("Spreadsheet tidak ditemukan. Silakan konfigurasi SPREADSHEET_ID di Script Properties.");
  }
}

function getSheet(sheetName) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (typeof HEADERS !== "undefined" && HEADERS && HEADERS[sheetName]) {
      sheet.appendRow(HEADERS[sheetName]);
      sheet.getRange(1, 1, 1, HEADERS[sheetName].length).setFontWeight("bold");
    }
  }
  return sheet;
}

function formatResponse(success, message, data, code) {
  var output = {
    success: success,
    message: message,
    data: data || null
  };
  if (code) output.code = code;
  return ContentService
    .createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

function hashPassword(password) {
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
  var txtHash = "";
  for (var i = 0; i < rawHash.length; i++) {
    var byteVal = rawHash[i];
    if (byteVal < 0) byteVal += 256;
    var byteHex = byteVal.toString(16);
    if (byteHex.length === 1) byteHex = "0" + byteHex;
    txtHash += byteHex;
  }
  return txtHash;
}

function getCurrentTimestamp() {
  return Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
}

function getCurrentDate() {
  return Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");
}

function generateId(prefix, lastNumber, padding) {
  padding = padding || 4;
  var numStr = ("00000000" + lastNumber).slice(-padding);
  return prefix + "-" + numStr;
}

function generateLaporanId(lastNumber) {
  var dateStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMMdd");
  var numStr = ("0000" + lastNumber).slice(-4);
  return "LAP-" + dateStr + "-" + numStr;
}
`
  },
  {
    filename: 'Auth.gs',
    description: 'Autentikasi, Verifikasi Token/Sesi, dan Enforce Role',
    code: `/**
 * ====================================================================
 * AUTHENTICATION & AUTHORIZATION (Auth.gs)
 * ====================================================================
 */

function handleLogin(username, password) {
  if (!username || !password) {
    return { success: false, message: "Username dan password wajib diisi." };
  }

  var sheet = getSheet(SHEETS.USERS);
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    var adminHash = hashPassword("admin123");
    var coordHash = hashPassword("koordinator123");
    var kaderHash = hashPassword("kader123");
    var initialUsers = [
      ["USR-0001", "H. Asep Rohmat, S.Pd", "admin", adminHash, "Admin", "DSA-0004", "Darmaraja", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["USR-0002", "Dra. Hj. Siti Maryam", "koordinator", coordHash, "Koordinator", "DSA-0004", "Darmaraja", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["USR-0003", "Neneng Sumiati", "kader.darmaraja", kaderHash, "Kader", "DSA-0004", "Darmaraja", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()]
    ];
    sheet.getRange(2, 1, initialUsers.length, initialUsers[0].length).setValues(initialUsers);
    data = sheet.getDataRange().getValues();
  }

  var inputHash = hashPassword(password);

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var uName = String(row[2]).trim();
    var pHash = String(row[3]).trim();
    var status = String(row[7]).trim();

    if (uName.toLowerCase() === username.toLowerCase().trim()) {
      if (status !== "Aktif") {
        return { success: false, message: "Akun Anda dinonaktifkan. Hubungi Administrator." };
      }

      // Verifikasi hash password
      if (pHash === inputHash || pHash === password) { // Backward compatible jika plain text
        var sessionUser = {
          idUser: row[0],
          nama: row[1],
          username: row[2],
          role: row[4],
          idDesa: row[5],
          namaDesa: row[6]
        };

        // Buat token sederhana (base64 dari idUser + timestamp + signature)
        var tokenPayload = sessionUser.idUser + "|" + sessionUser.username + "|" + sessionUser.role + "|" + new Date().getTime();
        var token = Utilities.base64Encode(tokenPayload);
        sessionUser.token = token;

        logAudit(sessionUser.idUser, sessionUser.nama, sessionUser.role, "LOGIN", "AUTH", sessionUser.idUser, "User login berhasil");

        return {
          success: true,
          message: "Login berhasil. Selamat datang, " + sessionUser.nama + "!",
          data: sessionUser
        };
      } else {
        return { success: false, message: "Password yang Anda masukkan salah." };
      }
    }
  }

  return { success: false, message: "Username tidak ditemukan." };
}

function verifyAuth(tokenOrUser) {
  if (!tokenOrUser) {
    return { valid: false, error: "Akses ditolak: Token autentikasi tidak ditemukan." };
  }

  var idOrUsername = "";
  if (typeof tokenOrUser === "string" && tokenOrUser.length > 0) {
    var rawStr = tokenOrUser.trim();
    // 1. Direct ID format (e.g. USR-0001)
    if (rawStr.indexOf("USR-") === 0 && rawStr.indexOf("|") === -1) {
      idOrUsername = rawStr;
    }
    // 2. Pipe-separated string (e.g. USR-0001|admin|Admin|...)
    else if (rawStr.indexOf("|") !== -1) {
      idOrUsername = rawStr.split("|")[0];
    }
    // 3. Base64 encoded payload
    else {
      try {
        var decoded = Utilities.newBlob(Utilities.base64Decode(rawStr)).getDataAsString();
        if (decoded.indexOf("|") !== -1) {
          idOrUsername = decoded.split("|")[0];
        } else {
          idOrUsername = decoded;
        }
      } catch (e) {
        idOrUsername = rawStr; // fallback jika string langsung
      }
    }
  } else if (typeof tokenOrUser === "object" && tokenOrUser) {
    idOrUsername = tokenOrUser.idUser || tokenOrUser.username || "";
  }

  if (!idOrUsername) {
    return { valid: false, error: "Sesi tidak valid atau telah berakhir." };
  }

  // Cari user di database terkini berdasarkan idUser atau username
  var sheet = getSheet(SHEETS.USERS);
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    var adminHash = hashPassword("admin123");
    var coordHash = hashPassword("koordinator123");
    var kaderHash = hashPassword("kader123");
    var initialUsers = [
      ["USR-0001", "H. Asep Rohmat, S.Pd", "admin", adminHash, "Admin", "DSA-0004", "Darmaraja", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["USR-0002", "Dra. Hj. Siti Maryam", "koordinator", coordHash, "Koordinator", "DSA-0004", "Darmaraja", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["USR-0003", "Neneng Sumiati", "kader.darmaraja", kaderHash, "Kader", "DSA-0004", "Darmaraja", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()]
    ];
    sheet.getRange(2, 1, initialUsers.length, initialUsers[0].length).setValues(initialUsers);
    data = sheet.getDataRange().getValues();
  }
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var dbId = String(row[0]).trim();
    var dbUser = String(row[2]).trim().toLowerCase();
    var targetCheck = String(idOrUsername).trim();

    if (dbId === targetCheck || dbUser === targetCheck.toLowerCase()) {
      if (row[7] !== "Aktif") {
        return { valid: false, error: "Akun telah dinonaktifkan." };
      }
      return {
        valid: true,
        user: {
          idUser: row[0],
          nama: row[1],
          username: row[2],
          role: row[4],
          idDesa: row[5],
          namaDesa: row[6]
        }
      };
    }
  }

  return { valid: false, error: "User tidak terdaftar." };
}

function checkPermission(authUser, allowedRoles) {
  if (!authUser || !authUser.role) return false;
  return allowedRoles.indexOf(authUser.role) !== -1;
}
`
  },
  {
    filename: 'Laporan.gs',
    description: 'CRUD Laporan Kegiatan Senam, LockService, Validasi Kamera/Hadir',
    code: `/**
 * ====================================================================
 * MANAJEMEN LAPORAN KEGIATAN SENAM (Laporan.gs)
 * ====================================================================
 */

function getLaporanList(filter, authUser) {
  var sheet = getSheet(SHEETS.LAPORAN_SENAM);
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var result = [];
  var filterDateStart = filter && filter.tanggalMulai ? new Date(filter.tanggalMulai) : null;
  var filterDateEnd = filter && filter.tanggalAkhir ? new Date(filter.tanggalAkhir) : null;

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var item = {
      idLaporan: row[0],
      idDesa: row[1],
      namaDesa: row[2],
      idKader: row[3],
      namaKader: row[4],
      tanggal: Utilities.formatDate(new Date(row[5]), "Asia/Jakarta", "yyyy-MM-dd"),
      jumlahPeserta: Number(row[6]) || 0,
      jenisSenam: row[7],
      statusAbsensi: row[8],
      fotoUrl: row[9],
      fotoFileId: row[10],
      captionFoto: row[11],
      sourceType: row[12] || "CAMERA",
      createdAt: row[13],
      updatedAt: row[14]
    };

    // Filter role: Kader hanya dapat melihat laporannya sendiri jika diminta
    if (authUser && authUser.role === ROLES.KADER && filter && filter.onlyMine) {
      if (item.idKader !== authUser.idUser) continue;
    }

    if (filter) {
      if (filter.idDesa && filter.idDesa !== "" && item.idDesa !== filter.idDesa) continue;
      if (filter.jenisSenam && filter.jenisSenam !== "" && item.jenisSenam !== filter.jenisSenam) continue;
      if (filter.statusAbsensi && filter.statusAbsensi !== "" && item.statusAbsensi !== filter.statusAbsensi) continue;
      if (filter.idKader && filter.idKader !== "" && item.idKader !== filter.idKader) continue;

      if (filterDateStart || filterDateEnd) {
        var itemDate = new Date(item.tanggal);
        if (filterDateStart && itemDate < filterDateStart) continue;
        if (filterDateEnd && itemDate > filterDateEnd) continue;
      }
    }

    result.push(item);
  }

  // Sort descending by tanggal (terbaru -> terlama)
  result.sort(function(a, b) {
    return new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
  });

  return result;
}

function saveLaporan(payload, authUser) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    // Validasi data
    if (!payload.tanggal) throw new Error("Tanggal kegiatan wajib diisi.");
    if (!payload.jenisSenam) throw new Error("Jenis senam wajib dipilih.");
    if (!payload.statusAbsensi) throw new Error("Status absensi wajib dipilih.");

    var jumlahPeserta = parseInt(payload.jumlahPeserta, 10);
    if (isNaN(jumlahPeserta) || jumlahPeserta < 0) {
      jumlahPeserta = 0;
    }

    // STRICT ATURAN FOTO: Jika Hadir, FOTO WAJIB!
    if (payload.statusAbsensi === "Hadir") {
      if (!payload.fotoUrl && !payload.fotoBase64) {
        throw new Error("Kegiatan dengan status 'Hadir' WAJIB menyertakan foto dokumentasi kamera.");
      }
    }

    // STRICT ROLE IDENTITAS: Jangan percaya input kader dari frontend!
    var idKader = authUser.idUser;
    var namaKader = authUser.nama;
    var idDesa = authUser.idDesa;
    var namaDesa = authUser.namaDesa;

    // Jika Admin/Koordinator menginputkan atas nama desa tertentu
    if (authUser.role === ROLES.ADMIN || authUser.role === ROLES.KOORDINATOR) {
      if (payload.idDesa) idDesa = payload.idDesa;
      if (payload.namaDesa) namaDesa = payload.namaDesa;
      if (payload.idKader) idKader = payload.idKader;
      if (payload.namaKader) namaKader = payload.namaKader;
    }

    // Upload foto ke Google Drive jika ada file base64
    var fotoUrl = payload.fotoUrl || "";
    var fotoFileId = payload.fotoFileId || "";
    if (payload.fotoBase64) {
      var uploadResult = savePhotoToDrive(payload.fotoBase64, idDesa, idKader, payload.tanggal);
      fotoUrl = uploadResult.url;
      fotoFileId = uploadResult.fileId;
    }

    var sheet = getSheet(SHEETS.LAPORAN_SENAM);
    var data = sheet.getDataRange().getValues();
    var lastNum = data.length; // auto increment
    var idLaporan = generateLaporanId(lastNum);
    var now = getCurrentTimestamp();

    var newRow = [
      idLaporan,
      idDesa,
      namaDesa,
      idKader,
      namaKader,
      payload.tanggal,
      jumlahPeserta,
      payload.jenisSenam,
      payload.statusAbsensi,
      fotoUrl,
      fotoFileId,
      payload.captionFoto || "",
      payload.sourceType || (payload.statusAbsensi === "Hadir" ? "CAMERA" : "GALLERY"),
      now,
      now
    ];

    sheet.appendRow(newRow);

    logAudit(authUser.idUser, authUser.nama, authUser.role, "CREATE_LAPORAN", "LAPORAN_SENAM", idLaporan, "Input laporan senam " + payload.jenisSenam + " di " + namaDesa + " (" + jumlahPeserta + " peserta)");

    return {
      success: true,
      message: "Laporan kegiatan senam berhasil disimpan.",
      data: { idLaporan: idLaporan }
    };
  } finally {
    lock.releaseLock();
  }
}

function updateLaporan(payload, authUser) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    var sheet = getSheet(SHEETS.LAPORAN_SENAM);
    var data = sheet.getDataRange().getValues();
    var rowIndex = -1;

    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === payload.idLaporan) {
        rowIndex = i + 1; // 1-based index
        // Enforce ownership jika Kader
        if (authUser.role === ROLES.KADER && data[i][3] !== authUser.idUser) {
          throw new Error("Anda tidak memiliki hak akses untuk mengubah laporan ini.");
        }
        break;
      }
    }

    if (rowIndex === -1) throw new Error("Laporan tidak ditemukan.");

    var existingRow = data[rowIndex - 1];
    var fotoUrl = existingRow[9];
    var fotoFileId = existingRow[10];

    if (payload.fotoBase64) {
      var uploadResult = savePhotoToDrive(payload.fotoBase64, existingRow[1], existingRow[3], payload.tanggal || existingRow[5]);
      fotoUrl = uploadResult.url;
      fotoFileId = uploadResult.fileId;
    }

    var now = getCurrentTimestamp();
    var updatedValues = [
      existingRow[0], // idLaporan
      existingRow[1], // idDesa
      existingRow[2], // namaDesa
      existingRow[3], // idKader
      existingRow[4], // namaKader
      payload.tanggal || existingRow[5],
      parseInt(payload.jumlahPeserta, 10) || 0,
      payload.jenisSenam || existingRow[7],
      payload.statusAbsensi || existingRow[8],
      fotoUrl,
      fotoFileId,
      payload.captionFoto !== undefined ? payload.captionFoto : existingRow[11],
      payload.sourceType || existingRow[12],
      existingRow[13],
      now
    ];

    sheet.getRange(rowIndex, 1, 1, updatedValues.length).setValues([updatedValues]);

    logAudit(authUser.idUser, authUser.nama, authUser.role, "UPDATE_LAPORAN", "LAPORAN_SENAM", payload.idLaporan, "Update laporan senam " + payload.idLaporan);

    return { success: true, message: "Laporan berhasil diperbarui." };
  } finally {
    lock.releaseLock();
  }
}

function deleteLaporan(idLaporan, authUser) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    // Hanya Admin dan Koordinator yang dapat menghapus laporan
    if (authUser.role !== ROLES.ADMIN && authUser.role !== ROLES.KOORDINATOR) {
      throw new Error("Akses ditolak: Hanya Admin/Koordinator yang dapat menghapus laporan.");
    }

    var sheet = getSheet(SHEETS.LAPORAN_SENAM);
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === idLaporan) {
        sheet.deleteRow(i + 1);
        logAudit(authUser.idUser, authUser.nama, authUser.role, "DELETE_LAPORAN", "LAPORAN_SENAM", idLaporan, "Hapus laporan senam " + idLaporan);
        return { success: true, message: "Laporan berhasil dihapus." };
      }
    }
    throw new Error("Laporan tidak ditemukan.");
  } finally {
    lock.releaseLock();
  }
}
`
  },
  {
    filename: 'Dashboard.gs',
    description: 'Fungsi Agregasi Backend untuk Dashboard, Grafik Senam Terbanyak & Teraktif',
    code: `/**
 * ====================================================================
 * DASHBOARD & AGREGASI STATISTIK (Dashboard.gs)
 * ====================================================================
 */

function getDashboardStats(filter) {
  var laporanSheet = getSheet(SHEETS.LAPORAN_SENAM);
  var lapData = laporanSheet.getDataRange().getValues();

  var desaSheet = getSheet(SHEETS.DESA);
  var desaData = desaSheet.getDataRange().getValues();

  var usersSheet = getSheet(SHEETS.USERS);
  var usersData = usersSheet.getDataRange().getValues();

  var currentMonthStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM");

  var totalKegiatan = 0;
  var totalPeserta = 0;
  var kegiatanBulanIni = 0;
  var pesertaBulanIni = 0;

  var totalDesaAktif = 0;
  for (var d = 1; d < desaData.length; d++) {
    if (desaData[d][2] === "Aktif") totalDesaAktif++;
  }

  var totalKaderAktif = 0;
  for (var u = 1; u < usersData.length; u++) {
    if (usersData[u][4] === ROLES.KADER && usersData[u][7] === "Aktif") totalKaderAktif++;
  }

  for (var i = 1; i < lapData.length; i++) {
    var row = lapData[i];
    var tgl = Utilities.formatDate(new Date(row[5]), "Asia/Jakarta", "yyyy-MM-dd");
    var peserta = Number(row[6]) || 0;
    var status = row[8];

    if (status === "Hadir") {
      totalKegiatan++;
      totalPeserta += peserta;

      if (tgl.indexOf(currentMonthStr) === 0) {
        kegiatanBulanIni++;
        pesertaBulanIni += peserta;
      }
    }
  }

  return {
    totalKegiatan: totalKegiatan,
    totalPeserta: totalPeserta,
    totalDesa: totalDesaAktif,
    totalKader: totalKaderAktif,
    kegiatanBulanIni: kegiatanBulanIni,
    pesertaBulanIni: pesertaBulanIni
  };
}

function getSenamTerbanyak(filter) {
  var sheet = getSheet(SHEETS.LAPORAN_SENAM);
  var data = sheet.getDataRange().getValues();
  var grouping = {};

  var fStart = filter && filter.tanggalMulai ? new Date(filter.tanggalMulai) : null;
  var fEnd = filter && filter.tanggalAkhir ? new Date(filter.tanggalAkhir) : null;

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var jenis = row[7];
    var peserta = Number(row[6]) || 0;
    var itemDate = new Date(row[5]);

    if (fStart && itemDate < fStart) continue;
    if (fEnd && itemDate > fEnd) continue;
    if (filter && filter.jenisSenam && filter.jenisSenam !== "" && jenis !== filter.jenisSenam) continue;

    if (!grouping[jenis]) {
      grouping[jenis] = { jenisSenam: jenis, jumlahKegiatan: 0, totalPeserta: 0 };
    }
    grouping[jenis].jumlahKegiatan += 1;
    grouping[jenis].totalPeserta += peserta;
  }

  var list = [];
  for (var k in grouping) {
    list.push(grouping[k]);
  }
  list.sort(function(a, b) { return b.jumlahKegiatan - a.jumlahKegiatan; });
  return list;
}

function getSenamDesaTeraktif(filter) {
  var sheet = getSheet(SHEETS.LAPORAN_SENAM);
  var data = sheet.getDataRange().getValues();
  var desaGrouping = {};

  var fStart = filter && filter.tanggalMulai ? new Date(filter.tanggalMulai) : null;
  var fEnd = filter && filter.tanggalAkhir ? new Date(filter.tanggalAkhir) : null;

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var jenis = row[7];
    var idDesa = row[1];
    var namaDesa = row[2];
    var peserta = Number(row[6]) || 0;
    var itemDate = new Date(row[5]);

    // HANYA JENIS_SENAM = "Senam Desa"
    if (jenis !== "Senam Desa") continue;

    if (fStart && itemDate < fStart) continue;
    if (fEnd && itemDate > fEnd) continue;
    if (filter && filter.idDesa && filter.idDesa !== "" && idDesa !== filter.idDesa) continue;

    if (!desaGrouping[idDesa]) {
      desaGrouping[idDesa] = {
        idDesa: idDesa,
        namaDesa: namaDesa,
        totalKegiatan: 0,
        totalPeserta: 0
      };
    }
    desaGrouping[idDesa].totalKegiatan += 1;
    desaGrouping[idDesa].totalPeserta += peserta;
  }

  var list = [];
  for (var d in desaGrouping) {
    list.push(desaGrouping[d]);
  }
  // Ranking: urutkan dari kegiatan terbanyak
  list.sort(function(a, b) { return b.totalKegiatan - a.totalKegiatan; });
  return list;
}
`
  },
  {
    filename: 'Drive.gs',
    description: 'Integrasi Google Drive untuk Penyimpanan Foto dan Pembuatan Folder Otomatis',
    code: `/**
 * ====================================================================
 * GOOGLE DRIVE STORAGE (Drive.gs)
 * ====================================================================
 */

function getOrCreateTargetFolder() {
  var folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(DRIVE_FOLDER_NAME);
}

function savePhotoToDrive(base64Data, idDesa, idKader, tanggalStr) {
  try {
    var folder = getOrCreateTargetFolder();
    var cleanBase64 = base64Data;
    var mimeType = "image/jpeg";

    if (base64Data.indexOf("data:") === 0) {
      var parts = base64Data.split(";base64,");
      mimeType = parts[0].replace("data:", "");
      cleanBase64 = parts[1];
    }

    var decodedBlob = Utilities.newBlob(Utilities.base64Decode(cleanBase64), mimeType);
    var dateFormatted = (tanggalStr || "").replace(/-/g, "") || Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMMdd");
    var timeFormatted = Utilities.formatDate(new Date(), "Asia/Jakarta", "HHmmss");
    var cleanDesa = (idDesa || "DSA-0000").replace(/[^a-zA-Z0-9_-]/g, "");
    var cleanKader = (idKader || "USR-0000").replace(/[^a-zA-Z0-9_-]/g, "");

    // Format nama file: YYYYMMDD_IDDESA_IDKADER_TIMESTAMP.jpg
    var fileName = dateFormatted + "_" + cleanDesa + "_" + cleanKader + "_" + timeFormatted + ".jpg";
    decodedBlob.setName(fileName);

    var file = folder.createFile(decodedBlob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Direct Google Drive image preview URL
    var fileId = file.getId();
    var directUrl = "https://lh3.googleusercontent.com/d/" + fileId;

    return {
      fileId: fileId,
      url: directUrl,
      fileName: fileName
    };
  } catch (err) {
    throw new Error("Gagal menyimpan foto ke Google Drive: " + err.message);
  }
}
`
  },
  {
    filename: 'Users.gs',
    description: 'Master User, Role Guard, dan RBAC Permission Enforcer',
    code: `/**
 * ====================================================================
 * MASTER USERS & RBAC (Users.gs)
 * ====================================================================
 */

function getUsersList(authUser) {
  if (authUser.role === ROLES.KADER) {
    throw new Error("Akses ditolak: Kader tidak memiliki akses data user.");
  }

  var sheet = getSheet(SHEETS.USERS);
  var data = sheet.getDataRange().getValues();
  var list = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    list.push({
      idUser: row[0],
      nama: row[1],
      username: row[2],
      role: row[4],
      idDesa: row[5],
      namaDesa: row[6],
      status: row[7],
      createdAt: row[8],
      updatedAt: row[9]
    });
  }
  return list;
}

function saveUser(payload, authUser) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    if (authUser.role === ROLES.KADER) {
      throw new Error("Akses ditolak: Kader tidak dapat menambah user.");
    }

    if (!payload.nama || !payload.username || !payload.password) {
      throw new Error("Nama, username, dan password wajib diisi.");
    }

    // Koordinator HANYA boleh membuat user dengan role Kader
    var targetRole = payload.role || ROLES.KADER;
    if (authUser.role === ROLES.KOORDINATOR) {
      targetRole = ROLES.KADER;
    }

    var sheet = getSheet(SHEETS.USERS);
    var data = sheet.getDataRange().getValues();

    // Cek duplikasi username
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][2]).toLowerCase() === payload.username.toLowerCase().trim()) {
        throw new Error("Username '" + payload.username + "' sudah digunakan.");
      }
    }

    var lastNum = data.length;
    var idUser = generateId("USR", lastNum, 4);
    var now = getCurrentTimestamp();
    var pHash = hashPassword(payload.password);

    var newRow = [
      idUser,
      payload.nama.trim(),
      payload.username.trim(),
      pHash,
      targetRole,
      payload.idDesa || "",
      payload.namaDesa || "",
      payload.status || "Aktif",
      now,
      now
    ];

    sheet.appendRow(newRow);

    logAudit(authUser.idUser, authUser.nama, authUser.role, "CREATE_USER", "USERS", idUser, "Membuat user baru: " + payload.nama + " (" + targetRole + ")");

    return { success: true, message: "User berhasil ditambahkan.", data: { idUser: idUser } };
  } finally {
    lock.releaseLock();
  }
}

function updateUser(payload, authUser) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    if (authUser.role === ROLES.KADER) {
      throw new Error("Akses ditolak: Kader tidak dapat mengedit user.");
    }

    var sheet = getSheet(SHEETS.USERS);
    var data = sheet.getDataRange().getValues();
    var rowIndex = -1;

    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === payload.idUser) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) throw new Error("User tidak ditemukan.");

    var existingRow = data[rowIndex - 1];
    var targetRole = existingRow[4];

    // Admin boleh ganti role, Koordinator tidak boleh ganti role user lain ke Admin
    if (authUser.role === ROLES.ADMIN && payload.role) {
      targetRole = payload.role;
    }

    var pHash = existingRow[3];
    if (payload.password && payload.password.trim() !== "") {
      pHash = hashPassword(payload.password);
    }

    var now = getCurrentTimestamp();
    var updatedValues = [
      existingRow[0],
      payload.nama || existingRow[1],
      payload.username || existingRow[2],
      pHash,
      targetRole,
      payload.idDesa !== undefined ? payload.idDesa : existingRow[5],
      payload.namaDesa !== undefined ? payload.namaDesa : existingRow[6],
      payload.status || existingRow[7],
      existingRow[8],
      now
    ];

    sheet.getRange(rowIndex, 1, 1, updatedValues.length).setValues([updatedValues]);

    logAudit(authUser.idUser, authUser.nama, authUser.role, "UPDATE_USER", "USERS", payload.idUser, "Update user " + payload.idUser);

    return { success: true, message: "User berhasil diperbarui." };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Update Profil Pribadi (Semua Role: Admin, Koordinator, Kader)
 * Catatan Keamanan: User HANYA boleh mengubah Nama dan Password sendiri.
 * Desa dan Role TERKUNCI & TIDAK DAPAT DIUBAH oleh user di menu profil.
 */
function updateProfile(payload, authUser) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var idUser = authUser.idUser;
    if (!payload.nama || String(payload.nama).trim() === "") {
      throw new Error("Nama lengkap wajib diisi.");
    }

    var sheet = getSheet(SHEETS.USERS);
    var data = sheet.getDataRange().getValues();
    var rowIndex = -1;

    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === idUser) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) throw new Error("User tidak ditemukan di database.");

    var existingRow = data[rowIndex - 1];
    var pHash = existingRow[3];
    if (payload.password && String(payload.password).trim() !== "") {
      pHash = hashPassword(payload.password);
    }

    var now = getCurrentTimestamp();
    // PERHATIAN: Desa (kolom 6 & 7) dan Role (kolom 5) TIDAK BOLEH diedit oleh user sendiri!
    var updatedValues = [
      existingRow[0], // idUser (tetap)
      String(payload.nama).trim(), // Nama (boleh diedit)
      existingRow[2], // username (tetap)
      pHash, // password (diubah jika diisi)
      existingRow[4], // role (TETAP TERKUNCI)
      existingRow[5], // idDesa (TETAP TERKUNCI)
      existingRow[6], // namaDesa (TETAP TERKUNCI)
      existingRow[7], // status (tetap)
      existingRow[8], // createdAt
      now // updatedAt
    ];

    sheet.getRange(rowIndex, 1, 1, updatedValues.length).setValues([updatedValues]);

    logAudit(authUser.idUser, String(payload.nama).trim(), authUser.role, "UPDATE_PROFILE", "USERS", idUser, "Update profil pribadi (Nama/Password)");

    var updatedSession = {
      idUser: existingRow[0],
      nama: String(payload.nama).trim(),
      username: existingRow[2],
      role: existingRow[4],
      idDesa: existingRow[5],
      namaDesa: existingRow[6]
    };

    return {
      success: true,
      message: "Profil Anda berhasil diperbarui.",
      data: updatedSession
    };
  } finally {
    lock.releaseLock();
  }
}

function deleteUser(idUser, authUser) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    // Koordinator & Kader TIDAK BISA delete user
    if (authUser.role !== ROLES.ADMIN) {
      throw new Error("Akses ditolak: Hanya Admin yang dapat menghapus user.");
    }

    var sheet = getSheet(SHEETS.USERS);
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === idUser) {
        sheet.deleteRow(i + 1);
        logAudit(authUser.idUser, authUser.nama, authUser.role, "DELETE_USER", "USERS", idUser, "Hapus user " + idUser);
        return { success: true, message: "User berhasil dihapus." };
      }
    }
    throw new Error("User tidak ditemukan.");
  } finally {
    lock.releaseLock();
  }
}
`
  },
  {
    filename: 'Desa.gs',
    description: 'Master Data Desa / Kelurahan di Kecamatan Darmaraja',
    code: `/**
 * ====================================================================
 * MASTER DESA (Desa.gs)
 * ====================================================================
 */

function getDesaList() {
  var sheet = getSheet(SHEETS.DESA);
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    var defaultDesa = [
      ["DSA-0001", "Cikeusi", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["DSA-0002", "Cieunteung", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["DSA-0003", "Cipaku", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["DSA-0004", "Darmaraja", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["DSA-0005", "Karangpakuan", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["DSA-0006", "Leuwihideung", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["DSA-0007", "Pakualam", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["DSA-0008", "Ranggon", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["DSA-0009", "Sukada", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["DSA-0010", "Sukamenak", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["DSA-0011", "Tarunajaya", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["DSA-0012", "Neglasari", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()]
    ];
    sheet.getRange(2, 1, defaultDesa.length, defaultDesa[0].length).setValues(defaultDesa);
    data = sheet.getDataRange().getValues();
  }
  var list = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0] || String(row[0]).trim() === "" || !row[1] || String(row[1]).trim() === "") {
      continue;
    }
    list.push({
      idDesa: String(row[0]).trim(),
      namaDesa: String(row[1]).trim(),
      status: row[2] ? String(row[2]).trim() : "Aktif",
      createdAt: row[3] || "",
      updatedAt: row[4] || ""
    });
  }
  return list;
}

function saveDesa(payload, authUser) {
  if (authUser.role === ROLES.KADER) {
    throw new Error("Akses ditolak: Kader tidak dapat menambah desa.");
  }
  if (!payload.namaDesa) throw new Error("Nama desa wajib diisi.");

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var sheet = getSheet(SHEETS.DESA);
    var data = sheet.getDataRange().getValues();
    var lastNum = data.length;
    var idDesa = generateId("DSA", lastNum, 4);
    var now = getCurrentTimestamp();

    var newRow = [idDesa, payload.namaDesa.trim(), payload.status || "Aktif", now, now];
    sheet.appendRow(newRow);

    logAudit(authUser.idUser, authUser.nama, authUser.role, "CREATE_DESA", "DESA", idDesa, "Menambahkan desa: " + payload.namaDesa);

    return { success: true, message: "Desa berhasil ditambahkan.", data: { idDesa: idDesa } };
  } finally {
    lock.releaseLock();
  }
}

function updateDesa(payload, authUser) {
  if (authUser.role === ROLES.KADER) {
    throw new Error("Akses ditolak: Kader tidak dapat mengedit desa.");
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var sheet = getSheet(SHEETS.DESA);
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(payload.idDesa).trim()) {
        var now = getCurrentTimestamp();
        var row = [
          String(payload.idDesa).trim(),
          payload.namaDesa || data[i][1],
          payload.status || data[i][2],
          data[i][3],
          now
        ];
        sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
        logAudit(authUser.idUser, authUser.nama, authUser.role, "UPDATE_DESA", "DESA", payload.idDesa, "Update desa " + payload.idDesa);
        return { success: true, message: "Data desa berhasil diperbarui." };
      }
    }
    throw new Error("Desa tidak ditemukan.");
  } finally {
    lock.releaseLock();
  }
}

function deleteDesa(idDesa, authUser) {
  // Koordinator TIDAK DAPAT delete Desa
  if (authUser.role !== ROLES.ADMIN) {
    throw new Error("Akses ditolak: Hanya Admin yang dapat menghapus desa.");
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var sheet = getSheet(SHEETS.DESA);
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(idDesa).trim()) {
        sheet.deleteRow(i + 1);
        logAudit(authUser.idUser, authUser.nama, authUser.role, "DELETE_DESA", "DESA", idDesa, "Hapus desa " + idDesa);
        return { success: true, message: "Desa berhasil dihapus." };
      }
    }
    throw new Error("Desa tidak ditemukan.");
  } finally {
    lock.releaseLock();
  }
}
`
  },
  {
    filename: 'JenisSenam.gs',
    description: 'Master Jenis Senam KORMI',
    code: `/**
 * ====================================================================
 * MASTER JENIS SENAM (JenisSenam.gs)
 * ====================================================================
 */

function getJenisSenamList() {
  var sheet = getSheet(SHEETS.JENIS_SENAM);
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    var defaultJs = [
      ["JS-0001", "Senam Kecamatan Minggu", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["JS-0002", "Senam Kecamatan Jumat", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["JS-0003", "Senam Desa", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["JS-0004", "Senam Jantung Sehat", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["JS-0005", "Senam Lansia Bugar", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()]
    ];
    sheet.getRange(2, 1, defaultJs.length, defaultJs[0].length).setValues(defaultJs);
    data = sheet.getDataRange().getValues();
  }
  var list = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0] || String(row[0]).trim() === "" || !row[1] || String(row[1]).trim() === "") {
      continue;
    }
    list.push({
      idJenis: String(row[0]).trim(),
      namaJenis: String(row[1]).trim(),
      status: row[2] ? String(row[2]).trim() : "Aktif",
      createdAt: row[3] || "",
      updatedAt: row[4] || ""
    });
  }
  return list;
}

function saveJenisSenam(payload, authUser) {
  if (authUser.role === ROLES.KADER) {
    throw new Error("Akses ditolak: Kader tidak dapat menambah jenis senam.");
  }
  if (!payload.namaJenis) throw new Error("Nama jenis senam wajib diisi.");

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var sheet = getSheet(SHEETS.JENIS_SENAM);
    var data = sheet.getDataRange().getValues();
    var lastNum = data.length;
    var idJenis = generateId("JS", lastNum, 4);
    var now = getCurrentTimestamp();

    var newRow = [idJenis, payload.namaJenis.trim(), payload.status || "Aktif", now, now];
    sheet.appendRow(newRow);

    logAudit(authUser.idUser, authUser.nama, authUser.role, "CREATE_JENIS_SENAM", "JENIS_SENAM", idJenis, "Menambahkan jenis senam: " + payload.namaJenis);

    return { success: true, message: "Jenis senam berhasil ditambahkan.", data: { idJenis: idJenis } };
  } finally {
    lock.releaseLock();
  }
}

function updateJenisSenam(payload, authUser) {
  if (authUser.role === ROLES.KADER) {
    throw new Error("Akses ditolak: Kader tidak dapat mengedit jenis senam.");
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var sheet = getSheet(SHEETS.JENIS_SENAM);
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(payload.idJenis).trim()) {
        var now = getCurrentTimestamp();
        var row = [
          String(payload.idJenis).trim(),
          payload.namaJenis || data[i][1],
          payload.status || data[i][2],
          data[i][3],
          now
        ];
        sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
        logAudit(authUser.idUser, authUser.nama, authUser.role, "UPDATE_JENIS_SENAM", "JENIS_SENAM", payload.idJenis, "Update jenis senam " + payload.idJenis);
        return { success: true, message: "Jenis senam berhasil diperbarui." };
      }
    }
    throw new Error("Jenis senam tidak ditemukan.");
  } finally {
    lock.releaseLock();
  }
}

function deleteJenisSenam(idJenis, authUser) {
  // Koordinator TIDAK DAPAT delete Jenis Senam
  if (authUser.role !== ROLES.ADMIN) {
    throw new Error("Akses ditolak: Hanya Admin yang dapat menghapus jenis senam.");
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    var sheet = getSheet(SHEETS.JENIS_SENAM);
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(idJenis).trim()) {
        sheet.deleteRow(i + 1);
        logAudit(authUser.idUser, authUser.nama, authUser.role, "DELETE_JENIS_SENAM", "JENIS_SENAM", idJenis, "Hapus jenis senam " + idJenis);
        return { success: true, message: "Jenis senam berhasil dihapus." };
      }
    }
    throw new Error("Jenis senam tidak ditemukan.");
  } finally {
    lock.releaseLock();
  }
}
`
  },
  {
    filename: 'Audit.gs',
    description: 'Pencatatan Audit Trail Aktivitas Pengguna',
    code: `/**
 * ====================================================================
 * AUDIT LOG SYSTEM (Audit.gs)
 * ====================================================================
 */

function logAudit(idUser, namaUser, role, action, tableName, recordId, description) {
  try {
    var sheet = getSheet(SHEETS.AUDIT_LOG);
    var idLog = "LOG-" + Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMMddHHmmss") + "-" + Math.floor(Math.random() * 900 + 100);
    var timestamp = getCurrentTimestamp();

    var row = [
      idLog,
      timestamp,
      idUser || "-",
      namaUser || "-",
      role || "-",
      action || "-",
      tableName || "-",
      recordId || "-",
      description || "-"
    ];

    sheet.appendRow(row);
  } catch (e) {
    Logger.log("Audit log failed: " + e.message);
  }
}

function getAuditLogs(authUser) {
  if (authUser.role !== ROLES.ADMIN) {
    throw new Error("Akses ditolak: Hanya Admin yang dapat melihat audit log.");
  }

  var sheet = getSheet(SHEETS.AUDIT_LOG);
  var data = sheet.getDataRange().getValues();
  var list = [];

  for (var i = data.length - 1; i >= 1; i--) { // latest first
    var row = data[i];
    list.push({
      idLog: row[0],
      timestamp: row[1],
      idUser: row[2],
      namaUser: row[3],
      role: row[4],
      action: row[5],
      tableName: row[6],
      recordId: row[7],
      description: row[8]
    });
    if (list.length >= 100) break; // Limit 100 logs
  }
  return list;
}
`
  },
  {
    filename: 'Code.gs',
    description: 'Main Entry Point REST API (doGet & doPost Routing)',
    code: `/**
 * ====================================================================
 * LAPORAN SENAM KORMI DARMARAJA V.2
 * MAIN WEB APP ENTRY POINT (Code.gs)
 * ====================================================================
 */

function doGet(e) {
  try {
    var action = e && e.parameter ? e.parameter.action : "health";
    var authUser = null;

    // Aksi publik / status API
    if (action === "health") {
      return formatResponse(true, "API KORMI Darmaraja V.2 is running smoothly.", { version: "2.0.0" });
    }

    // Reference Master Data Publik (Bebas diakses tanpa login)
    if (action === "getDesa" || action === "getDesaPublic") {
      return formatResponse(true, "Data desa berhasil dimuat", getDesaList());
    }

    if (action === "getJenisSenam" || action === "getJenisSenamPublic") {
      return formatResponse(true, "Data jenis senam berhasil dimuat", getJenisSenamList());
    }

    var filter = {};
    if (e.parameter.tanggalMulai) filter.tanggalMulai = e.parameter.tanggalMulai;
    if (e.parameter.tanggalAkhir) filter.tanggalAkhir = e.parameter.tanggalAkhir;
    if (e.parameter.jenisSenam) filter.jenisSenam = e.parameter.jenisSenam;
    if (e.parameter.idDesa) filter.idDesa = e.parameter.idDesa;
    if (e.parameter.idKader) filter.idKader = e.parameter.idKader;
    if (e.parameter.onlyMine === "true") filter.onlyMine = true;

    // Dashboard Publik (Bisa diakses tanpa login)
    if (action === "getDashboard" || action === "getDashboardStats") {
      return formatResponse(true, "Dashboard stats loaded", getDashboardStats(filter));
    }

    if (action === "getSenamTerbanyak") {
      return formatResponse(true, "Data senam terbanyak", getSenamTerbanyak(filter));
    }

    if (action === "getSenamTeraktif") {
      return formatResponse(true, "Data senam desa teraktif", getSenamDesaTeraktif(filter));
    }

    if (action === "getLaporanPublic") {
      return formatResponse(true, "Data laporan publik berhasil dimuat", getLaporanList(filter, { role: "Public" }));
    }

    // Endpoint yang memerlukan autentikasi login (getUsers, getAuditLog, getLaporan terproteksi)
    var authHeader = e.parameter.token || e.parameter.auth || e.parameter.idUser || "";
    var authCheck = verifyAuth(authHeader);
    if (!authCheck.valid) {
      // Jika getLaporan dipanggil tanpa token valid, fallback ke data laporan publik
      if (action === "getLaporan") {
        return formatResponse(true, "Data laporan berhasil dimuat", getLaporanList(filter, { role: "Public" }));
      }
      return formatResponse(false, authCheck.error, null, "SESSION_EXPIRED");
    }
    authUser = authCheck.user;

    switch (action) {
      case "getLaporan":
        return formatResponse(true, "Data laporan berhasil dimuat", getLaporanList(filter, authUser));

      case "getUsers":
        return formatResponse(true, "Data users berhasil dimuat", getUsersList(authUser));

      case "getAuditLog":
        return formatResponse(true, "Data audit log berhasil dimuat", getAuditLogs(authUser));

      default:
        return formatResponse(false, "Action '" + action + "' tidak dikenali.");
    }
  } catch (err) {
    return formatResponse(false, "Terjadi masalah saat memproses data: " + (err && err.message ? err.message : String(err)));
  }
}

function doPost(e) {
  try {
    var postData = {};
    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        postData = e.parameter;
      }
    } else if (e && e.parameter) {
      postData = e.parameter;
    }

    var action = postData.action || (e && e.parameter ? e.parameter.action : "");

    // Endpoint Login tidak perlu auth token
    if (action === "login") {
      var loginRes = handleLogin(postData.username, postData.password);
      return formatResponse(loginRes.success, loginRes.message, loginRes.data);
    }

    // Verifikasi Token
    var tokenValue =
      postData.token ||
      postData.auth ||
      postData.idUser ||
      (e && e.parameter ? (e.parameter.token || e.parameter.auth || e.parameter.idUser) : "");

    var authCheck = verifyAuth(tokenValue);
    if (!authCheck.valid) {
      return formatResponse(false, authCheck.error, null, "SESSION_EXPIRED");
    }
    var authUser = authCheck.user;

    switch (action) {
      case "saveLaporan":
        var saveLapRes = saveLaporan(postData, authUser);
        return formatResponse(saveLapRes.success, saveLapRes.message, saveLapRes.data);

      case "updateLaporan":
        var updLapRes = updateLaporan(postData, authUser);
        return formatResponse(updLapRes.success, updLapRes.message, updLapRes.data);

      case "deleteLaporan":
        var delLapRes = deleteLaporan(postData.idLaporan, authUser);
        return formatResponse(delLapRes.success, delLapRes.message, delLapRes.data);

      case "saveDesa":
        var saveDesRes = saveDesa(postData, authUser);
        return formatResponse(saveDesRes.success, saveDesRes.message, saveDesRes.data);

      case "updateDesa":
        var updDesRes = updateDesa(postData, authUser);
        return formatResponse(updDesRes.success, updDesRes.message, updDesRes.data);

      case "deleteDesa":
        var delDesRes = deleteDesa(postData.idDesa, authUser);
        return formatResponse(delDesRes.success, delDesRes.message, delDesRes.data);

      case "saveJenisSenam":
        var saveJsRes = saveJenisSenam(postData, authUser);
        return formatResponse(saveJsRes.success, saveJsRes.message, saveJsRes.data);

      case "updateJenisSenam":
        var updJsRes = updateJenisSenam(postData, authUser);
        return formatResponse(updJsRes.success, updJsRes.message, updJsRes.data);

      case "deleteJenisSenam":
        var delJsRes = deleteJenisSenam(postData.idJenis, authUser);
        return formatResponse(delJsRes.success, delJsRes.message, delJsRes.data);

      case "saveUser":
        var saveUsrRes = saveUser(postData, authUser);
        return formatResponse(saveUsrRes.success, saveUsrRes.message, saveUsrRes.data);

      case "updateUser":
        var updUsrRes = updateUser(postData, authUser);
        return formatResponse(updUsrRes.success, updUsrRes.message, updUsrRes.data);

      case "updateProfile":
        var updProfRes = updateProfile(postData, authUser);
        return formatResponse(updProfRes.success, updProfRes.message, updProfRes.data);

      case "deleteUser":
        var delUsrRes = deleteUser(postData.idUser, authUser);
        return formatResponse(delUsrRes.success, delUsrRes.message, delUsrRes.data);

      case "uploadFoto":
        var uploadRes = savePhotoToDrive(postData.fotoBase64, postData.idDesa, postData.idKader, postData.tanggal);
        logAudit(authUser.idUser, authUser.nama, authUser.role, "UPLOAD_FOTO", "LAPORAN_SENAM", uploadRes.fileId, "Upload foto " + uploadRes.fileName);
        return formatResponse(true, "Foto berhasil diunggah", uploadRes);

      default:
        return formatResponse(false, "Action '" + action + "' tidak dikenali.");
    }
  } catch (err) {
    return formatResponse(false, "Terjadi masalah saat memproses data: " + err.message);
  }
}
`
  },
  {
    filename: 'Setup.gs',
    description: 'Fungsi Inisialisasi Database Google Sheets dan Folder Google Drive (setupDatabase & seedDemoData)',
    code: `/**
 * ====================================================================
 * DATABASE SETUP & SEEDING SCRIPT (Setup.gs)
 * ====================================================================
 */

/**
 * Inisialisasi awal database Google Sheets dan Google Drive
 * Jalankan fungsi ini SATU KALI saat pertama kali memasang project Apps Script.
 */
function setupDatabase() {
  var ss = getSpreadsheet();

  // 1. Buat / Siapkan Sheet USERS
  var sheetUsers = ss.getSheetByName(SHEETS.USERS) || ss.insertSheet(SHEETS.USERS);
  if (sheetUsers.getLastRow() === 0) {
    sheetUsers.appendRow(HEADERS.USERS);
    sheetUsers.getRange(1, 1, 1, HEADERS.USERS.length).setFontWeight("bold").setBackground("#10b981").setFontColor("#ffffff");
  }

  // 2. Buat / Siapkan Sheet DESA
  var sheetDesa = ss.getSheetByName(SHEETS.DESA) || ss.insertSheet(SHEETS.DESA);
  if (sheetDesa.getLastRow() === 0) {
    sheetDesa.appendRow(HEADERS.DESA);
    sheetDesa.getRange(1, 1, 1, HEADERS.DESA.length).setFontWeight("bold").setBackground("#2563eb").setFontColor("#ffffff");
  }

  // 3. Buat / Siapkan Sheet JENIS_SENAM
  var sheetJs = ss.getSheetByName(SHEETS.JENIS_SENAM) || ss.insertSheet(SHEETS.JENIS_SENAM);
  if (sheetJs.getLastRow() === 0) {
    sheetJs.appendRow(HEADERS.JENIS_SENAM);
    sheetJs.getRange(1, 1, 1, HEADERS.JENIS_SENAM.length).setFontWeight("bold").setBackground("#f97316").setFontColor("#ffffff");
  }

  // 4. Buat / Siapkan Sheet LAPORAN_SENAM
  var sheetLap = ss.getSheetByName(SHEETS.LAPORAN_SENAM) || ss.insertSheet(SHEETS.LAPORAN_SENAM);
  if (sheetLap.getLastRow() === 0) {
    sheetLap.appendRow(HEADERS.LAPORAN_SENAM);
    sheetLap.getRange(1, 1, 1, HEADERS.LAPORAN_SENAM.length).setFontWeight("bold").setBackground("#059669").setFontColor("#ffffff");
  }

  // 5. Buat / Siapkan Sheet AUDIT_LOG
  var sheetAudit = ss.getSheetByName(SHEETS.AUDIT_LOG) || ss.insertSheet(SHEETS.AUDIT_LOG);
  if (sheetAudit.getLastRow() === 0) {
    sheetAudit.appendRow(HEADERS.AUDIT_LOG);
    sheetAudit.getRange(1, 1, 1, HEADERS.AUDIT_LOG.length).setFontWeight("bold").setBackground("#475569").setFontColor("#ffffff");
  }

  // 6. Siapkan Folder Google Drive
  var targetFolder = getOrCreateTargetFolder();

  // 7. Buat Desa Default Kecamatan Darmaraja jika kosong
  if (sheetDesa.getLastRow() <= 1) {
    var desaList = [
      ["DSA-0001", "Cikeusi", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["DSA-0002", "Cieunteung", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["DSA-0003", "Cipaku", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["DSA-0004", "Darmaraja", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["DSA-0005", "Karangpakuan", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["DSA-0006", "Leuwihideung", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["DSA-0007", "Pakualam", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["DSA-0008", "Ranggon", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["DSA-0009", "Sukada", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["DSA-0010", "Sukamenak", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["DSA-0011", "Tarunajaya", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["DSA-0012", "Neglasari", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()]
    ];
    sheetDesa.getRange(2, 1, desaList.length, desaList[0].length).setValues(desaList);
  }

  // 8. Buat Jenis Senam Default jika kosong
  if (sheetJs.getLastRow() <= 1) {
    var jsList = [
      ["JS-0001", "Senam Kecamatan Minggu", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["JS-0002", "Senam Kecamatan Jumat", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["JS-0003", "Senam Desa", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["JS-0004", "Senam Jantung Sehat", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["JS-0005", "Senam Lansia Bugar", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()]
    ];
    sheetJs.getRange(2, 1, jsList.length, jsList[0].length).setValues(jsList);
  }

  // 9. Buat Akun Admin Default jika belum ada
  if (sheetUsers.getLastRow() <= 1) {
    var adminHash = hashPassword("admin123");
    var coordHash = hashPassword("koordinator123");
    var kaderHash = hashPassword("kader123");

    var initialUsers = [
      ["USR-0001", "H. Asep Rohmat, S.Pd", "admin", adminHash, "Admin", "DSA-0004", "Darmaraja", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["USR-0002", "Dra. Hj. Siti Maryam", "koordinator", coordHash, "Koordinator", "DSA-0004", "Darmaraja", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["USR-0003", "Neneng Sumiati", "kader.darmaraja", kaderHash, "Kader", "DSA-0004", "Darmaraja", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()]
    ];
    sheetUsers.getRange(2, 1, initialUsers.length, initialUsers[0].length).setValues(initialUsers);
  }

  logAudit("SYSTEM", "System Setup", "Admin", "CREATE_USER", "SYSTEM", "INIT", "setupDatabase() berhasil dijalankan.");
  Logger.log("✅ setupDatabase() BERHASIL! Seluruh Sheet dan Folder Google Drive telah dibuat.");
}

/**
 * SEED DEMO DATA
 * PERHATIAN: Fungsi ini HANYA digunakan saat testing/development untuk mengisi data sampel kegiatan senam.
 * JANGAN jalankan di lingkungan production yang sudah memiliki data riil!
 */
function seedDemoData() {
  var sheetLap = getSheet(SHEETS.LAPORAN_SENAM);
  if (sheetLap.getLastRow() > 1) {
    Logger.log("Sheet LAPORAN_SENAM sudah memiliki data. Tidak melakukan overwrite.");
    return;
  }

  var demoReports = [
    ["LAP-20260828-0001", "DSA-0004", "Darmaraja", "USR-0003", "Neneng Sumiati", "2026-08-28", 48, "Senam Kecamatan Jumat", "Hadir", "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800", "DEMO_1", "Senam Jumat Pagi Alun-Alun Darmaraja", "CAMERA", getCurrentTimestamp(), getCurrentTimestamp()],
    ["LAP-20260827-0002", "DSA-0001", "Cikeusi", "USR-0003", "Neneng Sumiati", "2026-08-27", 36, "Senam Desa", "Hadir", "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800", "DEMO_2", "Senam Desa Cikeusi RW 02 Lapangan Voli", "CAMERA", getCurrentTimestamp(), getCurrentTimestamp()],
    ["LAP-20260826-0003", "DSA-0003", "Cipaku", "USR-0003", "Neneng Sumiati", "2026-08-26", 42, "Senam Desa", "Hadir", "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800", "DEMO_3", "Senam SKJ Dusun Babakan", "CAMERA", getCurrentTimestamp(), getCurrentTimestamp()],
    ["LAP-20260824-0004", "DSA-0004", "Darmaraja", "USR-0003", "Neneng Sumiati", "2026-08-24", 65, "Senam Kecamatan Minggu", "Hadir", "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800", "DEMO_4", "Senam Minggu KORMI Bersama Camat Darmaraja", "CAMERA", getCurrentTimestamp(), getCurrentTimestamp()]
  ];

  sheetLap.getRange(2, 1, demoReports.length, demoReports[0].length).setValues(demoReports);
  Logger.log("✅ seedDemoData() BERHASIL! 4 data sampel kegiatan senam telah ditambahkan.");
}
`
  }
];
