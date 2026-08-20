/* Bandingkan dua PDF */
App.register({
  id: "compare",
  name: "Bandingkan PDF",
  desc: "Unggah 2 PDF dan lihat perbedaan antar halaman, lalu unduh laporan PDF dengan perubahan yang disorot.",
  category: "security",
  icon: "compare",
  accept: ".pdf",
  acceptLabel: "2 file PDF",
  multiple: true,
  maxFiles: 2,
  renderOptions: async function (panel, files) {
    if (files.length !== 2) {
      panel.innerHTML = `<div class="note-box">Unggah <strong>2 file PDF</strong> untuk dibandingkan.</div>`;
      return;
    }
    const pdfA = await App.loadPdfJsDoc(await App.readAsArrayBuffer(files[0]));
    const pdfB = await App.loadPdfJsDoc(await App.readAsArrayBuffer(files[1]));
    panel.innerHTML = `
      <h4>Perbandingan halaman</h4>
      <div class="option-row checkbox-grid">
        <label><input type="checkbox" id="diffToggle" checked> Sorot perbedaan (merah)</label>
      </div>
      <div class="compare-grid" id="cmpGrid"></div>`;
    const grid = panel.querySelector("#cmpGrid");
    const maxP = Math.max(pdfA.numPages, pdfB.numPages);
    const colA = files[0].name, colB = files[1].name;
    for (let p = 1; p <= maxP; p++) {
      const row = document.createElement("div");
      row.className = "compare-grid";
      row.style.gridColumn = "1 / -1";
      row.innerHTML = `
        <div class="compare-col"><h5>${App.escapeHtml(colA)} — hal ${p}</h5><canvas data-side="a"></canvas></div>
        <div class="compare-col"><h5>${App.escapeHtml(colB)} — hal ${p}</h5><canvas data-side="b"></canvas></div>`;
      grid.appendChild(row);
    }
    const diffToggle = panel.querySelector("#diffToggle");
    const renderPage = async (pdf, p, canvas) => {
      const { canvas: rc } = await App.renderPageToCanvas(pdf, Math.min(p, pdf.numPages), 1.2);
      canvas.width = rc.width; canvas.height = rc.height;
      canvas.getContext("2d").drawImage(rc, 0, 0);
    };
    const renderDiff = async (p, canvasA, canvasB) => {
      const a = await App.renderPageToCanvas(pdfA, Math.min(p, pdfA.numPages), 1.2);
      const b = await App.renderPageToCanvas(pdfB, Math.min(p, pdfB.numPages), 1.2);
      const w = Math.max(a.canvas.width, b.canvas.width), h = Math.max(a.canvas.height, b.canvas.height);
      const ca = document.createElement("canvas"); ca.width = w; ca.height = h;
      ca.getContext("2d").drawImage(a.canvas, 0, 0);
      const cb = document.createElement("canvas"); cb.width = w; cb.height = h;
      cb.getContext("2d").drawImage(b.canvas, 0, 0);
      const da = ca.getContext("2d").getImageData(0, 0, w, h);
      const db = cb.getContext("2d").getImageData(0, 0, w, h);
      const out = ca.getContext("2d").createImageData(w, h);
      for (let i = 0; i < da.data.length; i += 4) {
        const diff = Math.abs(da.data[i] - db.data[i]) + Math.abs(da.data[i + 1] - db.data[i + 1]) + Math.abs(da.data[i + 2] - db.data[i + 2]);
        if (diff > 60) {
          out.data[i] = 255; out.data[i + 1] = 60; out.data[i + 2] = 60; out.data[i + 3] = 200;
        } else {
          out.data[i] = da.data[i]; out.data[i + 1] = da.data[i + 1]; out.data[i + 2] = da.data[i + 2]; out.data[i + 3] = 255;
        }
      }
      canvasA.width = w; canvasA.height = h;
      canvasA.getContext("2d").putImageData(out, 0, 0);
    };
    grid.querySelectorAll(".compare-col").forEach(async (col) => {
      const canvas = col.querySelector("canvas");
      const side = canvas.dataset.side;
      const p = +col.querySelector("h5").textContent.match(/hal (\d+)/)[1];
      await renderPage(side === "a" ? pdfA : pdfB, p, canvas);
      col.querySelector("h5").dataset.p = p;
    });
    diffToggle.addEventListener("change", async () => {
      if (diffToggle.checked) {
        grid.querySelectorAll(".compare-col").forEach(async (col) => {
          const p = +col.querySelector("h5").textContent.match(/hal (\d+)/)[1];
          const side = col.querySelector("canvas").dataset.side;
          if (side === "a") {
            const other = col.parentElement.querySelector('.compare-col [data-side="b"] canvas');
            await renderDiff(p, col.querySelector("canvas"), other);
          }
        });
      } else {
        grid.querySelectorAll(".compare-col").forEach(async (col) => {
          const p = +col.querySelector("h5").textContent.match(/hal (\d+)/)[1];
          const side = col.querySelector("canvas").dataset.side;
          await renderPage(side === "a" ? pdfA : pdfB, p, col.querySelector("canvas"));
        });
      }
    });
  },
  collectOptions() { return {}; },
  process: async (files, api) => {
    if (files.length !== 2) throw new Error("Unggah 2 file PDF untuk dibandingkan.");
    const pdfA = await App.loadPdfJsDoc(await App.readAsArrayBuffer(files[0]));
    const pdfB = await App.loadPdfJsDoc(await App.readAsArrayBuffer(files[1]));
    const { PDFDocument } = App.getPdfLib();
    const out = await PDFDocument.create();
    const maxP = Math.max(pdfA.numPages, pdfB.numPages);
    for (let p = 1; p <= maxP; p++) {
      const a = await App.renderPageToCanvas(pdfA, Math.min(p, pdfA.numPages), 2);
      const b = await App.renderPageToCanvas(pdfB, Math.min(p, pdfB.numPages), 2);
      const w = Math.max(a.canvas.width, b.canvas.width), h = Math.max(a.canvas.height, b.canvas.height);
      const report = document.createElement("canvas");
      report.width = w * 2 + 20; report.height = h;
      const ctx = report.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, report.width, report.height);
      ctx.drawImage(a.canvas, 0, 0);
      ctx.drawImage(b.canvas, w + 20, 0);
      const ra = report.getContext("2d").getImageData(0, 0, w, h);
      const rb = report.getContext("2d").getImageData(w + 20, 0, w, h);
      const d = report.getContext("2d").getImageData(0, 0, report.width, report.height);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const ia = (y * w + x) * 4;
          if (Math.abs(ra.data[ia] - rb.data[ia]) + Math.abs(ra.data[ia + 1] - rb.data[ia + 1]) + Math.abs(ra.data[ia + 2] - rb.data[ia + 2]) > 60) {
            const iaA = (y * report.width + x) * 4;
            const iaB = (y * report.width + (w + 20 + x)) * 4;
            d.data[iaA] = 255; d.data[iaA + 1] = 60; d.data[iaA + 2] = 60; d.data[iaA + 3] = 255;
            d.data[iaB] = 255; d.data[iaB + 1] = 60; d.data[iaB + 2] = 60; d.data[iaB + 3] = 255;
          }
        }
      }
      report.getContext("2d").putImageData(d, 0, 0);
      const blob = await App.canvasToJpegBlob(report, 0.92);
      const img = await out.embedJpg(await blob.arrayBuffer());
      const pw = a.pdfW + b.pdfW, ph = Math.max(a.pdfH, b.pdfH);
      const page = out.addPage([pw, ph]);
      page.drawImage(img, { x: 0, y: 0, width: pw, height: ph });
      api.progress("Membandingkan…", Math.round((p / maxP) * 100));
    }
    const bytes = await out.save();
    return { files: [{ name: "laporan_perbandingan.pdf", blob: new Blob([bytes], { type: "application/pdf" }) }] };
  }
});