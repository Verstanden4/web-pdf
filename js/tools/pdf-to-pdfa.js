/* PDF ke PDF/A - versi dasar (metadata + standarisasi ulang) */
App.register({
  id: "pdf-to-pdfa",
  name: "PDF ke PDF/A",
  desc: "Ubah PDF menjadi format PDF/A untuk pengarsipan jangka panjang (versi dasar, tanpa sertifikasi).",
  category: "convert",
  icon: "pdf2pdfa",
  accept: ".pdf",
  renderOptions(panel) {
    panel.innerHTML = `
      <h4>Metadata dokumen</h4>
      <div class="option-row"><label>Judul</label><input type="text" id="title" placeholder="Judul dokumen"></div>
      <div class="option-row"><label>Penulis</label><input type="text" id="author" placeholder="Nama penulis"></div>
      <div class="option-row"><label>Subjek</label><input type="text" id="subject" placeholder="Subjek"></div>
      <div class="note-box">Catatan: tool ini menghasilkan PDF/A lite — metadata &amp; penataan ulang stream. Konversi PDF/A penuh dengan sertifikasi hanya bisa dilakukan server-side.</div>`;
  },
  collectOptions(panel) {
    return { title: panel.querySelector("#title").value, author: panel.querySelector("#author").value, subject: panel.querySelector("#subject").value };
  },
  process: async (files, api) => {
    const { PDFDocument } = App.getPdfLib();
    const f = files[0];
    const src = await PDFDocument.load(await App.readAsArrayBuffer(f));
    const opts = api.getOptions();
    src.setProducer("iLovePDF Clone PDF/A");
    src.setCreator("iLovePDF Clone");
    if (opts.title) src.setTitle(opts.title);
    if (opts.author) src.setAuthor(opts.author);
    if (opts.subject) src.setSubject(opts.subject);
    if (!opts.title) src.setTitle(App.baseName(f.name));
    const bytes = await src.save({ useObjectStreams: true });
    return { files: [{ name: App.baseName(f.name) + "_pdfa.pdf", blob: new Blob([bytes], { type: "application/pdf" }) }] };
  }
});