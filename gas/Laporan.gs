/**
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

    // STRICT ROLE IDENTITAS: Ambil identitas langsung dari sesi auth terverifikasi
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
