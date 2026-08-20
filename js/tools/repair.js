/* Perbaiki PDF yang rusak */
App.register({
  id: "repair",
  name: "Perbaiki PDF",
  desc: "Coba pulihkan data dari PDF yang rusak atau korup dan simpan sebagai file baru.",
  category: "optimize",
  icon: "repair",
  accept: ".pdf",
  process: async (files, api) => {
    const { PDFDocument } = App.getPdfLib();
    const f = files[0];
    const bytes = await App.readAsArrayBuffer(f);
    api.progress("Memeriksa file…", 10);
    try {
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      api.progress("Struktur terbaca, menormalkan ulang…", 60);
      const out = await src.save({ useObjectStreams: true });
      return { files: [{ name: App.baseName(f.name) + "_diperbaiki.pdf", blob: new Blob([out], { type: "application/pdf" }) }] };
    } catch (e) {
      api.progress("Mencoba pemulihan oleh pdf.js…", 30);
      const pdf = await App.loadPdfJsDoc(bytes);
      api.progress("Merender ulang halaman…", 40);
      const out = await App.rasterRebuild(pdf, { scale: 2, onProgress: (p) => api.progress("Merender ulang…", Math.round(p * 0.6 + 40)) });
      const outBytes = await out.save();
      return { files: [{ name: App.baseName(f.name) + "_dipulihkan.pdf", blob: new Blob([outBytes], { type: "application/pdf" }) }] };
    }
  }
});