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
  if(ov){ ov.classList.add('show'); const bar = ov.querySelector('.progress .bar'); if(bar) bar.style.width = "0%"; }
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

/* === 📊 Solver mit funktionierendem Prozent-Counter === */
function initSolver() {
  const solveBtn = document.getElementById("solveBtn"), 
        summaryBox = document.getElementById("summary"), 
        matrixBox = document.getElementById("matrix");
  if(!solveBtn) return;

  // Der Worker-Teil bleibt gleich...
  const workerCode = `
    self.onmessage = function(e) {
      const { A, B, M, Nraw } = e.data;
      const idxA = Object.fromEntries(A.map((n,i)=>[n,i])), idxB = Object.fromEntries(B.map((n,i)=>[n,i]));
      const m = A.length, n = B.length, NONE = n;
      const forced = Array(m).fill(-1), forbidden = Array.from({length:m},()=>new Set());
      M.forEach(t => { if(t.A in idxA && t.B in idxB) { if(t.type==="PM") forced[idxA[t.A]] = idxB[t.B]; else if(t.type==="NM") forbidden[idxA[t.A]].add(idxB[t.B]); } });
      const nights = Nraw.map(nObj => ({ map: A.map(name => { const p = nObj.pairs.find(pair => pair.A === name); return (p && p.B in idxB) ? idxB[p.B] : NONE; }), beams: nObj.lights }));
      const noneQuota = Math.max(0, m - n), dom = A.map((_,i) => { if(forced[i]!==-1) return new Set([forced[i]]); let s = new Set([...Array(n).keys()].filter(j => !forbidden[i].has(j))); if(noneQuota > 0) s.add(NONE); return s; });
      const order = [...Array(m).keys()].sort((a,b)=>dom[a].size-dom[b].size);
      const usedB = new Array(n).fill(false);
      let usedNone = 0, total = 0n, assign = Array(m).fill(-1), counts = Array.from({length:m},()=>Array(n).fill(0n));
      function prune() { for(const nt of nights) { let hits = 0, could = 0; for(let i=0; i<m; i++){ const target = nt.map[i], current = assign[i]; if(current !== -1) { if(current !== NONE && current === target) hits++; } else if(target !== NONE && !usedB[target] && dom[i].has(target)) could++; } if(nt.beams < hits || nt.beams > (hits + could)) return false; } return true; }
      function dfs(pos) { if(pos === m) { if (usedNone === noneQuota) { total++; for(let i=0; i<m; i++) { if(assign[i]<n) counts[i][assign[i]]++; } } return; } const i = order[pos]; for(const j of dom[i]) { if(j===NONE) { if(usedNone < noneQuota) { assign[i]=NONE; usedNone++; if(prune()) dfs(pos+1); assign[i]=-1; usedNone--; } } else { if(!usedB[j]) { assign[i]=j; usedB[j]=true; if(prune()) dfs(pos+1); assign[i]=-1; usedB[j]=false; } } } }
      dfs(0); self.postMessage({type:'result', total: total.toString(), counts: counts.map(r=>r.map(c=>c.toString()))});
    };
  `;

  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(blob);

  solveBtn.onclick = () => {
    const {A, B} = getT(); if(A.length < 2) return alert("Bitte Teilnehmer anlegen!");
    
    showOverlay(); // Das Overlay wird eingeblendet
    const textEl = document.getElementById('progress-text');
    const startTime = Date.now();
    let currentPercent = 0;

    // --- 🏃 NEU: Das Hochzählen der Prozente ---
    const progressInterval = setInterval(() => {
      if (currentPercent < 99) {
        currentPercent += 1; // Zählt hoch
        if (textEl) textEl.textContent = `Berechnung läuft... (${currentPercent}%)`;
      }
    }, 28); // 3000ms / 100 Schritte ≈ 30ms

    const worker = new Worker(workerUrl);
    worker.postMessage({A, B, M: JSON.parse(localStorage.getItem("aytoMatchbox")||"[]"), Nraw: JSON.parse(localStorage.getItem("aytoMatchingNights")||"[]")});
    
    worker.onmessage = (e) => {
      if(e.data.type === 'result') {
        const duration = Date.now() - startTime;
        const delay = Math.max(0, 3000 - duration); // Wir warten den Rest der 3 Sek ab

        setTimeout(() => {
          clearInterval(progressInterval); // Zähler stoppen
          if (textEl) textEl.textContent = `Berechnung läuft... (100%)`;

          const total = BigInt(e.data.total), counts = e.data.counts.map(r=>r.map(c=>BigInt(c)));
          summaryBox.innerHTML = `<h3>Ergebnis</h3><div>${total.toString()} gültige Kombinationen</div>`;
          
          let html = `<div class="ayto-table-container"><table class="ayto-table"><tr><th></th>${B.map(b=>`<th>${b}</th>`).join("")}</tr>`;
          A.forEach((na, i) => {
            html += `<tr><td class="a-name">${na}</td>`;
            B.forEach((nb, j) => {
              const p = total > 0n ? Number((counts[i][j]*10000n)/total) / 100 : 0;
              if (p === 0) html += `<td class="no-match">No Match</td>`;
              else html += `<td style="background:hsl(${260-(p*2)},70%,${20+p*0.3}%);color:white;">${p.toFixed(2)}%</td>`;
            });
            html += "</tr>";
          });
          matrixBox.innerHTML = html + "</table></div>"; 
          matrixBox.style.display="block";
          
          setTimeout(() => { hideOverlay(); worker.terminate(); }, 200);
        }, delay);
      }
    };
  };
}
);

