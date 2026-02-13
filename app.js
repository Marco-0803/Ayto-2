/* === 🔄 Zuverlässiger Auto-Update & Cache-Reset === */
(function(){
  try {
    const meta = document.querySelector('meta[name="app-version"]');
    const version = meta ? meta.content : null;
    const last = localStorage.getItem('aytoAppVersion');

    // Prüfen, ob sich die Version geändert hat
    if (version && version !== last) {
      console.log(`🆕 Neue Version erkannt (${version}) → Lösche alte Daten und Cache...`);

      // Schritt 1: LocalStorage komplett löschen
      const preservedKeys = ["aytoAppVersion"]; // Nur die neue Version behalten
      const keys = Object.keys(localStorage);
      for (const k of keys) {
        if (!preservedKeys.includes(k)) localStorage.removeItem(k);
      }

      // Schritt 2: Neue Version speichern
      localStorage.setItem('aytoAppVersion', version);

      // Schritt 3: Browser-/PWA-Cache leeren
      if ('caches' in window) {
        caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
      }

      // Schritt 4: Optional visueller Hinweis
      const overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.inset = "0";
      overlay.style.display = "flex";
      overlay.style.alignItems = "center";
      overlay.style.justifyContent = "center";
      overlay.style.background = "rgba(0,0,0,0.85)";
      overlay.style.color = "white";
      overlay.style.fontSize = "18px";
      overlay.style.zIndex = "99999";
      overlay.textContent = "🔄 App wird aktualisiert...";
      document.body.appendChild(overlay);

      // Schritt 5: erzwungener Reload nach kurzem Delay
      setTimeout(() => {
        console.log("🔁 Neuladen...");
        location.reload(true);
      }, 1200);
    }
  } catch (e) {
    console.warn("Fehler beim Auto-Update:", e);
  }
})();
/* === 🌐 Bottom Navigation + Overlay Logic === */
(function(){
  const nav = document.getElementById('nav');
  const pages = document.querySelectorAll('.page');
  if(nav){
    nav.addEventListener('click', (e)=>{
      const btn = e.target.closest('button'); if(!btn) return;
      document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const id = btn.getAttribute('data-target');
      pages.forEach(p=> p.classList.toggle('active', p.id===id));
      window.scrollTo({top:0, behavior:'smooth'});
    });
  }
})();

function showOverlay(){
  const ov=document.getElementById('overlay');
  if(ov){
    ov.classList.add('show');
    const bar = ov.querySelector('.progress .bar');
    if(bar) bar.style.width = "0%";
  }
}
function hideOverlay(){
  const ov=document.getElementById('overlay');
  if(ov) ov.classList.remove('show');
}

/* === Staffel 2026 Vorbelegen (funktioniert sicher, auch mit Navigation) === */
function initPrefill() {
  const prefillBtn = document.getElementById("prefill");
  const listA = document.getElementById("listA");
  const listB = document.getElementById("listB");
  if (!prefillBtn || !listA || !listB) return; // Elemente noch nicht da

  // Falls bereits verbunden, nicht doppelt hinzufügen
  if (prefillBtn.dataset.bound) return;
  prefillBtn.dataset.bound = "true";

  prefillBtn.addEventListener("click", () => {
    const A = [
      "Adrianna", "Alicia", "Aurora", "Elena", "Ella",
      "Laura", "Linda", "Marla", "Michelle", "Tiziana", "Tonia"
    ];
    const B = [
      "Chris", "Ema", "Evi", "Jeronymo", "Jerry",
      "Julian.M", "Julian.S", "Luke", "Meji", "Noel"
    ];

    listA.innerHTML = "";
    listB.innerHTML = "";

    A.forEach(name => {
      const div = document.createElement("div");
      div.className = "row";
      div.innerHTML = `
        <input type="text" value="${name}" placeholder="Name (A)" style="flex:1">
        <button class="danger small">✖</button>`;
      div.querySelector("button").addEventListener("click", () => div.remove());
      listA.appendChild(div);
    });

    B.forEach(name => {
      const div = document.createElement("div");
      div.className = "row";
      div.innerHTML = `
        <input type="text" value="${name}" placeholder="Name (B)" style="flex:1">
        <button class="danger small">✖</button>`;
      div.querySelector("button").addEventListener("click", () => div.remove());
      listB.appendChild(div);
    });

    localStorage.setItem("aytoTeilnehmer", JSON.stringify({ A, B }));
    prefillBtn.textContent = "✅ Staffel 2026 geladen";
    prefillBtn.disabled = true;
    alert("Staffel 2026 wurde erfolgreich geladen!");
  });
}

