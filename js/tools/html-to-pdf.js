/* HTML menjadi PDF */
App.register({
  id: "html-to-pdf",
  name: "HTML ke PDF",
  desc: "Konversi file HTML atau kode HTML menjadi PDF dengan tata letak sederhana.",
  category: "convert",
  icon: "html2pdf",
  accept: ".html,.htm,.txt",
  acceptLabel: "file HTML",
  renderOptions(panel) {
    panel.innerHTML = `
      <div class="option-row">
        <label>Atau tempel kode HTML</label>
        <textarea id="htmlCode" placeholder="<html><body><h1>Halo dunia</h1></body></html>"></textarea>
      </div>
      <div class="option-row">
        <label>Orientasi</label>
        <select id="orient"><option value="portrait" selected>Potret</option><option value="landscape">Lanskap</option></select>
      </div>`;
  },
  collectOptions(panel) {
    return { html: panel.querySelector("#htmlCode").value, orient: panel.querySelector("#orient").value };
  },
  process: async (files, api) => {
    let html = api.getOptions().html;
    if (files.length && !html.trim()) {
      html = await files[0].text();
    }
    if (!html.trim()) throw new Error("Tidak ada HTML. Unggah file atau tempel kode HTML.");
    api.progress("Merender HTML…", 40);
    const blob = await App.htmlToPdfBlob(html, { margin: 10, orientation: api.getOptions().orient });
    return { files: [{ name: "halaman.html.pdf", blob }] };
  }
});