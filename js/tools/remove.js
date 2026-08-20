/* Hapus halaman dari PDF */
App.register({
  id: "remove",
  name: "Hapus Halaman",
  desc: "Hapus halaman yang tidak diinginkan dari PDF kamu.",
  category: "organize",
  icon: "remove",
  accept: ".pdf",
  renderOptions: async function (panel, files) {
    const f = files[0];
    const pdf = await App.loadPdfJsDoc(await App.readAsArrayBuffer(f));
    panel.innerHTML = `
      <h4>Pilih halaman yang ingin dihapus</h4>
      <div class="option-row checkbox-grid">
        <label><input type="checkbox" id="selOdd"> Semua ganjil</label>
        <label><input type="checkbox" id="selEven"> Semua genap</label>
      </div>
      <p class="muted">Klik halaman untuk menandai sebagai hapus.</p>
      <div id="pageGrid"></div>`;
    const grid = panel.querySelector("#pageGrid");
    await App.buildPageGrid(pdf, grid, { multi: true, allSelected: false });
    const selOdd = panel.querySelector("#selOdd");
    const selEven = panel.querySelector("#selEven");
    selOdd.addEventListener("change", () => {
      grid.querySelectorAll(".page-item").forEach((x) => x.classList.toggle("selected", selOdd.checked && +x.dataset.page % 2 === 1));
      selEven.checked = false;
    });
    selEven.addEventListener("change", () => {
      grid.querySelectorAll(".page-item").forEach((x) => x.classList.toggle("selected", selEven.checked && +x.dataset.page % 2 === 0));
      selOdd.checked = false;
    });
  },
  collectOptions(panel) {
    return { pages: Array.from(panel.querySelectorAll(".page-item.selected")).map((x) => +x.dataset.page) };
  },
  process: async (files, api) => {
    const { PDFDocument } = App.getPdfLib();
    const f = files[0];
    const src = await PDFDocument.load(await App.readAsArrayBuffer(f));
    const removeSet = new Set(api.getOptions().pages || []);
    if (!removeSet.size) throw new Error("Tidak ada halaman yang dipilih untuk dihapus.");
    const out = await PDFDocument.create();
    const keep = [];
    for (let i = 0; i < src.getPageCount(); i++) if (!removeSet.has(i + 1)) keep.push(i);
    if (!keep.length) throw new Error("Semua halaman akan dihapus. Tidak ada yang tersisa.");
    const pages = await out.copyPages(src, keep);
    pages.forEach((p) => out.addPage(p));
    const bytes = await out.save();
    return { files: [{ name: App.baseName(f.name) + "_tanpa_halaman.pdf", blob: new Blob([bytes], { type: "application/pdf" }) }] };
  }
});