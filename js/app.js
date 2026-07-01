const state = {
  screen: "welcome", step: 0, reductie: 0.8,
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

const STEPS = ["Klantinfo","Team & kostprijs","Operationeel tijdverlies","Niet-gefactureerde prestaties","Administratieve druk","Investering"];

// SECTOR LABELS
const SECTOR_LABELS = {
  bouw: {
    aantalMedewerkers: "Aantal vakmannen / arbeiders op de werf",
    kostprijsPerUur:   "Gemiddelde loonkost vakman per uur",
    naamCoordinator:   "Naam projectleider / planner",
    adminUrenPerWeek:  "Uren handmatige verwerking werkbonnen per week",
    kostprijsCoord:    "Loonkost projectleider/planner per uur",
    tijdverliesLabel:  "Wachttijden en faalkosten op de werf",
    tijdverliesHint:   "Denk aan: wachten op materiaal/tekeningen, zoekwerk, communicatiefouten tussen werf en kantoor.",
    incidentLabel:     "Aantal vakmannen betrokken per incident",
    medTooltip:        "Gebruik de totale werkgeverslasten (incl. pensioen, sociale lasten en overhead). In de bouw gemiddeld ca. €65/u.",
    coordTooltip:      "Gebruik de totale werkgeverslasten (incl. pensioen, sociale lasten en overhead). Voor een planner in de bouw gemiddeld ca. €65/u.",
  },
  default: {
    aantalMedewerkers: "Aantal operationele medewerkers",
    kostprijsPerUur:   "Kostprijs per uur",
    naamCoordinator:   "Naam coördinator / admin",
    adminUrenPerWeek:  "Uren manuele admin per week",
    kostprijsCoord:    "Kostprijs coördinator per uur",
    tijdverliesLabel:  "Operationeel tijdverlies",
    tijdverliesHint:   "Denk aan: wacht- of herstelmomenten, leveringsproblemen, zoekwerk, communicatiefouten.",
    incidentLabel:     "Mensen per incident (totaal betrokken)",
    medTooltip:        "Gebruik de totale werkgeverslasten (incl. pensioen, verzekeringen en vakantiegeld). Dit ligt vaak 1,3–1,5x hoger dan het brutoloon.",
    coordTooltip:      "Gebruik de totale werkgeverslasten (incl. pensioen, verzekeringen en vakantiegeld). Dit ligt vaak 1,3–1,5x hoger dan het brutoloon.",
  }
};
function L(){const s=(state.data.sector||"").toLowerCase().trim();if(["bouw","bouwsector","constructie"].includes(s))return SECTOR_LABELS.bouw;return SECTOR_LABELS.default;}

function fmt(n) { if (n==null||isNaN(n)) return "—"; return "€\u00a0"+Math.round(n).toLocaleString("nl-BE").replace(/,/g,"."); }
function fmtM(n) { if (n==null||isNaN(n)) return "—"; return (Math.round(n*10)/10).toFixed(1).replace(".",",")+"\u00a0mnd"; }
function fmtPct(n) { if (n==null||isNaN(n)) return "—"; return (Math.round(n*10)/10).toFixed(1).replace(".",",")+"%"; }

function calc(d, reductie) {
  const r = reductie ?? state.reductie;
  const kMed = parseFloat(d.kostprijsPerUur)||65;
  const kCoord = parseFloat(d.kostprijsCoordinatorPerUur)||kMed;
  const men = parseFloat(d.aantalMensenPerIncident)||0;
  const dur = parseFloat(d.duurIncidentMinuten)||0;
  const fr = parseFloat(d.frequentiePerWeek)||0;
  const adminUur = parseFloat(d.adminUrenPerWeek)||0;
  const nietGefMaand = d.nietGefactureerd?(parseFloat(d.nietGefactureerdMaand)||0):0;
  const eenmalig = parseFloat(d.eenmaligeKosten)||0;
  const licentie = parseFloat(d.jaarlijkseLicentie)||0;

  const verlorenUrenPerWeek = men*(dur/60)*fr;
  const tijdverliesMaand = verlorenUrenPerWeek*kMed*4.33;
  const adminMaand = adminUur*kCoord*4.33;
  const totaalHuidigMaand = tijdverliesMaand+adminMaand+nietGefMaand;

  const bespAdminJaar = (adminUur*kCoord*52)*r;
  const bespTijdverliesJaar = (verlorenUrenPerWeek*kMed*52)*r;
  const bespOmzetJaar = (nietGefMaand*12)*r;
  const totaleJaarlijkseBesparing = bespAdminJaar+bespTijdverliesJaar+bespOmzetJaar;

  const kostenJaar1 = eenmalig+licentie, kostenJaar2 = licentie, kostenJaar3 = licentie;
  const totaleKosten3Jaar = kostenJaar1+kostenJaar2+kostenJaar3;
  const totaleBesparing3Jaar = totaleJaarlijkseBesparing*3;
  const nettoWinstJaar1 = totaleJaarlijkseBesparing-kostenJaar1;
  const nettoWinstJaarNa1 = totaleJaarlijkseBesparing-licentie;
  const maandelijkseNetto = (totaleJaarlijkseBesparing-licentie)/12;
  const breakEvenMaanden = maandelijkseNetto>0?kostenJaar1/maandelijkseNetto:null;
  const roi3Jaar = totaleKosten3Jaar>0?((totaleBesparing3Jaar-totaleKosten3Jaar)/totaleKosten3Jaar)*100:null;
  const cumKosten = [kostenJaar1, kostenJaar1+kostenJaar2, kostenJaar1+kostenJaar2+kostenJaar3];
  const cumBesparing = [totaleJaarlijkseBesparing, totaleJaarlijkseBesparing*2, totaleJaarlijkseBesparing*3];

  return {verlorenUrenPerWeek,tijdverliesMaand,adminMaand,nietGefMaand,totaalHuidigMaand,
    bespAdminJaar,bespTijdverliesJaar,bespOmzetJaar,totaleJaarlijkseBesparing,
    kostenJaar1,kostenJaar2,kostenJaar3,totaleKosten3Jaar,totaleBesparing3Jaar,
    nettoWinstJaar1,nettoWinstJaarNa1,breakEvenMaanden,roi3Jaar,
    cumKosten,cumBesparing,eenmalig,licentie,reductie:r};
}

function el(id){return document.getElementById(id);}
function get(id){const e=el(id);return e?e.value:"";}
function set(id,html){const e=el(id);if(e)e.innerHTML=html;}
function show(id,v){const e=el(id);if(e)e.style.display=v?"block":"none";}
function stepDots(cur){return `<div class="steps">${STEPS.map((s,i)=>`<div class="step-dot ${i<cur?"done":i===cur?"active":""}"></div>`).join("")}<span class="step-name">${STEPS[cur]||""}</span></div>`;}
function backBtn(fn){return `<button class="btn-secondary" onclick="${fn}" style="margin-bottom:24px">← Terug</button>`;}
function infoTip(t){return `<span class="info-tip" tabindex="0"><span class="info-tip-icon">i</span><span class="info-tip-bubble">${t}</span></span>`;}

function renderWelcome(){
  set("app",`<div>
    <span class="label">Aziri · ROI Calculator</span>
    <h1 class="welcome-title">Maak verborgen kosten zichtbaar</h1>
    <p class="welcome-sub">Bereken operationeel tijdverlies, niet-gefactureerde prestaties en administratieve druk — en converteer ze naar een professionele ROI-infofiche.</p>
    <div class="mode-grid">
      <div class="mode-card" onclick="startForm()"><div class="mode-icon">📋</div><div class="mode-title">Stap voor stap</div><div class="mode-desc">Begeleid formulier, één sectie per keer. Ideaal tijdens of na een prospect-gesprek.</div></div>
      <div class="mode-card" onclick="startTranscript()"><div class="mode-icon">🤖</div><div class="mode-title">Transcript / notities</div><div class="mode-desc">Plak gespreksnotities of een transcript — AI extraheert de gegevens automatisch.</div></div>
    </div></div>`);
}

function startForm(){state.screen="form";state.step=0;render();}
function startTranscript(){state.screen="transcript";render();}

function renderTranscript(){
  set("app",`<div>${backBtn("goWelcome()")}
    <span class="label">Modus B — Transcript analyseren</span>
    <div class="card">
      <div class="field"><label>Plak hier je gespreksnotities of transcript</label>
        <textarea id="transcript-txt" placeholder="Bijv: 'Klant is Bakkerij Maes, sector voeding, 8 medewerkers. Ze wachten gemiddeld 5 minuten, 3x per week bij leveringsproblemen...'"></textarea>
      </div>
      <button class="btn-primary full" onclick="extractTranscript()">✨ &nbsp;Analyseer met AI</button>
      <div id="extract-status"></div>
    </div></div>`);
}

async function extractTranscript(){
  const text=el("transcript-txt").value.trim();
  if(!text){set("extract-status",`<div class="error">Plak eerst een transcript of notities.</div>`);return;}
  set("extract-status",`<div class="loading-wrap"><div class="loading-bar"></div><p class="loading-text">AI analyseert je transcript…</p></div>`);
  try{
    const resp=await fetch("/.netlify/functions/extract",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text})});
    const json=await resp.json();
    const raw=json.content?.find(b=>b.type==="text")?.text||"{}";
    const ex=JSON.parse(raw.replace(/```json|```/g,"").trim());
    Object.keys(ex).forEach(k=>{if(ex[k]!==null&&state.data[k]!==undefined)state.data[k]=ex[k];});
    if(ex.nietGefactureerdMaand)state.data.nietGefactureerd=true;
    state.screen="form";state.step=0;render();
  }catch(e){set("extract-status",`<div class="error">Fout: ${e.message}</div>`);}
}

