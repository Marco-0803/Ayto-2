/* === 🔄 Auto-Update & Versioning === */
(function(){
  try {
    const meta = document.querySelector('meta[name="app-version"]');
    const version = meta ? meta.content : null;
    const last = localStorage.getItem('aytoAppVersion');
    if (version && version !== last) {
      localStorage.setItem('aytoAppVersion', version);
      if ('caches' in window) caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
      location.reload(true);
    }
  } catch (e) { console.warn("Fehler beim Auto-Update:", e); }
})();

/* === 🛠 Globale Helfer & Daten-Management === */
const STORAGE_KEY_T = "aytoTeilnehmer";
function getT() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY_T)) || {A:[], B:[]}; } catch(e) { return {A:[], B:[]}; } }
function saveT(data) { localStorage.setItem(STORAGE_KEY_T, JSON.stringify(data)); document.dispatchEvent(new Event("teilnehmerChanged")); }

function showOverlay(){
  const ov=document.getElementById('overlay');
  if(ov){ 
    ov.classList.add('show'); 
    const bar = ov.querySelector('.progress .bar'); 
    if(bar) bar.style.width = "0%"; 
  }
}
function hideOverlay(){
  const ov=document.getElementById('overlay'); if(ov) ov.classList.remove('show');
}

/* === 👥 Teilnehmer-Verwaltung === */
function createPersonUI(name, group, listId) {
  const listEl = document.getElementById(listId);
  if (!listEl) return;
  const div = document.createElement("div");
  div.className = "row";
  div.innerHTML = `<input type="text" value="${name}" placeholder="Name" style="flex:1"><button class="danger small">✖</button>`;
  const inp = div.querySelector("input");
  inp.oninput = () => {
    const A = [...document.getElementById("listA").querySelectorAll("input")].map(i=>i.value.trim()).filter(Boolean);
    const B = [...document.getElementById("listB").querySelectorAll("input")].map(i=>i.value.trim()).filter(Boolean);
    saveT({A, B});
  };
  div.querySelector("button").onclick = () => { div.remove(); inp.oninput(); };
  listEl.appendChild(div);
}

