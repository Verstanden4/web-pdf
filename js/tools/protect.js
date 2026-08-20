/* Lindungi PDF dengan kata sandi */
App.register({
  id: "protect",
  name: "Lindungi PDF",
  desc: "Enkripsi PDF dengan kata sandi untuk mencegah akses tanpa izin.",
  category: "security",
  icon: "protect",
  accept: ".pdf",
  renderOptions(panel) {
    panel.innerHTML = `
      <h4>Kata sandi</h4>
      <div class="option-row"><label>Kata sandi (untuk membuka)</label><input type="password" id="userPw" placeholder="Minimal 4 karakter"></div>
      <div class="option-row"><label>Kata sandi pemilik (opsional)</label><input type="password" id="ownerPw" placeholder="Kosongkan = sama dengan kata sandi buka"></div>
      <h4>Izinkan pengguna untuk…</h4>
      <div class="option-row checkbox-grid">
        <label><input type="checkbox" id="pPrint" checked> Mencetak</label>
        <label><input type="checkbox" id="pCopy"> Menyalin teks</label>
        <label><input type="checkbox" id="pModify"> Memodifikasi</label>
        <label><input type="checkbox" id="pAnnot"> Menambah anotasi</label>
        <label><input type="checkbox" id="pFill"> Mengisi form</label>
      </div>`;
  },
  collectOptions(panel) {
    return {
      userPw: panel.querySelector("#userPw").value,
      ownerPw: panel.querySelector("#ownerPw").value,
      print: panel.querySelector("#pPrint").checked,
      copy: panel.querySelector("#pCopy").checked,
      modify: panel.querySelector("#pModify").checked,
      annot: panel.querySelector("#pAnnot").checked,
      fill: panel.querySelector("#pFill").checked
    };
  },
  process: async (files, api) => {
    const f = files[0];
    const opts = api.getOptions();
    if (!opts.userPw || opts.userPw.length < 4) throw new Error("Kata sandi minimal 4 karakter.");
    if (typeof PDFEncryptLite === "undefined") throw new Error("Library enkripsi tidak termuat.");
    const bytes = new Uint8Array(await App.readAsArrayBuffer(f));
    api.progress("Mengenkripsi dokumen…", 40);
    const enc = await PDFEncryptLite.encryptPDF(bytes, opts.userPw, {
      ownerPassword: opts.ownerPw || opts.userPw,
      allowPrinting: opts.print,
      allowModifying: opts.modify,
      allowCopying: opts.copy,
      allowAnnotating: opts.annot,
      allowFillingForms: opts.fill,
      allowExtraction: true,
      allowAssembly: opts.modify,
      allowHighQualityPrint: opts.print
    });
    return { files: [{ name: App.baseName(f.name) + "_terlindungi.pdf", blob: new Blob([enc], { type: "application/pdf" }) }] };
  }
});