function renderForm(){
  const d=state.data, s=state.step;
  let body="";
  if(s===0){body=`<span class="label">Klantinfo</span>
    <div class="field"><label>Bedrijfsnaam *</label><input type="text" id="f0" value="${d.bedrijfsnaam}" placeholder="bijv. Bakkerij Maes"></div>
    <div class="field-grid">
      <div class="field">
        <label>Sector <span style="color:#9CA3AF;font-size:11px">(bepaalt de terminologie)</span></label>
        <select id="f1">
          <option value="" ${!d.sector?"selected":""}>— Kies sector —</option>
          <option value="Bouw" ${d.sector==="Bouw"?"selected":""}>Bouw</option>
          <option value="Voeding" ${d.sector==="Voeding"?"selected":""}>Voeding</option>
          <option value="Zorg" ${d.sector==="Zorg"?"selected":""}>Zorg</option>
          <option value="Logistiek" ${d.sector==="Logistiek"?"selected":""}>Logistiek</option>
          <option value="Techniek" ${d.sector==="Techniek"?"selected":""}>Techniek</option>
          <option value="Retail" ${d.sector==="Retail"?"selected":""}>Retail</option>
          <option value="Andere" ${d.sector==="Andere"?"selected":""}>Andere</option>
        </select>
        <p class="hint">Kies "Bouw" voor sectorspecifieke terminologie. Andere sectoren gebruiken generieke labels.</p>
      </div>
      <div class="field"><label>Contactpersoon <span style="color:#9CA3AF;font-size:11px">(optioneel)</span></label><input type="text" id="f2" value="${d.contactpersoon}" placeholder="naam"></div>
    </div>
    <div class="btn-row"><button class="btn-primary" onclick="next(0)">Volgende →</button></div>`;}
  else if(s===1){const lbl=L();body=`<span class="label">Team & kostprijs</span>
    <div class="field-grid">
      <div class="field"><label>${lbl.aantalMedewerkers}</label><input type="number" id="f0" value="${d.aantalMedewerkers}" placeholder="bijv. 8" min="1"></div>
      <div class="field"><label>${lbl.kostprijsPerUur} ${infoTip(lbl.medTooltip)}</label><input type="number" id="f1" value="${d.kostprijsPerUur}" placeholder="65"><p class="hint">Standaard: € 65/u</p></div>
    </div>
    <div class="field"><label>${lbl.naamCoordinator} <span style="color:#9CA3AF;font-size:11px">(optioneel)</span></label><input type="text" id="f2" value="${d.naamCoordinator}" placeholder="bijv. Jana Claes"></div>
    <div class="btn-row"><button class="btn-secondary" onclick="prev()">←</button><button class="btn-primary" onclick="next(1)">Volgende →</button></div>`;}
  else if(s===2){const lbl=L();body=`<span class="label">${lbl.tijdverliesLabel}</span>
    <p style="font-size:13px;color:var(--text-muted);margin-bottom:18px;line-height:1.6"><strong>${lbl.tijdverliesHint}</strong><br>Denk op <strong>bedrijfsniveau</strong>: dit zijn <em>totale</em> incidenten voor het hele bedrijf, niet per medewerker.</p>
    <div class="field-grid">
      <div class="field"><label>${lbl.incidentLabel}</label><input type="number" id="f0" value="${d.aantalMensenPerIncident}" placeholder="bijv. 3" min="1"></div>
      <div class="field"><label>Duur per incident (minuten)</label><input type="number" id="f1" value="${d.duurIncidentMinuten}" placeholder="bijv. 15" min="1"></div>
    </div>
    <div class="field">
      <label>Hoe vaak komt dit incident in totaal voor binnen het hele bedrijf per week?</label>
      <input type="number" id="f2" value="${d.frequentiePerWeek}" placeholder="bijv. 4" min="0" step="0.5">
      <p class="hint">De berekening vermenigvuldigt dit automatisch met het aantal betrokken mensen en de duur.</p>
    </div>
    <div class="btn-row"><button class="btn-secondary" onclick="prev()">←</button><button class="btn-primary" onclick="next(2)">Volgende →</button></div>`;}
  else if(s===3){body=`<span class="label">Niet-gefactureerde prestaties</span>
    <div class="field"><label>Worden materialen, uren of diensten gebruikt die niet altijd gefactureerd worden?</label>
      <div class="toggle-group">
        <div class="toggle-btn ${d.nietGefactureerd?"active":""}" onclick="toggleNG(true)">Ja</div>
        <div class="toggle-btn ${!d.nietGefactureerd?"active":""}" onclick="toggleNG(false)">Nee</div>
      </div>
    </div>
    <div id="ng-field" style="display:${d.nietGefactureerd?"block":"none"}">
      <div class="field"><label>Geschat maandelijks niet-gefactureerd bedrag (€)</label><input type="number" id="f0" value="${d.nietGefactureerdMaand||""}" placeholder="bijv. 800" min="0"></div>
    </div>
    <div class="btn-row"><button class="btn-secondary" onclick="prev()">←</button><button class="btn-primary" onclick="next(3)">Volgende →</button></div>`;}
  else if(s===4){const lbl=L();body=`<span class="label">Administratieve druk</span>
    <div class="field-grid">
      <div class="field"><label>${lbl.adminUrenPerWeek}</label><input type="number" id="f0" value="${d.adminUrenPerWeek}" placeholder="bijv. 6" min="0" step="0.5"></div>
      <div class="field"><label>${lbl.kostprijsCoord} ${infoTip(lbl.coordTooltip)}</label><input type="number" id="f1" value="${d.kostprijsCoordinatorPerUur||d.kostprijsPerUur}" placeholder="${d.kostprijsPerUur||65}"><p class="hint">Standaard: teamgemiddelde</p></div>
    </div>
    <div class="btn-row"><button class="btn-secondary" onclick="prev()">←</button><button class="btn-primary" onclick="next(4)">Volgende →</button></div>`;}
  else if(s===5){body=`<span class="label">Investering</span>
    <div class="field-grid">
      <div class="field"><label>Eenmalige ontwikkelingskosten (€)</label><input type="number" id="f0" value="${d.eenmaligeKosten}" placeholder="bijv. 15000" min="0"></div>
      <div class="field"><label>Jaarlijkse licentiekosten (€)</label><input type="number" id="f1" value="${d.jaarlijkseLicentie}" placeholder="bijv. 2400" min="0"></div>
    </div>
    <div class="btn-row"><button class="btn-secondary" onclick="prev()">←</button><button class="btn-primary" onclick="calculate()">📊 &nbsp;Bereken ROI</button></div>`;}

  set("app",`<div>${backBtn("goWelcome()")}${stepDots(s)}<div class="card">${body}</div></div>`);
}

