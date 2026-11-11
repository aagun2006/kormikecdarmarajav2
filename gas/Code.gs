/**
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
    return formatResponse(false, "Terjadi masalah saat memproses data: " + (err && err.message ? err.message : String(err)));
  }
}
