/* AI: Ringkas & Terjemah PDF (butuh API key, CORS proxy untuk dipakai dari browser) */
(function (App) {
  "use strict";

  async function extractText(pdf) {
    let text = "";
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const tc = await page.getTextContent();
      let curY = null, cur = [];
      const lines = [];
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
        if (t) text += t + "\n";
      });
    }
    return text;
  }

  async function callLLM(opts, messages) {
    const base = (opts.baseUrl || "https://api.openai.com/v1").replace(/\/+$/, "");
    const res = await fetch(base + "/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + opts.apiKey },
      body: JSON.stringify({ model: opts.model || "gpt-4o-mini", messages, max_tokens: +(opts.maxTokens || 2000) })
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error("API error " + res.status + ": " + t.slice(0, 200));
    }
    const data = await res.json();
    return data.choices[0].message.content;
  }

  const aiFields = `
    <div class="note-box">Tool AI memerlukan <strong>API key</strong> (mis. OpenAI) dan <strong>proxy/CORS backend</strong> — browser tidak bisa memanggil API LLM langsung. Cocok untuk integrasi lanjutan.</div>
    <div class="option-row"><label>API Key</label><input type="password" id="aiKey" placeholder="sk-..."></div>
    <div class="option-row"><label>Base URL</label><input type="text" id="aiBase" placeholder="https://api.openai.com/v1"></div>
    <div class="option-row"><label>Model</label><input type="text" id="aiModel" placeholder="gpt-4o-mini"></div>
    <div class="option-row"><label>Maks token output</label><input type="number" id="aiMax" min="100" max="16000" value="2000"></div>`;

  function collectAI(panel) {
    return {
      apiKey: panel.querySelector("#aiKey").value,
      baseUrl: panel.querySelector("#aiBase").value,
      model: panel.querySelector("#aiModel").value,
      maxTokens: panel.querySelector("#aiMax").value
    };
  }

  App.register({
    id: "summarize",
    name: "Ringkas AI",
    desc: "Buat ringkasan singkat dan padat dari isi dokumen PDF memakai AI.",
    category: "intelligence",
    icon: "sparkles",
    accept: ".pdf",
    new: true,
    renderOptions(panel) {
      panel.innerHTML = aiFields;
    },
    collectOptions: collectAI,
    process: async (files, api) => {
      const opts = api.getOptions();
      if (!opts.apiKey) throw new Error("Isi API Key terlebih dahulu.");
      const pdf = await App.loadPdfJsDoc(await App.readAsArrayBuffer(files[0]));
      api.progress("Mengekstrak teks…", 15);
      const text = await extractText(pdf);
      if (!text.trim()) throw new Error("Tidak ada teks yang bisa diringkas.");
      api.progress("Memanggil AI…", 40);
      const out = await callLLM(opts, [
        { role: "system", content: "Kamu adalah asisten peringkas dokumen. Ringkas isi dokumen dengan jelas dan terstruktur dalam bahasa Indonesia." },
        { role: "user", content: "Ringkas dokumen berikut:\n\n" + text.slice(0, 60000) }
      ]);
      const blob = new Blob([out], { type: "text/plain;charset=utf-8" });
      return { files: [{ name: App.baseName(files[0].name) + "_ringkasan.txt", blob }] };
    }
  });

  App.register({
    id: "translate",
    name: "Terjemahkan PDF",
    desc: "Terjemahkan isi teks PDF ke bahasa lain memakai AI, hasil berupa file teks.",
    category: "intelligence",
    icon: "translate",
    accept: ".pdf",
    new: true,
    renderOptions(panel) {
      panel.innerHTML = aiFields + `
        <div class="option-row">
          <label>Bahasa tujuan</label>
          <select id="aiLang">
            <option value="bahasa Indonesia" selected>Indonesia</option>
            <option value="English">English</option>
            <option value="bahasa Melayu">Melayu</option>
            <option value="中文">中文</option>
            <option value="日本語">日本語</option>
            <option value="español">Español</option>
            <option value="Deutsch">Deutsch</option>
          </select>
        </div>`;
    },
    collectOptions(panel) {
      return Object.assign(collectAI(panel), { lang: panel.querySelector("#aiLang").value });
    },
    process: async (files, api) => {
      const opts = api.getOptions();
      if (!opts.apiKey) throw new Error("Isi API Key terlebih dahulu.");
      const pdf = await App.loadPdfJsDoc(await App.readAsArrayBuffer(files[0]));
      api.progress("Mengekstrak teks…", 15);
      const text = await extractText(pdf);
      if (!text.trim()) throw new Error("Tidak ada teks yang bisa diterjemahkan.");
      api.progress("Memanggil AI…", 40);
      const out = await callLLM(opts, [
        { role: "system", content: "Kamu adalah penerjemah profesional. Terjemahkan dokumen ke bahasa: " + opts.lang + ". Pertahankan makna dan struktur." },
        { role: "user", content: "Terjemahkan dokumen berikut:\n\n" + text.slice(0, 60000) }
      ]);
      const blob = new Blob([out], { type: "text/plain;charset=utf-8" });
      return { files: [{ name: App.baseName(files[0].name) + "_terjemahan.txt", blob }] };
    }
  });
})(window.App);