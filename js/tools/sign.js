/* Tanda tangan (Sign) PDF */
App.register({
  id: "sign",
  name: "Tanda Tangan PDF",
  desc: "Gambar tanda tanganmu lalu tempelkan ke halaman PDF. Seret untuk menyesuaikan posisi.",
  category: "edit",
  icon: "sign",
  accept: ".pdf",
  renderOptions: async function (panel, files) {
    const f = files[0];
    const pdf = await App.loadPdfJsDoc(await App.readAsArrayBuffer(f));
    panel.innerHTML = `
      <h4>1. Gambar tanda tangan</h4>
      <div class="editor-canvas-wrap">
        <canvas id="sigPad" width="480" height="200" style="background:#fff;touch-action:none;border:1px solid #ddd;border-radius:8px;width:100%;height:auto;cursor:crosshair"></canvas>
        <div class="editor-tools">
          <button class="btn btn-ghost" id="sigClear" type="button">Bersihkan</button>
          <label style="font-size:12px">Ukuran <input type="range" id="sigSize" min="1" max="12" value="3" style="width:90px;vertical-align:middle"></label>
        </div>
      </div>
      <h4 style="margin-top:14px">2. Posisi</h4>
      <div class="option-row">
        <select id="sigPos">
          <option value="center">Tengah</option>
          <option value="bottom" selected>Bawah tengah</option>
          <option value="bottom-right">Bawah kanan</option>
          <option value="bottom-left">Bawah kiri</option>
          <option value="top">Atas tengah</option>
        </select>
      </div>
      <div class="option-row">
        <label>Skala tanda tangan</label>
        <div class="range-row"><input type="range" id="sigScale" min="10" max="100" value="40"><output id="sigScaleOut">40%</output></div>
      </div>
      <div class="option-row checkbox-grid">
        <label><input type="checkbox" id="sigAll" checked> Terapkan ke semua halaman</label>
      </div>`;
    const pad = panel.querySelector("#sigPad");
    const pctx = pad.getContext("2d");
    let drawing = false;
    const posOf = (e) => {
      const r = pad.getBoundingClientRect();
      return [(e.clientX - r.left) * (pad.width / r.width), (e.clientY - r.top) * (pad.height / r.height)];
    };
    pad.addEventListener("pointerdown", (e) => {
      drawing = true; pad.setPointerCapture(e.pointerId);
      const [x, y] = posOf(e);
      pctx.strokeStyle = "#000"; pctx.lineWidth = +panel.querySelector("#sigSize").value; pctx.lineCap = "round"; pctx.lineJoin = "round";
      pctx.beginPath(); pctx.moveTo(x, y); pctx.lineTo(x + 0.1, y + 0.1); pctx.stroke();
    });
    pad.addEventListener("pointermove", (e) => {
      if (!drawing) return;
      const [x, y] = posOf(e);
      pctx.lineTo(x, y); pctx.stroke();
    });
    ["pointerup", "pointercancel"].forEach((ev) => pad.addEventListener(ev, () => (drawing = false)));
    panel.querySelector("#sigClear").addEventListener("click", () => pctx.clearRect(0, 0, pad.width, pad.height));
    panel.querySelector("#sigScale").addEventListener("input", (e) => { panel.querySelector("#sigScaleOut").value = e.target.value + "%"; });
  },
  collectOptions(panel) {
    const pad = panel.querySelector("#sigPad");
    const pctx = pad.getContext("2d");
    const px = pctx.getImageData(0, 0, pad.width, pad.height).data;
    let hasInk = false;
    for (let i = 3; i < px.length; i += 4) { if (px[i] > 0) { hasInk = true; break; } }
    const dataUrl = hasInk ? pad.toDataURL("image/png") : "";
    return { sig: dataUrl, pos: panel.querySelector("#sigPos").value, scale: +panel.querySelector("#sigScale").value / 100, all: panel.querySelector("#sigAll").checked };
  },
  process: async (files, api) => {
    const { PDFDocument } = App.getPdfLib();
    const f = files[0];
    const src = await PDFDocument.load(await App.readAsArrayBuffer(f));
    const opts = api.getOptions();
    if (!opts.sig) throw new Error("Tanda tangan kosong. Gambar dulu di panel editor.");
    const imgBytes = await (await fetch(opts.sig)).arrayBuffer();
    const img = await src.embedPng(imgBytes);
    const total = src.getPageCount();
    for (let i = 0; i < total; i++) {
      const page = src.getPage(i);
      const pw = page.getWidth(), ph = page.getHeight();
      const w = pw * 0.25 * opts.scale, h = img.height * (w / img.width);
      let x, y;
      const m = pw * 0.05;
      if (opts.pos === "center") { x = (pw - w) / 2; y = (ph - h) / 2; }
      else if (opts.pos === "bottom") { x = (pw - w) / 2; y = ph * 0.72; }
      else if (opts.pos === "bottom-right") { x = pw - w - m; y = ph * 0.72; }
      else if (opts.pos === "bottom-left") { x = m; y = ph * 0.72; }
      else { x = (pw - w) / 2; y = m * 2; }
      page.drawImage(img, { x, y, width: w, height: h });
      api.progress("Membubuhkan tanda tangan…", Math.round(((i + 1) / total) * 100));
    }
    const bytes = await src.save();
    return { files: [{ name: App.baseName(f.name) + "_ditandatangani.pdf", blob: new Blob([bytes], { type: "application/pdf" }) }] };
  }
});