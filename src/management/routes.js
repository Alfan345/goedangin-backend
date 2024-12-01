const Joi = require("joi");
const {
  postSetorBarang,
  postTarikBarang,
  getSetorBarang,
  getTarikBarang,
  prediksiHarga,
  laporanBarang,
  cekResi,
} = require("./controller");
const { path } = require("pdfkit");
const { verifyToken } = require("../middlewares/authMiddleware");

const routes = [
  {
    method: "GET",
    path: "/dashboard",
    handler: async (request, h) => {
      try {
        // Verifikasi token dan dapatkan email user
        const { email } = verifyToken(request, h);

        // Ambil data barang berdasarkan email user
        const conn = await getDB().getConnection();
        const [rows] = await conn.query(
          "SELECT * FROM barang WHERE user_email = ?",
          [email]
        );
        conn.release();

        return h.response(rows).code(200);
      } catch (error) {
        console.error("Error:", error.message);
        return h.response({ message: error.message }).code(401);
      }
    },
    options: {
      auth: false, // Jika JWT auth default diaktifkan di `index.js`, set false untuk handle manual
    },
  },
  {
    method: "POST",
    path: "/setor-barang",
    options: {
      validate: {
        payload: Joi.object({
          nama_penyetor: Joi.string().required(),
          no_telp: Joi.string().required(),
          jumlah_barang: Joi.number().required(),
          harga_barang: Joi.number().required(),
          harga_pasar_saat_ini: Joi.number().required(),
          jenis_barang: Joi.string().required(),
        }),
      },
    },
    handler: postSetorBarang,
  },
  {
    method: "GET",
    path: "/setor-barang",
    handler: getSetorBarang,
  },

  {
    method: "POST",
    path: "/tarik-barang",
    options: {
      validate: {
        payload: Joi.object({
          resi: Joi.string().required(),
          harga_baru: Joi.number().required(),
          jumlah_ditarik: Joi.number().required(),
        }),
      },
    },
    handler: postTarikBarang,
  },
  {
    method: "GET",
    path: "/tarik-barang",
    handler: getTarikBarang,
  },
  {
    method: "GET",
    path: "/prediksi",
    handler: prediksiHarga,
  },
  {
    method: "GET",
    path: "/laporan/{resi}",
    handler: laporanBarang,
  },
  {
    method: "GET",
    path: "/cek-resi/{resi}",
    handler: cekResi,
  },
];

module.exports = routes;