function toggleNG(val){
  state.data.nietGefactureerd=val; show("ng-field",val);
  document.querySelectorAll(".toggle-btn").forEach((b,i)=>{b.classList.toggle("active",(i===0&&val)||(i===1&&!val));});
}

function save(s){
  const d=state.data;
  if(s===0){d.bedrijfsnaam=get("f0");d.sector=get("f1");d.contactpersoon=get("f2");}
  if(s===1){d.aantalMedewerkers=get("f0");d.kostprijsPerUur=parseFloat(get("f1"))||65;d.naamCoordinator=get("f2");}
  if(s===2){d.aantalMensenPerIncident=get("f0");d.duurIncidentMinuten=get("f1");d.frequentiePerWeek=get("f2");}
  if(s===3){const e=el("f0");if(e)d.nietGefactureerdMaand=parseFloat(e.value)||0;}
  if(s===4){d.adminUrenPerWeek=get("f0");d.kostprijsCoordinatorPerUur=parseFloat(get("f1"))||d.kostprijsPerUur;}
  if(s===5){d.eenmaligeKosten=get("f0");d.jaarlijkseLicentie=get("f1");}
}

function next(s){save(s);if(s===0&&!state.data.bedrijfsnaam.trim()){alert("Vul de bedrijfsnaam in.");return;}state.step++;render();}
function prev(){state.step--;render();}
function calculate(){save(5);state.result=calc(state.data);state.screen="result";render();}

