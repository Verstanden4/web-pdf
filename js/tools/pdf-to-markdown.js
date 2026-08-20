/* PDF menjadi Markdown */
App.register({
  id: "pdf-to-markdown",
  name: "PDF ke Markdown",
  desc: "Ekstrak teks dari PDF menjadi file Markdown (.md) yang rapi untuk catatan atau LLM.",
  category: "convert",
  icon: "pdf2md",
  accept: ".pdf",
  renderOptions(panel) {
    panel.innerHTML = `
      <div class="option-row checkbox-grid">
        <label><input type="checkbox" id="pageBreak" checked> Tandai batas halaman</label>
      </div>`;
  },
  collectOptions(panel) {
    return { pageBreak: panel.querySelector("#pageBreak").checked };
  },
  process: async (files, api) => {
    const f = files[0];
    const pdf = await App.loadPdfJsDoc(await App.readAsArrayBuffer(f));
    const opts = api.getOptions();
    let md = "# Ekstraksi PDF: " + f.name + "\n\n";
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const tc = await page.getTextContent();
      const lines = [];
      let curY = null, cur = [];
      tc.items.forEach((it) => {
        if (!it.str) return;
        const y = it.transform[5];
        if (curY === null || Math.abs(y - curY) > 3) {
          if (cur.length) lines.push(cur);
          cur = [it]; curY = y;
        } else cur.push(it);
      });
      if (cur.length) lines.push(cur);
      lines.forEach((ln) => {
        ln.sort((a, b) => a.transform[4] - b.transform[4]);
        const t = ln.map((it) => it.str).join(" ").trim();
        if (t) md += t + "\n\n";
      });
      if (opts.pageBreak && p < pdf.numPages) md += "\n---\n\n";
      api.progress("Mengekstrak halaman…", Math.round((p / pdf.numPages) * 90));
    }
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    return { files: [{ name: App.baseName(f.name) + ".md", blob }] };
  }
});