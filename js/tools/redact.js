/* Redaksi (sensor) bagian PDF */
App.register({
  id: "redact",
  name: "Redaksi PDF",
  desc: "Tutup permanen teks atau gambar sensitif dengan kotak hitam. Konten dihapus (tidak hanya ditutupi).",
  category: "security",
  icon: "redact",
  accept: ".pdf",
  renderOptions: async function (panel, files) {
    const f = files[0];
    const pdf = await App.loadPdfJsDoc(await App.readAsArrayBuffer(f));
    panel.innerHTML = `
      <h4>Redaksi halaman</h4>
      <div class="option-row">
        <button class="btn btn-ghost" id="prevPg" type="button">&larr; Sebelumnya</button>
        <span id="pgLabel" style="margin:0 10px;font-weight:700">Halaman 1 / ${pdf.numPages}</span>
        <button class="btn btn-ghost" id="nextPg" type="button">Berikutnya &rarr;</button>
      </div>
      <div class="editor-canvas-wrap">
        <canvas id="redactCanvas" style="touch-action:none;cursor:crosshair"></canvas>
        <div class="editor-tools">
          <button class="btn btn-ghost" id="undoBtn" type="button">Urungkan</button>
          <button class="btn btn-ghost" id="clearBtn" type="button">Bersihkan halaman</button>
        </div>
      </div>
      <p class="muted">Seret untuk menutupi area sensitif dengan kotak hitam.</p>`;

    const canvas = panel.querySelector("#redactCanvas");
    const ctx = canvas.getContext("2d");
    const pgLabel = panel.querySelector("#pgLabel");
    const state = { pages: {}, scale: {}, pdfW: {}, pdfH: {} };
    panel.__redactState = state;
    let curPage = 1;
    let base = null;
    let drawing = false, sel = null;

    async function loadPage(p) {
      const vp = await pdf.getPage(p).getViewport({ scale: 1 });
      const ds = Math.min(1.4, 760 / vp.width);
      const { canvas: rc, pdfW, pdfH } = await App.renderPageToCanvas(pdf, p, ds);
      const img = new Image();
      img.src = rc.toDataURL("image/jpeg", 0.9);
      await img.decode();
      state.scale[p] = ds; state.pdfW[p] = pdfW; state.pdfH[p] = pdfH;
      if (!state.pages[p]) state.pages[p] = [];
      base = { img, w: rc.width, h: rc.height };
      canvas.width = base.w; canvas.height = base.h;
      redraw();
    }
    function redraw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (base) ctx.drawImage(base.img, 0, 0, base.w, base.h);
      (state.pages[curPage] || []).forEach((r) => {
        ctx.fillStyle = "#000";
        ctx.fillRect(Math.min(r.x0, r.x1), Math.min(r.y0, r.y1), Math.abs(r.x1 - r.x0), Math.abs(r.y1 - r.y0));
      });
    }
    const posOf = (e) => {
      const r = canvas.getBoundingClientRect();
      return [(e.clientX - r.left) * (canvas.width / r.width), (e.clientY - r.top) * (canvas.height / r.height)];
    };
    canvas.addEventListener("pointerdown", (e) => {
      drawing = true; canvas.setPointerCapture(e.pointerId);
      const [x, y] = posOf(e);
      sel = { x0: x, y0: y, x1: x, y1: y };
      state.pages[curPage].push(sel);
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!drawing) return;
      const [x, y] = posOf(e);
      sel.x1 = x; sel.y1 = y; redraw();
    });
    ["pointerup", "pointercancel"].forEach((ev) => canvas.addEventListener(ev, () => (drawing = false)));
    panel.querySelector("#undoBtn").addEventListener("click", () => { state.pages[curPage].pop(); redraw(); });
    panel.querySelector("#clearBtn").addEventListener("click", () => { state.pages[curPage] = []; redraw(); });
    panel.querySelector("#prevPg").addEventListener("click", async () => { if (curPage > 1) { curPage--; pgLabel.textContent = "Halaman " + curPage + " / " + pdf.numPages; await loadPage(curPage); } });
    panel.querySelector("#nextPg").addEventListener("click", async () => { if (curPage < pdf.numPages) { curPage++; pgLabel.textContent = "Halaman " + curPage + " / " + pdf.numPages; await loadPage(curPage); } });
    await loadPage(1);
  },
  collectOptions(panel) {
    return { state: panel.__redactState || {} };
  },
  process: async (files, api) => {
    const { PDFDocument } = App.getPdfLib();
    const f = files[0];
    const pdf = await App.loadPdfJsDoc(await App.readAsArrayBuffer(f));
    const state = api.getOptions().state;
    const out = await PDFDocument.create();
    for (let p = 1; p <= pdf.numPages; p++) {
      const meta = state.pages[p] || [];
      const scale = state.scale[p] || 1;
      const exScale = scale * 2;
      const { canvas: rc, pdfW, pdfH } = await App.renderPageToCanvas(pdf, p, exScale);
      const ec = document.createElement("canvas");
      ec.width = rc.width; ec.height = rc.height;
      const c2 = ec.getContext("2d");
      c2.drawImage(rc, 0, 0);
      const k = exScale / scale;
      meta.forEach((r) => {
        c2.fillStyle = "#000";
        c2.fillRect(Math.min(r.x0, r.x1) * k, Math.min(r.y0, r.y1) * k, Math.abs(r.x1 - r.x0) * k, Math.abs(r.y1 - r.y0) * k);
      });
      const blob = await App.canvasToJpegBlob(ec, 0.92);
      const img = await out.embedJpg(await blob.arrayBuffer());
      const page = out.addPage([pdfW, pdfH]);
      page.drawImage(img, { x: 0, y: 0, width: pdfW, height: pdfH });
      api.progress("Merender halaman…", Math.round((p / pdf.numPages) * 100));
    }
    const bytes = await out.save();
    return { files: [{ name: App.baseName(f.name) + "_teredaksi.pdf", blob: new Blob([bytes], { type: "application/pdf" }) }] };
  }
});