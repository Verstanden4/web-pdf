/* Atur ulang urutan halaman, hapus, atau tambah halaman dari file lain */
App.register({
  id: "organize",
  name: "Atur Halaman",
  desc: "Susun ulang urutan halaman, hapus halaman, atau tambahkan halaman dari PDF lain.",
  category: "organize",
  icon: "organize",
  accept: ".pdf",
  renderOptions: async function (panel, files) {
    const f = files[0];
    const { PDFDocument } = App.getPdfLib();
    const src = await PDFDocument.load(await App.readAsArrayBuffer(f));
    const pdf = await App.loadPdfJsDoc(await App.readAsArrayBuffer(f));

    panel.innerHTML = `
      <h4>Seret halaman untuk menyusun ulang</h4>
      <p class="muted">Seret kartu untuk mengubah urutan. Klik &times; untuk menghapus halaman.</p>
      <button class="btn btn-ghost" id="btnAddPage" type="button">+ Tambah halaman dari PDF lain</button>
      <input type="file" id="addInput" accept=".pdf" hidden>
      <div id="pageGrid"></div>`;

    const grid = panel.querySelector("#pageGrid");
    grid.classList.add("page-grid");
    const state = { order: [], docs: { orig: src }, nextDoc: 1 };
    App._organizeState = App._organizeState || new WeakMap();
    App._organizeState.set(panel, state);

    async function appendItem(pageNum, label, docKey, pdfDocForThumb) {
      const { canvas } = await App.renderPageToCanvas(pdfDocForThumb, pageNum, 0.4);
      const div = document.createElement("div");
      div.className = "page-item";
      div.draggable = true;
      div.dataset.key = docKey;
      div.dataset.pagenum = pageNum;
      div.innerHTML = `<span class="page-num">${label}</span><img src="${canvas.toDataURL("image/jpeg", 0.7)}"><button class="page-del" title="Hapus">&times;</button>`;
      grid.appendChild(div);
      const key = docKey + ":" + pageNum;
      state.order.push(key);

      div.addEventListener("dragstart", (e) => {
        div.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", key);
      });
      div.addEventListener("dragend", () => div.classList.remove("dragging"));
      div.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        div.classList.add("drag-over");
      });
      div.addEventListener("dragleave", () => div.classList.remove("drag-over"));
      div.addEventListener("drop", (e) => {
        e.preventDefault();
        div.classList.remove("drag-over");
        const fromKey = e.dataTransfer.getData("text/plain");
        if (!fromKey || fromKey === key) return;
        const fromIdx = state.order.indexOf(fromKey);
        const toIdx = state.order.indexOf(key);
        if (fromIdx < 0 || toIdx < 0) return;
        state.order.splice(fromIdx, 1);
        state.order.splice(toIdx, 0, fromKey);
        rerender();
      });
      div.querySelector(".page-del").addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = state.order.indexOf(key);
        if (idx >= 0) state.order.splice(idx, 1);
        div.remove();
      });
    }
    function rerender() {
      const byKey = {};
      grid.querySelectorAll(".page-item").forEach((d) => { byKey[d.dataset.key + ":" + d.dataset.pagenum] = d; });
      grid.innerHTML = "";
      state.order.forEach((k) => { const d = byKey[k]; if (d) grid.appendChild(d); });
    }

    for (let i = 1; i <= pdf.numPages; i++) await appendItem(i, String(i), "orig", pdf);

    const addInput = panel.querySelector("#addInput");
    panel.querySelector("#btnAddPage").addEventListener("click", () => addInput.click());
    addInput.addEventListener("change", async () => {
      const files = Array.from(addInput.files);
      addInput.value = "";
      for (const file of files) {
        const doc = await PDFDocument.load(await App.readAsArrayBuffer(file));
        const docKey = "add" + state.nextDoc++;
        state.docs[docKey] = doc;
        const pdfDoc = await App.loadPdfJsDoc(await App.readAsArrayBuffer(file));
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          await appendItem(i, "T" + i, docKey, pdfDoc);
        }
      }
    });
  },
  collectOptions(panel) {
    App._organizePanel = panel;
    return {};
  },
  process: async (files, api) => {
    const { PDFDocument } = App.getPdfLib();
    const f = files[0];
    const src = await PDFDocument.load(await App.readAsArrayBuffer(f));
    const state = App._organizeState.get(App._organizePanel);
    if (!state || !state.order.length) throw new Error("Tidak ada halaman tersisa.");
    const out = await PDFDocument.create();
    let idx = 1;
    for (const key of state.order) {
      const [docKey, pageNum] = key.split(":");
      const doc = state.docs[docKey] || src;
      const p = await out.copyPages(doc, [+pageNum - 1]);
      out.addPage(p[0]);
      api.progress("Menyusun halaman…", Math.round((idx++ / state.order.length) * 100));
    }
    const bytes = await out.save();
    return { files: [{ name: App.baseName(f.name) + "_diatur.pdf", blob: new Blob([bytes], { type: "application/pdf" }) }] };
  }
});