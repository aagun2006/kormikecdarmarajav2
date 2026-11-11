/**
 * ====================================================================
 * GOOGLE DRIVE STORAGE (Drive.gs)
 * ====================================================================
 */

function getOrCreateTargetFolder() {
  var folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(DRIVE_FOLDER_NAME);
}

function savePhotoToDrive(base64Data, idDesa, idKader, tanggalStr) {
  try {
    var folder = getOrCreateTargetFolder();
    var cleanBase64 = base64Data;
    var mimeType = "image/jpeg";

    if (base64Data.indexOf("data:") === 0) {
      var parts = base64Data.split(";base64,");
      mimeType = parts[0].replace("data:", "");
      cleanBase64 = parts[1];
    }

    var decodedBlob = Utilities.newBlob(Utilities.base64Decode(cleanBase64), mimeType);
    var dateFormatted = (tanggalStr || "").replace(/-/g, "") || Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMMdd");
    var timeFormatted = Utilities.formatDate(new Date(), "Asia/Jakarta", "HHmmss");
    var cleanDesa = (idDesa || "DSA-0000").replace(/[^a-zA-Z0-9_-]/g, "");
    var cleanKader = (idKader || "USR-0000").replace(/[^a-zA-Z0-9_-]/g, "");

    // Format nama file: YYYYMMDD_IDDESA_IDKADER_TIMESTAMP.jpg
    var fileName = dateFormatted + "_" + cleanDesa + "_" + cleanKader + "_" + timeFormatted + ".jpg";
    decodedBlob.setName(fileName);

    var file = folder.createFile(decodedBlob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Direct Google Drive image preview URL
    var fileId = file.getId();
    var directUrl = "https://lh3.googleusercontent.com/d/" + fileId;

    return {
      fileId: fileId,
      url: directUrl,
      fileName: fileName
    };
  } catch (err) {
    throw new Error("Gagal menyimpan foto ke Google Drive: " + err.message);
  }
}
