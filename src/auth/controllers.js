require('dotenv').config();

const bcrypt = require("bcrypt");
const { generateToken } = require("./jwt");
const { db } = require("../database");
const { sendWhatsAppMessage } = require("./waservice");
const { errorHandler } = require("../utils/errorHandler");
const { verifyToken } = require("../middlewares/authMiddleware");
const secretKey = process.env.SECRET_KEY;

const userController = {
  registrasi: async (request, h) => {
    const { namaPerusahaan, email, nomorTelpon, kapasitasGudang, lokasiMitra } =
      request.payload;

    try {
      const conn = await db.getConnection();
      const query = `INSERT INTO users (nama_perusahaan, email, nomor_telpon, kapasitas_gudang, lokasi_mitra, status) 
                            VALUES (?, ?, ?, ?, ?, 'pending')`;
      await conn.execute(query, [
        namaPerusahaan,
        email,
        nomorTelpon,
        kapasitasGudang,
        lokasiMitra,
      ]);
      conn.release();

      return h
        .response({
          message: "Registrasi berhasil, menunggu persetujuan admin",
        })
        .code(201);
    } catch (error) {
      return errorHandler(h, error, "Gagal registrasi");
    }
  },

  approveUser: async (request, h) => {
    const { userId, password } = request.payload;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const conn = await db.getConnection();

      const query = `UPDATE users SET status = 'approved', password = ? WHERE id = ? AND status = 'pending'`;
      const result = await conn.execute(query, [hashedPassword, userId]);

      if (result[0].affectedRows === 0) {
        return h
          .response({ message: "User tidak ditemukan atau sudah disetujui" })
          .code(400);
      }

      const [userData] = await conn.query(
        `SELECT email, nomor_telpon FROM users WHERE id = ?`,
        [userId]
      );
      const user = userData[0];
      sendWhatsAppMessage(
        user.nomor_telpon,
        `Akun Anda telah disetujui. Login: ${user.email}, Password: ${password}`
      );
      conn.release();

      return h
        .response({
          message: "User disetujui, detail login dikirim via WhatsApp",
        })
        .code(200);
    } catch (error) {
      return errorHandler(h, error, "Gagal menyetujui user");
    }
  },

  login: async (request, h) => {
    const { email, password } = request.payload;

    try {
      const conn = await db.getConnection();
      const [rows] = await conn.query("SELECT * FROM users WHERE email = ?", [
        email,
      ]);
      conn.release();

      if (rows.length === 0) {
        return h.response({ message: "Email tidak ditemukan" }).code(404);
      }

      const user = rows[0];
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return h.response({ message: "Password salah" }).code(401);
      }

      const token = generateToken(user.email);
      return h.response({ message: "Login berhasil", token }).code(200);
    } catch (error) {
      return errorHandler(h, error, "Gagal login");
    }
  },

  getProfile: async (request, h) => {
    try {
      const decoded = verifyToken(request, h);
      const conn = await db.getConnection();
      const [rows] = await conn.query("SELECT * FROM users WHERE email = ?", [
        decoded.email,
      ]);
      conn.release();

      if (rows.length === 0) {
        return h.response({ message: "User tidak ditemukan" }).code(404);
      }

      return h.response(rows[0]).code(200);
    } catch (error) {
      return errorHandler(h, error, "Invalid token");
    }
  },

  updateProfile: async (request, h) => {
    try {
      const decoded = verifyToken(request, h);
      const { namaPerusahaan, nomorTelpon, kapasitasGudang, lokasiMitra } =
        request.payload;

      const conn = await db.getConnection();
      const query = `UPDATE users SET nama_perusahaan = ?, nomor_telpon = ?, kapasitas_gudang = ?, lokasi_mitra = ? 
                            WHERE email = ?`;
      await conn.execute(query, [
        namaPerusahaan,
        nomorTelpon,
        kapasitasGudang,
        lokasiMitra,
        decoded.email,
      ]);
      conn.release();

      return h.response({ message: "Profil berhasil diperbarui" }).code(200);
    } catch (error) {
      return errorHandler(h, error, "Gagal memperbarui profil");
    }
  },
};

module.exports = userController;
