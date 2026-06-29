// src\services\pdf.service.js
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

async function generateRegistrationPDF(user) {
  // lokasi template
  const templatePath = path.join(
    __dirname,
    "../../templates/Formulir_Pendaftaran_Dojang_Joko_Tingkir.pdf",
  );

  // folder output
  const outputDir = path.join(__dirname, "../../../uploads/forms");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `registration_${user.id}.pdf`);

  // baca template
  const existingPdf = fs.readFileSync(templatePath);

  const pdfDoc = await PDFDocument.load(existingPdf);

  const form = pdfDoc.getForm();

  // ===========================
  // Helper
  // ===========================

  const text = (value) => (value ? String(value) : "");

  // ===========================
  // Isi Text Field
  // ===========================

  form.getTextField("name").setText(text(user.name));

  form.getTextField("tanggal_lahir").setText(text(user.tanggal_lahir));

  form.getTextField("alamat").setText(text(user.alamat));

  form.getTextField("phone").setText(text(user.phone));

  form.getTextField("nama_wali").setText(text(user.nama_wali));

  form.getTextField("no_wali").setText(text(user.no_wali));

  // ===========================
  // Radio Button
  // ===========================

  if (user.jenis_kelamin) {
    form.getRadioGroup("jenis_kelamin").select(user.jenis_kelamin);
  }

  // supaya user tidak bisa mengedit lagi
  form.flatten();

  const pdfBytes = await pdfDoc.save();

  fs.writeFileSync(outputPath, pdfBytes);

  return outputPath;
}

module.exports = {
  generateRegistrationPDF,
};
