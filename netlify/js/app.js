// ─── STATE ───────────────────────────────────────────────────────────────────
const state = {
  screen: "welcome",
  step: 0,
  data: {
    bedrijfsnaam: "", sector: "", contactpersoon: "",
    aantalMedewerkers: "", kostprijsPerUur: 65, naamCoordinator: "",
    aantalMensenPerIncident: "", duurIncidentMinuten: "", frequentiePerWeek: "",
    nietGefactureerd: false, nietGefactureerdMaand: 0,
    adminUrenPerWeek: "", kostprijsCoordinatorPerUur: 65,
    eenmaligeKosten: "", jaarlijkseLicentie: ""
  },
  result: null
};

const STEPS = [
  "Klantinfo", "Team & kostprijs", "Operationeel tijdverlies",
  "Niet-gefactureerde prestaties", "Administratieve druk", "Investering"
];

// ─── FORMATTING ───────────────────────────────────────────────────────────────
function fmt(n) {
  if (n == null || isNaN(n)) return "—";
  return "€\u00a0" + Math.round(n).toLocaleString("nl-BE").replace(/,/g, ".");
}
function fmtM(n) {
  if (!n || isNaN(n)) return "—";
  return (Math.round(n * 10) / 10).toFixed(1).replace(".", ",") + " mnd";
}

