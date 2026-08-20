/* PDF menjadi PowerPoint (PPTX) - tiap halaman jadi slide gambar */
App.register({
  id: "pdf-to-ppt",
  name: "PDF ke PowerPoint",
  desc: "Ubah setiap halaman PDF menjadi slide PowerPoint dengan gambar halaman penuh.",
  category: "convert",
  icon: "pdf2ppt",
  accept: ".pdf",
  process: async (files, api) => {
    const f = files[0];
    const pdf = await App.loadPdfJsDoc(await App.readAsArrayBuffer(f));
    const pptx = new PptxGenJS();
    const SH = 5.625, SW = 10;
    for (let i = 1; i <= pdf.numPages; i++) {
      const { canvas, pdfW, pdfH } = await App.renderPageToCanvas(pdf, i, 2);
      const data = canvas.toDataURL("image/jpeg", 0.92);
      const slide = pptx.addSlide();
      const s = Math.min(SW / pdfW, SH / pdfH);
      const w = pdfW * s, h = pdfH * s;
      slide.addImage({ data, x: (SW - w) / 2, y: (SH - h) / 2, w, h });
      api.progress("Membuat slide…", Math.round((i / pdf.numPages) * 90));
    }
    api.progress("Menyimpan PPTX…", 95);
    const blob = await pptx.write({ outputType: "blob" });
    return { files: [{ name: App.baseName(f.name) + ".pptx", blob }] };
  }
});