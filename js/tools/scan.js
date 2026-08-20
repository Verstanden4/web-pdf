/* Pindai dokumen lewat kamera menjadi PDF */
App.register({
  id: "scan",
  name: "Pindai ke PDF",
  desc: "Ambil foto dokumen dengan kamera lalu ubah menjadi PDF (butuh izin kamera, HTTPS/localhost).",
  category: "organize",
  icon: "scan",
  accept: ".jpg,.jpeg,.png",
  acceptLabel: "file hasil scan",
  multiple: true,
  renderOptions(panel) {
    panel.innerHTML = `
      <h4>Pindai lewat kamera</h4>
      <div class="option-row">
        <button class="btn btn-ghost" id="startCam" type="button">Mulai kamera</button>
        <button class="btn btn-ghost" id="shoot" type="button">Ambil foto</button>
        <button class="btn btn-ghost" id="stopCam" type="button">Matikan kamera</button>
      </div>
      <div id="camWrap" style="text-align:center;margin:10px 0" class="hidden">
        <video id="camVideo" autoplay playsinline style="max-width:100%;max-height:380px;border-radius:10px;background:#000"></video>
      </div>
      <div id="shotList" class="page-grid"></div>
      <p class="muted">Atau unggah langsung gambar hasil scan dari perangkat kamu lewat tombol "Pilih file".</p>`;
    const video = panel.querySelector("#camVideo");
    const shotList = panel.querySelector("#shotList");
    const shots = [];
    panel.__scanShots = shots;
    let stream = null;

    panel.querySelector("#startCam").addEventListener("click", async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = stream;
        panel.querySelector("#camWrap").classList.remove("hidden");
        await video.play();
      } catch (e) {
        App.toast("Kamera tidak tersedia / izin ditolak. Unggah gambar saja.");
      }
    });
    panel.querySelector("#shoot").addEventListener("click", () => {
      if (!stream) { App.toast("Nyalakan kamera dulu."); return; }
      const c = document.createElement("canvas");
      c.width = video.videoWidth; c.height = video.videoHeight;
      c.getContext("2d").drawImage(video, 0, 0);
      c.toBlob((b) => {
        const item = document.createElement("div");
        item.className = "page-item";
        item.innerHTML = `<img src="${c.toDataURL("image/jpeg", 0.9)}">`;
        shotList.appendChild(item);
        shots.push(b);
        App.toast("Foto ditambahkan.");
      }, "image/jpeg", 0.9);
    });
    panel.querySelector("#stopCam").addEventListener("click", () => {
      if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
      panel.querySelector("#camWrap").classList.add("hidden");
    });
  },
  collectOptions(panel) {
    return { shots: panel.__scanShots || [] };
  },
  process: async (files, api) => {
    const { PDFDocument } = App.getPdfLib();
    const out = await PDFDocument.create();
    const blobs = api.getOptions().shots.length ? api.getOptions().shots : files;
    if (!blobs.length) throw new Error("Tidak ada gambar. Pindai atau unggah gambar dulu.");
    for (let i = 0; i < blobs.length; i++) {
      const bytes = blobs[i] instanceof Blob ? await blobs[i].arrayBuffer() : await App.readAsArrayBuffer(blobs[i]);
      const img = await out.embedJpg(bytes);
      const page = out.addPage([img.width, img.height]);
      page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      api.progress("Menyusun PDF…", Math.round(((i + 1) / blobs.length) * 100));
    }
    const outBytes = await out.save();
    return { files: [{ name: "hasil_scan.pdf", blob: new Blob([outBytes], { type: "application/pdf" }) }] };
  }
});