// ─── BEREKENINGEN ─────────────────────────────────────────────────────────────
function calc(d) {
  const k   = parseFloat(d.kostprijsPerUur) || 65;
  const kc  = parseFloat(d.kostprijsCoordinatorPerUur) || k;
  const men = parseFloat(d.aantalMensenPerIncident) || 0;
  const dur = parseFloat(d.duurIncidentMinuten) || 0;
  const fr  = parseFloat(d.frequentiePerWeek) || 0;
  const adm = parseFloat(d.adminUrenPerWeek) || 0;
  const mat = d.nietGefactureerd ? (parseFloat(d.nietGefactureerdMaand) || 0) : 0;
  const een = parseFloat(d.eenmaligeKosten) || 0;
  const lic = parseFloat(d.jaarlijkseLicentie) || 0;

  const opMaand  = (men * (dur / 60) * fr * 4) * k;
  const admMaand = (adm * 4) * kc;
  const totMaand = opMaand + admMaand + mat;

  const bespOp  = opMaand  * 0.80 * 12;
  const bespMat = mat      * 1.00 * 12;
  const bespAdm = admMaand * 0.75 * 12;
  const nettoJaar = bespOp + bespMat + bespAdm - lic;
  const breakEven = nettoJaar > 0 ? een / (nettoJaar / 12) : null;

  return { opMaand, admMaand, mat, totMaand, bespOp, bespMat, bespAdm, nettoJaar, breakEven, een, lic };
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function el(id) { return document.getElementById(id); }
function get(id) { const e = el(id); return e ? e.value : ""; }
function set(id, html) { const e = el(id); if (e) e.innerHTML = html; }
function show(id, v) { const e = el(id); if (e) e.style.display = v ? "block" : "none"; }

function stepDots(current) {
  return `<div class="steps">
    ${STEPS.map((s, i) =>
      `<div class="step-dot ${i < current ? "done" : i === current ? "active" : ""}"></div>`
    ).join("")}
    <span class="step-name">${STEPS[current] || ""}</span>
  </div>`;
}

function backBtn(onclick) {
  return `<button class="btn-secondary" onclick="${onclick}" style="margin-bottom:24px">
    ← Terug
  </button>`;
}

// ─── SCREENS ──────────────────────────────────────────────────────────────────
function renderWelcome() {
  set("app", `
    <div>
      <span class="label">Aziri · ROI Calculator</span>
      <h1 class="welcome-title">Maak verborgen kosten zichtbaar</h1>
      <p class="welcome-sub">Bereken operationeel tijdverlies, niet-gefactureerde prestaties en administratieve druk — en converteer ze naar een professionele ROI-infofiche.</p>
      <div class="mode-grid">
        <div class="mode-card" onclick="startForm()">
          <div class="mode-icon">📋</div>
          <div class="mode-title">Stap voor stap</div>
          <div class="mode-desc">Begeleid formulier, één sectie per keer. Ideaal tijdens of na een prospect-gesprek.</div>
        </div>
        <div class="mode-card" onclick="startTranscript()">
          <div class="mode-icon">🤖</div>
          <div class="mode-title">Transcript / notities</div>
          <div class="mode-desc">Plak gespreksnotities of een transcript — AI extraheert de gegevens automatisch.</div>
        </div>
      </div>
    </div>`);
}

function startForm() { state.screen = "form"; state.step = 0; render(); }
function startTranscript() { state.screen = "transcript"; render(); }

function renderTranscript() {
  set("app", `
    <div>
      ${backBtn("goWelcome()")}
      <span class="label">Modus B — Transcript analyseren</span>
      <div class="card">
        <div class="field">
          <label>Plak hier je gespreksnotities of transcript</label>
          <textarea id="transcript-txt" placeholder="Bijv: 'Klant is Bakkerij Maes, sector voeding, 8 medewerkers. Ze wachten gemiddeld 5 minuten, 3x per week bij leveringsproblemen. Coördinator besteedt 6u/week aan manuele planning...'"></textarea>
        </div>
        <button class="btn-primary full" onclick="extractTranscript()">✨ &nbsp;Analyseer met AI</button>
        <div id="extract-status"></div>
      </div>
    </div>`);
}

async function extractTranscript() {
  const text = el("transcript-txt").value.trim();
  if (!text) { set("extract-status", `<div class="error">Plak eerst een transcript of notities.</div>`); return; }
  set("extract-status", `<div class="loading-wrap"><div class="loading-bar"></div><p class="loading-text">AI analyseert je transcript…</p></div>`);
  try {
    const resp = await fetch("/.netlify/functions/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    const json = await resp.json();
    const raw = json.content?.find(b => b.type === "text")?.text || "{}";
    const ex = JSON.parse(raw.replace(/```json|```/g, "").trim());
    Object.keys(ex).forEach(k => { if (ex[k] !== null && state.data[k] !== undefined) state.data[k] = ex[k]; });
    if (ex.nietGefactureerdMaand) state.data.nietGefactureerd = true;
    state.screen = "form"; state.step = 0; render();
  } catch(e) {
    set("extract-status", `<div class="error">Fout bij verwerking: ${e.message}. Gebruik het formulier als alternatief.</div>`);
  }
}

// ─── FORMULIER ────────────────────────────────────────────────────────────────
function renderForm() {
  const d = state.data;
  const s = state.step;
  let body = "";

  if (s === 0) {
    body = `
      <span class="label">Klantinfo</span>
      <div class="field"><label>Bedrijfsnaam *</label><input type="text" id="f0" value="${d.bedrijfsnaam}" placeholder="bijv. Bakkerij Maes"></div>
      <div class="field-grid">
        <div class="field"><label>Sector</label><input type="text" id="f1" value="${d.sector}" placeholder="bijv. voeding, bouw, zorg"></div>
        <div class="field"><label>Contactpersoon <span style="color:#444;font-size:11px">(optioneel)</span></label><input type="text" id="f2" value="${d.contactpersoon}" placeholder="naam"></div>
      </div>
      <div class="btn-row"><button class="btn-primary" onclick="next(0)">Volgende →</button></div>`;
  } else if (s === 1) {
    body = `
      <span class="label">Team & kostprijs</span>
      <div class="field-grid">
        <div class="field"><label>Aantal operationele medewerkers</label><input type="number" id="f0" value="${d.aantalMedewerkers}" placeholder="bijv. 8" min="1"></div>
        <div class="field"><label>Kostprijs per uur (€)</label><input type="number" id="f1" value="${d.kostprijsPerUur}" placeholder="65"><p class="hint">Standaard: € 65/u</p></div>
      </div>
      <div class="field"><label>Naam coördinator <span style="color:#444;font-size:11px">(optioneel)</span></label><input type="text" id="f2" value="${d.naamCoordinator}" placeholder="bijv. Jana Claes"></div>
      <div class="btn-row"><button class="btn-secondary" onclick="prev()">←</button><button class="btn-primary" onclick="next(1)">Volgende →</button></div>`;
  } else if (s === 2) {
    body = `
      <span class="label">Operationeel tijdverlies</span>
      <p style="font-size:13px;color:var(--text-dim);margin-bottom:18px">Wacht- of herstelmomenten: leveringsproblemen, zoekwerk, communicatiefouten…</p>
      <div class="field-grid">
        <div class="field"><label>Mensen per incident</label><input type="number" id="f0" value="${d.aantalMensenPerIncident}" placeholder="bijv. 3" min="1"></div>
        <div class="field"><label>Duur per incident (minuten)</label><input type="number" id="f1" value="${d.duurIncidentMinuten}" placeholder="bijv. 15" min="1"></div>
      </div>
      <div class="field"><label>Frequentie per week</label><input type="number" id="f2" value="${d.frequentiePerWeek}" placeholder="bijv. 4" min="0" step="0.5"></div>
      <div class="btn-row"><button class="btn-secondary" onclick="prev()">←</button><button class="btn-primary" onclick="next(2)">Volgende →</button></div>`;
  } else if (s === 3) {
    body = `
      <span class="label">Niet-gefactureerde prestaties</span>
      <div class="field">
        <label>Worden materialen, uren of diensten gebruikt die niet altijd gefactureerd worden?</label>
        <div class="toggle-group">
          <div class="toggle-btn ${d.nietGefactureerd ? "active" : ""}" onclick="toggleNG(true)">Ja</div>
          <div class="toggle-btn ${!d.nietGefactureerd ? "active" : ""}" onclick="toggleNG(false)">Nee</div>
        </div>
      </div>
      <div id="ng-field" style="display:${d.nietGefactureerd ? "block" : "none"}">
        <div class="field"><label>Geschat maandelijks niet-gefactureerd bedrag (€)</label><input type="number" id="f0" value="${d.nietGefactureerdMaand || ""}" placeholder="bijv. 800" min="0"></div>
      </div>
      <div class="btn-row"><button class="btn-secondary" onclick="prev()">←</button><button class="btn-primary" onclick="next(3)">Volgende →</button></div>`;
  } else if (s === 4) {
    body = `
      <span class="label">Administratieve druk</span>
      <div class="field-grid">
        <div class="field"><label>Uren manuele admin per week</label><input type="number" id="f0" value="${d.adminUrenPerWeek}" placeholder="bijv. 6" min="0" step="0.5"></div>
        <div class="field"><label>Kostprijs coördinator per uur (€)</label><input type="number" id="f1" value="${d.kostprijsCoordinatorPerUur || d.kostprijsPerUur}" placeholder="${d.kostprijsPerUur || 65}"><p class="hint">Standaard: teamgemiddelde</p></div>
      </div>
      <div class="btn-row"><button class="btn-secondary" onclick="prev()">←</button><button class="btn-primary" onclick="next(4)">Volgende →</button></div>`;
  } else if (s === 5) {
    body = `
      <span class="label">Investering</span>
      <div class="field-grid">
        <div class="field"><label>Eenmalige ontwikkelingskosten (€)</label><input type="number" id="f0" value="${d.eenmaligeKosten}" placeholder="bijv. 15000" min="0"></div>
        <div class="field"><label>Jaarlijkse licentiekosten (€)</label><input type="number" id="f1" value="${d.jaarlijkseLicentie}" placeholder="bijv. 2400" min="0"></div>
      </div>
      <div class="btn-row"><button class="btn-secondary" onclick="prev()">←</button><button class="btn-primary" onclick="calculate()">📊 &nbsp;Bereken ROI</button></div>`;
  }

  set("app", `
    <div>
      ${backBtn("goWelcome()")}
      ${stepDots(s)}
      <div class="card">${body}</div>
    </div>`);
}

function toggleNG(val) {
  state.data.nietGefactureerd = val;
  show("ng-field", val);
  document.querySelectorAll(".toggle-btn").forEach((b, i) => {
    b.classList.toggle("active", (i === 0 && val) || (i === 1 && !val));
  });
}

function save(s) {
  const d = state.data;
  if (s === 0) { d.bedrijfsnaam = get("f0"); d.sector = get("f1"); d.contactpersoon = get("f2"); }
  if (s === 1) { d.aantalMedewerkers = get("f0"); d.kostprijsPerUur = parseFloat(get("f1")) || 65; d.naamCoordinator = get("f2"); }
  if (s === 2) { d.aantalMensenPerIncident = get("f0"); d.duurIncidentMinuten = get("f1"); d.frequentiePerWeek = get("f2"); }
  if (s === 3) { const e = el("f0"); if (e) d.nietGefactureerdMaand = parseFloat(e.value) || 0; }
  if (s === 4) { d.adminUrenPerWeek = get("f0"); d.kostprijsCoordinatorPerUur = parseFloat(get("f1")) || d.kostprijsPerUur; }
  if (s === 5) { d.eenmaligeKosten = get("f0"); d.jaarlijkseLicentie = get("f1"); }
}

function next(s) {
  save(s);
  if (s === 0 && !state.data.bedrijfsnaam.trim()) { alert("Vul de bedrijfsnaam in."); return; }
  state.step++; render();
}
function prev() { state.step--; render(); }
function calculate() { save(5); state.result = calc(state.data); state.screen = "result"; render(); }

// ─── RESULTAAT ────────────────────────────────────────────────────────────────
function renderResult() {
  const r = state.result;
  const d = state.data;
  const naam = d.bedrijfsnaam || "Klant";

  set("app", `
    <div>
      <button class="btn-secondary" onclick="state.screen='form';render()" style="margin-bottom:24px">← Bewerken</button>
      <span class="label">ROI Infofiche</span>
      <h2 style="font-size:20px;font-weight:600;margin-bottom:4px">${naam}</h2>
      <p style="font-size:13px;color:var(--text-dim);margin-bottom:22px">${[d.sector, d.contactpersoon].filter(Boolean).join(" · ")}</p>

      <div class="kpi-grid">
        <div class="kpi-card accent">
          <div class="kpi-label">Terugverdientijd</div>
          <div class="kpi-value">${r.breakEven ? fmtM(r.breakEven) : "—"}</div>
          <div class="kpi-sub">na eenmalige investering</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Netto besparing / jaar</div>
          <div class="kpi-value green">${fmt(r.nettoJaar)}</div>
          <div class="kpi-sub">na aftrek licentie</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Huidig tijdverlies / jaar</div>
          <div class="kpi-value amber">${fmt(r.totMaand * 12)}</div>
          <div class="kpi-sub">operationele verliezen</div>
        </div>
      </div>

      <div class="tables-grid">
        <div class="card" style="margin:0">
          <span class="label">Huidig tijdverlies / maand</span>
          <table>
            <thead><tr><th>Post</th><th>Bedrag</th></tr></thead>
            <tbody>
              <tr><td>Operationeel tijdverlies</td><td>${fmt(r.opMaand)}</td></tr>
              <tr><td>Niet-gefactureerde prestaties</td><td>${fmt(r.mat)}</td></tr>
              <tr><td>Administratieve druk</td><td>${fmt(r.admMaand)}</td></tr>
              <tr class="total"><td>Totaal</td><td>${fmt(r.totMaand)}</td></tr>
            </tbody>
          </table>
        </div>
        <div class="card" style="margin:0">
          <span class="label">ROI na investering / jaar</span>
          <table>
            <thead><tr><th>Post</th><th>Besparing</th></tr></thead>
            <tbody>
              <tr class="pos"><td>Operationeel (−80%)</td><td>${fmt(r.bespOp)}</td></tr>
              <tr class="pos"><td>Niet-gefactureerd (−100%)</td><td>${fmt(r.bespMat)}</td></tr>
              <tr class="pos"><td>Admin (−75%)</td><td>${fmt(r.bespAdm)}</td></tr>
              <tr class="neg"><td>Jaarlijkse licentie</td><td>−${fmt(r.lic)}</td></tr>
              <tr class="total"><td>Netto besparing</td><td>${fmt(r.nettoJaar)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="invest-block">
        <div class="invest-item">
          <div class="invest-item-label">Eenmalige ontwikkeling</div>
          <div class="invest-item-val">${fmt(r.een)}</div>
        </div>
        <div class="invest-item">
          <div class="invest-item-label">Licentie / jaar</div>
          <div class="invest-item-val">${fmt(r.lic)}</div>
        </div>
        <div class="invest-item">
          <div class="invest-item-label">Break-even</div>
          <div class="invest-item-val blue">${r.breakEven ? fmtM(r.breakEven) : "n.v.t."}</div>
        </div>
      </div>

      <div class="aannames">
        <strong style="color:#666">Aannames:</strong> Operationeel tijdverlies −80% gereduceerd · Niet-gefactureerde prestaties −100% · Admin-tijd −75% · Marge van 20–25% voor adoptie ingebouwd
      </div>

      <div class="action-row">
        <button class="btn-primary" onclick="generatePDF()">⬇ &nbsp;Download PDF</button>
        <button class="btn-secondary" onclick="goWelcome()">Nieuwe klant</button>
      </div>
      <div id="pdf-msg"></div>
    </div>`);
}

// ─── PDF ──────────────────────────────────────────────────────────────────────
function generatePDF() {
  set("pdf-msg", `<div class="loading-wrap" style="padding:12px 0"><div class="loading-bar"></div><p class="loading-text">PDF wordt gegenereerd…</p></div>`);
  setTimeout(() => {
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const r = state.result;
      const d = state.data;
      const naam = d.bedrijfsnaam || "Klant";
      const W = 210; const mg = 18;

      // Header
      doc.setFillColor(10, 10, 10);
      doc.rect(0, 0, W, 30, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16); doc.setTextColor(91, 91, 214);
      doc.text("AZIRI", mg, 19);
      doc.setFontSize(8); doc.setTextColor(100, 100, 100);
      doc.text("ROI Calculator", mg + 32, 19);
      doc.setFont("helvetica", "normal");
      doc.text(new Date().toLocaleDateString("nl-BE"), W - mg, 19, { align: "right" });

      // Klant
      let y = 40;
      doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.setTextColor(20, 20, 20);
      doc.text(naam, mg, y);
      y += 5;
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(130, 130, 130);
      doc.text([d.sector, d.contactpersoon].filter(Boolean).join(" · "), mg, y);
      y += 12;

      // KPIs
      const kw = (W - mg * 2 - 8) / 3;
      const kpis = [
        { l: "Terugverdientijd", v: r.breakEven ? fmtM(r.breakEven) : "—", accent: true },
        { l: "Netto besparing / jaar", v: fmt(r.nettoJaar), accent: false },
        { l: "Huidig tijdverlies / jaar", v: fmt(r.totMaand * 12), accent: false }
      ];
      kpis.forEach((k, i) => {
        const x = mg + i * (kw + 4);
        if (k.accent) doc.setFillColor(12, 12, 28); else doc.setFillColor(247, 247, 250);
        doc.roundedRect(x, y, kw, 20, 2, 2, "F");
        doc.setFontSize(6.5); doc.setFont("helvetica", "normal");
        doc.setTextColor(k.accent ? 91 : 110, k.accent ? 91 : 110, k.accent ? 150 : 110);
        doc.text(k.l.toUpperCase(), x + 5, y + 7);
        doc.setFontSize(10); doc.setFont("helvetica", "bold");
        doc.setTextColor(91, 91, 214);
        doc.text(k.v, x + 5, y + 15);
      });
      y += 28;

      // Tabellen
      const tw = (W - mg * 2 - 8) / 2;
      const drawT = (title, rows, tx) => {
        doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(91, 91, 214);
        doc.text(title.toUpperCase(), tx, y);
        let ty = y + 4;
        doc.setDrawColor(210); doc.setLineWidth(0.2);
        doc.line(tx, ty, tx + tw, ty); ty += 5;
        rows.forEach((row, ri) => {
          const isTotal = ri === rows.length - 1;
          doc.setFont("helvetica", isTotal ? "bold" : "normal");
          doc.setFontSize(8);
          doc.setTextColor(isTotal ? 91 : 70, isTotal ? 91 : 70, isTotal ? 214 : 70);
          doc.text(row[0], tx, ty);
          doc.text(row[1], tx + tw, ty, { align: "right" });
          ty += 6;
          if (!isTotal) { doc.setDrawColor(230); doc.setLineWidth(0.1); doc.line(tx, ty - 1.5, tx + tw, ty - 1.5); }
        });
        return ty;
      };

      const lRows = [
        ["Operationeel tijdverlies", fmt(r.opMaand)],
        ["Niet-gefactureerde prestaties", fmt(r.mat)],
        ["Administratieve druk", fmt(r.admMaand)],
        ["Totaal / maand", fmt(r.totMaand)]
      ];
      const rRows = [
        ["Operationeel (−80%)", fmt(r.bespOp)],
        ["Niet-gefactureerd (−100%)", fmt(r.bespMat)],
        ["Admin-tijd (−75%)", fmt(r.bespAdm)],
        ["Min licentie", "−" + fmt(r.lic)],
        ["Netto besparing / jaar", fmt(r.nettoJaar)]
      ];

      doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(40, 40, 40);
      doc.text("Huidig tijdverlies / maand", mg, y);
      doc.text("ROI na investering / jaar", mg + tw + 8, y);
      y += 3;
      doc.setDrawColor(200); doc.setLineWidth(0.3);
      doc.line(mg, y, mg + tw, y);
      doc.line(mg + tw + 8, y, mg + tw + 8 + tw, y);
      y += 5;

      let ly = y, ry = y;
      lRows.forEach((row, ri) => {
        const isT = ri === lRows.length - 1;
        doc.setFont("helvetica", isT ? "bold" : "normal"); doc.setFontSize(8);
        doc.setTextColor(isT ? 91 : 70, isT ? 91 : 70, isT ? 214 : 70);
        doc.text(row[0], mg, ly); doc.text(row[1], mg + tw, ly, { align: "right" });
        ly += 6;
        if (!isT) { doc.setDrawColor(230); doc.setLineWidth(0.1); doc.line(mg, ly - 1.5, mg + tw, ly - 1.5); }
      });
      rRows.forEach((row, ri) => {
        const isT = ri === rRows.length - 1;
        doc.setFont("helvetica", isT ? "bold" : "normal"); doc.setFontSize(8);
        doc.setTextColor(isT ? 91 : 70, isT ? 91 : 70, isT ? 214 : 70);
        doc.text(row[0], mg + tw + 8, ry); doc.text(row[1], W - mg, ry, { align: "right" });
        ry += 6;
        if (!isT) { doc.setDrawColor(230); doc.setLineWidth(0.1); doc.line(mg + tw + 8, ry - 1.5, W - mg, ry - 1.5); }
      });

      y = Math.max(ly, ry) + 10;

      // Investering
      doc.setFillColor(245, 245, 250);
      doc.roundedRect(mg, y, W - mg * 2, 18, 2, 2, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor(91, 91, 214);
      doc.text("INVESTERING", mg + 5, y + 7);
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(80, 80, 80);
      doc.text(`Ontwikkeling: ${fmt(r.een)}`, mg + 5, y + 13);
      doc.text(`Licentie/jaar: ${fmt(r.lic)}`, mg + 62, y + 13);
      doc.setFont("helvetica", "bold"); doc.setTextColor(91, 91, 214);
      doc.text(`Break-even: ${r.breakEven ? fmtM(r.breakEven) : "n.v.t."}`, mg + 118, y + 13);
      y += 26;

      // Aannames
      doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(150, 150, 150);
      doc.text("Aannames: operationeel −80% · niet-gefactureerd −100% · admin −75% · marge voor adoptie ingebouwd", mg, y);
      y += 8;

      // Footer
      doc.setDrawColor(210); doc.setLineWidth(0.3); doc.line(mg, y, W - mg, y);
      y += 5;
      doc.setFontSize(7); doc.setTextColor(180, 180, 180);
      doc.text("Gegenereerd via Aziri ROI Calculator · aziri.be", mg, y);
      doc.text(`ROI_${naam}_Aziri`, W - mg, y, { align: "right" });

      doc.save(`ROI_${naam}_Aziri.pdf`);
      set("pdf-msg", `<p class="success">✓ PDF opgeslagen: ROI_${naam}_Aziri.pdf</p>`);
    } catch(e) {
      set("pdf-msg", `<div class="error">PDF-fout: ${e.message}</div>`);
    }
  }, 100);
}

// ─── ROUTING ──────────────────────────────────────────────────────────────────
function goWelcome() { state.screen = "welcome"; render(); }

function render() {
  const s = state.screen;
  if (s === "welcome")    renderWelcome();
  else if (s === "transcript") renderTranscript();
  else if (s === "form")  renderForm();
  else if (s === "result") renderResult();
}

render();
