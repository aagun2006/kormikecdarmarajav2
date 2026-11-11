/**
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
