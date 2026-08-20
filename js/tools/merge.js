/* Gabungkan beberapa PDF menjadi satu */
App.register({
  id: "merge",
  name: "Gabungkan PDF",
  desc: "Gabungkan beberapa file PDF menjadi satu dokumen, urut sesuai daftar file.",
  category: "organize",
  icon: "merge",
  accept: ".pdf",
  acceptLabel: "file PDF",
  multiple: true,
  process: async (files) => {
    const { PDFDocument } = App.getPdfLib();
    const out = await PDFDocument.create();
    const outBase = files.length > 1 ? App.baseName(files[0].name) + "_digabung" : "gabungan";
    for (let i = 0; i < files.length; i++) {
      const src = await PDFDocument.load(await App.readAsArrayBuffer(files[i]));
      const pages = await out.copyPages(src, src.getPageIndices());
      pages.forEach((p) => out.addPage(p));
    }
    const bytes = await out.save({ useObjectStreams: true });
    return { files: [{ name: outBase + ".pdf", blob: new Blob([bytes], { type: "application/pdf" }) }] };
  }
});