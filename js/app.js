/* =========================================================
   iLovePDF Clone - Core App
   Semua diproses di browser, tanpa server.
   ========================================================= */
window.App = (function () {
  "use strict";

  /* ---------- Icons (SVG) ---------- */
  const I = {
    merge: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h6l6 5 6-5"/><path d="M3 17h6l6-5"/><path d="M15 12h6"/></svg>',
    split: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="M8 7l4-4 4 4"/><path d="M8 17l4 4 4-4"/></svg>',
    compress: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="M14 10l7-7"/><path d="M3 21l7-7"/></svg>',
    rotate: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/></svg>',
    remove: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/></svg>',
    extract: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 17l3-3-3-3"/></svg>',
    organize: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    watermark: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.7s6 6.9 6 11.3a6 6 0 1 1-12 0c0-4.4 6-11.3 6-11.3z"/></svg>',
    pagenum: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><text x="8" y="19" font-size="8" fill="currentColor">123</text></svg>',
    protect: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    unlock: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.7-1.5"/></svg>',
    img2pdf: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5-9 9"/></svg>',
    pdf2img: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5-9 9"/></svg>',
    doc2pdf: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><text x="9" y="18" font-size="9" fill="currentColor" font-weight="bold">W</text></svg>',
    pdf2doc: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><text x="6" y="18" font-size="9" fill="currentColor" font-weight="bold">W</text></svg>',
    xls2pdf: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 14l5 5M13 14l-5 5"/></svg>',
    pdf2xls: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 14l5 5M13 14l-5 5"/></svg>',
    ppt2pdf: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>',
    pdf2ppt: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>',
    html2pdf: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6l-6 6 6 6"/><path d="M16 6l6 6-6 6"/></svg>',
    pdf2md: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><text x="8" y="17" font-size="7" fill="currentColor" font-weight="bold">#</text></svg>',
    pdf2pdfa: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><text x="7" y="18" font-size="10" fill="currentColor" font-weight="bold">A</text></svg>',
    edit: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/></svg>',
    sign: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17c2-1 3-3 3-5 0-1-1-1-1-2 0-3 4-4 5-5"/><path d="M8 15c2 1 4 1 6 1 2 0 4 0 5-1"/><path d="M4 21h16"/></svg>',
    crop: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/></svg>',
    redact: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/><rect x="4" y="20" width="16" height="2" rx="1"/></svg>',
    compare: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="18" rx="1"/><rect x="13" y="3" width="8" height="18" rx="1"/><path d="M7 8h.01M17 8h.01M7 12h.01M17 12h.01"/></svg>',
    repair: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a5 5 0 0 0-6.9 6.9L3 18v3h3l4.8-4.8a5 5 0 0 0 6.9-6.9l-2.9 2.9-2.5-2.5z"/></svg>',
    scan: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/></svg>',
    ocr: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V5a1 1 0 0 1 1-1h2"/><path d="M17 4h2a1 1 0 0 1 1 1v2"/><path d="M20 17v2a1 1 0 0 1-1 1h-2"/><path d="M7 20H5a1 1 0 0 1-1-1v-2"/><path d="M7 8h10v8H7z"/><path d="M9 12h6"/></svg>',
    forms: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    sparkles: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.9 2.6L22.5 18.5l-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9z"/></svg>',
    translate: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h7"/><path d="M9 3v2c0 4.4-2 8-5 9"/><path d="M5 8c2 1 4 3 5 6"/><path d="M11 9h9"/><path d="M14 4l5 12M19 16l1.5-4M12 20h9"/></svg>',
    doc: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
    check: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
    upload: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4"/><path d="M6 9l6-6 6 6"/><path d="M4 20h16"/></svg>',
    download: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v12"/><path d="M6 10l6 6 6-6"/><path d="M4 20h16"/></svg>'
  };

  /* ---------- Categories ---------- */
  const CATS = [
    { id: "organize", label: "Organize", color: "var(--cat-organize)" },
    { id: "optimize", label: "Optimize", color: "var(--cat-optimize)" },
    { id: "convert", label: "Convert", color: "var(--cat-convert)" },
    { id: "edit", label: "Edit", color: "var(--cat-edit)" },
    { id: "security", label: "Keamanan", color: "var(--cat-security)" },
    { id: "intelligence", label: "Intelijen", color: "var(--cat-intelligence)" }
  ];
  const catOf = (id) => CATS.find((c) => c.id === id) || CATS[0];

  /* ---------- Registry ---------- */
  const registry = [];
  function register(def) {
    def.icon = I[def.icon] || I.doc;
    registry.push(def);
  }

  /* ---------- Utils ---------- */
  function toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("show"), 2600);
  }
  function formatBytes(b) {
    if (b < 1024) return b + " B";
    if (b < 1048576) return (b / 1024).toFixed(1) + " KB";
    return (b / 1048576).toFixed(2) + " MB";
  }
  function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1500);
  }
  function downloadMany(items) {
    items.forEach((it) => downloadBlob(it.blob, it.name));
  }
  async function zipDownload(items, zipName) {
    const zip = new JSZip();
    const used = new Set();
    items.forEach((it) => {
      let n = it.name;
      while (used.has(n.toLowerCase())) {
        const dot = n.lastIndexOf(".");
        n = n.slice(0, dot) + "_" + (used.size + 1) + n.slice(dot);
      }
      used.add(n.toLowerCase());
      zip.file(n, it.blob);
    });
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, zipName);
  }
  function readAsArrayBuffer(file) {
    return file.arrayBuffer ? file.arrayBuffer() : new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result); r.onerror = rej;
      r.readAsArrayBuffer(file);
    });
  }
  function readAsDataURL(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result); r.onerror = rej;
      r.readAsDataURL(file);
    });
  }
  function baseName(name) {
    const i = name.lastIndexOf(".");
    return i > 0 ? name.slice(0, i) : name;
  }

  /* ---------- pdf.js / pdf-lib helpers ---------- */
  let pdfjsReady = false;
  function getPdfJs() {
    if (!pdfjsReady) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = "libs/pdf.worker.min.js";
      pdfjsReady = true;
    }
    return pdfjsLib;
  }
  function getPdfLib() {
    if (!window.PDFLib) throw new Error("Library PDFLib tidak termuat.");
    return window.PDFLib;
  }
  async function loadPdfJsDoc(bytes, password) {
    const pdfjs = getPdfJs();
    const task = pdfjs.getDocument({ data: new Uint8Array(bytes), password });
    try {
      return await task.promise;
    } catch (e) {
      if (e && e.name === "PasswordException") {
        const wants = prompt("File PDF dilindungi kata sandi. Masukkan password:");
        if (wants === null) throw new Error("Dibatalkan.");
        return loadPdfJsDoc(bytes, wants);
      }
      throw e;
    }
  }
  async function renderPageToCanvas(pdf, pageNum, scale) {
    const page = await pdf.getPage(pageNum);
    const vp = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(vp.width);
    canvas.height = Math.floor(vp.height);
    const ctx = canvas.getContext("2d");
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    return {
      canvas,
      w: vp.width, h: vp.height,
      pdfW: vp.width / scale, pdfH: vp.height / scale
    };
  }
  function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve) => {
      let done = false;
      const finish = (b) => { if (!done && b) { done = true; resolve(b); } };
      try {
        canvas.toBlob((b) => {
          if (b) { finish(b); return; }
          const url = canvas.toDataURL(type, quality);
          const bin = atob(url.split(",")[1]);
          const arr = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
          finish(new Blob([arr], { type }));
        }, type, quality);
      } catch (e) {
        finish(new Blob([new Uint8Array(0)], { type }));
      }
    });
  }
  function canvasToJpegBlob(canvas, quality) {
    return canvasToBlob(canvas, "image/jpeg", quality || 0.92);
  }
  function canvasToPngBlob(canvas) {
    return canvasToBlob(canvas, "image/png");
  }
  /* Rebuild a new PDF from rendered page images (raster fallback). */
  async function rasterRebuild(pdfJsDoc, opts) {
    const { PDFDocument, degrees } = getPdfLib();
    const out = await PDFDocument.create();
    opts = opts || {};
    const numPages = pdfJsDoc.numPages;
    for (let i = 1; i <= numPages; i++) {
      const scale = opts.scale || 2;
      const { canvas, pdfW, pdfH } = await renderPageToCanvas(pdfJsDoc, i, scale);
      const jpg = await canvasToJpegBlob(canvas, opts.quality || 0.92);
      const bytes = await jpg.arrayBuffer();
      const img = await out.embedJpg(bytes);
      const page = out.addPage([pdfW, pdfH]);
      page.drawImage(img, { x: 0, y: 0, width: pdfW, height: pdfH });
      if (opts.onProgress) opts.onProgress(Math.round((i / numPages) * 100));
    }
    return out;
  }

  /* ---------- Router ---------- */
  function route() {
    const hash = location.hash.replace(/^#\/?/, "");
    if (hash && registry.some((t) => t.id === hash)) {
      renderToolPage(registry.find((t) => t.id === hash));
    } else {
      renderHome();
    }
    window.scrollTo(0, 0);
  }

  /* ---------- Home ---------- */
  function renderHome() {
    const app = document.getElementById("app");
    const chips = CATS.map((c) => `<button class="chip" data-cat="${c.id}">${c.label}</button>`).join("");
    const cards = registry.map((t) => {
      const c = catOf(t.category);
      return `<div class="tool-card" data-cat="${t.category}" data-id="${t.id}">
        <div class="card-top" style="background:${c.color}"></div>
        <div class="card-body">
          <div class="card-icon" style="background:${c.color}">${t.icon}</div>
          <h3>${t.name}${t.new ? ' <span class="badge-new">Baru</span>' : ""}</h3>
          <p>${t.desc}</p>
        </div>
      </div>`;
    }).join("");
    app.innerHTML = `
      <section class="hero">
        <h1>Semua tools yang kamu butuhkan untuk bekerja dengan PDF <span class="hl">dalam satu tempat</span></h1>
        <p>Gabungkan, pisah, kompres, konversi, rotasi, buka kunci, dan beri watermark pada PDF hanya dengan beberapa klik. 100% gratis — semua diproses di browser kamu, file tidak pernah dikirim ke server.</p>
      </section>
      <div class="chips"><button class="chip active" data-cat="all">Semua</button>${chips}</div>
      <div class="tool-grid">${cards}</div>`;
    app.querySelectorAll(".chip").forEach((c) => {
      c.addEventListener("click", () => {
        app.querySelectorAll(".chip").forEach((x) => x.classList.remove("active"));
        c.classList.add("active");
        const cat = c.dataset.cat;
        app.querySelectorAll(".tool-card").forEach((card) => {
          card.classList.toggle("hidden", cat !== "all" && card.dataset.cat !== cat);
        });
      });
    });
    app.querySelectorAll(".tool-card").forEach((card) => {
      card.addEventListener("click", () => (location.hash = "#/" + card.dataset.id));
    });
  }

  /* ---------- Tool page ---------- */
  function renderToolPage(def) {
    const app = document.getElementById("app");
    const c = catOf(def.category);
    const accept = def.accept || ".pdf";
    const state = { files: [], options: {}, results: null, optionsReady: Promise.resolve() };

    app.innerHTML = `
      <div class="tool-page">
        <div class="tool-hero">
          <div class="tool-big-icon" style="background:${c.color}">${def.icon}</div>
          <a class="back-link" href="#/">&larr; Semua tools</a>
          <h1>${def.name}</h1>
          <p>${def.desc}</p>
        </div>
        <div class="tool-body">
          <div class="drop-area" id="dropArea">
            <div class="drop-icon">${I.upload}</div>
            <p><strong>Pilih ${def.acceptLabel || "file"}</strong> atau tarik &amp; lepas di sini</p>
            <button class="btn btn-primary">Pilih file</button>
            <input type="file" id="fileInput" accept="${accept}" multiple hidden>
          </div>
          <div class="files-panel hidden" id="filesPanel">
            <div class="files-list" id="filesList"></div>
            <div class="options-panel hidden" id="optionsPanel"></div>
            <div class="btn-process-wrap">
              <button class="btn btn-primary btn-big" id="btnProcess">Proses PDF</button>
            </div>
          </div>
          <div class="progress-wrap hidden" id="progressWrap">
            <div class="spinner"></div>
            <div class="progress-text" id="progressText">Memproses…</div>
          </div>
          <div id="resultSlot"></div>
        </div>
      </div>`;

    const dropArea = app.querySelector("#dropArea");
    const fileInput = app.querySelector("#fileInput");
    const filesPanel = app.querySelector("#filesPanel");
    const filesList = app.querySelector("#filesList");
    const optionsPanel = app.querySelector("#optionsPanel");
    const btnProcess = app.querySelector("#btnProcess");
    const progressWrap = app.querySelector("#progressWrap");
    const progressText = app.querySelector("#progressText");
    const resultSlot = app.querySelector("#resultSlot");

    function addFiles(fileList) {
      const accepted = Array.from(fileList).filter((f) => {
        const ext = f.name.split(".").pop().toLowerCase();
        return accept.split(",").some((a) => a.trim() === "." + ext);
      });
      if (!accepted.length) {
        toast("Format file tidak didukung.");
        return;
      }
      if (def.maxFiles && state.files.length + accepted.length > def.maxFiles) {
        toast(`Maksimal ${def.maxFiles} file.`);
        accepted.length = Math.max(0, def.maxFiles - state.files.length);
      }
      state.files.push(...accepted);
      renderFiles();
    }
    function renderFiles() {
      if (!state.files.length) {
        filesPanel.classList.add("hidden");
        return;
      }
      filesPanel.classList.remove("hidden");
      filesList.innerHTML = state.files.map((f, i) => `
        <div class="file-card">
          <div class="file-icon">${I.doc}</div>
          <div class="file-info">
            <div class="file-name">${escapeHtml(f.name)}</div>
            <div class="file-meta">${formatBytes(f.size)}</div>
          </div>
          <button class="file-remove" data-i="${i}" title="Hapus">&times;</button>
        </div>`).join("");
      filesList.querySelectorAll(".file-remove").forEach((b) => {
        b.addEventListener("click", () => {
          state.files.splice(+b.dataset.i, 1);
          renderFiles();
          if (!state.files.length) {
            resultSlot.innerHTML = "";
            optionsPanel.classList.add("hidden");
            optionsPanel.innerHTML = "";
          }
        });
      });
      state.optionsReady = (async () => {
        optionsPanel.innerHTML = "";
        if (def.renderOptions) await def.renderOptions(optionsPanel, state.files);
        optionsPanel.classList.toggle("hidden", !optionsPanel.children.length);
      })();
    }

    dropArea.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", () => { addFiles(fileInput.files); fileInput.value = ""; });
    ["dragenter", "dragover"].forEach((ev) => dropArea.addEventListener(ev, (e) => { e.preventDefault(); dropArea.classList.add("drag"); }));
    ["dragleave", "drop"].forEach((ev) => dropArea.addEventListener(ev, (e) => { e.preventDefault(); dropArea.classList.remove("drag"); }));
    dropArea.addEventListener("drop", (e) => addFiles(e.dataTransfer.files));

    btnProcess.addEventListener("click", async () => {
      if (!state.files.length) return;
      btnProcess.disabled = true;
      progressWrap.classList.remove("hidden");
      resultSlot.innerHTML = "";
      await state.optionsReady;
      if (def.collectOptions) state.options = def.collectOptions(optionsPanel) || {};
      const api = {
        files: state.files,
        progress: (msg, pct) => { progressText.textContent = msg + (pct != null ? " (" + pct + "%)" : ""); },
        getOptions: () => state.options
      };
      try {
        const res = await def.process(state.files, api);
        showResult(res);
      } catch (err) {
        progressWrap.classList.add("hidden");
        toast("Terjadi kesalahan: " + (err && err.message ? err.message : err));
        console.error(err);
      } finally {
        btnProcess.disabled = false;
      }
    });

    function showResult(res) {
      progressWrap.classList.add("hidden");
      const files = res.files || [];
      const zipName = res.zipName || def.id + "-hasil.zip";
      const actions = [];
      if (files.length > 1) {
        actions.push(`<button class="btn btn-primary" id="dlZip">Unduh semua (ZIP)</button>`);
      }
      files.forEach((f, i) => {
        actions.push(`<button class="btn btn-dark" data-i="${i}">${I.download} Unduh: ${escapeHtml(f.name)}</button>`);
      });
      actions.push(`<button class="btn btn-ghost" id="again">Proses file lain</button>`);
      resultSlot.innerHTML = `
        <div class="result-box">
          <div class="result-icon">${I.check}</div>
          <h3>Berhasil!</h3>
          <p>${files.length} file berhasil dibuat. Total ${formatBytes(files.reduce((s, f) => s + (f.blob.size || 0), 0))}.</p>
          <div class="result-actions">${actions.join("")}</div>
        </div>`;
      resultSlot.querySelectorAll("[data-i]").forEach((b) => {
        b.addEventListener("click", () => downloadBlob(files[+b.dataset.i].blob, files[+b.dataset.i].name));
      });
      const dz = resultSlot.querySelector("#dlZip");
      if (dz) dz.addEventListener("click", async () => { dz.disabled = true; try { await zipDownload(files, zipName); } finally { dz.disabled = false; } });
      const ag = resultSlot.querySelector("#again");
      if (ag) ag.addEventListener("click", () => {
        state.files = []; state.results = null;
        filesList.innerHTML = ""; optionsPanel.innerHTML = ""; resultSlot.innerHTML = "";
        filesPanel.classList.add("hidden");
      });
    }
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  }

  window.addEventListener("DOMContentLoaded", route);
  window.addEventListener("hashchange", route);

  return {
    register,
    getTool: (id) => registry.find((t) => t.id === id),
    tools: registry,
    toast,
    formatBytes,
    downloadBlob,
    downloadMany,
    zipDownload,
    readAsArrayBuffer,
    readAsDataURL,
    baseName,
    getPdfJs,
    getPdfLib,
    loadPdfJsDoc,
    renderPageToCanvas,
    canvasToJpegBlob,
    canvasToPngBlob,
    rasterRebuild,
    escapeHtml
  };
})();