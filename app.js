/* === 🔄 Auto-Update & Versioning === */
(function(){
  try {
    const meta = document.querySelector('meta[name="app-version"]');
    const version = meta ? meta.content : null;
    const last = localStorage.getItem('aytoAppVersion');
    if (version && version !== last) {
      const preservedKeys = ["aytoAppVersion"];
      const keys = Object.keys(localStorage);
      for (const k of keys) { if (!preservedKeys.includes(k)) localStorage.removeItem(k); }
      localStorage.setItem('aytoAppVersion', version);
      if ('caches' in window) { caches.keys().then(keys => keys.forEach(k => caches.delete(k))); }
      location.reload(true);
    }
  } catch (e) { console.warn("Fehler beim Auto-Update:", e); }
})();

/* === 🌐 Navigation & Overlay === */
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
  if(ov){ ov.classList.add('show'); const bar = ov.querySelector('.progress .bar'); if(bar) bar.style.width = "0%"; }
}
function hideOverlay(){
  const ov=document.getElementById('overlay'); if(ov) ov.classList.remove('show');
}

/* === 👥 Teilnehmer-Verwaltung === */
const STORAGE_KEY_T = "aytoTeilnehmer";
function getT() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY_T)) || {A:[], B:[]}; } catch(e) { return {A:[], B:[]}; } }
function saveT(data) { localStorage.setItem(STORAGE_KEY_T, JSON.stringify(data)); document.dispatchEvent(new Event("teilnehmerChanged")); }

function createPersonUI(name, group, listEl) {
  const div = document.createElement("div");
  div.className = "row";
  div.innerHTML = `<input type="text" value="${name}" style="flex:1"><button class="danger small">✖</button>`;
  const inp = div.querySelector("input");
  inp.oninput = () => {
    const A = [...document.getElementById("listA").querySelectorAll("input")].map(i=>i.value.trim()).filter(Boolean);
    const B = [...document.getElementById("listB").querySelectorAll("input")].map(i=>i.value.trim()).filter(Boolean);
    saveT({A, B});
  };
  div.querySelector("button").onclick = () => { div.remove(); inp.oninput(); };
  listEl.appendChild(div);
}

document.addEventListener("DOMContentLoaded", () => {
  const listA = document.getElementById("listA"), listB = document.getElementById("listB");
  const addA = document.getElementById("addA"), addB = document.getElementById("addB"), preBtn = document.getElementById("prefill");
  if(!listA) return;

  const data = getT();
  data.A.forEach(n => createPersonUI(n, "A", listA));
  data.B.forEach(n => createPersonUI(n, "B", listB));

  addA.onclick = () => createPersonUI("", "A", listA);
  addB.onclick = () => createPersonUI("", "B", listB);

  preBtn.onclick = () => {
    const A = ["Adrianna", "Alicia", "Aurora", "Elena", "Ella", "Laura", "Linda", "Marla", "Michelle", "Tiziana", "Tonia"];
    const B = ["Chris", "Ema", "Evi", "Jeronymo", "Jerry", "Julian.M", "Julian.S", "Luke", "Meji", "Noel"];
    listA.innerHTML = ""; listB.innerHTML = "";
    A.forEach(n => createPersonUI(n, "A", listA));
    B.forEach(n => createPersonUI(n, "B", listB));
    saveT({A, B});
    preBtn.textContent = "✅ Staffel 2026 geladen"; preBtn.disabled = true;
  };
});

