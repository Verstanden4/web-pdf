/* Potong (crop) area PDF */
App.register({
  id: "crop",
  name: "Potong PDF",
  desc: "Potong margin atau area tertentu pada halaman PDF. Seret untuk memilih area yang dipertahankan.",
  category: "edit",
  icon: "crop",
  accept: ".pdf",
  renderOptions: async function (panel, files) {
    const f = files[0];
    const pdf = await App.loadPdfJsDoc(await App.readAsArrayBuffer(f));
    panel.innerHTML = `
      <h4>Pilih area yang dipertahankan</h4>
      <div class="option-row">
        <button class="btn btn-ghost" id="prevPg" type="button">&larr; Sebelumnya</button>
        <span id="pgLabel" style="margin:0 10px;font-weight:700">Halaman 1 / ${pdf.numPages}</span>
        <button class="btn btn-ghost" id="nextPg" type="button">Berikutnya &rarr;</button>
      </div>
      <div class="option-row checkbox-grid">
        <label><input type="checkbox" id="cropAll" checked> Terapkan potongan yang sama ke semua halaman</label>
      </div>
      <div class="editor-canvas-wrap">
        <canvas id="cropCanvas" style="touch-action:none;cursor:crosshair"></canvas>
      </div>
      <p class="muted">Seret pada gambar untuk memilih area. Klik "Proses PDF" untuk menerapkan.</p>`;

    const canvas = panel.querySelector("#cropCanvas");
    const ctx = canvas.getContext("2d");
    const pgLabel = panel.querySelector("#pgLabel");
    const state = { page: {}, scale: {}, pdfW: {}, pdfH: {} };
    panel.__cropState = state;
    let curPage = 1;
    let base = null;
    let sel = null, drawing = false;

    async function loadPage(p) {
      const vp = await pdf.getPage(p).getViewport({ scale: 1 });
      const ds = Math.min(1.4, 760 / vp.width);
      const { canvas: rc, pdfW, pdfH } = await App.renderPageToCanvas(pdf, p, ds);
      const img = new Image();
      img.src = rc.toDataURL("image/jpeg", 0.9);
      await img.decode();
      state.scale[p] = ds; state.pdfW[p] = pdfW; state.pdfH[p] = pdfH;
      if (!state.page[p]) state.page[p] = null;
      base = { img, w: rc.width, h: rc.height };
      canvas.width = base.w; canvas.height = base.h;
      redraw();
    }
    function redraw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (base) ctx.drawImage(base.img, 0, 0, base.w, base.h);
      const r = state.page[curPage];
      if (r) {
        const sx = r.x * state.scale[curPage], sy = r.y * state.scale[curPage], sw = r.w * state.scale[curPage], sh = r.h * state.scale[curPage];
        ctx.fillStyle = "rgba(0,120,255,0.25)";
        ctx.fillRect(sx, sy, sw, sh);
        ctx.strokeStyle = "#0078ff"; ctx.lineWidth = 2;
        ctx.strokeRect(sx, sy, sw, sh);
      }
    }
    const posOf = (e) => {
      const r = canvas.getBoundingClientRect();
      return [(e.clientX - r.left) * (canvas.width / r.width), (e.clientY - r.top) * (canvas.height / r.height)];
    };
    canvas.addEventListener("pointerdown", (e) => {
      drawing = true; canvas.setPointerCapture(e.pointerId);
      const [x, y] = posOf(e); sel = { x0: x, y0: y, x1: x, y1: y };
      state.page[curPage] = null; redraw();
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!drawing) return;
      const [x, y] = posOf(e);
      sel.x1 = x; sel.y1 = y;
      const s = state.scale[curPage];
      const r = sel;
      state.page[curPage] = { x: Math.min(r.x0, r.x1) / s, y: Math.min(r.y0, r.y1) / s, w: Math.abs(r.x1 - r.x0) / s, h: Math.abs(r.y1 - r.y0) / s };
      redraw();
    });
    ["pointerup", "pointercancel"].forEach((ev) => canvas.addEventListener(ev, () => (drawing = false)));
    panel.querySelector("#prevPg").addEventListener("click", async () => { if (curPage > 1) { curPage--; pgLabel.textContent = "Halaman " + curPage + " / " + pdf.numPages; await loadPage(curPage); } });
    panel.querySelector("#nextPg").addEventListener("click", async () => { if (curPage < pdf.numPages) { curPage++; pgLabel.textContent = "Halaman " + curPage + " / " + pdf.numPages; await loadPage(curPage); } });
    await loadPage(1);
  },
  collectOptions(panel) {
    return { state: panel.__cropState || {}, all: panel.querySelector("#cropAll").checked };
  },
  process: async (files, api) => {
    const { PDFDocument } = App.getPdfLib();
    const f = files[0];
    const src = await PDFDocument.load(await App.readAsArrayBuffer(f));
    const opts = api.getOptions();
    const state = opts.state;
    const template = state.page[1];
    const total = src.getPageCount();
    let applied = 0;
    for (let i = 0; i < total; i++) {
      const page = src.getPage(i);
      const r = opts.all ? template : state.page[i + 1];
      if (!r || r.w <= 2 || r.h <= 2) continue;
      page.setMediaBox(r.x, r.y, r.w, r.h);
      page.setCropBox(r.x, r.y, r.w, r.h);
      applied++;
    }
    if (!applied) throw new Error("Belum ada area yang dipilih untuk dipotong.");
    const bytes = await src.save();
    return { files: [{ name: App.baseName(f.name) + "_dipotong.pdf", blob: new Blob([bytes], { type: "application/pdf" }) }] };
  }
});