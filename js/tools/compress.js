/* Kompres / optimasi ukuran PDF */
App.register({
  id: "compress",
  name: "Kompres PDF",
  desc: "Kurangi ukuran file PDF dengan menurunkan kualitas gambar. Semua diproses di browser.",
  category: "optimize",
  icon: "compress",
  accept: ".pdf",
  renderOptions(panel) {
    panel.innerHTML = `
      <h4>Pengaturan kompresi</h4>
      <div class="option-row">
        <label>Kualitas gambar</label>
        <div class="range-row">
          <input type="range" id="quality" min="10" max="90" value="55">
          <output id="qOut">55%</output>
        </div>
      </div>
      <div class="option-row">
        <label>Resolusi render</label>
        <select id="scale">
          <option value="1">Rendah (paling kecil)</option>
          <option value="1.5" selected>Sedang (disarankan)</option>
          <option value="2">Tinggi</option>
          <option value="3">Sangat tinggi</option>
        </select>
      </div>
      <p class="muted">Catatan: kompresi bekerja dengan merender ulang halaman sebagai gambar. Teks pada hasil tidak lagi bisa diseleksi.</p>`;
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
    api.progress("Menganalisis…", 5);
    const out = await App.rasterRebuild(pdf, {
      scale: opts.scale,
      quality: opts.quality,
      onProgress: (p) => api.progress("Mengompresi halaman…", Math.round(p * 0.95 + 5))
    });
    const bytes = await out.save();
    return { files: [{ name: App.baseName(f.name) + "_kompres.pdf", blob: new Blob([bytes], { type: "application/pdf" }) }] };
  }
});