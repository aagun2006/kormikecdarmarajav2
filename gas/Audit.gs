/**
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
