/**
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
