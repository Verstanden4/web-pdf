/* Rotasi halaman PDF */
App.register({
  id: "rotate",
  name: "Putar PDF",
  desc: "Putar halaman PDF sesuai arah yang kamu butuhkan, untuk semua halaman atau yang dipilih.",
  category: "edit",
  icon: "rotate",
  accept: ".pdf",
  renderOptions: async function (panel, files) {
    const f = files[0];
    const pdf = await App.loadPdfJsDoc(await App.readAsArrayBuffer(f));
    panel.innerHTML = `
      <h4>Arah rotasi</h4>
      <div class="option-row">
        <label><input type="radio" name="dir" value="90" checked> 90&deg; searah jarum jam</label>
        <label><input type="radio" name="dir" value="180"> 180&deg;</label>
        <label><input type="radio" name="dir" value="270"> 90&deg; berlawanan arah</label>
      </div>
      <div class="option-row">
        <label>Terapkan ke</label>
        <select id="scope">
          <option value="all">Semua halaman</option>
          <option value="pick">Pilih halaman</option>
        </select>
      </div>
      <div id="pickRow" class="hidden">
        <p class="muted">Klik halaman yang ingin diputar.</p>
        <div id="pageGrid"></div>
      </div>`;
    await App.buildPageGrid(pdf, panel.querySelector("#pageGrid"), { multi: true });
    panel.querySelector("#scope").addEventListener("change", (e) => {
      panel.querySelector("#pickRow").classList.toggle("hidden", e.target.value !== "pick");
    });
  },
  collectOptions(panel) {
    const scope = panel.querySelector("#scope").value;
    let pages = null;
    if (scope === "pick") {
      pages = Array.from(panel.querySelectorAll(".page-item.selected")).map((x) => +x.dataset.page);
    }
    return { dir: +panel.querySelector('input[name="dir"]:checked').value, pages };
  },
  process: async (files, api) => {
    const { PDFDocument, degrees } = App.getPdfLib();
    const f = files[0];
    const src = await PDFDocument.load(await App.readAsArrayBuffer(f));
    const opts = api.getOptions();
    const total = src.getPageCount();
    for (let i = 0; i < total; i++) {
      if (opts.pages && !opts.pages.includes(i + 1)) continue;
      const page = src.getPage(i);
      const cur = page.getRotation().angle;
      page.setRotation(degrees((cur + opts.dir) % 360));
    }
    const bytes = await src.save();
    return { files: [{ name: App.baseName(f.name) + "_diputar.pdf", blob: new Blob([bytes], { type: "application/pdf" }) }] };
  }
});