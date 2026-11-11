/**
 * ====================================================================
 * UTILITY & HELPER FUNCTIONS (Utils.gs)
 * ====================================================================
 */

function getSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID !== "") {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  try {
    return SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    throw new Error("Spreadsheet tidak ditemukan. Silakan konfigurasi SPREADSHEET_ID di Script Properties.");
  }
}

function getSheet(sheetName) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (typeof HEADERS !== "undefined" && HEADERS && HEADERS[sheetName]) {
      sheet.appendRow(HEADERS[sheetName]);
      sheet.getRange(1, 1, 1, HEADERS[sheetName].length).setFontWeight("bold");
    }
  }
  return sheet;
}

function formatResponse(success, message, data, code) {
  var output = {
    success: success,
    message: message,
    data: data || null
  };
  if (code) output.code = code;
  return ContentService
    .createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

function hashPassword(password) {
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
  var txtHash = "";
  for (var i = 0; i < rawHash.length; i++) {
    var byteVal = rawHash[i];
    if (byteVal < 0) byteVal += 256;
    var byteHex = byteVal.toString(16);
    if (byteHex.length === 1) byteHex = "0" + byteHex;
    txtHash += byteHex;
  }
  return txtHash;
}

function getCurrentTimestamp() {
  return Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
}

function getCurrentDate() {
  return Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");
}

function generateId(prefix, lastNumber, padding) {
  padding = padding || 4;
  var numStr = ("00000000" + lastNumber).slice(-padding);
  return prefix + "-" + numStr;
}

function generateLaporanId(lastNumber) {
  var dateStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMMdd");
  var numStr = ("0000" + lastNumber).slice(-4);
  return "LAP-" + dateStr + "-" + numStr;
}

function formatSafeDate(val) {
  if (!val) return "";
  if (typeof val === "string") {
    var trimmed = val.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.slice(0, 10);
    }
  }
  try {
    var d = new Date(val);
    if (isNaN(d.getTime())) return "";
    return Utilities.formatDate(d, "Asia/Jakarta", "yyyy-MM-dd");
  } catch (e) {
    return String(val).slice(0, 10);
  }
}
