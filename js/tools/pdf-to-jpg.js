/* PDF menjadi gambar JPG */
App.register({
  id: "pdf-to-jpg",
  name: "PDF ke JPG",
  desc: "Konversi setiap halaman PDF menjadi gambar JPG berkualitas tinggi.",
  category: "convert",
  icon: "pdf2img",
  accept: ".pdf",
  renderOptions(panel) {
    panel.innerHTML = `
      <h4>Pengaturan</h4>
      <div class="option-row">
        <label>Kualitas</label>
        <div class="range-row">
          <input type="range" id="quality" min="50" max="100" value="90">
          <output id="qOut">90%</output>
        </div>
      </div>
      <div class="option-row">
        <label>Resolusi (scale)</label>
        <select id="scale">
          <option value="1">Rendah</option>
          <option value="1.5">Sedang</option>
          <option value="2" selected>Tinggi</option>
          <option value="3">Sangat tinggi</option>
        </select>
      </div>`;
    const q = panel.querySelector("#quality");
    const o = panel.querySelector("#qOut");
    q.addEventListener("input", () => { o.value = q.value + "%"; });
  },
  collectOptions(panel) {
    return { quality: +panel.querySelector("#quality").value / 100, scale: +panel.querySelector("#scale").value };
  },
  process: async (files, api) => {
    const f = files[0];
    const pdf = await App.loadPdfJsDoc(await App.readAsArrayBuffer(f));
    const opts = api.getOptions();
    const base = App.baseName(f.name);
    const out = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const { canvas } = await App.renderPageToCanvas(pdf, i, opts.scale);
      const blob = await App.canvasToJpegBlob(canvas, opts.quality);
      out.push({ name: `${base}_halaman_${i}.jpg`, blob });
      api.progress("Merender halaman…", Math.round((i / pdf.numPages) * 100));
    }
    return { files: out, zipName: base + "_gambar.zip" };
  }
});