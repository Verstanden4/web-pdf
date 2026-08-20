/* Ekstrak halaman dari PDF */
App.register({
  id: "extract",
  name: "Ekstrak Halaman",
  desc: "Ekstrak halaman pilihan dari PDF menjadi dokumen baru.",
  category: "organize",
  icon: "extract",
  accept: ".pdf",
  renderOptions: async function (panel, files) {
    const f = files[0];
    const pdf = await App.loadPdfJsDoc(await App.readAsArrayBuffer(f));
    panel.innerHTML = `
      <h4>Pilih halaman yang akan diekstrak</h4>
      <div class="option-row">
        <label>Mode hasil</label>
        <select id="mode">
          <option value="single">Satu PDF berisi semua halaman terpilih</option>
          <option value="multi">Setiap halaman menjadi PDF terpisah</option>
        </select>
      </div>
      <p class="muted">Klik halaman untuk memilih.</p>
      <div id="pageGrid"></div>`;
    await App.buildPageGrid(pdf, panel.querySelector("#pageGrid"), { multi: true });
  },
  collectOptions(panel) {
    return {
      mode: panel.querySelector("#mode").value,
      pages: Array.from(panel.querySelectorAll(".page-item.selected")).map((x) => +x.dataset.page)
    };
  },
  process: async (files, api) => {
    const { PDFDocument } = App.getPdfLib();
    const f = files[0];
    const src = await PDFDocument.load(await App.readAsArrayBuffer(f));
    const opts = api.getOptions();
    if (!opts.pages || !opts.pages.length) throw new Error("Pilih minimal satu halaman.");
    const base = App.baseName(f.name);
    const inds = opts.pages.map((p) => p - 1);
    if (opts.mode === "single") {
      const out = await PDFDocument.create();
      const pages = await out.copyPages(src, inds);
      pages.forEach((p) => out.addPage(p));
      const bytes = await out.save();
      return { files: [{ name: base + "_ekstrak.pdf", blob: new Blob([bytes], { type: "application/pdf" }) }] };
    }
    const out = [];
    for (let i = 0; i < inds.length; i++) {
      const d = await PDFDocument.create();
      const p = await d.copyPages(src, [inds[i]]);
      d.addPage(p[0]);
      const bytes = await d.save();
      out.push({ name: `${base}_halaman_${inds[i] + 1}.pdf`, blob: new Blob([bytes], { type: "application/pdf" }) });
      api.progress("Mengekstrak…", Math.round(((i + 1) / inds.length) * 100));
    }
    return { files: out, zipName: base + "_ekstrak.zip" };
  }
});