function updateSlider(val){
  state.reductie=val/100;
  state.result=calc(state.data,state.reductie);
  renderResultContent();
}

function chartHtml(r){
  const maxVal=Math.max(...r.cumKosten,...r.cumBesparing,1);
  const bars=[1,2,3].map((j,i)=>{
    const kPct=Math.max((r.cumKosten[i]/maxVal)*100,2);
    const bPct=Math.max((r.cumBesparing[i]/maxVal)*100,2);
    const ok=r.cumBesparing[i]>=r.cumKosten[i];
    return `<div class="chart-year">
      <div class="chart-year-label">Jaar ${j}</div>
      <div class="chart-bars">
        <div class="chart-bar-row"><span class="chart-bar-tag">Kosten</span><div class="chart-bar-track"><div class="chart-bar-fill cost" style="width:${kPct}%"></div></div><span class="chart-bar-val">${fmt(r.cumKosten[i])}</span></div>
        <div class="chart-bar-row"><span class="chart-bar-tag">Besparing</span><div class="chart-bar-track"><div class="chart-bar-fill save" style="width:${bPct}%"></div></div><span class="chart-bar-val">${fmt(r.cumBesparing[i])}</span></div>
      </div>
      <div class="chart-year-status ${ok?"positive":"pending"}">${ok?"✓ Break-even bereikt":"Nog niet terugverdiend"}</div>
    </div>`;
  }).join("");
  return `<div class="chart-wrap">${bars}</div><div class="chart-legend"><span><i class="chart-dot cost"></i> Cumulatieve kosten</span><span><i class="chart-dot save"></i> Cumulatieve besparingen</span></div>`;
}

