/**
 * ====================================================================
 * DASHBOARD & AGREGASI STATISTIK (Dashboard.gs)
 * ====================================================================
 */

function getDashboardStats(filter) {
  var laporanSheet = getSheet(SHEETS.LAPORAN_SENAM);
  var lapData = laporanSheet.getDataRange().getValues();

  var desaSheet = getSheet(SHEETS.DESA);
  var desaData = desaSheet.getDataRange().getValues();

  var usersSheet = getSheet(SHEETS.USERS);
  var usersData = usersSheet.getDataRange().getValues();

  var currentMonthStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM");

  var totalKegiatan = 0;
  var totalPeserta = 0;
  var kegiatanBulanIni = 0;
  var pesertaBulanIni = 0;

  var totalDesaAktif = 0;
  for (var d = 1; d < desaData.length; d++) {
    if (desaData[d][2] === "Aktif") totalDesaAktif++;
  }

  var totalKaderAktif = 0;
  for (var u = 1; u < usersData.length; u++) {
    if (usersData[u][4] === ROLES.KADER && usersData[u][7] === "Aktif") totalKaderAktif++;
  }

  for (var i = 1; i < lapData.length; i++) {
    var row = lapData[i];
    var tgl = Utilities.formatDate(new Date(row[5]), "Asia/Jakarta", "yyyy-MM-dd");
    var peserta = Number(row[6]) || 0;
    var status = row[8];

    if (status === "Hadir") {
      totalKegiatan++;
      totalPeserta += peserta;

      if (tgl.indexOf(currentMonthStr) === 0) {
        kegiatanBulanIni++;
        pesertaBulanIni += peserta;
      }
    }
  }

  return {
    totalKegiatan: totalKegiatan,
    totalPeserta: totalPeserta,
    totalDesa: totalDesaAktif,
    totalKader: totalKaderAktif,
    kegiatanBulanIni: kegiatanBulanIni,
    pesertaBulanIni: pesertaBulanIni
  };
}

function getSenamTerbanyak(filter) {
  var sheet = getSheet(SHEETS.LAPORAN_SENAM);
  var data = sheet.getDataRange().getValues();
  var grouping = {};

  var fStart = filter && filter.tanggalMulai ? new Date(filter.tanggalMulai) : null;
  var fEnd = filter && filter.tanggalAkhir ? new Date(filter.tanggalAkhir) : null;

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var jenis = row[7];
    var peserta = Number(row[6]) || 0;
    var itemDate = new Date(row[5]);

    if (fStart && itemDate < fStart) continue;
    if (fEnd && itemDate > fEnd) continue;
    if (filter && filter.jenisSenam && filter.jenisSenam !== "" && jenis !== filter.jenisSenam) continue;

    if (!grouping[jenis]) {
      grouping[jenis] = { jenisSenam: jenis, jumlahKegiatan: 0, totalPeserta: 0 };
    }
    grouping[jenis].jumlahKegiatan += 1;
    grouping[jenis].totalPeserta += peserta;
  }

  var list = [];
  for (var k in grouping) {
    list.push(grouping[k]);
  }
  list.sort(function(a, b) { return b.jumlahKegiatan - a.jumlahKegiatan; });
  return list;
}

function getSenamDesaTeraktif(filter) {
  var sheet = getSheet(SHEETS.LAPORAN_SENAM);
  var data = sheet.getDataRange().getValues();
  var desaGrouping = {};

  var fStart = filter && filter.tanggalMulai ? new Date(filter.tanggalMulai) : null;
  var fEnd = filter && filter.tanggalAkhir ? new Date(filter.tanggalAkhir) : null;

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var jenis = row[7];
    var idDesa = row[1];
    var namaDesa = row[2];
    var peserta = Number(row[6]) || 0;
    var itemDate = new Date(row[5]);

    // HANYA JENIS_SENAM = "Senam Desa"
    if (jenis !== "Senam Desa") continue;

    if (fStart && itemDate < fStart) continue;
    if (fEnd && itemDate > fEnd) continue;
    if (filter && filter.idDesa && filter.idDesa !== "" && idDesa !== filter.idDesa) continue;

    if (!desaGrouping[idDesa]) {
      desaGrouping[idDesa] = {
        idDesa: idDesa,
        namaDesa: namaDesa,
        totalKegiatan: 0,
        totalPeserta: 0
      };
    }
    desaGrouping[idDesa].totalKegiatan += 1;
    desaGrouping[idDesa].totalPeserta += peserta;
  }

  var list = [];
  for (var d in desaGrouping) {
    list.push(desaGrouping[d]);
  }
  // Ranking: urutkan dari kegiatan terbanyak
  list.sort(function(a, b) { return b.totalKegiatan - a.totalKegiatan; });
  return list;
}