/* === 📊 Web-Worker Solver mit flüssiger 3s Animation === */
function initSolver() {
  const solveBtn = document.getElementById("solveBtn"), 
        summaryBox = document.getElementById("summary"), 
        matrixBox = document.getElementById("matrix");
  if(!solveBtn) return;

  // Worker-Code bleibt gleich
  const workerCode = `
    self.onmessage = function(e) {
      const { A, B, M, Nraw } = e.data;
      const idxA = Object.fromEntries(A.map((n,i)=>[n,i])), idxB = Object.fromEntries(B.map((n,i)=>[n,i]));
      const m = A.length, n = B.length, NONE = n;
      const forced = Array(m).fill(-1), forbidden = Array.from({length:m},()=>new Set());
      M.forEach(t => { if(t.A in idxA && t.B in idxB) { if(t.type==="PM") forced[idxA[t.A]] = idxB[t.B]; else if(t.type==="NM") forbidden[idxA[t.A]].add(idxB[t.B]); } });
      const nights = Nraw.map(nObj => ({ map: A.map(name => { const p = nObj.pairs.find(pair => pair.A === name); return (p && p.B in idxB) ? idxB[p.B] : NONE; }), beams: nObj.lights }));
      const noneQuota = Math.max(0, m - n), dom = A.map((_,i) => { if(forced[i]!==-1) return new Set([forced[i]]); let s = new Set([...Array(n).keys()].filter(j => !forbidden[i].has(j))); if(noneQuota > 0) s.add(NONE); return s; });
      const order = [...Array(m).keys()].sort((a,b)=>dom[a].size-dom[b].size);
      const usedB = new Array(n).fill(false);
      let usedNone = 0, total = 0n, assign = Array(m).fill(-1), counts = Array.from({length:m},()=>Array(n).fill(0n));
      function prune() { for(const nt of nights) { let hits = 0, could = 0; for(let i=0; i<m; i++){ const target = nt.map[i], current = assign[i]; if(current !== -1) { if(current !== NONE && current === target) hits++; } else if(target !== NONE && !usedB[target] && dom[i].has(target)) could++; } if(nt.beams < hits || nt.beams > (hits + could)) return false; } return true; }
      function dfs(pos) { if(pos === m) { if (usedNone === noneQuota) { total++; for(let i=0; i<m; i++) { if(assign[i]<n) counts[i][assign[i]]++; } } return; } const i = order[pos]; for(const j of dom[i]) { if(j===NONE) { if(usedNone < noneQuota) { assign[i]=NONE; usedNone++; if(prune()) dfs(pos+1); assign[i]=-1; usedNone--; } } else { if(!usedB[j]) { assign[i]=j; usedB[j]=true; if(prune()) dfs(pos+1); assign[i]=-1; usedB[j]=false; } } } }
      dfs(0); self.postMessage({type:'result', total: total.toString(), counts: counts.map(r=>r.map(c=>c.toString()))});
    };
  `;

  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(blob);

  solveBtn.onclick = () => {
    const {A, B} = getT(); if(A.length < 2) return alert("Bitte Teilnehmer anlegen!");
    
    showOverlay();
    const ov = document.getElementById('overlay');
    const textEl = ov.querySelector('p') || ov.querySelector('div[style*="font-size"]'); 
    const startTime = Date.now();
    
    // --- 🏃 Animation für die Prozente (0 bis 100 in 3s) ---
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 2; // Erhöht den Wert schrittweise
      if (progress <= 99) {
        if(textEl) textEl.textContent = `Berechnung läuft... (${progress}%)`;
      }
    }, 50); // Alle 50ms ein Update

    const worker = new Worker(workerUrl);
    worker.postMessage({A, B, M: JSON.parse(localStorage.getItem("aytoMatchbox")||"[]"), Nraw: JSON.parse(localStorage.getItem("aytoMatchingNights")||"[]")});
    
    worker.onmessage = (e) => {
      if(e.data.type === 'result') {
        const duration = Date.now() - startTime;
        const delay = Math.max(0, 3000 - duration);

        setTimeout(() => {
          clearInterval(progressInterval); // Animation stoppen
          if(textEl) textEl.textContent = `Berechnung läuft... (100%)`;

          const total = BigInt(e.data.total), counts = e.data.counts.map(r=>r.map(c=>BigInt(c)));
          summaryBox.innerHTML = `<h3>Ergebnis</h3><div>${total.toString()} gültige Kombinationen</div>`;
          
          let html = `<div class="ayto-table-container"><table class="ayto-table"><tr><th></th>${B.map(b=>`<th>${b}</th>`).join("")}</tr>`;
          A.forEach((na, i) => {
            html += `<tr><td style="position:sticky;left:0;background:#23283f;font-weight:bold;z-index:2">${na}</td>`;
            B.forEach((nb, j) => {
              const p = total > 0n ? Number((counts[i][j]*10000n)/total) / 100 : 0;
              if (p === 0) html += `<td class="no-match">No Match</td>`;
              else html += `<td style="background:hsl(${260-(p*2)},70%,${20+p*0.3}%);color:white;text-align:center;font-size:11px;min-width:75px">${p.toFixed(2)}%</td>`;
            });
            html += "</tr>";
          });
          matrixBox.innerHTML = html + "</table></div>"; 
          matrixBox.style.display="block";
          
          setTimeout(() => { hideOverlay(); worker.terminate(); }, 200); // Ganz kurzer Moment bei 100% verweilen
        }, delay);
      }
    };
  };
}
