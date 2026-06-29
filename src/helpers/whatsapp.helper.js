// src\helpers\whatsapp.helper.js
exports.activationMessage = (user) => {
  return `Halo ${user.name},

🎉 Selamat!

Pendaftaran Anda sebagai calon murid DojangMS telah *diterima* dan akun Anda berhasil *diaktivasi*.

Anda sekarang sudah dapat login menggunakan email berikut:

📧 ${user.email}

Langkah selanjutnya, silakan melanjutkan proses administrasi dengan datang langsung ke dojang.

Rincian biaya:
💳 Biaya Pendaftaran: Rp150.000
🥋 Dobok(Seragam) : Rp200.000

Apabila ada pertanyaan mengenai proses pendaftaran maupun administrasi, silakan balas chat ini.Kami akan dengan senang hati membantu Anda.

Terima kasih.
Sampai jumpa di DojangMS! 🙏`;
};
