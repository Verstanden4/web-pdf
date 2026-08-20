/* Word (DOCX) menjadi PDF */
App.register({
  id: "word-to-pdf",
  name: "Word ke PDF",
  desc: "Konversi dokumen DOC/DOCX menjadi PDF. Mempertahankan teks, gambar, dan tabel sederhana.",
  category: "convert",
  icon: "doc2pdf",
  accept: ".docx,.doc",
  acceptLabel: "dokumen Word",
  process: async (files, api) => {
    if (files[0].name.toLowerCase().endsWith(".doc")) {
      throw new Error("Format .doc lama tidak didukung. Simpan ulang sebagai .docx terlebih dahulu.");
    }
    api.progress("Membaca dokumen…", 10);
    const buf = await App.readAsArrayBuffer(files[0]);
    const result = await mammoth.convertToHtml({ arrayBuffer: buf });
    api.progress("Merender ke PDF…", 60);
    const blob = await App.htmlToPdfBlob(result.value, { margin: 15 });
    return { files: [{ name: App.baseName(files[0].name) + ".pdf", blob }] };
  }
});