// Listener beim ersten Anzeigen der Teilnehmer-Seite aktivieren
document.addEventListener("DOMContentLoaded", () => {
  // gleich beim Start prüfen
  initPrefill();

  // zusätzlich bei Navigation prüfen (wenn man den Teilnehmer-Tab öffnet)
  document.addEventListener("click", e => {
    const btn = e.target.closest("button[data-target='page-participants']");
    if (btn) setTimeout(initPrefill, 100); // leicht verzögert, bis DOM sichtbar
  });
});
/* === 👥 Teilnehmer-Verwaltung (mit Live-Update) === */
window.addEventListener("DOMContentLoaded", () => {
  const listA = document.getElementById("listA");
  const listB = document.getElementById("listB");
  const addA = document.getElementById("addA");
  const addB = document.getElementById("addB");
  const prefill = document.getElementById("prefill");
  const warn = document.getElementById("warnBalance");
  if (!listA || !listB || !addA || !addB) return;

  const STORAGE_KEY = "aytoTeilnehmer";

  function getData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { A: [], B: [] };
      const parsed = JSON.parse(raw);
      return { A: Array.isArray(parsed.A) ? parsed.A : [], B: Array.isArray(parsed.B) ? parsed.B : [] };
    } catch (e) {
      console.warn("localStorage Fehler:", e);
      return { A: [], B: [] };
    }
  }

  function saveData() {
    const A = [...listA.querySelectorAll("input")].map(i => i.value.trim()).filter(Boolean);
    const B = [...listB.querySelectorAll("input")].map(i => i.value.trim()).filter(Boolean);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ A, B }));
    document.dispatchEvent(new Event("teilnehmerChanged")); // 🔄 Signal an andere Bereiche
  }

  function createPerson(name, group, save = true) {
    const div = document.createElement("div");
    div.className = "row";
    div.innerHTML = `
      <input type="text" value="${name}" placeholder="Name eingeben" style="flex:1">
      <button class="danger small" title="Löschen">✖</button>
    `;
    const input = div.querySelector("input");
    input.addEventListener("input", saveData);
    div.querySelector("button").addEventListener("click", () => {
      div.remove(); saveData(); checkBalance();
    });
    (group === "A" ? listA : listB).appendChild(div);
    if (save) saveData();
    checkBalance();
  }

  function loadData() {
    const data = getData();
    listA.innerHTML = "";
    listB.innerHTML = "";
    data.A.forEach(n => createPerson(n, "A", false));
    data.B.forEach(n => createPerson(n, "B", false));
    checkBalance();
  }

  function checkBalance() {
    const aCount = listA.children.length, bCount = listB.children.length;
    if (Math.abs(aCount - bCount) > 1) {
      warn.style.display = "block";
      warn.textContent = `⚠ Ungleichgewicht: ${aCount} A-Person(en) vs. ${bCount} B-Person(en).`;
    } else warn.style.display = "none";
  }

  addA.addEventListener("click", () => createPerson(`A${listA.children.length + 1}`, "A"));
  addB.addEventListener("click", () => createPerson(`B${listB.children.length + 1}`, "B"));

  loadData();
});
/* === 💞 Matchbox (aktualisiert bei Teilnehmer-Änderungen) === */
window.addEventListener("DOMContentLoaded", () => {
  const tbA = document.getElementById("tbA"),
        tbB = document.getElementById("tbB"),
        tbType = document.getElementById("tbType"),
        tbAdd = document.getElementById("addTB"),
        tbList = document.getElementById("tbList");
  if (!tbA || !tbB || !tbType || !tbAdd || !tbList) return;

  const KEY_T = "aytoTeilnehmer", KEY_M = "aytoMatchbox";
  const getTeilnehmer = () => JSON.parse(localStorage.getItem(KEY_T) || '{"A":[],"B":[]}');
  const loadM = () => JSON.parse(localStorage.getItem(KEY_M) || "[]");
  const saveM = a => localStorage.setItem(KEY_M, JSON.stringify(a));

  function refresh() {
    const { A, B } = getTeilnehmer();
    tbA.innerHTML = '<option value="">— A auswählen —</option>';
    tbB.innerHTML = '<option value="">— B auswählen —</option>';
    A.forEach(n => tbA.innerHTML += `<option>${n}</option>`);
    B.forEach(n => tbB.innerHTML += `<option>${n}</option>`);
  }

  function render() {
    const arr = loadM();
    tbList.innerHTML = "";
    if (!arr.length) {
      tbList.innerHTML = "<div class='small muted'>Noch keine Einträge</div>";
      return;
    }
    arr.forEach((m, i) => {
      const tagClass = m.type === "PM" ? "tag good" : m.type === "NM" ? "tag bad" : "tag neutral";
      const tagText = m.type === "PM" ? "Perfect Match" : m.type === "NM" ? "No Match" : "Sold";
      const div = document.createElement("div");
      div.className = "row";
      div.innerHTML = `<div style="flex:1">${m.A} × ${m.B} <span class="${tagClass}">${tagText}</span></div>
      <button class="danger small">✖</button>`;
      div.querySelector("button").onclick = () => {
        const a = loadM();
        a.splice(i, 1);
        saveM(a);
        render();
      };
      tbList.appendChild(div);
    });
  }

  tbAdd.onclick = () => {
    const a = tbA.value.trim(), b = tbB.value.trim(), t = tbType.value;
    if (!a || !b) return alert("Bitte A und B auswählen!");
    const arr = loadM();
    if (arr.some(x => x.A === a && x.B === b)) return alert("Dieses Paar existiert bereits!");
    arr.push({ A: a, B: b, type: t });
    saveM(arr);
    render();
  };

  // Beobachter & Live-Update bei Teilnehmeränderungen
  const obsA = new MutationObserver(refresh);
  const obsB = new MutationObserver(refresh);
  obsA.observe(document.getElementById("listA"), { childList: true, subtree: true });
  obsB.observe(document.getElementById("listB"), { childList: true, subtree: true });
  document.addEventListener("teilnehmerChanged", refresh);

  refresh();
  render();
});
// === 🌙 Matching Nights (komplette Paarungen) ===
window.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("teilnehmerChanged", renderNights);
  const addNightBtn = document.getElementById("addNight");
  const nightsList = document.getElementById("nights");
  const STORAGE_KEY_NIGHTS = "aytoMatchingNights";
  const STORAGE_KEY_TEILNEHMER = "aytoTeilnehmer";

  if (!addNightBtn || !nightsList) return;

  // Teilnehmer laden
  function getTeilnehmer() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_TEILNEHMER);
      if (!raw) return { A: [], B: [] };
      const parsed = JSON.parse(raw);
      return {
        A: Array.isArray(parsed.A) ? parsed.A : [],
        B: Array.isArray(parsed.B) ? parsed.B : []
      };
    } catch {
      return { A: [], B: [] };
    }
  }

  // Nights laden/speichern
  function loadNights() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_NIGHTS)) || [];
    } catch {
      return [];
    }
  }
  function saveNights(arr) {
    localStorage.setItem(STORAGE_KEY_NIGHTS, JSON.stringify(arr));
  }

  // Rendering der gespeicherten Nights
  function renderNights() {
    const nights = loadNights();
    nightsList.innerHTML = "";

    if (nights.length === 0) {
      nightsList.innerHTML = "<div class='small muted'>Noch keine Matching Night angelegt</div>";
      return;
    }

    nights.forEach((night, i) => {
      const div = document.createElement("div");
      div.className = "card stack";
      div.style.padding = "10px";

      div.innerHTML = `
        <div class="row" style="justify-content:space-between;align-items:center">
          <strong>Night ${i + 1}</strong>
          <button class="danger small">✖</button>
        </div>
        <div class="small muted">Lichter: ${night.lights}</div>
        <table style="width:100%;font-size:13px">
          ${night.pairs.map(p => `<tr><td>${p.A}</td><td>×</td><td>${p.B}</td></tr>`).join("")}
        </table>
      `;

      div.querySelector("button").addEventListener("click", () => {
        const nights = loadNights();
        nights.splice(i, 1);
        saveNights(nights);
        renderNights();
      });

      nightsList.appendChild(div);
    });
  }

  // Neue Night hinzufügen
  addNightBtn.addEventListener("click", () => {
    const { A, B } = getTeilnehmer();
    if (A.length === 0 || B.length === 0) {
      alert("Bitte zuerst Teilnehmer hinzufügen!");
      return;
    }

    // --- Erstelle UI für Auswahl ---
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(0,0,0,0.85)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "10000";

    const box = document.createElement("div");
    box.className = "card stack";
    box.style.maxWidth = "420px";
    box.style.background = "#171a2b";
    box.style.color = "white";
    box.style.padding = "16px";
    box.innerHTML = `<h3>Neue Matching Night</h3>`;

    // === Tabelle mit Zuordnungen ===
    const table = document.createElement("table");
    table.style.width = "100%";
    table.innerHTML = `<tr><th>A-Person</th><th></th><th>B-Person</th></tr>`;

    // "Keine Partnerin" ist immer erlaubt
    const optionsBase = [
      '<option value="">— wählen —</option>',
      '<option value="keine">Kein Partner</option>'
    ];

    const selects = [];
    function updateDropdowns() {
      const used = new Set(
        selects.map(sel => sel.value).filter(v => v && v !== "keine")
      );

      selects.forEach(sel => {
        const current = sel.value;
        sel.innerHTML = optionsBase.concat(
          B.filter(b => !used.has(b) || b === current)
            .map(b => `<option value="${b}">${b}</option>`)
        ).join("");
        sel.value = current;
      });
    }

    A.forEach(a => {
      const tr = document.createElement("tr");
      const sel = document.createElement("select");
      selects.push(sel);
      tr.innerHTML = `<td>${a}</td><td>×</td><td></td>`;
      tr.children[2].appendChild(sel);
      table.appendChild(tr);

      // Initial füllen
      sel.innerHTML = optionsBase.concat(
        B.map(b => `<option value="${b}">${b}</option>`)
      ).join("");

      // Wenn Auswahl geändert → Dropdowns neu aufbauen
      sel.addEventListener("change", updateDropdowns);
    });
    box.appendChild(table);

    // === Lichter-Auswahl ===
    const lightRow = document.createElement("div");
    lightRow.className = "row";
    lightRow.style.marginTop = "10px";
    const lightLabel = document.createElement("label");
    lightLabel.textContent = "Lichter:";
    const lightSelect = document.createElement("select");
    for (let i = 0; i <= Math.min(A.length, B.length); i++) {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = i;
      lightSelect.appendChild(opt);
    }
    lightRow.appendChild(lightLabel);
    lightRow.appendChild(lightSelect);
    box.appendChild(lightRow);

    // === Buttons (Speichern / Abbrechen) ===
    const btnRow = document.createElement("div");
    btnRow.className = "row";
    btnRow.style.marginTop = "12px";
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Speichern";
    saveBtn.className = "primary";
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Abbrechen";
    cancelBtn.className = "ghost";
    btnRow.appendChild(saveBtn);
    btnRow.appendChild(cancelBtn);
    box.appendChild(btnRow);

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    cancelBtn.addEventListener("click", () => overlay.remove());

    // === Speichern der Night ===
    saveBtn.addEventListener("click", () => {
      const pairs = [];
      const selects = box.querySelectorAll("select");
      selects.forEach((sel, idx) => {
        if (idx < A.length) {
          const value = sel.value;
          if (value && value !== "keine") pairs.push({ A: A[idx], B: value });
        }
      });

      const lights = parseInt(lightSelect.value, 10);
      const nights = loadNights();
      nights.push({ pairs, lights });
      saveNights(nights);
      overlay.remove();
      renderNights();
    });
  });

  // Initial aufrufen
  renderNights();
});
/* === 🕒 Timeline === */
window.addEventListener("DOMContentLoaded",()=>{
  const box=document.getElementById("timelineBox"); if(!box) return;
  const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d;}catch{return d;}};
  function render(){
    const mb=get("aytoMatchbox",[]), nights=get("aytoMatchingNights",[]);
    box.innerHTML="";
    if(!mb.length&&!nights.length){box.innerHTML="<div class='small muted'>Noch keine Ereignisse vorhanden</div>";return;}
    if(mb.length){
      box.innerHTML+="<h3>💞 Matchbox-Entscheidungen</h3>";
      mb.forEach((m,i)=>{
        const emoji=m.type==="PM"?"✅":m.type==="NM"?"❌":"🟦";
        const txt=m.type==="PM"?"Perfect Match":m.type==="NM"?"No Match":"Sold";
        box.innerHTML+=`<div class="card stack"><strong>Matchbox ${i+1}</strong><div>${emoji} ${m.A} × ${m.B} — ${txt}</div></div>`;
      });
    }
    if(nights.length){
      box.innerHTML+="<h3>🌙 Matching Nights</h3>";
      nights.forEach((n,i)=>{
        box.innerHTML+=`<div class="card stack"><strong>Night ${i+1}</strong> – ${n.lights} Lichter
        <table style="width:100%;font-size:13px">${n.pairs.map(p=>`<tr><td>${p.A}</td><td>×</td><td>${p.B||"<i>Keine Partnerin</i>"}</td></tr>`).join("")}</table></div>`;
      });
    }
  }
  render();
  document.querySelectorAll('nav button[data-target="page-nights"]').forEach(b=>b.addEventListener("click",render));
});

