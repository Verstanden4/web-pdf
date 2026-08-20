/* PDF menjadi dokumen Word (DOCX) - berbasis teks */
App.register({
  id: "pdf-to-word",
  name: "PDF ke Word",
  desc: "Ekstrak teks dari PDF menjadi dokumen Word (.docx). Format lanjutan (gambar, kolom) disederhanakan.",
  category: "convert",
  icon: "pdf2doc",
  accept: ".pdf",
  process: async (files, api) => {
    const f = files[0];
    const pdf = await App.loadPdfJsDoc(await App.readAsArrayBuffer(f));
    const paragraphs = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const tc = await page.getTextContent();
      const lines = [];
      let curY = null, cur = [];
      tc.items.forEach((it) => {
        if (!it.str) return;
        const y = it.transform[5];
        if (curY === null || Math.abs(y - curY) > 2) {
          if (cur.length) lines.push(cur);
          cur = [it]; curY = y;
        } else {
          cur.push(it);
        }
      });
      if (cur.length) lines.push(cur);
      lines.forEach((ln) => {
        ln.sort((a, b) => a.transform[4] - b.transform[4]);
        paragraphs.push(ln.map((it) => it.str).join(" "));
      });
      api.progress("Mengekstrak teks…", Math.round((p / pdf.numPages) * 80));
    }

    const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const body = paragraphs.map((t) =>
      `<w:p><w:r><w:t xml:space="preserve">${esc(t)}</w:t></w:r></w:p>`
    ).join("");
    const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr/></w:body></w:document>`;
    const ctXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`;
    const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;

    const zip = new JSZip();
    zip.file("[Content_Types].xml", ctXml);
    zip.file("_rels/.rels", relsXml);
    zip.file("word/document.xml", docXml);
    api.progress("Membuat file Word…", 95);
    const blob = await zip.generateAsync({ type: "blob" });
    return { files: [{ name: App.baseName(f.name) + ".docx", blob }] };
  }
});