function renderResult(){
  const d=state.data, naam=d.bedrijfsnaam||"Klant";
  const today=new Date().toLocaleDateString("nl-BE");
  set("app",`<div>
    <button class="btn-secondary" onclick="state.screen='form';render()" style="margin-bottom:24px">← Bewerken</button>
    <span class="label">ROI Infofiche · 3-jaars projectie</span>
    <h2 style="font-size:20px;font-weight:700;margin-bottom:4px">${naam}</h2>
    <p style="font-size:13px;color:var(--text-dim);margin-bottom:20px">${[d.sector,d.contactpersoon].filter(Boolean).join(" · ")} · Opgesteld op ${today}</p>

    <div class="confidential-banner">
      🔒 <span><strong>Vertrouwelijk</strong> — Dit document is uitsluitend bestemd voor de ontvanger. Verspreiding of gebruik door derden is niet toegestaan zonder schriftelijke toestemming van Aziri.</span>
    </div>

    <div class="slider-card">
      <div class="slider-header">
        <div>
          <div class="slider-title">Verwacht oplossingspercentage</div>
          <div class="slider-sub">Geen enkele software lost alles 100% op. Stel in hoe realistisch je de businesscase wil presenteren.</div>
        </div>
        <div class="slider-value-badge" id="slider-badge">${Math.round(state.reductie*100)}%</div>
      </div>
      <input type="range" class="slider" id="reductie-slider" min="50" max="100" step="5" value="${Math.round(state.reductie*100)}"
        oninput="document.getElementById('slider-badge').textContent=this.value+'%'"
        onchange="updateSlider(parseInt(this.value))">
      <div class="slider-ticks"><span>50%</span><span>60%</span><span>70%</span><span>80%</span><span>90%</span><span>100%</span></div>
    </div>

    <div id="result-content"></div>

    <div class="action-row" style="margin-top:20px">
      <button class="btn-primary" onclick="generatePDF()">⬇ &nbsp;Download PDF</button>
      <button class="btn-secondary" onclick="goWelcome()">Nieuwe klant</button>
    </div>
    <div id="pdf-msg"></div>
  </div>`);
  renderResultContent();
}

function renderResultContent(){
  const r=state.result, payback=r.breakEvenMaanden;
  set("result-content",`
    <div class="kpi-grid">
      <div class="kpi-card accent"><div class="kpi-label">Terugverdientijd</div><div class="kpi-value">${payback!=null?fmtM(payback):"—"}</div><div class="kpi-sub">${payback!=null?"Binnen "+fmtM(payback)+" terugverdiend":"Niet berekend"}</div></div>
      <div class="kpi-card"><div class="kpi-label">Netto winst jaar 1</div><div class="kpi-value ${r.nettoWinstJaar1>=0?"green":""}" style="${r.nettoWinstJaar1<0?"color:var(--red)":""}">${fmt(r.nettoWinstJaar1)}</div><div class="kpi-sub">na ontwikkeling + licentie</div></div>
      <div class="kpi-card"><div class="kpi-label">Cumulatieve ROI (3 jaar)</div><div class="kpi-value ${r.roi3Jaar>=0?"green":""}" style="${r.roi3Jaar<0?"color:var(--red)":""}">${r.roi3Jaar!=null?fmtPct(r.roi3Jaar):"—"}</div><div class="kpi-sub">rendement op investering</div></div>
    </div>
    <div class="tables-grid">
      <div class="card" style="margin:0"><span class="label">Huidige situatie / maand</span>
        <table><thead><tr><th>Post</th><th>Bedrag</th></tr></thead><tbody>
          <tr><td>Operationeel tijdverlies</td><td>${fmt(r.tijdverliesMaand)}</td></tr>
          <tr><td>Niet-gefactureerde prestaties</td><td>${fmt(r.nietGefMaand)}</td></tr>
          <tr><td>Administratieve druk</td><td>${fmt(r.adminMaand)}</td></tr>
          <tr class="total"><td>Totaal / maand</td><td>${fmt(r.totaalHuidigMaand)}</td></tr>
        </tbody></table>
      </div>
      <div class="card" style="margin:0"><span class="label">Bruto besparing / jaar (${Math.round(r.reductie*100)}% correctie)</span>
        <table><thead><tr><th>Post</th><th>Besparing</th></tr></thead><tbody>
          <tr class="pos"><td>Operationeel tijdverlies</td><td>${fmt(r.bespTijdverliesJaar)}</td></tr>
          <tr class="pos"><td>Gerecupereerde omzet</td><td>${fmt(r.bespOmzetJaar)}</td></tr>
          <tr class="pos"><td>Administratieve druk</td><td>${fmt(r.bespAdminJaar)}</td></tr>
          <tr class="total"><td>Totale jaarlijkse besparing</td><td>${fmt(r.totaleJaarlijkseBesparing)}</td></tr>
        </tbody></table>
      </div>
    </div>
    <div class="card"><span class="label">Cumulatief over 3 jaar — kosten vs. besparingen</span>${chartHtml(r)}</div>
    <div class="tables-grid">
      <div class="card" style="margin:0"><span class="label">Kosten per jaar</span>
        <table><thead><tr><th>Periode</th><th>Bedrag</th></tr></thead><tbody>
          <tr><td>Jaar 1 (ontwikkeling + licentie)</td><td>${fmt(r.kostenJaar1)}</td></tr>
          <tr><td>Jaar 2 (licentie)</td><td>${fmt(r.kostenJaar2)}</td></tr>
          <tr><td>Jaar 3 (licentie)</td><td>${fmt(r.kostenJaar3)}</td></tr>
          <tr class="total"><td>Totaal 3 jaar</td><td>${fmt(r.totaleKosten3Jaar)}</td></tr>
        </tbody></table>
      </div>
      <div class="card" style="margin:0"><span class="label">Netto winst per jaar</span>
        <table><thead><tr><th>Periode</th><th>Netto</th></tr></thead><tbody>
          <tr class="${r.nettoWinstJaar1>=0?"pos":"neg"}"><td>Jaar 1</td><td>${fmt(r.nettoWinstJaar1)}</td></tr>
          <tr class="${r.nettoWinstJaarNa1>=0?"pos":"neg"}"><td>Jaar 2</td><td>${fmt(r.nettoWinstJaarNa1)}</td></tr>
          <tr class="${r.nettoWinstJaarNa1>=0?"pos":"neg"}"><td>Jaar 3</td><td>${fmt(r.nettoWinstJaarNa1)}</td></tr>
          <tr class="total"><td>Totaal 3 jaar</td><td>${fmt(r.totaleBesparing3Jaar-r.totaleKosten3Jaar)}</td></tr>
        </tbody></table>
      </div>
    </div>
    <div class="invest-block">
      <div class="invest-item"><div class="invest-item-label">Eenmalige ontwikkeling</div><div class="invest-item-val">${fmt(r.eenmalig)}</div></div>
      <div class="invest-item"><div class="invest-item-label">Licentie / jaar</div><div class="invest-item-val">${fmt(r.licentie)}</div></div>
      <div class="invest-item"><div class="invest-item-label">Break-even</div><div class="invest-item-val blue">${payback!=null?fmtM(payback):"n.v.t."}</div></div>
    </div>
    <div class="aannames">
      <strong style="color:#555">Aannames:</strong> Oplossingspercentage ${Math.round(r.reductie*100)}% · ROI-projectie 3 jaar · Geen interne trainingskosten · Besparingen constant over 3 jaar
    </div>`);
}

