const Hapi = require("@hapi/hapi");
const Inert = require("@hapi/inert");
const authRoutes = require("./src/auth/routes"); // Rute untuk autentikasi
const managementRoutes = require("./src/management/routes"); // Rute untuk manajemen barang
const { connectDB } = require("./src/database");
const Jwt = require("@hapi/jwt");

const init = async () => {
  const server = Hapi.server({
    port: 3000,
    host: "localhost",
  });

  // Hubungkan ke database
  try {
    await connectDB();
    console.log("Koneksi ke database berhasil.");
  } catch (err) {
    console.error("Gagal menghubungkan ke database:", err);
    process.exit(1); // Stop aplikasi jika koneksi gagal
  }

  // Register plugin JWT
  await server.register(Jwt);
  await server.register(Inert);

  // Konfigurasi strategi autentikasi
  server.auth.strategy("jwt", "jwt", {
    keys: "goedanginssht", // Ganti dengan secret key Anda
    verify: {
      aud: false, // Nonaktifkan verifikasi audience jika tidak diperlukan
      iss: false, // Nonaktifkan verifikasi issuer jika tidak diperlukan
      sub: false, // Nonaktifkan verifikasi subject jika tidak diperlukan
      exp: true, // Aktifkan verifikasi masa berlaku token
    },
    validate: (artifacts, request, h) => {
      // artifacts.decoded.payload adalah payload token yang ter-decode
      return {
        isValid: true,
        credentials: { email: artifacts.decoded.payload.email },
      };
    },
  });

  server.auth.default("jwt"); // Semua endpoint butuh autentikasi secara default

  // Register rute
  server.route(authRoutes);
  server.route(managementRoutes);

  // Jalankan server
  try {
    await server.start();
    console.log("Server berjalan di", server.info.uri);
  } catch (err) {
    console.error("Gagal memulai server:", err);
  }
};

process.on("unhandledRejection", (err) => {
  console.error(err);
  process.exit(1);
});

init();
