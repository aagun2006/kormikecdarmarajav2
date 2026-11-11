/**
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
      ["DSA-0003", "Cipeuteuy", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["DSA-0004", "Darmaraja", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["DSA-0005", "Karangpakuan", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["DSA-0006", "Darmajaya", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["DSA-0007", "Pakualam", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["DSA-0008", "Ranggon", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
      ["DSA-0009", "Sukaratu", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()],
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
      ["JS-0003", "Senam Desa", "Aktif", getCurrentTimestamp(), getCurrentTimestamp()]
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

/**
function seedDemoData() {
  return;
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