/* === 🚀 Haupt-Initialisierung === */
document.addEventListener("DOMContentLoaded", () => {
  
  /* --- 🌐 Navigation --- */
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

  /* --- 👥 Teilnehmer & Prefill --- */
  const listA = document.getElementById("listA"), listB = document.getElementById("listB");
  if(listA && listB) {
    const data = getT();
    data.A.forEach(n => createPersonUI(n, "A", "listA"));
    data.B.forEach(n => createPersonUI(n, "B", "listB"));

    document.getElementById("addA").onclick = () => createPersonUI("", "A", "listA");
    document.getElementById("addB").onclick = () => createPersonUI("", "B", "listB");

    const preBtn = document.getElementById("prefill");
    if(preBtn) {
        preBtn.onclick = () => {
          const A = ["Adrianna", "Alicia", "Aurora", "Elena", "Ella", "Laura", "Linda", "Marla", "Michelle", "Tiziana", "Tonia"];
          const B = ["Chris", "Ema", "Evi", "Jeronymo", "Jerry", "Julian.M", "Julian.S", "Luke", "Meji", "Noel"];
          listA.innerHTML = ""; listB.innerHTML = "";
          A.forEach(n => createPersonUI(n, "A", "listA"));
          B.forEach(n => createPersonUI(n, "B", "listB"));
          saveT({A, B});
          preBtn.textContent = "✅ Staffel 2026 geladen"; preBtn.disabled = true;
        };
    }
  }

  /* --- 💞 Matchbox --- */
  const tbA = document.getElementById("tbA"), tbB = document.getElementById("tbB"), tbList = document.getElementById("tbList");
  if(tbA && tbB) {
    const refreshMBOptions = () => {
      const {A, B} = getT();
      tbA.innerHTML = '<option value="">— A auswählen —</option>' + A.map(n=>`<option>${n}</option>`).join("");
      tbB.innerHTML = '<option value="">— B auswählen —</option>' + B.map(n=>`<option>${n}</option>`).join("");
    };
    const renderMB = () => {
      const mb = JSON.parse(localStorage.getItem("aytoMatchbox") || "[]");
      tbList.innerHTML = mb.length ? "" : "<div class='small muted'>Noch keine Einträge</div>";
      mb.forEach((m, i) => {
        const tag = m.type==="PM"?"good":m.type==="NM"?"bad":"neutral";
        const div = document.createElement("div"); div.className="row";
        div.innerHTML = `<div style="flex:1">${m.A} × ${m.B} <span class="tag ${tag}">${m.type}</span></div><button class="danger small">✖</button>`;
        div.querySelector("button").onclick = () => { mb.splice(i, 1); localStorage.setItem("aytoMatchbox", JSON.stringify(mb)); renderMB(); };
        tbList.appendChild(div);
      });
    };
    document.getElementById("addTB").onclick = () => {
      if(!tbA.value || !tbB.value) return alert("Bitte A und B wählen");
      const mb = JSON.parse(localStorage.getItem("aytoMatchbox") || "[]");
      mb.push({A: tbA.value, B: tbB.value, type: document.getElementById("tbType").value});
      localStorage.setItem("aytoMatchbox", JSON.stringify(mb));
      renderMB();
    };
    document.addEventListener("teilnehmerChanged", refreshMBOptions);
    refreshMBOptions(); renderMB();
  }

  /* --- 🌙 Matching Nights --- */
  const addNightBtn = document.getElementById("addNight"), nightsList = document.getElementById("nights");
  if(addNightBtn) {
    const renderNights = () => {
      const nights = JSON.parse(localStorage.getItem("aytoMatchingNights") || "[]");
      nightsList.innerHTML = nights.length ? "" : "<div class='small muted'>Keine Matching Night angelegt</div>";
      nights.forEach((n, i) => {
        const div = document.createElement("div"); div.className="card stack";
        div.innerHTML = `<div class="row" style="justify-content:space-between"><strong>Night ${i+1}</strong><button class="danger small">✖</button></div>
          <div class="small muted">Lichter: ${n.lights}</div>
          <table style="width:100%;font-size:12px">${n.pairs.map(p=>`<tr><td>${p.A}</td><td>×</td><td>${p.B === 'keine' ? '<i>Kein Partner</i>' : p.B}</td></tr>`).join("")}</table>`;
        div.querySelector("button").onclick = () => { nights.splice(i,1); localStorage.setItem("aytoMatchingNights", JSON.stringify(nights)); renderNights(); };
        nightsList.appendChild(div);
      });
    };

    addNightBtn.onclick = () => {
      const {A, B} = getT(); if(!A.length || !B.length) return alert("Teilnehmer fehlen!");
      const ov = document.createElement("div"); ov.style="position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:10000;display:flex;align-items:center;justify-content:center;padding:15px";
      const box = document.createElement("div"); box.className="card stack"; box.style="max-width:450px;width:100%;max-height:95vh;overflow-y:auto;background:#171a2b;padding:20px;border:1px solid #333";
      box.innerHTML = `<h3 style="margin-top:0">Matching Night</h3>`;
      const pairRows = [];
      const updateSelects = () => {
        const usedB = pairRows.map(r => r.sel.value).filter(v => v !== "keine");
        pairRows.forEach(row => {
          const current = row.sel.value;
          let html = `<option value="keine">Kein Partner</option>`;
          B.forEach(nameB => { if (!usedB.includes(nameB) || nameB === current) html += `<option value="${nameB}" ${nameB === current ? 'selected' : ''}>${nameB}</option>`; });
          row.sel.innerHTML = html;
        });
      };
      A.forEach(nameA => {
        const row = document.createElement("div"); row.style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;gap:10px";
        row.innerHTML = `<span style="font-size:14px;font-weight:bold;flex:1">${nameA}</span>`;
        const sel = document.createElement("select"); sel.style="flex:1.5;padding:8px";
        sel.onchange = updateSelects; row.appendChild(sel); box.appendChild(row);
        pairRows.push({A: nameA, sel});
      });
      updateSelects();
      const lRow = document.createElement("div"); lRow.className="row"; lRow.style="margin-top:15px;padding-top:15px;border-top:1px solid #333";
      const lightSelect = document.createElement("select"); lightSelect.style="width:100px;padding:8px";
      for(let i=0; i <= A.length; i++) lightSelect.innerHTML += `<option value="${i}">${i}</option>`;
      lRow.innerHTML = `<span>Lichter:</span>`; lRow.appendChild(lightSelect); box.appendChild(lRow);
      const btnRow = document.createElement("div"); btnRow.className="row"; btnRow.style="margin-top:20px";
      const sBtn = document.createElement("button"); sBtn.className="primary"; sBtn.style="flex:1"; sBtn.textContent="Speichern";
      const cBtn = document.createElement("button"); cBtn.className="ghost"; cBtn.style="flex:1"; cBtn.textContent="Abbrechen";
      btnRow.appendChild(sBtn); btnRow.appendChild(cBtn); box.appendChild(btnRow); ov.appendChild(box); document.body.appendChild(ov);
      cBtn.onclick = () => ov.remove();
      sBtn.onclick = () => {
        const pairs = pairRows.map(r=>({A: r.A, B: r.sel.value}));
        const nights = JSON.parse(localStorage.getItem("aytoMatchingNights") || "[]");
        nights.push({pairs, lights: parseInt(lightSelect.value)});
        localStorage.setItem("aytoMatchingNights", JSON.stringify(nights));
        ov.remove(); renderNights();
      };
    };
    renderNights();
  }

  /* --- 💾 Daten-Sicherung (Export, Import & Reset) --- */
  const exportBtn = document.getElementById("exportBtn");
  const importBtn = document.getElementById("importBtn");
  const importFile = document.getElementById("importFile");
  const resetBtn = document.getElementById("resetBtn");

  if (exportBtn) {
    exportBtn.onclick = () => {
      const data = {
        teilnehmer: getT(),
        matchbox: JSON.parse(localStorage.getItem("aytoMatchbox") || "[]"),
        nights: JSON.parse(localStorage.getItem("aytoMatchingNights") || "[]")
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `AYTO_Data_Export.json`;
      a.click();
      URL.revokeObjectURL(url);
    };
  }

  if (importBtn && importFile) {
    importBtn.onclick = () => importFile.click();
    importFile.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target.result);
          if (imported.teilnehmer) localStorage.setItem(STORAGE_KEY_T, JSON.stringify(imported.teilnehmer));
          if (imported.matchbox) localStorage.setItem("aytoMatchbox", JSON.stringify(imported.matchbox));
          if (imported.nights) localStorage.setItem("aytoMatchingNights", JSON.stringify(imported.nights));
          alert("Erfolgreich importiert!");
          location.reload();
        } catch (err) { alert("Import-Fehler!"); }
      };
      reader.readAsText(file);
    };
  }

  if (resetBtn) {
    resetBtn.onclick = () => {
      if (confirm("Wirklich alles löschen?")) {
        localStorage.clear();
        location.reload();
      }
    };
  }

  initSolver();

}); // Ende des DOMContentLoaded


