/* Watermark teks atau gambar di atas PDF */
App.register({
  id: "watermark",
  name: "Watermark",
  desc: "Beri watermark teks atau gambar di atas PDF. Atur transparansi, posisi, dan rotasi.",
  category: "edit",
  icon: "watermark",
  accept: ".pdf",
  renderOptions(panel) {
    panel.innerHTML = `
      <h4>Jenis watermark</h4>
      <div class="option-row">
        <label><input type="radio" name="wmtype" value="text" checked> Teks</label>
        <label><input type="radio" name="wmtype" value="image"> Gambar</label>
      </div>
      <div class="option-row" id="textRow"><label>Teks</label><input type="text" id="wmtext" placeholder="RAHASIA"></div>
      <div class="option-row hidden" id="imgRow"><label>Gambar (PNG/JPG)</label><input type="file" id="wmimg" accept=".png,.jpg,.jpeg"></div>
      <div class="option-row">
        <label>Ukuran / skala</label>
        <div class="range-row"><input type="range" id="size" min="12" max="120" value="48"><output id="sizeOut">48</output></div>
      </div>
      <div class="option-row">
        <label>Transparansi</label>
        <div class="range-row"><input type="range" id="opacity" min="5" max="100" value="25"><output id="opOut">25%</output></div>
      </div>
      <div class="option-row">
        <label>Posisi</label>
        <select id="position">
          <option value="center">Tengah</option>
          <option value="tile">Tersebar (ubin)</option>
          <option value="diagonal">Diagonal</option>
          <option value="tl">Kiri atas</option>
          <option value="tr">Kanan atas</option>
          <option value="bl">Kiri bawah</option>
          <option value="br">Kanan bawah</option>
        </select>
      </div>
      <div class="option-row checkbox-grid">
        <label><input type="checkbox" id="rotate"> Miringkan 45&deg;</label>
      </div>`;
    const sync = () => {
      const t = panel.querySelector('input[name="wmtype"]:checked').value;
      panel.querySelector("#textRow").classList.toggle("hidden", t !== "text");
      panel.querySelector("#imgRow").classList.toggle("hidden", t !== "image");
    };
    panel.querySelectorAll('input[name="wmtype"]').forEach((i) => i.addEventListener("change", sync));
    panel.querySelector("#size").addEventListener("input", (e) => { panel.querySelector("#sizeOut").value = e.target.value; });
    panel.querySelector("#opacity").addEventListener("input", (e) => { panel.querySelector("#opOut").value = e.target.value + "%"; });
  },
  collectOptions(panel) {
    return {
      wmtype: panel.querySelector('input[name="wmtype"]:checked').value,
      text: panel.querySelector("#wmtext").value || "RAHASIA",
      img: panel.querySelector("#wmimg").files[0] || null,
      size: +panel.querySelector("#size").value,
      opacity: +panel.querySelector("#opacity").value / 100,
      position: panel.querySelector("#position").value,
      rotate: panel.querySelector("#rotate").checked
    };
  },
  process: async (files, api) => {
    const { PDFDocument, StandardFonts, degrees } = App.getPdfLib();
    const f = files[0];
    const src = await PDFDocument.load(await App.readAsArrayBuffer(f));
    const opts = api.getOptions();
    let font, img;
    if (opts.wmtype === "text") {
      font = await src.embedFont(StandardFonts.HelveticaBold);
    } else {
      if (!opts.img) throw new Error("Pilih gambar untuk watermark.");
      const bytes = await App.readAsArrayBuffer(opts.img);
      const isPng = opts.img.name.toLowerCase().endsWith(".png");
      img = isPng ? await src.embedPng(bytes) : await src.embedJpg(bytes);
    }
    const rot = opts.rotate ? 45 : 0;
    for (let i = 0; i < src.getPageCount(); i++) {
      const page = src.getPage(i);
      const pw = page.getWidth(), ph = page.getHeight();
      if (opts.wmtype === "text") {
        const fsize = opts.size;
        const tw = font.widthOfTextAtSize(opts.text, fsize);
        const th = font.heightAtSize(fsize);
        const positions = [];
        if (opts.position === "tile") {
          const stepX = tw + 80, stepY = th * 3;
          for (let x = -tw; x < pw + tw; x += stepX)
            for (let y = -th; y < ph + th; y += stepY) positions.push([x, y]);
        } else if (opts.position === "diagonal") {
          const n = Math.ceil((pw + ph) / 200);
          for (let k = 0; k < n; k++) positions.push([(pw / n) * k - tw / 2, ph - (ph / n) * k - th / 2]);
        } else if (opts.position === "tl") positions.push([40, ph - 40 - th]);
        else if (opts.position === "tr") positions.push([pw - tw - 40, ph - 40 - th]);
        else if (opts.position === "bl") positions.push([40, 40]);
        else if (opts.position === "br") positions.push([pw - tw - 40, 40]);
        else positions.push([(pw - tw) / 2, (ph - th) / 2]);
        positions.forEach(([x, y]) => {
          page.drawText(opts.text, { x, y, size: fsize, font, color: PDFLib.rgb(0.7, 0.7, 0.7), opacity: opts.opacity, rotate: degrees(rot) });
        });
      } else {
        const iw = opts.size * 3;
        const s = Math.min(iw / img.width, iw / img.height);
        const w = img.width * s, h = img.height * s;
        const positions = [];
        if (opts.position === "tile") {
          const stepX = w + 60, stepY = h + 60;
          for (let x = -w; x < pw + w; x += stepX)
            for (let y = -h; y < ph + h; y += stepY) positions.push([x, y]);
        } else if (opts.position === "diagonal") {
          const n = Math.ceil((pw + ph) / 150);
          for (let k = 0; k < n; k++) positions.push([(pw / n) * k - w / 2, ph - (ph / n) * k - h / 2]);
        } else if (opts.position === "tl") positions.push([40, ph - 40 - h]);
        else if (opts.position === "tr") positions.push([pw - w - 40, ph - 40 - h]);
        else if (opts.position === "bl") positions.push([40, 40]);
        else if (opts.position === "br") positions.push([pw - w - 40, 40]);
        else positions.push([(pw - w) / 2, (ph - h) / 2]);
        positions.forEach(([x, y]) => {
          page.drawImage(img, { x, y, width: w, height: h, opacity: opts.opacity, rotate: degrees(rot) });
        });
      }
      api.progress("Memberi watermark…", Math.round(((i + 1) / src.getPageCount()) * 100));
    }
    const bytes = await src.save();
    return { files: [{ name: App.baseName(f.name) + "_watermark.pdf", blob: new Blob([bytes], { type: "application/pdf" }) }] };
  }
});