/* === 📊 Hybrid-Solver: schnell, korrekt, 20 s Timeout & „Keine Partnerin“-Fix === */
window.addEventListener("DOMContentLoaded", () => {
  const solveBtn   = document.getElementById("solveBtn");
  const summaryBox = document.getElementById("summary");
  const matrixBox  = document.getElementById("matrix");
  const logsBox    = document.getElementById("logs");

  if (!solveBtn) return;

  // --- Storage-Reader
  const get = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch { return d; } };
  const getT = () => get("aytoTeilnehmer", { A: [], B: [] });
  const getM = () => get("aytoMatchbox", []);
  const getN = () => get("aytoMatchingNights", []);

  // --- PNG-Export
  async function exportMatrix() {
    const el = document.querySelector(".ayto-table-container");
    if (!el) return alert("Keine Matrix gefunden!");
    if (typeof html2canvas !== "function")
      return alert("html2canvas nicht geladen – Export nicht möglich.");
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#1a1b2b" });
    const a = document.createElement("a");
    a.download = "AYTO-Matrix.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  }

  // --- Overlay / Fortschritt
  const overlayEl = () => document.getElementById("overlay");
  const barEl = () => overlayEl()?.querySelector(".progress .bar");
  const setProgress = (p) => { const b = barEl(); if (b) b.style.width = Math.min(100, p).toFixed(1) + "%"; };

// === Constraints ===
function buildConstraints() {
  const { A, B } = getT();
  const M = getM();
  const Nraw = getN();

  if (A.length < 2 || B.length < 2)
    return { ok:false, error:"Bitte mindestens 2 Teilnehmer pro Gruppe anlegen.", A,B };
  if (!(A.length === B.length || A.length === B.length + 1 || A.length === B.length + 2)) {
    return { ok:false, error:`Unterstützt werden A=B, A=B+1 oder A=B+2. Aktuell: ${A.length}×${B.length}.`, A,B };
  }

  const idxA = Object.fromEntries(A.map((n,i)=>[n,i]));
  const idxB = Object.fromEntries(B.map((n,i)=>[n,i]));
  const m = A.length, n = B.length, NONE = n;
  const forced = Array(m).fill(-1);
  const forbidden = Array.from({length:m},()=>new Set());

  // --- Matchbox
  for (const t of M) {
    if (!(t.A in idxA)) continue;
    const ai = idxA[t.A];
    if (t.B in idxB) {
      const bj = idxB[t.B];
      if (t.type === "PM") {
        if (forced[ai] !== -1 && forced[ai] !== bj)
          return { ok:false, error:`Widerspruch in Perfect Matches: ${t.A}×${t.B}`, A,B };
        forced[ai] = bj;
      } else if (t.type === "NM") forbidden[ai].add(bj);
    }
  }

  // --- Matching Nights
  const nights = [];
  for (const nObj of Array.isArray(Nraw)?Nraw:[]) {
    const map = Array(m).fill(NONE);
    let empties = 0;

    for (const a of A) {
      const i = idxA[a];
      const entry = (nObj.pairs || []).find(p => p.A === a);
      const rawB = entry ? (entry.B || "").trim().toLowerCase() : "";

      if (
        rawB === "" ||
        rawB.includes("kein") ||
        rawB.includes("Partner") ||
        rawB.includes("ohne") ||
        rawB.includes("—") ||
        rawB.includes("-")
      ) {
        map[i] = NONE; empties++;
      } else if (rawB in idxB) {
        map[i] = idxB[rawB];
      } else if (B.some(b => b.toLowerCase() === rawB)) {
        map[i] = idxB[B.find(b => b.toLowerCase() === rawB)];
      } else {
        map[i] = NONE; empties++;
      }
    }

    const k = A.length - B.length; // 0, 1 oder 2
    if (k === 0 && empties !== 0)
      return { ok:false, error:"In einer Night (A=B) darf niemand ohne Partnerin sein.", A,B };
    if (k > 0 && empties !== k)
      return { ok:false, error:`In einer Night (A=B+${k}) müssen genau ${k} Person(en) ohne Partnerin sein.`, A,B };

    nights.push({ map, beams: parseInt(nObj.lights||0,10), NONE });
  }

  return { ok:true, A,B,m,n,NONE,forced,forbidden,nights };
}

// === Solver ===
async function berechne() {
  summaryBox.innerHTML = "<h3>Berechnung läuft…</h3>";
  logsBox.innerHTML = "";
  matrixBox.innerHTML = "";
  matrixBox.style.display = "none";
  setProgress(0);
  showOverlay?.();

  const t0 = performance.now();
  const HARD_TIMEOUT_MS = 20000;
  let timedOut = false;

  const cons = buildConstraints();
  if (!cons.ok) { hideOverlay?.(); alert(cons.error); return; }

  const { A,B,m,n,NONE,forced,forbidden,nights } = cons;
  const noneQuota = Math.max(0, m - n); // erlaubt 0, 1 oder 2 ohne Partnerin
  const allWomen = [...Array(n).keys()];
  const dom = Array.from({length:m},(_,i)=> new Set(allWomen.filter(j=>!forbidden[i].has(j))));
  if (noneQuota > 0) for (let i=0;i<m;i++) dom[i].add(NONE);
  for (let i=0;i<m;i++) if (forced[i]!==-1) dom[i]=new Set([forced[i]]);
  for (let i=0;i<m;i++) if (dom[i].size===0){ hideOverlay?.(); alert(`Keine Möglichkeit für ${A[i]}.`); return; }

  const order=[...Array(m).keys()].sort((a,b)=> dom[a].size-dom[b].size);
  const usedWoman=new Array(n).fill(false);
  let usedNone=0;
  const assign=Array(m).fill(-1);
  let total=0n;
  const counts=Array.from({length:m},()=>Array(n).fill(0n));

  function nightBounds(nt){
    let fixed=0,could=0;
    for(let i=0;i<m;i++){
      const want=nt.map[i], a=assign[i];
      if(a!==-1){ if(a!==NONE && a===want) fixed++; }
      else if(want!==NONE && !usedWoman[want] && dom[i].has(want)) could++;
    }
    return [fixed,fixed+could];
  }
  function prune(){
    for(const nt of nights){ const [mn,mx]=nightBounds(nt); if(nt.beams<mn||nt.beams>mx) return false; }
    return true;
  }
  function satisfied(){
    for(const nt of nights){
      let hits=0;
      for(let i=0;i<m;i++){ const a=assign[i]; if(a!==-1&&a!==NONE&&a===nt.map[i]) hits++; }
      if(hits!==nt.beams) return false;
    }
    return true;
  }

  let nodes=0;
  function tickProgress(){
    nodes++;
    if((nodes&0x3FF)===0){
      const elapsed=performance.now()-t0;
      const est=Math.min(85,100*(1-Math.exp(-nodes/40000)));
      const boost=Math.min(15,(elapsed/HARD_TIMEOUT_MS)*15);
      setProgress(est+boost);
      if(elapsed>HARD_TIMEOUT_MS) timedOut=true;
    }
  }

  function dfs(pos){
    if(timedOut) return;
    if(pos===m){
      if (usedNone === noneQuota) {
        if(!satisfied()) return;
        total++;
        for(let i=0;i<m;i++){ const j=assign[i]; if(j>=0&&j<n) counts[i][j]++; }
      }
      return;
    }
    const i=order[pos];
    for(const j of dom[i]){
      tickProgress();
      if(j===NONE){
        if (usedNone >= noneQuota) continue;
        assign[i]=NONE; usedNone++;
        if(prune()) dfs(pos+1);
        assign[i]=-1; usedNone--;
      } else {
        if(usedWoman[j]) continue;
        assign[i]=j; usedWoman[j]=true;
        let ok=true;
        for(const k of order){ if(k===i||assign[k]!==-1) continue; if(dom[k].size===1&&dom[k].has(j)){ ok=false; break; } }
        if(ok&&prune()) dfs(pos+1);
        assign[i]=-1; usedWoman[j]=false;
      }
      if(timedOut) return;
    }
  }

  if(!prune()){ hideOverlay?.(); alert("Widerspruch mit den Lichterzahlen."); return; }
  dfs(0);
  setProgress(100);
  const dur=Math.round(performance.now()-t0);

  if(timedOut && total===0n){ hideOverlay?.(); alert("Leider noch zu wenig Daten oder zu komplex – abgebrochen nach 20 s."); return; }

  summaryBox.innerHTML=`
    <h3>Ergebnis</h3>
    <div>${A.length}×${B.length} Teilnehmer</div>
    <div>${String(total)} gültige Kombinationen (${dur} ms)</div>
    <button id="exportMatrix" class="primary" style="margin-top:8px">Matrix speichern (PNG)</button>
  `;
  document.getElementById("exportMatrix").onclick = exportMatrix;

  if(total===0n){
    matrixBox.innerHTML="<h3>Keine gültige Kombination gefunden!</h3>";
    matrixBox.style.display="block";
    hideOverlay?.(); return;
  }

  const toPct=(x)=>Number((x*10000n)/total)/100;
  let html=`<div class="ayto-table-container"><table class="ayto-table"><tr><th>A\\B</th>${B.map(b=>`<th>${b}</th>`).join("")}</tr>`;
  for(let i=0;i<m;i++){
    html+=`<tr><td style="position:sticky;left:0;background:#23283f;font-weight:600">${A[i]}</td>`;
    for(let j=0;j<n;j++){
      const p=toPct(counts[i][j]);
      const hue=p===0?0:p===100?120:p*1.2;
      const bg=`hsl(${hue},75%,${Math.min(25+p*0.3,55)}%)`;
      html+=`<td style="text-align:center;background:${bg};color:#fff">${isNaN(p)?'0.00':p.toFixed(2)}%</td>`;
    }
    html+="</tr>";
  }
  html+="</table></div>";
  matrixBox.innerHTML=html;
  matrixBox.style.display="block";
  hideOverlay?.();
}

// Mindestens 5s Overlay + weiche Progress-Animation, ohne den Solver anzufassen
solveBtn.onclick = async () => {
  const ov = document.getElementById('overlay');
  const bar = ov?.querySelector('.bar');
  const title = ov?.querySelector('.overlay-title');

  // 1) showOverlay starten
  if (typeof showOverlay === 'function') showOverlay();
  else ov?.classList.add('show');

  // 2) hideOverlay vorübergehend "abfangen", damit der Solver es nicht zu früh schließt
  const realHide = window.hideOverlay;
  let wantHide = false;
  window.hideOverlay = () => { wantHide = true; }; // Puffer statt sofort zu schließen

  // 3) sanfte Fake-Progress-Animation bis 90%
  let p = 0;
  const tick = () => {
    if (p < 90) {
      p += 1.2; // Geschwindigkeit der Leiste
      if (bar) bar.style.width = `${p}%`;
      if (title) title.textContent = `Berechnung läuft... (${Math.round(p)}%)`;
      anim = requestAnimationFrame(tick);
    }
  };
  let anim = requestAnimationFrame(tick);

  const start = performance.now();
  const MIN_MS = 5000;

  try {
    // 4) Eigentliche Berechnung laufen lassen (dein bestehendes berechne())
    await Promise.resolve(berechne());
  } catch (e) {
    console.error(e);
  } finally {
    // 5) Animation auf 100% ziehen
    cancelAnimationFrame(anim);
    if (bar) bar.style.width = '100%';
    if (title) title.textContent = `Berechnung abgeschlossen (100%)`;

    // 6) Mindestdauer sicherstellen
    const elapsed = performance.now() - start;
    const rest = Math.max(0, MIN_MS - elapsed);
    setTimeout(() => {
      // Jetzt das Overlay wirklich schließen (und hideOverlay wiederherstellen)
      if (typeof realHide === 'function') realHide();
      else ov?.classList.remove('show');
      window.hideOverlay = realHide;

      // Falls der Solver währenddessen schon "schließen wollte", ist das jetzt sowieso erledigt
      wantHide = false;
    }, rest);
  }
};
});