function generatePDF(){
  set("pdf-msg",`<div class="loading-wrap" style="padding:12px 0"><div class="loading-bar"></div><p class="loading-text">PDF wordt gegenereerd…</p></div>`);
  setTimeout(()=>{
    try{
      const {jsPDF}=window.jspdf;
      const doc=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
      const r=state.result, d=state.data, naam=d.bedrijfsnaam||"Klant";
      const W=210, mg=16;
      const today=new Date().toLocaleDateString("nl-BE");

      // ── Header: wit met paarse lijn, hippo emoji ──
      doc.setFillColor(255,255,255); doc.rect(0,0,W,28,"F");
      doc.setFillColor(91,91,214); doc.rect(0,25,W,3,"F");
      // Hippo blok
      doc.setFillColor(91,91,214); doc.roundedRect(mg,6,16,16,3,3,"F");
      doc.setFontSize(10); doc.setTextColor(255,255,255); doc.text("🦛",mg+3,17);
      // Brand
      doc.setFont("helvetica","bold"); doc.setFontSize(13); doc.setTextColor(91,91,214);
      doc.text("AZIRI",mg+20,13);
      doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(156,163,175);
      doc.text("ROI Calculator · 3-jaars projectie",mg+20,19);
      doc.text(today,W-mg,13,{align:"right"});

      let y=36;

      // ── Vertrouwelijk banner ──
      doc.setFillColor(254,243,199); doc.roundedRect(mg,y,W-mg*2,10,2,2,"F");
      doc.setDrawColor(252,211,77); doc.setLineWidth(0.3); doc.roundedRect(mg,y,W-mg*2,10,2,2,"S");
      doc.setFont("helvetica","bold"); doc.setFontSize(7.5); doc.setTextColor(120,53,15);
      doc.text("🔒 Vertrouwelijk",mg+4,y+6.5);
      doc.setFont("helvetica","normal"); doc.setTextColor(146,64,14);
      doc.text("— Uitsluitend bestemd voor de ontvanger. Verspreiding zonder toestemming van Aziri is niet toegestaan.",mg+34,y+6.5);
      y+=16;

      // ── Klant ──
      doc.setFont("helvetica","bold"); doc.setFontSize(14); doc.setTextColor(17,24,39); doc.text(naam,mg,y); y+=5;
      doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(156,163,175);
      doc.text([d.sector,d.contactpersoon].filter(Boolean).join(" · ")+" · Opgesteld op "+today,mg,y); y+=7;

      // ── Oplossingspercentage badge ──
      doc.setFillColor(238,238,255); doc.roundedRect(mg,y,W-mg*2,9,2,2,"F");
      doc.setFont("helvetica","normal"); doc.setFontSize(7.5); doc.setTextColor(91,91,214);
      doc.text(`Oplossingspercentage: ${Math.round(r.reductie*100)}% — geen enkele software lost alles 100% op.`,mg+5,y+6);
      y+=15;

      // ── KPI's ──
      const kw=(W-mg*2-8)/3, payback=r.breakEvenMaanden;
      [{l:"Terugverdientijd",v:payback!=null?fmtM(payback):"—",a:true},{l:"Netto winst jaar 1",v:fmt(r.nettoWinstJaar1),a:false},{l:"ROI over 3 jaar",v:r.roi3Jaar!=null?fmtPct(r.roi3Jaar):"—",a:false}].forEach((k,i)=>{
        const x=mg+i*(kw+4);
        if(k.a){doc.setFillColor(238,238,255);doc.setDrawColor(91,91,214);doc.setLineWidth(0.5);}
        else{doc.setFillColor(249,250,251);doc.setDrawColor(226,228,233);doc.setLineWidth(0.3);}
        doc.roundedRect(x,y,kw,18,2,2,"FD");
        doc.setFontSize(6); doc.setFont("helvetica","bold"); doc.setTextColor(156,163,175);
        doc.text(k.l.toUpperCase(),x+5,y+6.5);
        doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.setTextColor(91,91,214);
        doc.text(k.v,x+5,y+13.5);
      }); y+=24;

      // ── Twee tabellen: huidige situatie + besparing ──
      const tw=(W-mg*2-8)/2;
      const lR=[["Operationeel tijdverlies",fmt(r.tijdverliesMaand)],["Niet-gefactureerde prestaties",fmt(r.nietGefMaand)],["Administratieve druk",fmt(r.adminMaand)],["Totaal / maand",fmt(r.totaalHuidigMaand)]];
      const rR=[["Tijdverlies (na correctie)",fmt(r.bespTijdverliesJaar)],["Omzet gerecupereerd",fmt(r.bespOmzetJaar)],["Admin (na correctie)",fmt(r.bespAdminJaar)],["Totale jaarlijkse besparing",fmt(r.totaleJaarlijkseBesparing)]];

      doc.setFont("helvetica","bold"); doc.setFontSize(7.5); doc.setTextColor(40,40,40);
      doc.text("Huidige situatie / maand",mg,y);
      doc.text(`Bruto besparing / jaar (${Math.round(r.reductie*100)}%)`,mg+tw+8,y); y+=3;
      doc.setDrawColor(200); doc.setLineWidth(0.3); doc.line(mg,y,mg+tw,y); doc.line(mg+tw+8,y,mg+tw+8+tw,y); y+=5;
      let ly=y, ry=y;
      lR.forEach((row,ri)=>{const isT=ri===lR.length-1; doc.setFont("helvetica",isT?"bold":"normal"); doc.setFontSize(8); doc.setTextColor(isT?91:70,isT?91:70,isT?214:70); doc.text(row[0],mg,ly); doc.text(row[1],mg+tw,ly,{align:"right"}); ly+=6; if(!isT){doc.setDrawColor(243,244,246);doc.setLineWidth(0.1);doc.line(mg,ly-1.5,mg+tw,ly-1.5);}});
      rR.forEach((row,ri)=>{const isT=ri===rR.length-1; doc.setFont("helvetica",isT?"bold":"normal"); doc.setFontSize(8); doc.setTextColor(isT?91:70,isT?91:70,isT?214:70); doc.text(row[0],mg+tw+8,ry); doc.text(row[1],W-mg,ry,{align:"right"}); ry+=6; if(!isT){doc.setDrawColor(243,244,246);doc.setLineWidth(0.1);doc.line(mg+tw+8,ry-1.5,W-mg,ry-1.5);}});
      y=Math.max(ly,ry)+8;

      // ── Projectie over 3 jaar ──
      doc.setFillColor(249,250,251); doc.setDrawColor(226,228,233); doc.setLineWidth(0.3);
      doc.roundedRect(mg,y,W-mg*2,38,2,2,"FD");
      doc.setFont("helvetica","bold"); doc.setFontSize(7); doc.setTextColor(91,91,214);
      doc.text("PROJECTIE OVER 3 JAAR",mg+5,y+6); y+=9;
      const cW=(W-mg*2-10)/4;
      doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(156,163,175);
      doc.text("",mg+5,y); doc.text("Jaar 1",mg+5+cW,y,{align:"right"}); doc.text("Jaar 2",mg+5+cW*2,y,{align:"right"}); doc.text("Jaar 3",mg+5+cW*3,y,{align:"right"}); y+=5;
      doc.setDrawColor(226,228,233); doc.setLineWidth(0.2); doc.line(mg+3,y,W-mg-3,y); y+=4;
      doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(107,114,128);
      doc.text("Kosten",mg+5,y); doc.text(fmt(r.kostenJaar1),mg+5+cW,y,{align:"right"}); doc.text(fmt(r.kostenJaar2),mg+5+cW*2,y,{align:"right"}); doc.text(fmt(r.kostenJaar3),mg+5+cW*3,y,{align:"right"}); y+=6;
      doc.setTextColor(5,150,105);
      doc.text("Besparing",mg+5,y); doc.text(fmt(r.totaleJaarlijkseBesparing),mg+5+cW,y,{align:"right"}); doc.text(fmt(r.totaleJaarlijkseBesparing),mg+5+cW*2,y,{align:"right"}); doc.text(fmt(r.totaleJaarlijkseBesparing),mg+5+cW*3,y,{align:"right"}); y+=6;
      doc.setFont("helvetica","bold"); doc.setTextColor(91,91,214);
      doc.text("Netto",mg+5,y); doc.text(fmt(r.nettoWinstJaar1),mg+5+cW,y,{align:"right"}); doc.text(fmt(r.nettoWinstJaarNa1),mg+5+cW*2,y,{align:"right"}); doc.text(fmt(r.nettoWinstJaarNa1),mg+5+cW*3,y,{align:"right"}); y+=6;
      doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(156,163,175);
      doc.text("Cumulatief netto",mg+5,y); doc.text(fmt(r.nettoWinstJaar1),mg+5+cW,y,{align:"right"}); doc.text(fmt(r.nettoWinstJaar1+r.nettoWinstJaarNa1),mg+5+cW*2,y,{align:"right"}); doc.text(fmt(r.totaleBesparing3Jaar-r.totaleKosten3Jaar),mg+5+cW*3,y,{align:"right"});
      y+=14;

      // ── Netto winst tabel + kosten tabel ──
      const tw2=(W-mg*2-8)/2;
      doc.setFont("helvetica","bold"); doc.setFontSize(7.5); doc.setTextColor(40,40,40);
      doc.text("Kosten per jaar",mg,y); doc.text("Netto winst per jaar",mg+tw2+8,y); y+=3;
      doc.setDrawColor(200); doc.setLineWidth(0.3); doc.line(mg,y,mg+tw2,y); doc.line(mg+tw2+8,y,mg+tw2+8+tw2,y); y+=5;
      const kRows=[["Jaar 1 (ontwikkeling+licentie)",fmt(r.kostenJaar1)],["Jaar 2 (licentie)",fmt(r.kostenJaar2)],["Jaar 3 (licentie)",fmt(r.kostenJaar3)],["Totaal 3 jaar",fmt(r.totaleKosten3Jaar)]];
      const nRows=[["Jaar 1",fmt(r.nettoWinstJaar1)],["Jaar 2",fmt(r.nettoWinstJaarNa1)],["Jaar 3",fmt(r.nettoWinstJaarNa1)],["Totaal 3 jaar",fmt(r.totaleBesparing3Jaar-r.totaleKosten3Jaar)]];
      let ky=y, ny=y;
      kRows.forEach((row,ri)=>{const isT=ri===3; doc.setFont("helvetica",isT?"bold":"normal"); doc.setFontSize(8); doc.setTextColor(isT?91:70,isT?91:70,isT?214:70); doc.text(row[0],mg,ky); doc.text(row[1],mg+tw2,ky,{align:"right"}); ky+=6; if(!isT){doc.setDrawColor(243,244,246);doc.setLineWidth(0.1);doc.line(mg,ky-1.5,mg+tw2,ky-1.5);}});
      nRows.forEach((row,ri)=>{const isT=ri===3; doc.setFont("helvetica",isT?"bold":"normal"); doc.setFontSize(8); doc.setTextColor(isT?91:70,isT?91:70,isT?214:70); doc.text(row[0],mg+tw2+8,ny); doc.text(row[1],W-mg,ny,{align:"right"}); ny+=6; if(!isT){doc.setDrawColor(243,244,246);doc.setLineWidth(0.1);doc.line(mg+tw2+8,ny-1.5,W-mg,ny-1.5);}});
      y=Math.max(ky,ny)+8;

      // ── Investering samenvatting ──
      doc.setFillColor(238,238,255); doc.setDrawColor(91,91,214); doc.setLineWidth(0.5);
      doc.roundedRect(mg,y,W-mg*2,17,2,2,"FD");
      doc.setFont("helvetica","bold"); doc.setFontSize(6.5); doc.setTextColor(91,91,214); doc.text("INVESTERING & SAMENVATTING",mg+5,y+6);
      doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(75,85,99);
      doc.text(`Ontwikkeling: ${fmt(r.eenmalig)}`,mg+5,y+12.5);
      doc.text(`Licentie/jaar: ${fmt(r.licentie)}`,mg+66,y+12.5);
      doc.setFont("helvetica","bold"); doc.setTextColor(91,91,214);
      doc.text(`Break-even: ${payback!=null?fmtM(payback):"n.v.t."}  |  ROI 3j: ${r.roi3Jaar!=null?fmtPct(r.roi3Jaar):"—"}`,mg+118,y+12.5);
      y+=24;

      // ── Aannames ──
      doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(156,163,175);
      doc.text(`Aannames: oplossingspercentage ${Math.round(r.reductie*100)}% · projectie 3 jaar · geen interne trainingskosten · besparingen constant`,mg,y);
      y+=7;

      // ── Footer: paarse lijn + vertrouwelijk + branding ──
      doc.setFillColor(91,91,214); doc.rect(0,y,W,2,"F"); y+=4;
      doc.setFillColor(254,243,199); doc.roundedRect(mg,y,tw,9,2,2,"F");
      doc.setFont("helvetica","bold"); doc.setFontSize(7); doc.setTextColor(120,53,15);
      doc.text("🔒 Vertrouwelijk — Uitsluitend voor de ontvanger. Niet verspreiden zonder toestemming Aziri.",mg+3,y+6);
      doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(91,91,214);
      doc.text("AZIRI",W-mg,y+5,{align:"right"});
      doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(156,163,175);
      doc.text("aziri.eu · ROI_"+naam+"_Aziri",W-mg,y+10,{align:"right"});

      doc.save(`ROI_${naam}_Aziri.pdf`);
      set("pdf-msg",`<p class="success">✓ PDF opgeslagen: ROI_${naam}_Aziri.pdf</p>`);
    }catch(e){set("pdf-msg",`<div class="error">PDF-fout: ${e.message}</div>`);}
  },100);
}

function goWelcome(){state.screen="welcome";render();}
function render(){
  const s=state.screen;
  if(s==="welcome") renderWelcome();
  else if(s==="transcript") renderTranscript();
  else if(s==="form") renderForm();
  else if(s==="result") renderResult();
}
render();
