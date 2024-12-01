const PDFDocument = require("pdfkit");
const fs = require("fs");

function generatePDF(resi, setorData, tarikData) {
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
  return filePath;
}

module.exports = generatePDF;
