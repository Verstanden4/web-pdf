/* PDF menjadi Excel (XLSX) - ekstraksi teks ke tabel */
App.register({
  id: "pdf-to-excel",
  name: "PDF ke Excel",
  desc: "Ekstrak teks dari PDF menjadi spreadsheet Excel. Deteksi tabel dilakukan secara sederhana.",
  category: "convert",
  icon: "pdf2xls",
  accept: ".pdf",
  process: async (files, api) => {
    const f = files[0];
    const pdf = await App.loadPdfJsDoc(await App.readAsArrayBuffer(f));
    const aoa = [];
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
        const text = ln.map((it) => it.str).join(" ");
        const cells = text.split(/\s{2,}|\t/).map((c) => c.trim()).filter(Boolean);
        aoa.push(cells.length ? cells : [text]);
      });
      api.progress("Mengekstrak halaman…", Math.round((p / pdf.numPages) * 80));
    }
    if (!aoa.length) throw new Error("Tidak ada teks yang bisa diekstrak.");
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, "Halaman");
    api.progress("Membuat file Excel…", 95);
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    return { files: [{ name: App.baseName(f.name) + ".xlsx", blob }] };
  }
});