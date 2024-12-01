const db = require("../database");
const generateResiCode = require("../utils/resiGenerator");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const { get } = require("https");

const dashboard = async (request, h) => {
  const { email } = request.auth.credentials; // Email dari JWT
  const conn = await getDB().getConnection();
  const [rows] = await conn.query("SELECT * FROM barang WHERE user_email = ?", [
    email,
  ]);
  conn.release();
  return h.response(rows).code(200);
};

const postSetorBarang = async (request, h) => {
  const {
    nama_penyetor,
    no_telp,
    jumlah_barang,
    harga_barang,
    harga_pasar_saat_ini,
    jenis_barang,
  } = request.payload;
  const resi = generateResiCode(jenis_barang);

  try {
    await db.execute(
      `INSERT INTO setor_barang (nama_penyetor, no_telp, jumlah_barang, harga_barang, harga_pasar_saat_ini, resi, jenis_barang) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nama_penyetor,
        no_telp,
        jumlah_barang,
        harga_barang,
        harga_pasar_saat_ini,
        resi,
        jenis_barang,
      ]
    );
    return h.response({ message: "Barang berhasil disetor", resi }).code(201);
  } catch (err) {
    console.error(err);
    return h.response({ message: "Terjadi kesalahan" }).code(500);
  }
};

const getSetorBarang = async (request, h) => {
  try {
    const [data] = await db.execute("SELECT * FROM setor_barang");
    return h.response(data).code(200);
  } catch (err) {
    console.error(err);
    return h.response({ message: "Terjadi kesalahan" }).code(500);
  }
};

const postTarikBarang = async (request, h) => {
  const { resi, harga_baru, jumlah_ditarik } = request.payload;

  try {
    const [barang] = await db.execute(
      "SELECT * FROM setor_barang WHERE resi = ?",
      [resi]
    );

    if (barang.length === 0) {
      return h.response({ message: "Resi tidak ditemukan" }).code(404);
    }

    const currentBarang = barang[0];
    const harga_lama = currentBarang.harga_pasar_saat_ini;
    const jumlah_sisa = currentBarang.jumlah_barang - jumlah_ditarik;

    if (jumlah_sisa < 0) {
      return h
        .response({
          message: "Jumlah barang yang ditarik melebihi jumlah yang tersedia",
        })
        .code(400);
    }

    await db.execute(
      "UPDATE setor_barang SET jumlah_barang = ?, harga_pasar_saat_ini = ? WHERE resi = ?",
      [jumlah_sisa, harga_baru, resi]
    );

    await db.execute(
      "INSERT INTO tarik_barang (resi, jumlah_ditarik, harga_lama, harga_baru, perbedaan_harga) VALUES (?, ?, ?, ?, ?)",
      [resi, jumlah_ditarik, harga_lama, harga_baru, harga_baru - harga_lama]
    );

    return h.response({ message: "Barang berhasil ditarik" }).code(201);
  } catch (err) {
    console.error(err);
    return h.response({ message: "Terjadi kesalahan" }).code(500);
  }
};

const getTarikBarang = async (request, h) => {
  try {
    const [data] = await db.execute("SELECT * FROM tarik_barang");
    return h.response(data).code(200);
  } catch (err) {
    console.error(err);
    return h.response({ message: "Terjadi kesalahan" }).code(500);
  }
};

const prediksiHarga = async (request, h) => {
  const prediction = { barang: "Bawang", prediksi_harga: 45000 };
  return h.response(prediction).code(200);
};

const laporanBarang = async (request, h) => {
  const { resi } = request.params;

  try {
    const [setorData] = await db.execute(
      "SELECT * FROM setor_barang WHERE resi = ?",
      [resi]
    );
    const [tarikData] = await db.execute(
      "SELECT * FROM tarik_barang WHERE resi = ?",
      [resi]
    );

    if (setorData.length === 0) {
      return h.response({ message: "Resi tidak ditemukan" }).code(404);
    }

    const doc = new PDFDocument();
    const filePath = `./laporan-${resi}.pdf`;
    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(16).text(`Laporan Resi: ${resi}`);

    doc.text("\nData Setor Barang:\n");
    setorData.forEach((item) => {
      doc.text(JSON.stringify(item));
    });

    doc.text("\nData Tarik Barang:\n");
    tarikData.forEach((item) => {
      doc.text(JSON.stringify(item));
    });

    doc.end();

    return h.file(filePath);
  } catch (err) {
    console.error(err);
    return h.response({ message: "Terjadi kesalahan" }).code(500);
  }
};

const cekResi = async (request, h) => {
  const { resi } = request.params;

  try {
    const [data] = await db.execute(
      "SELECT * FROM setor_barang WHERE resi = ?",
      [resi]
    );

    if (data.length === 0) {
      return h.response({ message: "Resi tidak ditemukan" }).code(404);
    }

    return h.response(data[0]).code(200);
  } catch (err) {
    console.error(err);
    return h.response({ message: "Terjadi kesalahan" }).code(500);
  }
};

module.exports = {
  postSetorBarang,
  postTarikBarang,
  getSetorBarang,
  getTarikBarang,
  prediksiHarga,
  laporanBarang,
  cekResi,
  dashboard,
};
