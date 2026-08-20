/* Pisahkan PDF menjadi beberapa file */
App.register({
  id: "split",
  name: "Pisahkan PDF",
  desc: "Pisahkan setiap halaman atau rentang halaman tertentu menjadi file PDF terpisah.",
  category: "organize",
  icon: "split",
  accept: ".pdf",
  renderOptions(panel) {
    panel.innerHTML = `
      <h4>Mode pemisahan</h4>
      <div class="option-row">
        <label><input type="radio" name="mode" value="page" checked> Setiap halaman menjadi file terpisah</label>
        <label><input type="radio" name="mode" value="range"> Rentang tertentu (contoh: 1-3,5,8-10)</label>
        <label><input type="radio" name="mode" value="every"> Pisahkan setiap N halaman</label>
      </div>
      <div class="option-row hidden" id="rangeRow"><label>Rentang</label><input type="text" id="ranges" placeholder="1-3,5,8-10"></div>
      <div class="option-row hidden" id="everyRow"><label>Setiap</label><input type="number" id="every" min="1" value="2"></div>
      <div class="option-row">
        <label>Nama file</label>
        <select id="naming">
          <option value="name_page">nama_halaman</option>
          <option value="page">halaman</option>
          <option value="name">nama</option>
        </select>
      </div>`;
    const sync = () => {
      const v = panel.querySelector('input[name="mode"]:checked').value;
      panel.querySelector("#rangeRow").classList.toggle("hidden", v !== "range");
      panel.querySelector("#everyRow").classList.toggle("hidden", v !== "every");
    };
    panel.querySelectorAll('input[name="mode"]').forEach((i) => i.addEventListener("change", sync));
  },
  collectOptions(panel) {
    return {
      mode: panel.querySelector('input[name="mode"]:checked').value,
      ranges: panel.querySelector("#ranges").value,
      every: panel.querySelector("#every").value,
      naming: panel.querySelector("#naming").value
    };
  },
  process: async (files, api) => {
    const { PDFDocument } = App.getPdfLib();
    const f = files[0];
    const src = await PDFDocument.load(await App.readAsArrayBuffer(f));
    const opts = api.getOptions();
    const base = App.baseName(f.name);
    const n = src.getPageCount();
    const ranges = [];
    if (opts.mode === "page") for (let i = 1; i <= n; i++) ranges.push([i, i]);
    else if (opts.mode === "range") {
      const pages = App.parseRanges(opts.ranges, n);
      if (!pages.length) throw new Error("Rentang tidak valid.");
      pages.forEach((p) => ranges.push([p, p]));
    } else {
      const step = Math.max(1, parseInt(opts.every) || 2);
      for (let i = 1; i <= n; i += step) ranges.push([i, Math.min(i + step - 1, n)]);
    }
    const out = [];
    let idx = 1;
    for (const [a, b] of ranges) {
      const d = await PDFDocument.create();
      const inds = [];
      for (let i = a; i <= b; i++) inds.push(i - 1);
      const pages = await d.copyPages(src, inds);
      pages.forEach((p) => d.addPage(p));
      const bytes = await d.save();
      const name = opts.naming === "name" ? base + ".pdf"
        : opts.naming === "page" ? `halaman_${a}_${b}.pdf`
        : `${base}_${a}_${b}.pdf`;
      out.push({ name, blob: new Blob([bytes], { type: "application/pdf" }) });
      api.progress("Memisahkan…", Math.round((idx++ / ranges.length) * 100));
    }
    return { files: out, zipName: base + "_terpisah.zip" };
  }
});