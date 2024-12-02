const { db } = require("../database");
const generateResiCode = require("../utils/resiGenerator");
const { writeFile } = require("fs").promises;
const pdfmake = require("pdfmake");
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

  const { email } = request.auth.credentials; // Email dari token JWT
  const resi = generateResiCode(jenis_barang);

  try {
    await db.execute(
      `INSERT INTO setor_barang (nama_penyetor, no_telp, jumlah_barang, harga_barang, harga_pasar_saat_ini, resi, jenis_barang, user_email) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nama_penyetor,
        no_telp,
        jumlah_barang,
        harga_barang,
        harga_pasar_saat_ini,
        resi,
        jenis_barang,
        email,
      ]
    );
    return h.response({ message: "Barang berhasil disetor", resi }).code(201);
  } catch (err) {
    console.error(err);
    return h.response({ message: "Terjadi kesalahan" }).code(500);
  }
};


const getSetorBarang = async (request, h) => {
  const { email } = request.auth.credentials;

  try {
    const [data] = await db.execute(
      "SELECT id, nama_penyetor, no_telp, jumlah_barang, harga_barang, harga_pasar_saat_ini, resi, jenis_barang FROM setor_barang WHERE user_email = ?",
      [email]
    );

    return h.response(data).code(200);
  } catch (err) {
    console.error(err);
    return h.response({ message: "Terjadi kesalahan" }).code(500);
  }
};


const postTarikBarang = async (request, h) => {
  const { resi, harga_baru, jumlah_ditarik } = request.payload;
  const { email } = request.auth.credentials; // Email dari token JWT

  try {
    const [barang] = await db.execute(
      "SELECT * FROM setor_barang WHERE resi = ? AND user_email = ?",
      [resi, email] // Pastikan resi milik pengguna
    );

    if (barang.length === 0) {
      return h
        .response({ message: "Resi tidak ditemukan atau bukan milik Anda" })
        .code(404);
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
      "UPDATE setor_barang SET jumlah_barang = ?, harga_pasar_saat_ini = ? WHERE resi = ? AND user_email = ?",
      [jumlah_sisa, harga_baru, resi, email] // Update berdasarkan email
    );

    await db.execute(
      "INSERT INTO tarik_barang (resi, jumlah_ditarik, harga_lama, harga_baru, perbedaan_harga, user_email) VALUES (?, ?, ?, ?, ?, ?)",
      [
        resi,
        jumlah_ditarik,
        harga_lama,
        harga_baru,
        harga_baru - harga_lama,
        email,
      ] 
    );

    return h.response({ message: "Barang berhasil ditarik" }).code(201);
  } catch (err) {
    console.error(err);
    return h.response({ message: "Terjadi kesalahan" }).code(500);
  }
};


const getTarikBarang = async (request, h) => {
  const { email } = request.auth.credentials;

  try {
    const [data] = await db.execute(
      "SELECT id, resi, jumlah_ditarik, harga_lama, harga_baru, perbedaan_harga FROM tarik_barang WHERE user_email = ?",
      [email]
    );

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
  const { email } = request.auth.credentials;

  try {
    const [setorData] = await db.execute(
      "SELECT nama_penyetor, no_telp, jumlah_barang, harga_barang, harga_pasar_saat_ini, jenis_barang FROM setor_barang WHERE resi = ? AND user_email = ?",
      [resi, email]
    );

    const [tarikData] = await db.execute(
      "SELECT jumlah_ditarik, harga_lama, harga_baru, perbedaan_harga FROM tarik_barang WHERE resi = ? AND user_email = ?",
      [resi, email]
    );

    if (setorData.length === 0) {
      return h.response({ message: "Resi tidak ditemukan" }).code(404);
    }

    // Konfigurasi font
    const fonts = {
      Roboto: {
        normal: "node_modules/pdfmake/build/vfs_fonts.js",
      },
    };

    const printer = new pdfmake(fonts);

    // Konten laporan
    const content = [
      { text: `Laporan Resi: ${resi}`, style: "header" },
      { text: "\nData Setor Barang", style: "subheader" },
      {
        table: {
          widths: ["*", "*", "*", "*", "*", "*"],
          body: [
            [
              "Nama Penyetor",
              "No Telp",
              "Jumlah Barang",
              "Harga Barang",
              "Harga Pasar Saat Ini",
              "Jenis Barang",
            ],
            ...setorData.map((item) => [
              item.nama_penyetor,
              item.no_telp,
              item.jumlah_barang,
              item.harga_barang,
              item.harga_pasar_saat_ini,
              item.jenis_barang,
            ]),
          ],
        },
      },
      { text: "\nData Tarik Barang", style: "subheader" },
      {
        table: {
          widths: ["*", "*", "*", "*"],
          body: [
            ["Jumlah Ditarik", "Harga Lama", "Harga Baru", "Perbedaan Harga"],
            ...tarikData.map((item) => [
              item.jumlah_ditarik,
              item.harga_lama,
              item.harga_baru,
              item.perbedaan_harga,
            ]),
          ],
        },
      },
    ];

    // Gaya dokumen
    const styles = {
      header: { fontSize: 18, bold: true },
      subheader: { fontSize: 14, bold: true },
    };

    // Konfigurasi dokumen
    const docDefinition = { content, styles };

    // File path untuk menyimpan
    const filePath = `./laporan-${resi}.pdf`;

    // Generate PDF
    return new Promise((resolve, reject) => {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const writeStream = fs.createWriteStream(filePath);

      pdfDoc.pipe(writeStream);
      pdfDoc.end();

      writeStream.on("finish", () => {
        resolve(h.file(filePath));
      });

      writeStream.on("error", (err) => {
        console.error(err);
        reject(h.response({ message: "Terjadi kesalahan" }).code(500));
      });
    });
  } catch (err) {
    console.error(err);
    return h.response({ message: "Terjadi kesalahan" }).code(500);
  }
};


const cekResi = async (request, h) => {
  const { resi } = request.params;
  const { email } = request.auth.credentials;

  try {
    const [data] = await db.execute(
      "SELECT id, nama_penyetor, no_telp, jumlah_barang, harga_barang, harga_pasar_saat_ini, resi, jenis_barang FROM setor_barang WHERE resi = ? AND user_email = ?",
      [resi, email]
    );

    if (data.length === 0) {
      return h
        .response({ message: "Resi tidak ditemukan atau bukan milik Anda" })
        .code(404);
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
