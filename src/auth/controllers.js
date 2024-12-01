const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDB } = require('../database');
const { generateToken } = require('./jwt');
const { sendWhatsAppMessage } = require('./waservice');  // Import service WhatsApp
const secretKey = process.env.JWT_SECRET_KEY || 'goedanginssht';

const userController = {
    registrasi: async (request, h) => {
            const { namaPerusahaan, email, nomorTelpon, kapasitasGudang, lokasiMitra } = request.payload;
        
            try {
                const conn = await getDB().getConnection();
                const query = `INSERT INTO users (nama_perusahaan, email, nomor_telpon, kapasitas_gudang, lokasi_mitra, status) 
                               VALUES (?, ?, ?, ?, ?, 'pending')`;  // Status 'pending'
                await conn.execute(query, [namaPerusahaan, email, nomorTelpon, kapasitasGudang, lokasiMitra]);
        
                conn.release();
        
                return h.response({ message: 'Registrasi berhasil, menunggu persetujuan admin' }).code(201);
            } catch (error) {
                console.error("Error registrasi:", error);
                return h.response({ message: 'Gagal registrasi', error: error.message }).code(500);
            }
        },
    
        approveUser: async (request, h) => {
            const { userId, password } = request.payload;  // Admin akan memberikan password
        
            try {
                // Hash password
                const hashedPassword = await bcrypt.hash(password, 10);
        
                const conn = await getDB().getConnection();
                const query = `UPDATE users SET status = 'approved', password = ? WHERE id = ? AND status = 'pending'`;
                const result = await conn.execute(query, [hashedPassword, userId]);
        
                conn.release();
        
                if (result[0].affectedRows === 0) {
                    return h.response({ message: 'User tidak ditemukan atau sudah disetujui' }).code(400);
                }
                const userQuery = `SELECT email, nomor_telpon FROM users WHERE id = ?`;
                const [userData] = await conn.execute(userQuery, [userId]);
        
                if (userData.length > 0) {
                    const user = userData[0];
                    const message = `Halo ${user.email}, akun Anda telah disetujui. Detail login: Email: ${user.email}, Password: ${password}`;
                    sendWhatsAppMessage(user.nomor_telpon, message);
                }
        
                return h.response({ message: 'User berhasil disetujui, detail login dikirim via WhatsApp' }).code(200);
            } catch (error) {
                console.error("Error approve user:", error);
                return h.response({ message: 'Gagal menyetujui user', error: error.message }).code(500);
            }
        },
        

    login: async (request, h) => {
        const { email, password } = request.payload;

        try {
            const conn = await getDB().getConnection();
            const [rows] = await conn.query('SELECT * FROM users WHERE email = ?', [email]);
            conn.release();

            if (rows.length === 0) {
                return h.response({ message: 'Email tidak ditemukan' }).code(404);
            }

            const user = rows[0];

            // Verifikasi password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return h.response({ message: 'Password salah' }).code(401);
            }

            // Generate JWT
            const token = generateToken(user.email);

            return h.response({ message: 'Login berhasil', token }).code(200);
        } catch (error) {
            console.error(error);
            return h.response({ message: 'Gagal login' }).code(500);
        }
    },

    getProfile: async (request, h) => {
        const token = request.headers.authorization;

        try {
            const decoded = jwt.verify(token, secretKey);
            const conn = await getDB().getConnection();
            const [rows] = await conn.query('SELECT * FROM users WHERE email = ?', [decoded.email]);

            conn.release();

            if (rows.length === 0) {
                return h.response({ message: 'User tidak ditemukan' }).code(404);
            }

            return h.response(rows[0]).code(200);
        } catch (error) {
            console.error(error);
            return h.response({ message: 'Invalid token' }).code(401);
        }
    },

    updateProfile: async (request, h) => {
        const token = request.headers.authorization;
        const { namaPerusahaan, nomorTelpon, kapasitasGudang, lokasiMitra } = request.payload;

        try {
            const decoded = jwt.verify(token, secretKey);
            const conn = await getDB().getConnection();
            const query = `UPDATE users 
                           SET nama_perusahaan = ?, nomor_telpon = ?, kapasitas_gudang = ?, lokasi_mitra = ? 
                           WHERE email = ?`;
            await conn.execute(query, [namaPerusahaan, nomorTelpon, kapasitasGudang, lokasiMitra, decoded.email]);

            conn.release();

            return h.response({ message: 'Profil berhasil diperbarui' }).code(200);
        } catch (error) {
            console.error(error);
            return h.response({ message: 'Invalid token atau gagal memperbarui profil' }).code(401);
        }
    },
};

module.exports = userController;