/* === 💞 Matchbox === */
document.addEventListener("DOMContentLoaded", () => {
  const tbA = document.getElementById("tbA"), tbB = document.getElementById("tbB"), tbType = document.getElementById("tbType"), 
        tbAdd = document.getElementById("addTB"), tbList = document.getElementById("tbList");
  if(!tbA) return;

  function refreshDropdowns() {
    const {A, B} = getT();
    tbA.innerHTML = '<option value="">— A auswählen —</option>' + A.map(n=>`<option>${n}</option>`).join("");
    tbB.innerHTML = '<option value="">— B auswählen —</option>' + B.map(n=>`<option>${n}</option>`).join("");
  }

  function renderMB() {
    const mb = JSON.parse(localStorage.getItem("aytoMatchbox") || "[]");
    tbList.innerHTML = mb.length ? "" : "<div class='small muted'>Noch keine Einträge</div>";
    mb.forEach((m, i) => {
      const tag = m.type==="PM"?"good":m.type==="NM"?"bad":"neutral";
      const div = document.createElement("div"); div.className="row";
      div.innerHTML = `<div style="flex:1">${m.A} × ${m.B} <span class="tag ${tag}">${m.type}</span></div><button class="danger small">✖</button>`;
      div.querySelector("button").onclick = () => { mb.splice(i, 1); localStorage.setItem("aytoMatchbox", JSON.stringify(mb)); renderMB(); };
      tbList.appendChild(div);
    });
  }

  tbAdd.onclick = () => {
    if(!tbA.value || !tbB.value) return alert("Bitte A und B wählen");
    const mb = JSON.parse(localStorage.getItem("aytoMatchbox") || "[]");
    mb.push({A: tbA.value, B: tbB.value, type: tbType.value});
    localStorage.setItem("aytoMatchbox", JSON.stringify(mb));
    renderMB();
  };

  document.addEventListener("teilnehmerChanged", refreshDropdowns);
  refreshDropdowns(); renderMB();
});

/* === 🌙 Matching Nights === */
document.addEventListener("DOMContentLoaded", () => {
  const addNightBtn = document.getElementById("addNight"), nightsList = document.getElementById("nights");
  if(!nightsList) return;

  function renderNights() {
    const nights = JSON.parse(localStorage.getItem("aytoMatchingNights") || "[]");
    nightsList.innerHTML = nights.length ? "" : "<div class='small muted'>Keine Matching Night angelegt</div>";
    nights.forEach((n, i) => {
      const div = document.createElement("div"); div.className="card stack";
      div.innerHTML = `<div class="row" style="justify-content:space-between"><strong>Night ${i+1}</strong><button class="danger small">✖</button></div>
        <div class="small muted">Lichter: ${n.lights}</div>
        <table style="width:100%;font-size:12px">${n.pairs.map(p=>`<tr><td>${p.A}</td><td>×</td><td>${p.B}</td></tr>`).join("")}</table>`;
      div.querySelector("button").onclick = () => { nights.splice(i,1); localStorage.setItem("aytoMatchingNights", JSON.stringify(nights)); renderNights(); };
      nightsList.appendChild(div);
    });
  }

  addNightBtn.onclick = () => {
    const {A, B} = getT(); if(!A.length || !B.length) return alert("Teilnehmer fehlen!");
    const ov = document.createElement("div"); ov.style="position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px";
    const box = document.createElement("div"); box.className="card stack"; box.style="max-width:400px;width:100%;max-height:90vh;overflow-y:auto;background:#171a2b";
    box.innerHTML = `<h3>Matching Night</h3>`;
    
    const selects = A.map(name => {
      const row = document.createElement("div"); row.className="row"; row.style="margin-bottom:8px";
      row.innerHTML = `<span style="flex:1">${name}</span>`;
      const sel = document.createElement("select"); sel.style="flex:1";
      sel.innerHTML = `<option value="keine">— Partner —</option>` + B.map(bn=>`<option value="${bn}">${bn}</option>`).join("");
      row.appendChild(sel); box.appendChild(row); return {A: name, sel};
    });

    const lRow = document.createElement("div"); lRow.className="row";
    lRow.innerHTML = `<span>Lichter:</span><input type="number" value="0" min="0" max="${A.length}" style="width:60px">`;
    box.appendChild(lRow);

    const sBtn = document.createElement("button"); sBtn.className="primary"; sBtn.textContent="Speichern";
    const cBtn = document.createElement("button"); cBtn.className="ghost"; cBtn.textContent="Abbrechen";
    box.appendChild(sBtn); box.appendChild(cBtn); ov.appendChild(box); document.body.appendChild(ov);

    cBtn.onclick = () => ov.remove();
    sBtn.onclick = () => {
      const pairs = selects.map(s=>({A: s.A, B: s.sel.value})).filter(p=>p.B!=="keine");
      const nights = JSON.parse(localStorage.getItem("aytoMatchingNights") || "[]");
      nights.push({pairs, lights: parseInt(lRow.querySelector("input").value)});
      localStorage.setItem("aytoMatchingNights", JSON.stringify(nights));
      ov.remove(); renderNights();
    };
  };
  renderNights();
});

