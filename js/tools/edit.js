/* Edit PDF: tambah teks, gambar, bentuk, dan coretan */
App.register({
  id: "edit",
  name: "Edit PDF",
  desc: "Tambahkan teks, gambar, bentuk, atau coretan tangan di atas halaman PDF.",
  category: "edit",
  icon: "edit",
  accept: ".pdf",
  renderOptions: async function (panel, files) {
    const f = files[0];
    const pdf = await App.loadPdfJsDoc(await App.readAsArrayBuffer(f));
    panel.innerHTML = `
      <h4>Editor halaman</h4>
      <div class="option-row">
        <button class="btn btn-ghost" id="prevPg" type="button">&larr; Sebelumnya</button>
        <span id="pgLabel" style="margin:0 10px;font-weight:700">Halaman 1 / ${pdf.numPages}</span>
        <button class="btn btn-ghost" id="nextPg" type="button">Berikutnya &rarr;</button>
      </div>
      <div class="editor-canvas-wrap">
        <canvas id="editCanvas"></canvas>
        <div class="editor-tools">
          <button class="btn btn-ghost tool-btn btn-dark" data-tool="pen" type="button">Pena</button>
          <button class="btn btn-ghost tool-btn" data-tool="rect" type="button">Kotak</button>
          <button class="btn btn-ghost tool-btn" data-tool="line" type="button">Garis</button>
          <button class="btn btn-ghost tool-btn" data-tool="text" type="button">Teks</button>
          <button class="btn btn-ghost tool-btn" data-tool="img" type="button">Gambar</button>
          <input type="color" id="editColor" value="#ff0000" title="Warna">
          <label style="font-size:12px">Ukuran <input type="range" id="penSize" min="1" max="40" value="3" style="width:80px;vertical-align:middle"></label>
          <button class="btn btn-ghost" id="undoBtn" type="button">Urungkan</button>
          <button class="btn btn-ghost" id="clearBtn" type="button">Bersihkan</button>
          <input type="file" id="editImgInput" accept=".png,.jpg,.jpeg" hidden>
        </div>
      </div>`;

    const canvas = panel.querySelector("#editCanvas");
    const ctx = canvas.getContext("2d");
    const pgLabel = panel.querySelector("#pgLabel");
    const pagesState = {};
    panel.__editState = pagesState;
    let curPage = 1;
    let curTool = "pen";
    let drawing = false;
    let base = null;
    let pendingImg = null;

    async function loadPage(p) {
      const vp = await pdf.getPage(p).getViewport({ scale: 1 });
      const ds = Math.min(1.6, 780 / vp.width);
      const { canvas: rc, pdfW, pdfH } = await App.renderPageToCanvas(pdf, p, ds);
      const img = new Image();
      img.src = rc.toDataURL("image/jpeg", 0.95);
      await img.decode();
      if (!pagesState[p]) pagesState[p] = { items: [], scale: ds, pdfW, pdfH };
      base = { img, w: rc.width, h: rc.height };
      canvas.width = base.w; canvas.height = base.h;
      redraw();
    }
    function redraw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (base) ctx.drawImage(base.img, 0, 0, base.w, base.h);
      (pagesState[curPage] ? pagesState[curPage].items : []).forEach(drawItem);
    }
    function drawItem(it) {
      ctx.save();
      if (it.type === "pen") {
        ctx.strokeStyle = it.color; ctx.lineWidth = it.size; ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctx.beginPath();
        it.points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
      } else if (it.type === "rect") {
        ctx.strokeStyle = it.color; ctx.lineWidth = it.size;
        ctx.strokeRect(Math.min(it.x0, it.x1), Math.min(it.y0, it.y1), Math.abs(it.x1 - it.x0), Math.abs(it.y1 - it.y0));
      } else if (it.type === "line") {
        ctx.strokeStyle = it.color; ctx.lineWidth = it.size; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(it.x0, it.y0); ctx.lineTo(it.x1, it.y1); ctx.stroke();
      } else if (it.type === "text") {
        ctx.fillStyle = it.color; ctx.font = "bold " + it.size + "px sans-serif";
        ctx.fillText(it.text, it.x, it.y);
      } else if (it.type === "img") {
        ctx.drawImage(it.img, it.x, it.y, it.w, it.h);
      }
      ctx.restore();
    }
    function pos(e) {
      const r = canvas.getBoundingClientRect();
      const sx = canvas.width / r.width, sy = canvas.height / r.height;
      return [(e.clientX - r.left) * sx, (e.clientY - r.top) * sy];
    }
    canvas.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      const [x, y] = pos(e);
      const items = pagesState[curPage].items;
      if (curTool === "text") {
        const t = prompt("Teks yang ingin ditambahkan:");
        if (t) { items.push({ type: "text", x, y, text: t, size: 18, color: colorVal() }); redraw(); }
        return;
      }
      if (curTool === "img") {
        if (pendingImg) {
          const w = pendingImg.width * 0.25, h = pendingImg.height * 0.25;
          items.push({ type: "img", img: pendingImg, x: x - w / 2, y: y - h / 2, w, h });
          pendingImg = null; redraw();
        }
        return;
      }
      drawing = true;
      canvas.setPointerCapture(e.pointerId);
      if (curTool === "pen") items.push({ type: "pen", color: colorVal(), size: penSize(), points: [[x, y]] });
      else items.push({ type: curTool, color: colorVal(), size: penSize(), x0: x, y0: y, x1: x, y1: y });
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!drawing) return;
      const [x, y] = pos(e);
      const items = pagesState[curPage].items;
      const it = items[items.length - 1];
      if (curTool === "pen") it.points.push([x, y]);
      else { it.x1 = x; it.y1 = y; }
      redraw();
    });
    ["pointerup", "pointercancel"].forEach((ev) => canvas.addEventListener(ev, () => (drawing = false)));

    function colorVal() { return panel.querySelector("#editColor").value; }
    function penSize() { return +panel.querySelector("#penSize").value; }

    panel.querySelector("#editColor").addEventListener("input", redraw);
    panel.querySelectorAll(".tool-btn").forEach((b) => b.addEventListener("click", () => {
      curTool = b.dataset.tool;
      panel.querySelectorAll(".tool-btn").forEach((x) => x.classList.remove("btn-dark"));
      b.classList.add("btn-dark");
      if (curTool === "img") panel.querySelector("#editImgInput").click();
    }));
    panel.querySelector("#editImgInput").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const dataUrl = await App.readAsDataURL(file);
      const img = new Image();
      img.onload = () => { pendingImg = img; App.toast("Klik pada halaman untuk menempatkan gambar."); };
      img.src = dataUrl;
    });
    panel.querySelector("#undoBtn").addEventListener("click", () => {
      const items = pagesState[curPage].items;
      if (items.length) { items.pop(); redraw(); }
    });
    panel.querySelector("#clearBtn").addEventListener("click", () => { pagesState[curPage].items = []; redraw(); });

    panel.querySelector("#prevPg").addEventListener("click", async () => { if (curPage > 1) { curPage--; pgLabel.textContent = "Halaman " + curPage + " / " + pdf.numPages; await loadPage(curPage); } });
    panel.querySelector("#nextPg").addEventListener("click", async () => { if (curPage < pdf.numPages) { curPage++; pgLabel.textContent = "Halaman " + curPage + " / " + pdf.numPages; await loadPage(curPage); } });

    await loadPage(1);
  },
  collectOptions(panel) {
    return { pagesState: panel.__editState || {} };
  },
  process: async (files, api) => {
    const { PDFDocument } = App.getPdfLib();
    const f = files[0];
    const pdf = await App.loadPdfJsDoc(await App.readAsArrayBuffer(f));
    const pagesState = api.getOptions().pagesState;
    const out = await PDFDocument.create();
    for (let p = 1; p <= pdf.numPages; p++) {
      const meta = pagesState[p] || { items: [], scale: 1, pdfW: 595, pdfH: 842 };
      const exScale = meta.scale * 2;
      const { canvas: rc, pdfW, pdfH } = await App.renderPageToCanvas(pdf, p, exScale);
      const ec = document.createElement("canvas");
      ec.width = rc.width; ec.height = rc.height;
      const c2 = ec.getContext("2d");
      c2.drawImage(rc, 0, 0);
      const k = exScale / meta.scale;
      meta.items.forEach((it) => {
        c2.save();
        if (it.type === "pen") {
          c2.strokeStyle = it.color; c2.lineWidth = it.size * k; c2.lineCap = "round"; c2.lineJoin = "round";
          c2.beginPath();
          it.points.forEach(([x, y], i) => (i ? c2.lineTo(x * k, y * k) : c2.moveTo(x * k, y * k)));
          c2.stroke();
        } else if (it.type === "rect") {
          c2.strokeStyle = it.color; c2.lineWidth = it.size * k;
          c2.strokeRect(Math.min(it.x0, it.x1) * k, Math.min(it.y0, it.y1) * k, Math.abs(it.x1 - it.x0) * k, Math.abs(it.y1 - it.y0) * k);
        } else if (it.type === "line") {
          c2.strokeStyle = it.color; c2.lineWidth = it.size * k; c2.lineCap = "round";
          c2.beginPath(); c2.moveTo(it.x0 * k, it.y0 * k); c2.lineTo(it.x1 * k, it.y1 * k); c2.stroke();
        } else if (it.type === "text") {
          c2.fillStyle = it.color; c2.font = "bold " + (it.size * k) + "px sans-serif";
          c2.fillText(it.text, it.x * k, it.y * k);
        } else if (it.type === "img") {
          c2.drawImage(it.img, it.x * k, it.y * k, it.w * k, it.h * k);
        }
        c2.restore();
      });
      const blob = await App.canvasToJpegBlob(ec, 0.92);
      const img = await out.embedJpg(await blob.arrayBuffer());
      const page = out.addPage([pdfW, pdfH]);
      page.drawImage(img, { x: 0, y: 0, width: pdfW, height: pdfH });
      api.progress("Merender halaman…", Math.round((p / pdf.numPages) * 100));
    }
    const bytes = await out.save();
    return { files: [{ name: App.baseName(f.name) + "_diedit.pdf", blob: new Blob([bytes], { type: "application/pdf" }) }] };
  }
});