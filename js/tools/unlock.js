/* Buka kunci (hapus password) PDF */
App.register({
  id: "unlock",
  name: "Buka Kunci PDF",
  desc: "Hapus proteksi kata sandi dari PDF. Halaman akan dirender ulang sehingga tidak lagi terkunci.",
  category: "security",
  icon: "unlock",
  accept: ".pdf",
  renderOptions(panel) {
    panel.innerHTML = `
      <div class="option-row"><label>Kata sandi (jika ada)</label><input type="password" id="pw" placeholder="Kosongkan jika PDF tidak ber-password"></div>
      <p class="muted">Jika file tidak ber-password, langsung tekan Proses PDF. Catatan: hasil unlock dirender ulang menjadi gambar (teks tidak lagi bisa diseleksi).</p>`;
  },
  collectOptions(panel) {
    return { pw: panel.querySelector("#pw").value };
  },
  process: async (files, api) => {
    const f = files[0];
    const bytes = await App.readAsArrayBuffer(f);
    const opts = api.getOptions();
    api.progress("Membuka dokumen…", 15);
    const pdf = await App.loadPdfJsDoc(bytes, opts.pw || undefined);
    api.progress("Merender ulang halaman…", 20);
    const src = await App.rasterRebuild(pdf, { scale: 2, onProgress: (p) => api.progress("Merender ulang…", Math.round(p * 0.8 + 20)) });
    const out = await src.save();
    return { files: [{ name: App.baseName(f.name) + "_tanpa_kunci.pdf", blob: new Blob([out], { type: "application/pdf" }) }] };
  }
});