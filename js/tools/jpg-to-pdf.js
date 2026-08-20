/* Gambar (JPG/PNG) menjadi PDF */
App.register({
  id: "jpg-to-pdf",
  name: "JPG ke PDF",
  desc: "Konversi gambar JPG atau PNG menjadi PDF. Atur orientasi, ukuran, dan margin.",
  category: "convert",
  icon: "img2pdf",
  accept: ".jpg,.jpeg,.png",
  acceptLabel: "gambar",
  multiple: true,
  renderOptions(panel) {
    panel.innerHTML = `
      <h4>Pengaturan</h4>
      <div class="option-row">
        <label>Orientasi</label>
        <select id="orient">
          <option value="auto" selected>Otomatis (ikut gambar)</option>
          <option value="portrait">Potret</option>
          <option value="landscape">Lanskap</option>
        </select>
      </div>
      <div class="option-row">
        <label>Ukuran halaman</label>
        <select id="pageSize">
          <option value="fit" selected>Sesuai gambar (satu gambar per halaman)</option>
          <option value="a4">A4</option>
          <option value="letter">Letter</option>
        </select>
      </div>
      <div class="option-row">
        <label>Margin (mm)</label>
        <input type="number" id="margin" min="0" max="50" value="0">
      </div>`;
  },
  collectOptions(panel) {
    return {
      orient: panel.querySelector("#orient").value,
      pageSize: panel.querySelector("#pageSize").value,
      margin: +panel.querySelector("#margin").value || 0
    };
  },
  process: async (files, api) => {
    const { PDFDocument } = App.getPdfLib();
    const out = await PDFDocument.create();
    const opts = api.getOptions();
    const pt = 72 / 25.4; // mm to pt
    for (let i = 0; i < files.length; i++) {
      const bytes = await App.readAsArrayBuffer(files[i]);
      const name = files[i].name.toLowerCase();
      const isPng = name.endsWith(".png");
      const img = isPng ? await out.embedPng(bytes) : await out.embedJpg(bytes);
      let w = img.width, h = img.height;
      if (opts.orient === "portrait" && w > h) { const t = w; w = h; h = t; }
      if (opts.orient === "landscape" && h > w) { const t = w; w = h; h = t; }
      const m = opts.margin * pt;
      let page;
      if (opts.pageSize === "a4") {
        page = out.addPage([595.28, 841.89]);
        let dw = page.getWidth() - m * 2, dh = page.getHeight() - m * 2;
        const s = Math.min(dw / w, dh / h);
        const cw = w * s, ch = h * s;
        page.drawImage(img, { x: (page.getWidth() - cw) / 2, y: (page.getHeight() - ch) / 2, width: cw, height: ch });
      } else if (opts.pageSize === "letter") {
        page = out.addPage([612, 792]);
        let dw = page.getWidth() - m * 2, dh = page.getHeight() - m * 2;
        const s = Math.min(dw / w, dh / h);
        const cw = w * s, ch = h * s;
        page.drawImage(img, { x: (page.getWidth() - cw) / 2, y: (page.getHeight() - ch) / 2, width: cw, height: ch });
      } else {
        page = out.addPage([w + m * 2, h + m * 2]);
        page.drawImage(img, { x: m, y: m, width: w, height: h });
      }
      api.progress("Membuat PDF…", Math.round(((i + 1) / files.length) * 100));
    }
    const bytes = await out.save();
    const n = files.length > 1 ? "gambar" : App.baseName(files[0].name);
    return { files: [{ name: n + ".pdf", blob: new Blob([bytes], { type: "application/pdf" }) }] };
  }
});