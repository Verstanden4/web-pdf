/* Shared helpers for tool modules */
window.App = window.App || {};
(function (App) {
  "use strict";

  /* Parse "1-3,5,8-10" -> sorted unique array of ints */
  App.parseRanges = function (str, max) {
    const set = new Set();
    String(str || "").split(/[,;\s]+/).forEach((part) => {
      if (!part) return;
      const m = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
      if (!m) return;
      const a = +m[1], b = m[2] ? +m[2] : a;
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) if (i >= 1 && i <= max) set.add(i);
    });
    return Array.from(set).sort((x, y) => x - y);
  };

  /* Render a grid of page thumbnails.
     opts: { multi, removable, allSelected, onChanged(selectedArray) }
     Returns { items, getSelected, clear } */
  App.buildPageGrid = async function (pdf, container, opts) {
    opts = opts || {};
    const items = [];
    container.innerHTML = "";
    container.classList.add("page-grid");
    const scale = 0.45;
    for (let i = 1; i <= pdf.numPages; i++) {
      const { canvas } = await App.renderPageToCanvas(pdf, i, scale);
      const div = document.createElement("div");
      div.className = "page-item" + (opts.multi && opts.allSelected ? " selected" : "");
      div.dataset.page = i;
      div.innerHTML = `<span class="page-num">${i}</span><img src="${canvas.toDataURL("image/jpeg", 0.7)}">`;
      if (opts.removable) {
        div.insertAdjacentHTML("beforeend", `<button class="page-del" title="Hapus">&times;</button>`);
      }
      container.appendChild(div);
      items.push(div);

      const onChange = () => opts.onChanged && opts.onChanged(getSelected());
      if (opts.removable) {
        div.querySelector(".page-del").addEventListener("click", (e) => {
          e.stopPropagation();
          div.remove();
          onChange();
        });
      }
      if (opts.multi) {
        div.addEventListener("click", () => { div.classList.toggle("selected"); onChange(); });
      } else {
        div.addEventListener("click", () => {
          items.forEach((x) => x.classList.remove("selected"));
          div.classList.add("selected");
          onChange();
        });
      }
    }
    function getSelected() {
      return items.filter((x) => container.contains(x) && x.classList.contains("selected")).map((x) => +x.dataset.page);
    }
    function clear() { container.innerHTML = ""; items.length = 0; }
    return { items, getSelected, clear };
  };

  /* Thumbnail preview of a single image file */
  App.imageThumb = function (file) {
    return new Promise((res) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); res(img); };
      img.src = url;
    });
  };

  /* Render arbitrary HTML into a PDF blob using html2pdf.js */
  App.htmlToPdfBlob = function (html, opts) {
    opts = opts || {};
    const holder = document.createElement("div");
    holder.style.cssText = "position:absolute;left:-10000px;top:0;width:794px;background:#fff;color:#000;font-size:12pt;";
    holder.innerHTML = html;
    document.body.appendChild(holder);
    const worker = html2pdf().set({
      margin: opts.margin != null ? opts.margin : 10,
      filename: "out",
      image: { type: "jpeg", quality: 0.92 },
      html2canvas: { scale: opts.scale || 2, useCORS: true, backgroundColor: "#ffffff", logging: false },
      jsPDF: { unit: "mm", format: opts.format || "a4", orientation: opts.orientation || "portrait" },
      pagebreak: { mode: ["css", "legacy"] }
    }).from(holder);
    return worker.output("blob").then((blob) => { holder.remove(); return blob; }, (e) => { holder.remove(); throw e; });
  };

})(window.App);