/* === 📊 Web-Worker Solver (Vollständig) === */
window.addEventListener("DOMContentLoaded", () => {
  const solveBtn = document.getElementById("solveBtn"), summaryBox = document.getElementById("summary"), matrixBox = document.getElementById("matrix");
  if(!solveBtn) return;

  const workerCode = `
    self.onmessage = function(e) {
      const { A, B, M, Nraw } = e.data;
      const idxA = Object.fromEntries(A.map((n,i)=>[n,i])), idxB = Object.fromEntries(B.map((n,i)=>[n,i]));
      const m = A.length, n = B.length, NONE = n;
      const forced = Array(m).fill(-1), forbidden = Array.from({length:m},()=>new Set());

      M.forEach(t => {
        if(t.A in idxA && t.B in idxB) {
          if(t.type==="PM") forced[idxA[t.A]] = idxB[t.B];
          else if(t.type==="NM") forbidden[idxA[t.A]].add(idxB[t.B]);
        }
      });

      const nights = Nraw.map(nObj => ({
        map: A.map(name => {
          const p = nObj.pairs.find(pair => pair.A === name);
          return (p && p.B in idxB) ? idxB[p.B] : NONE;
        }),
        beams: nObj.lights
      }));

      const noneQuota = Math.max(0, m - n);
      const dom = A.map((_,i) => {
        if(forced[i]!==-1) return new Set([forced[i]]);
        let s = new Set([...Array(n).keys()].filter(j => !forbidden[i].has(j)));
        if(noneQuota > 0) s.add(NONE);
        return s;
      });

      const order = [...Array(m).keys()].sort((a,b)=>dom[a].size-dom[b].size);
      const usedB = new Array(n).fill(false);
      let usedNone = 0, total = 0n, nodes = 0, assign = Array(m).fill(-1), counts = Array.from({length:m},()=>Array(n).fill(0n));

      function prune() {
        for(const nt of nights) {
          let fixed = 0, could = 0;
          for(let i=0; i<m; i++){
            const w = nt.map[i], a = assign[i];
            if(a!==-1) { if(a!==NONE && a===w) fixed++; }
            else if(w!==NONE && !usedB[w] && dom[i].has(w)) could++;
          }
          if(nt.beams < fixed || nt.beams > (fixed+could)) return false;
        }
        return true;
      }

      function dfs(pos) {
        if(pos === m) {
          total++;
          for(let i=0; i<m; i++) { if(assign[i]<n) counts[i][assign[i]]++; }
          return;
        }
        const i = order[pos];
        for(const j of dom[i]) {
          nodes++; if((nodes & 0xFFFF) === 0) self.postMessage({type:'progress', nodes});
          if(j===NONE) { if(usedNone < noneQuota) { assign[i]=NONE; usedNone++; if(prune()) dfs(pos+1); assign[i]=-1; usedNone--; } }
          else { if(!usedB[j]) { assign[i]=j; usedB[j]=true; if(prune()) dfs(pos+1); assign[i]=-1; usedB[j]=false; } }
        }
      }
      dfs(0);
      self.postMessage({type:'result', total: total.toString(), counts: counts.map(r=>r.map(c=>c.toString())), duration: 0});
    };
  `;

  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(blob);

  solveBtn.onclick = () => {
    const {A, B} = getT(); if(A.length < 2) return alert("Teilnehmer fehlen!");
    showOverlay();
    const worker = new Worker(workerUrl);
    worker.postMessage({A, B, M: JSON.parse(localStorage.getItem("aytoMatchbox")||"[]"), Nraw: JSON.parse(localStorage.getItem("aytoMatchingNights")||"[]")});
    worker.onmessage = (e) => {
      if(e.data.type === 'result') {
        const total = BigInt(e.data.total), counts = e.data.counts.map(r=>r.map(c=>BigInt(c)));
        summaryBox.innerHTML = `<h3>Ergebnis</h3><div>${total.toString()} Kombinationen</div>`;
        let html = `<div class="ayto-table-container"><table class="ayto-table"><tr><th></th>${B.map(b=>`<th>${b}</th>`).join("")}</tr>`;
        A.forEach((na, i) => {
          html += `<tr><td>${na}</td>`;
          B.forEach((nb, j) => {
            const p = total > 0n ? Number((counts[i][j]*10000n)/total)/100 : 0;
            html += `<td style="background:hsl(${p*1.2},70%,30%);color:white">${p.toFixed(2)}%</td>`;
          });
          html += "</tr>";
        });
        matrixBox.innerHTML = html + "</table></div>"; matrixBox.style.display="block";
        hideOverlay(); worker.terminate();
      }
    };
  };
});
