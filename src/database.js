const mysql = require("mysql2/promise");
const {Connector} = require('@google-cloud/cloud-sql-connector');
require('dotenv').config();

const connector = new Connector();

const getClientOpts = async () => {
  return await connector.getOptions({
    instanceConnectionName: process.env.INSTANCE_CONNECTION_NAME, // Ganti dengan instance connection name Anda
    ipType: 'PUBLIC',  // Atau 'PRIVATE' jika menggunakan IP privat
  });
};

const connectDB = async () => {
  try {
    const clientOpts = await getClientOpts();
    const db = mysql.createPool({
      ...clientOpts,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    const connection = await db.getConnection(); // Ambil satu koneksi dari pool
    console.log("Database terhubung");
    connection.release(); // Lepaskan koneksi setelah dicek
  } catch (err) {
    console.error("Gagal terhubung ke database:", err.message);
    throw err; // Lempar error agar bisa ditangkap di server.js
  }
};

module.exports = { connectDB };