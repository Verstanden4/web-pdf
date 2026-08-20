/* OCR: kenali teks dari PDF scan */
App.register({
  id: "ocr",
  name: "OCR PDF",
  desc: "Kenali teks dari PDF hasil scan dengan Tesseract dan ekspor ke file teks (.txt).",
  category: "optimize",
  icon: "ocr",
  accept: ".pdf",
  renderOptions(panel) {
    panel.innerHTML = `
      <div class="option-row">
        <label>Bahasa</label>
        <select id="lang">
          <option value="eng" selected>English</option>
          <option value="ind">Indonesia</option>
          <option value="spa">Español</option>
          <option value="fra">Français</option>
          <option value="deu">Deutsch</option>
          <option value="jpn">日本語</option>
        </select>
      </div>
      <div class="note-box">Proses OCR berjalan di browser kamu (Tesseract.js). Data bahasa diunduh dari CDN saat pertama kali dipakai, jadi tool ini butuh koneksi internet. Proses lambat untuk file besar.</div>`;
  },
  collectOptions(panel) {
    return { lang: panel.querySelector("#lang").value };
  },
  process: async (files, api) => {
    if (typeof Tesseract === "undefined") throw new Error("Tesseract.js tidak termuat.");
    const f = files[0];
    const pdf = await App.loadPdfJsDoc(await App.readAsArrayBuffer(f));
    const lang = api.getOptions().lang || "eng";
    api.progress("Menyiapkan mesin OCR…", 5);
    const worker = await Tesseract.createWorker(lang, 1, {
      logger: (m) => { if (m.status === "recognizing text") api.progress("Mengenali teks…", Math.round(m.progress * 90 + 5)); }
    });
    let text = "";
    try {
      for (let p = 1; p <= pdf.numPages; p++) {
        const { canvas } = await App.renderPageToCanvas(pdf, p, 2);
        const { data } = await worker.recognize(canvas);
        text += `--- Halaman ${p} ---\n\n`;
        text += (data.text || "") + "\n\n";
      }
    } finally {
      await worker.terminate();
    }
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    return { files: [{ name: App.baseName(f.name) + "_ocr.txt", blob }] };
  }
});