# 📁 Kumpulan File Google Apps Script (GAS) KORMI Darmaraja V.2

Folder ini berisi seluruh file modular `.gs` yang dapat Anda salin (copy-paste) satu per satu ke Google Apps Script tanpa takut salah gabung.

---

## 🗂️ Daftar File dan Fungsinya:

| No | Nama File | Fungsi & Keterangan |
|---|---|---|
| 1 | `Config.gs` | Konfigurasi utama: Nama Sheet, Header Kolom, Folder Drive, dan Role. |
| 2 | `Utils.gs` | Fungsi pembantu: Hashing SHA-256, format tanggal, auto-generate ID record. |
| 3 | `Auth.gs` | Logika autentikasi login, validasi password hash, dan permission RBAC. |
| 4 | `Laporan.gs` | CRUD data laporan senam, aturan wajib foto kamera jika status "Hadir". |
| 5 | `Dashboard.gs` | Perhitungan agregasi statistik, chart Senam Terbanyak, dan ranking Desa Teraktif. |
| 6 | `Drive.gs` | Penyimpanan file gambar Base64 ke folder Google Drive & generate URL publik. |
| 7 | `Users.gs` | Manajemen master data pengguna (Admin, Koordinator, Kader). |
| 8 | `Desa.gs` | Manajemen master data 12 Desa di Kecamatan Darmaraja. |
| 9 | `JenisSenam.gs` | Manajemen master jenis senam (Senam Kecamatan, Senam Desa, dll). |
| 10 | `Audit.gs` | Pencatatan rekam jejak audit log keamanan & perubahan database. |
| 11 | `Code.gs` | **Entry point utama** penanganan REST API (`doGet` & `doPost`). |
| 12 | `Setup.gs` | Fungsi inisialisasi awal database (`setupDatabase()`) dan pembuat header sheet. |

---

## 🚀 Langkah Pemasangan di Google Spreadsheet:

1. **Buka Google Spreadsheet Baru**:
   - Buat spreadsheet baru di Google Drive (beri judul: `DB_KORMI_DARMARAJA_V2`).
   - Salin **Spreadsheet ID** dari URL browser:
     `https://docs.google.com/spreadsheets/d/`**`[SPREADSHEET_ID_DISINI]`**`/edit`

2. **Buka Apps Script**:
   - Klik menu **Ekstensi (Extensions) > Apps Script**.

3. **Buat File Script Sesuai Daftar di Atas**:
   - Klik tombol **+** di samping Files > pilih **Script**.
   - Buat file satu per satu dengan nama:
     - `Config`
     - `Utils`
     - `Auth`
     - `Laporan`
     - `Dashboard`
     - `Drive`
     - `Users`
     - `Desa`
     - `JenisSenam`
     - `Audit`
     - `Code`
     - `Setup`
   - Salin isi dari masing-masing file di folder ini ke file Apps Script yang bersesuaian.

4. **Konfigurasi Script Properties (Opsional tapi Direkomendasikan)**:
   - Di Apps Script, klik **Project Settings** (ikon gerigi di kiri).
   - Scroll ke **Script Properties** > Klik **Add script property**.
   - Properti: `SPREADSHEET_ID`, Nilai: `[ID Spreadsheet Anda]`.
   - *(Atau Anda bisa langsung mengisinya di baris ke-19 pada `Config.gs`)*.

5. **Jalankan Inisialisasi Database**:
   - Buka file `Setup.gs`.
   - Di toolbar atas, pilih fungsi **`setupDatabase`** lalu klik **Run** (Jalankan).
   - Berikan izin akses (*Review Permissions* > Pilih akun Google Anda > *Advanced* > *Go to (unsafe)* > *Allow*).
   - Periksa Google Spreadsheet Anda, sheet `USERS`, `DESA`, `JENIS_SENAM`, `LAPORAN_SENAM`, dan `AUDIT_LOG` akan terisi otomatis dengan data 12 Desa dan akun default!

6. **Deploy Web App**:
   - Klik tombol biru **Deploy > New deployment**.
   - Pilih jenis: **Web app**.
   - Description: `KORMI Darmaraja V2 Production`.
   - Execute as: **Me (email Anda)**.
   - Who has access: **Anyone** *(PENTING agar frontend web app dapat mengirim laporan)*.
   - Klik **Deploy**.
   - Salin **Web app URL** yang berakhiran `/exec`.

7. **Hubungkan ke Frontend Web App**:
   - Buka aplikasi web KORMI Darmaraja ini.
   - Login (default: `admin` / `password` atau `admin123`).
   - Buka menu **Profil** > tempel Web App URL pada kolom **Google Apps Script Web App Exec URL**.
   - Klik **Uji Koneksi Server** lalu **Simpan Konfigurasi**.
