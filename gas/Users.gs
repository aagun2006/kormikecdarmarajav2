/**
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
