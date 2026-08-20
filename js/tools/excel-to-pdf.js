/* Excel (XLSX) menjadi PDF */
App.register({
  id: "excel-to-pdf",
  name: "Excel ke PDF",
  desc: "Konversi lembar kerja Excel (XLSX/XLS) menjadi PDF dengan tata letak tabel sederhana.",
  category: "convert",
  icon: "xls2pdf",
  accept: ".xlsx,.xls",
  acceptLabel: "file Excel",
  process: async (files, api) => {
    api.progress("Membaca spreadsheet…", 15);
    const buf = await App.readAsArrayBuffer(files[0]);
    const wb = XLSX.read(new Uint8Array(buf), { type: "array" });
    const htmlParts = [];
    wb.SheetNames.forEach((sn, si) => {
      const ws = wb.Sheets[sn];
      const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
      if (!aoa.length) return;
      htmlParts.push(`<h2 style="font-size:14pt;margin:8px 0">${App.escapeHtml(sn)}</h2>`);
      let table = '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:10pt">';
      aoa.forEach((row, ri) => {
        table += "<tr>";
        row.forEach((cell) => {
          const val = cell == null ? "" : String(cell);
          table += `<td${ri === 0 ? ' style="background:#eee;font-weight:bold"' : ""}>${App.escapeHtml(val)}</td>`;
        });
        table += "</tr>";
      });
      table += "</table>";
      htmlParts.push(table);
      api.progress("Menyusun tabel…", Math.round(((si + 1) / wb.SheetNames.length) * 50) + 20);
    });
    if (!htmlParts.length) throw new Error("Tidak ada data di spreadsheet.");
    api.progress("Merender ke PDF…", 75);
    const blob = await App.htmlToPdfBlob(htmlParts.join(""), { margin: 10, orientation: "landscape" });
    return { files: [{ name: App.baseName(files[0].name) + ".pdf", blob }] };
  }
});