/* === 📊 Solver für 11 Frauen & 10 Männer (Jede Frau kann Doppel-Match sein) === */
function initSolver() {
  const solveBtn = document.getElementById("solveBtn"), 
        summaryBox = document.getElementById("summary"), 
        matrixBox = document.getElementById("matrix");
  if(!solveBtn) return;

const workerCode = `
self.onmessage = function(e) {
  const { A, B, M, Nraw } = e.data;
  const idxA = Object.fromEntries(A.map((n,i)=>[n,i]));
  const idxB = Object.fromEntries(B.map((n,i)=>[n,i]));
  const m = A.length, n = B.length;

  // forced[a] = b wenn PM gesetzt
  const forced = Array(m).fill(-1);
  const forbidden = Array.from({length:m}, ()=>new Set());

  M.forEach(t => {
    if(!(t.A in idxA)) return;
    if(!(t.B in idxB)) return;
    const a = idxA[t.A], b = idxB[t.B];
    if(t.type === "PM") forced[a] = b;
    else if(t.type === "NM") forbidden[a].add(b);
    // alles andere (z.B. "SOLD") ignorieren
  });

  // Matching nights: bIdx = -1 wenn 'keine'
  const nights = (Nraw || []).map(nObj => ({
    pairs: (nObj.pairs || []).map(p => ({
      aIdx: (p.A in idxA) ? idxA[p.A] : -1,
      bIdx: (p.B === "keine") ? -1 : ((p.B in idxB) ? idxB[p.B] : -2)
    })),
    beams: Number(nObj.lights)
  }));

  // Wenn irgendwo ein unbekannter Mann-Name in einer Night steht => keine Lösung möglich
  for(const nt of nights){
    for(const pr of nt.pairs){
      if(pr.bIdx === -2) {
        self.postMessage({type:'result', total:'0', counts: Array.from({length:m},()=>Array(n).fill('0'))});
        return;
      }
    }
  }

  let total = 0n;
  let counts = Array.from({length:m},()=>Array(n).fill(0n));

  // assign[a] = b (genau ein Mann pro Frau)
  let assign = Array(m).fill(-1);

  // useCountB[b] = wie oft Mann verwendet wurde (0/1/2)
  let useCountB = new Array(n).fill(0);

  // Flag: wurde schon irgendein Mann 2x verwendet?
  let doubleManUsed = false;

  function dfs(aIdx){
    if(aIdx === m){
      // Bei 11F/10M muss genau ein Mann doppelt sein
      if(!doubleManUsed) return;

      // Matching Nights prüfen
      for(const nt of nights){
        let hits = 0;
        for(const pair of nt.pairs){
          if(pair.aIdx < 0) continue;         // unbekannte Frau ignorieren
          if(pair.bIdx < 0) continue;         // 'keine' => nie Treffer
          if(assign[pair.aIdx] === pair.bIdx) hits++;
        }
        if(hits !== nt.beams) return;
      }

      total++;
      for(let i=0;i<m;i++){
        const b = assign[i];
        if(b >= 0) counts[i][b]++;
      }
      return;
    }

    // Kandidaten-Männer für diese Frau
    const forceB = forced[aIdx];

    for(let b=0;b<n;b++){
      if(forbidden[aIdx].has(b)) continue;
      if(forceB !== -1 && forceB !== b) continue;

      // Regel: jeder Mann max 1x, außer genau EIN Mann darf 2x
      if(useCountB[b] >= 2) continue;
      if(useCountB[b] === 1 && doubleManUsed) continue; // zweites "Doppeln" verboten

      // setzen
      const prevDouble = doubleManUsed;
      useCountB[b]++;
      if(useCountB[b] === 2) doubleManUsed = true;

      assign[aIdx] = b;
      dfs(aIdx+1);

      // zurücksetzen
      assign[aIdx] = -1;
      if(useCountB[b] === 2) doubleManUsed = prevDouble; // vor dem Decrement war es 2
      useCountB[b]--;
    }
  }

  dfs(0);

  self.postMessage({
    type:'result',
    total: total.toString(),
    counts: counts.map(r=>r.map(c=>c.toString()))
  });
};
`;

  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(blob);

  solveBtn.onclick = () => {
    const {A, B} = getT(); if(A.length < 2) return alert("Daten unvollständig!");
    showOverlay();
    const worker = new Worker(workerUrl);
    worker.postMessage({A, B, M: JSON.parse(localStorage.getItem("aytoMatchbox")||"[]"), Nraw: JSON.parse(localStorage.getItem("aytoMatchingNights")||"[]")});
    
    worker.onmessage = (e) => {
      const total = BigInt(e.data.total);
      const counts = e.data.counts.map(r=>r.map(c=>BigInt(c)));
      summaryBox.innerHTML = "<h3>Ergebnis</h3><div>" + (total === 0n ? "Keine Kombination gefunden" : total.toString() + " Kombinationen") + "</div>";
      
      let html = '<div class="ayto-table-container"><table class="ayto-table"><tr><th></th>';
      B.forEach(nameB => { html += '<th>' + nameB + '</th>'; });
      html += '</tr>';
      
      A.forEach((nameA, i) => {
        html += '<tr><td class="a-name" style="position:sticky;left:0;background:#23283f;font-weight:bold;z-index:2">' + nameA + '</td>';
        B.forEach((nameB, j) => {
          const count = counts[i][j];
          const p = total > 0n ? Number((count * 10000n) / total) / 100 : 0;
          
          if (p >= 100) {
            html += '<td style="background:#ffd700;color:#000;font-weight:bold;text-align:center;">MATCH</td>';
          } else if (count === 0n) {
            html += '<td class="no-match" style="color:#444;font-size:10px;">No Match</td>';
          } else {
            const hue = 260 - (p * 2.5);
            html += '<td style="background:hsl(' + hue + ',70%,25%);color:white;text-align:center;font-size:11px;">' + p.toFixed(2) + '%</td>';
          }
        });
        html += '</tr>';
      });
      matrixBox.innerHTML = html + "</table></div>";
      matrixBox.style.display = "block";
      hideOverlay();
      worker.terminate();
    };
  };/* === 💾 Daten-Sicherung (Export & Import) === */
document.addEventListener("DOMContentLoaded", () => {
  const exportBtn = document.getElementById("exportBtn");
  const importBtn = document.getElementById("importBtn");
  const importFile = document.getElementById("importFile");
  const resetBtn = document.getElementById("resetBtn");

  // EXPORT: Erstellt eine JSON-Datei aus allen LocalStorage-Daten
  if (exportBtn) {
    exportBtn.onclick = () => {
      const data = {
        teilnehmer: JSON.parse(localStorage.getItem("aytoTeilnehmer") || '{"A":[], "B":[]}'),
        matchbox: JSON.parse(localStorage.getItem("aytoMatchbox") || "[]"),
        nights: JSON.parse(localStorage.getItem("aytoMatchingNights") || "[]")
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      
      const timestamp = new Date().toLocaleDateString('de-DE').replace(/\./g, '-');
      a.href = url;
      a.download = `AYTO_Backup_${timestamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
    };
  }

  // IMPORT: Öffnet den Datei-Dialog
  if (importBtn && importFile) {
    importBtn.onclick = () => importFile.click();

    importFile.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          
          // Daten in den LocalStorage schreiben
          if (imported.teilnehmer) localStorage.setItem("aytoTeilnehmer", JSON.stringify(imported.teilnehmer));
          if (imported.matchbox) localStorage.setItem("aytoMatchbox", JSON.stringify(imported.matchbox));
          if (imported.nights) localStorage.setItem("aytoMatchingNights", JSON.stringify(imported.nights));
          
          alert("Daten erfolgreich importiert!");
          location.reload(); // Seite neu laden, um Daten anzuzeigen
        } catch (err) {
          alert("Fehler: Ungültige Datei-Format.");
          console.error(err);
        }
      };
      reader.readAsText(file);
    };
  }

  // RESET: Alles löschen
  if (resetBtn) {
    resetBtn.onclick = () => {
      if (confirm("Möchtest du wirklich ALLE Daten (Teilnehmer, Nächte, Matchbox) löschen?")) {
        localStorage.clear();
        location.reload();
      }
    };
  }
});
