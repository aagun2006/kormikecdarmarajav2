/**
 * ====================================================================
 * LAPORAN SENAM KORMI DARMARAJA V.2
 * CONFIGURATION FILE (Config.gs)
 * ====================================================================
 */

// Ganti SPREADSHEET_ID dengan ID Google Spreadsheet Anda jika tidak menggunakan Container-Bound Script
var SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty("1jjdrCUkxS68ZTbZKce2iaCRydGEZb-pBJjydIDnMfZY") || "";

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
