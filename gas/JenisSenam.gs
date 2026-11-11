/**
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
