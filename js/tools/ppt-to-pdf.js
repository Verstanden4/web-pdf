/* PowerPoint (PPTX) menjadi PDF - versi sederhana berbasis teks slide */
App.register({
  id: "ppt-to-pdf",
  name: "PowerPoint ke PDF",
  desc: "Konversi presentasi PPTX menjadi PDF. Teks dan urutan slide dipertahankan; tata letak disederhanakan.",
  category: "convert",
  icon: "ppt2pdf",
  accept: ".pptx,.ppt",
  acceptLabel: "file presentasi",
  process: async (files, api) => {
    const f = files[0];
    if (f.name.toLowerCase().endsWith(".ppt")) {
      throw new Error("Format .ppt lama tidak didukung. Simpan ulang sebagai .pptx terlebih dahulu.");
    }
    api.progress("Membaca presentasi…", 15);
    const zip = await JSZip.loadAsync(await App.readAsArrayBuffer(f));
    const slides = [];
    for (let i = 1; ; i++) {
      const file = zip.file(`ppt/slides/slide${i}.xml`);
      if (!file) break;
      slides.push(await file.async("string"));
    }
    if (!slides.length) throw new Error("Tidak ada slide ditemukan.");
    const parts = [];
    slides.forEach((xml, i) => {
      const texts = [];
      const re = /<a:t>([\s\S]*?)<\/a:t>/g;
      let m;
      while ((m = re.exec(xml))) texts.push(m[1]);
      parts.push(`<div style="page-break-after:always;padding:30px;font-family:Arial,sans-serif">`);
      parts.push(`<h3 style="color:#444;border-bottom:2px solid #ddd;padding-bottom:6px">Slide ${i + 1}</h3>`);
      texts.forEach((t) => {
        t = t.trim();
        if (!t) return;
        parts.push(`<p style="margin:8px 0;font-size:13pt">${App.escapeHtml(t)}</p>`);
      });
      parts.push(`</div>`);
      api.progress("Membaca slide…", Math.round(((i + 1) / slides.length) * 50) + 15);
    });
    api.progress("Merender ke PDF…", 75);
    const blob = await App.htmlToPdfBlob(parts.join(""), { margin: 0, orientation: "landscape" });
    return { files: [{ name: App.baseName(f.name) + ".pdf", blob }] };
  }
});