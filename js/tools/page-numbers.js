/* Tambah nomor halaman ke PDF */
App.register({
  id: "page-numbers",
  name: "Nomor Halaman",
  desc: "Tambahkan nomor halaman ke PDF dengan pilihan posisi, format, dan ukuran.",
  category: "edit",
  icon: "pagenum",
  accept: ".pdf",
  renderOptions(panel) {
    panel.innerHTML = `
      <h4>Pengaturan nomor halaman</h4>
      <div class="option-row">
        <label>Posisi</label>
        <select id="position">
          <option value="bottom-center" selected>Bawah tengah</option>
          <option value="bottom-left">Bawah kiri</option>
          <option value="bottom-right">Bawah kanan</option>
          <option value="top-center">Atas tengah</option>
          <option value="top-left">Atas kiri</option>
          <option value="top-right">Atas kanan</option>
        </select>
      </div>
      <div class="option-row">
        <label>Format</label>
        <select id="format">
          <option value="n" selected>1, 2, 3…</option>
          <option value="nofn">1 / 10, 2 / 10…</option>
          <option value="page">Halaman 1</option>
          <option value="pageofn">Halaman 1 dari 10</option>
        </select>
      </div>
      <div class="option-row">
        <label>Mulai dari</label>
        <input type="number" id="start" min="1" value="1">
      </div>
      <div class="option-row">
        <label>Ukuran font</label>
        <div class="range-row"><input type="range" id="size" min="6" max="40" value="12"><output id="sizeOut">12</output></div>
      </div>`;
    panel.querySelector("#size").addEventListener("input", (e) => { panel.querySelector("#sizeOut").value = e.target.value; });
  },
  collectOptions(panel) {
    return {
      position: panel.querySelector("#position").value,
      format: panel.querySelector("#format").value,
      start: +panel.querySelector("#start").value || 1,
      size: +panel.querySelector("#size").value
    };
  },
  process: async (files, api) => {
    const { PDFDocument, StandardFonts } = App.getPdfLib();
    const f = files[0];
    const src = await PDFDocument.load(await App.readAsArrayBuffer(f));
    const opts = api.getOptions();
    const font = await src.embedFont(StandardFonts.Helvetica);
    const total = src.getPageCount();
    for (let i = 0; i < total; i++) {
      const page = src.getPage(i);
      const pw = page.getWidth(), ph = page.getHeight();
      const num = opts.start + i;
      let label;
      if (opts.format === "n") label = String(num);
      else if (opts.format === "nofn") label = `${num} / ${opts.start + total - 1}`;
      else if (opts.format === "page") label = "Halaman " + num;
      else label = "Halaman " + num + " dari " + (opts.start + total - 1);
      const tw = font.widthOfTextAtSize(label, opts.size);
      const th = font.heightAtSize(opts.size);
      let x, y;
      const m = 30;
      if (opts.position.includes("left")) x = m;
      else if (opts.position.includes("right")) x = pw - tw - m;
      else x = (pw - tw) / 2;
      if (opts.position.includes("top")) y = ph - th - m;
      else y = m;
      page.drawText(label, { x, y, size: opts.size, font, color: PDFLib.rgb(0, 0, 0) });
      api.progress("Menambah nomor…", Math.round(((i + 1) / total) * 100));
    }
    const bytes = await src.save();
    return { files: [{ name: App.baseName(f.name) + "_nomor.pdf", blob: new Blob([bytes], { type: "application/pdf" }) }] };
  }
});