/* Isi dan buat form PDF */
App.register({
  id: "forms",
  name: "Form PDF",
  desc: "Isi kolom form yang sudah ada atau buat bidang teks baru di PDF.",
  category: "edit",
  icon: "forms",
  accept: ".pdf",
  renderOptions: async function (panel, files) {
    const f = files[0];
    const { PDFDocument } = App.getPdfLib();
    const src = await PDFDocument.load(await App.readAsArrayBuffer(f));
    const pdf = await App.loadPdfJsDoc(await App.readAsArrayBuffer(f));
    const form = src.getForm();
    const fields = form.getFields();
    const newFields = [];
    panel.__formState = { newFields };

    let html = `<h4>Bidang form yang terdeteksi (${fields.length})</h4>`;
    if (!fields.length) html += `<p class="muted">Tidak ada bidang form terdeteksi. Kamu bisa menambah bidang teks baru di bawah.</p>`;
    html += `<div id="fieldInputs">`;
    fields.forEach((fd) => {
      const name = fd.getName();
      const P = PDFLib;
      const typeLabel = fd instanceof P.PDFTextField ? "Teks"
        : fd instanceof P.PDFCheckBox ? "Checkbox"
        : fd instanceof P.PDFRadioGroup ? "Radio"
        : fd instanceof P.PDFDropdown ? "Dropdown"
        : fd instanceof P.PDFOptionList ? "Daftar" : "Bidang";
      html += `
        <div class="option-row" style="display:flex;gap:8px;align-items:center">
          <span style="min-width:150px;font-size:13px"><strong>${App.escapeHtml(name)}</strong> <span class="muted">(${typeLabel})</span></span>
          <input type="text" class="field-val" data-name="${App.escapeHtml(name)}" placeholder="Nilai (kosongkan jika tidak diisi)">
        </div>`;
    });
    html += `</div>`;

    html += `
      <h4 style="margin-top:16px">Tambah bidang teks baru</h4>
      <div class="option-row">
        <label>Halaman</label>
        <select id="nfPage">${Array.from({ length: pdf.numPages }, (_, i) => `<option value="${i + 1}">Halaman ${i + 1}</option>`).join("")}</select>
      </div>
      <div class="editor-canvas-wrap">
        <canvas id="nfCanvas" style="touch-action:none;cursor:crosshair;max-width:100%"></canvas>
      </div>
      <p class="muted">Klik pada halaman untuk meletakkan bidang teks baru.</p>
      <div id="nfList" class="muted" style="margin-top:8px"></div>
      <div class="option-row checkbox-grid" style="margin-top:10px">
        <label><input type="checkbox" id="flatten" checked> Ratakan form (buat nilai permanen, tidak bisa diedit lagi)</label>
      </div>`;
    panel.innerHTML = html;

    // preview for adding fields
    const canvas = panel.querySelector("#nfCanvas");
    const ctx = canvas.getContext("2d");
    let curPage = 1;
    let base = null;
    async function loadPreview(p) {
      const vp = await pdf.getPage(p).getViewport({ scale: 1 });
      const ds = Math.min(1.2, 720 / vp.width);
      const { canvas: rc, pdfW, pdfH } = await App.renderPageToCanvas(pdf, p, ds);
      const img = new Image();
      img.src = rc.toDataURL("image/jpeg", 0.9);
      await img.decode();
      base = { img, w: rc.width, h: rc.height, scale: ds, pdfW, pdfH };
      canvas.width = base.w; canvas.height = base.h;
      redraw();
    }
    function redraw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (base) ctx.drawImage(base.img, 0, 0, base.w, base.h);
      const list = newFields.filter((n) => n.page === curPage);
      list.forEach((n) => {
        const x = n.x * base.scale, y = n.y * base.scale, w = n.w * base.scale, h = n.h * base.scale;
        ctx.fillStyle = "rgba(0,120,255,0.15)"; ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = "#0078ff"; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, w, h);
      });
    }
    const posOf = (e) => {
      const r = canvas.getBoundingClientRect();
      return [(e.clientX - r.left) * (canvas.width / r.width), (e.clientY - r.top) * (canvas.height / r.height)];
    };
    canvas.addEventListener("pointerdown", (e) => {
      const [x, y] = posOf(e);
      const name = "field_" + Date.now().toString(36);
      newFields.push({ name, page: curPage, x: x / base.scale, y: y / base.scale, w: 150 / base.scale, h: 22 / base.scale });
      redraw();
      const lst = panel.querySelector("#nfList");
      lst.innerHTML = newFields.map((n, i) => `<span style="margin-right:10px">${App.escapeHtml(n.name)} (hal ${n.page}) <a href="#" data-rm="${i}" style="color:var(--primary)">hapus</a></span>`).join("") || "Belum ada bidang baru.";
      lst.querySelectorAll("[data-rm]").forEach((a) => a.addEventListener("click", (ev) => {
        ev.preventDefault(); newFields.splice(+a.dataset.rm, 1); redraw(); a.parentElement.remove();
      }));
    });
    panel.querySelector("#nfPage").addEventListener("change", (e) => { curPage = +e.target.value; loadPreview(curPage); });
    await loadPreview(1);
  },
  collectOptions(panel) {
    const vals = {};
    panel.querySelectorAll(".field-val").forEach((i) => { vals[i.dataset.name] = i.value; });
    return { values: vals, newFields: panel.__formState.newFields, flatten: panel.querySelector("#flatten").checked };
  },
  process: async (files, api) => {
    const { PDFDocument } = App.getPdfLib();
    const f = files[0];
    const src = await PDFDocument.load(await App.readAsArrayBuffer(f));
    const opts = api.getOptions();
    const form = src.getForm();
    const fields = form.getFields();
    fields.forEach((fd) => {
      const val = opts.values[fd.getName()];
      if (val === undefined || val === "") return;
      const P = PDFLib;
      if (fd instanceof P.PDFTextField) { fd.setText(val); }
      else if (fd instanceof P.PDFCheckBox) { if (["on", "true", "✓", "1", "x"].includes(String(val).toLowerCase())) fd.check(); }
    });
    opts.newFields.forEach((n) => {
      const tf = form.createTextField(n.name);
      tf.setText("");
      const page = src.getPage(n.page - 1);
      tf.addToPage(page, { x: n.x, y: n.y, width: n.w, height: n.h });
    });
    if (opts.flatten) form.flatten();
    const bytes = await src.save();
    return { files: [{ name: App.baseName(f.name) + "_form.pdf", blob: new Blob([bytes], { type: "application/pdf" }) }] };
  }
});