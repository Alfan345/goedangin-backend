const twilio = require("twilio");

const client = new twilio(
  "AC6e78c9c765754e00ce82245ce09f4670",
  "21970244e76aaf35eed352ed8ac83c88"
); // Ganti dengan kredensial Twilio Anda

/**
 * Fungsi untuk mengirim pesan WhatsApp
 * @param {string} phoneNumber - Nomor telepon pengguna yang menerima pesan
 * @param {string} message - Pesan yang akan dikirimkan
 */
function sendWhatsAppMessage(phoneNumber, message) {
  client.messages
    .create({
      from: "whatsapp:+14155238886", // Nomor Twilio, ganti sesuai dengan akun Anda
      to: `whatsapp:${phoneNumber}`, // Nomor telepon penerima
      body: message, // Isi pesan
    })
    .then((message) => console.log("Pesan WhatsApp terkirim:", message.sid))
    .catch((error) => console.error("Error mengirim pesan WhatsApp:", error));
}

module.exports = {
  sendWhatsAppMessage,
};
