/* === 🔄 Auto-Update & Versioning === */
(function(){
  try {
    const meta = document.querySelector('meta[name="app-version"]');
    const version = meta ? meta.content : null;
    const last = localStorage.getItem('aytoAppVersion');
    if (version && version !== last) {
      console.log(`🆕 Neue Version erkannt (${version})`);
      const preservedKeys = ["aytoAppVersion"];
      const keys = Object.keys(localStorage);
      for (const k of keys) { if (!preservedKeys.includes(k)) localStorage.removeItem(k); }
      localStorage.setItem('aytoAppVersion', version);
      if ('caches' in window) { caches.keys().then(keys => keys.forEach(k => caches.delete(k))); }
      const overlay = document.createElement("div");
      overlay.style = "position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);color:white;font-size:18px;z-index:99999";
      overlay.textContent = "🔄 App wird aktualisiert...";
      document.body.appendChild(overlay);
      setTimeout(() => location.reload(true), 1200);
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

/* === 👥 Teilnehmer-Verwaltung & Staffel 2026 === */
function initPrefill() {
  const prefillBtn = document.getElementById("prefill");
  const listA = document.getElementById("listA");
  const listB = document.getElementById("listB");
  if (!prefillBtn || !listA || !listB || prefillBtn.dataset.bound) return;
  prefillBtn.dataset.bound = "true";

  prefillBtn.addEventListener("click", () => {
    const A = ["Adrianna", "Alicia", "Aurora", "Elena", "Ella", "Laura", "Linda", "Marla", "Michelle", "Tiziana", "Tonia"];
    const B = ["Chris", "Ema", "Evi", "Jeronymo", "Jerry", "Julian.M", "Julian.S", "Luke", "Meji", "Noel"];
    listA.innerHTML = ""; listB.innerHTML = "";
    A.forEach(name => createPersonUI(name, "A"));
    B.forEach(name => createPersonUI(name, "B"));
    localStorage.setItem("aytoTeilnehmer", JSON.stringify({ A, B }));
    document.dispatchEvent(new Event("teilnehmerChanged"));
    prefillBtn.textContent = "✅ Staffel 2026 geladen";
    prefillBtn.disabled = true;
  });
}

function createPersonUI(name, group) {
  const list = document.getElementById(group === "A" ? "listA" : "listB");
  const div = document.createElement("div");
  div.className = "row";
  div.innerHTML = `<input type="text" value="${name}" style="flex:1"><button class="danger small">✖</button>`;
  div.querySelector("button").onclick = () => { div.remove(); document.dispatchEvent(new Event("teilnehmerChanged")); };
  div.querySelector("input").oninput = () => document.dispatchEvent(new Event("teilnehmerChanged"));
  list.appendChild(div);
}

document.addEventListener("DOMContentLoaded", () => {
  initPrefill();
  document.addEventListener("click", e => {
    if (e.target.closest("button[data-target='page-participants']")) setTimeout(initPrefill, 100);
  });
});

/* === 💞 Matchbox & Matching Nights === */
// (Hier folgen deine bestehenden Funktionen für Matchbox und Nights Logik...)
// Damit der Code kompakt bleibt, fokussieren wir uns auf den Solver-Umbau:

/* === 📊 Der neue Web-Worker Solver === */
window.addEventListener("DOMContentLoaded", () => {
  const solveBtn   = document.getElementById("solveBtn");
  const summaryBox = document.getElementById("summary");
  const matrixBox  = document.getElementById("matrix");
  
  if (!solveBtn) return;

  const get = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch { return d; } };

  // --- Worker Script als String ---
  const workerCode = `
    self.onmessage = function(e) {
      const { A, B, M, Nraw } = e.data;
      const idxA = Object.fromEntries(A.map((n,i)=>[n,i]));
      const idxB = Object.fromEntries(B.map((n,i)=>[n,i]));
      const m = A.length, n = B.length, NONE = n;
      const forced = Array(m).fill(-1);
      const forbidden = Array.from({length:m},()=>new Set());

      for (const t of M) {
        if (!(t.A in idxA)) continue;
        const ai = idxA[t.A];
        if (t.B in idxB) {
          const bj = idxB[t.B];
          if (t.type === "PM") forced[ai] = bj;
          else if (t.type === "NM") forbidden[ai].add(bj);
        }
      }

      const nights = Nraw.map(nObj => {
        const map = Array(m).fill(NONE);
        A.forEach((name, i) => {
          const p = (nObj.pairs || []).find(pair => pair.A === name);
          if (p && p.B in idxB) map[i] = idxB[p.B];
          else map[i] = NONE;
        });
        return { map, beams: parseInt(nObj.lights||0,10) };
      });

      const noneQuota = Math.max(0, m - n);
      const dom = Array.from({length:m}, (_,i) => {
        let s = new Set([...Array(n).keys()].filter(j => !forbidden[i].has(j)));
        if (noneQuota > 0) s.add(NONE);
        if (forced[i] !== -1) s = new Set([forced[i]]);
        return s;
      });

      const order = [...Array(m).keys()].sort((a,b) => dom[a].size - dom[b].size);
      const usedWoman = new Array(n).fill(false);
      let usedNone = 0, total = 0n, nodes = 0;
      const assign = Array(m).fill(-1);
      const counts = Array.from({length:m}, ()=>Array(n).fill(0n));

      function prune() {
        for (const nt of nights) {
          let fixed = 0, could = 0;
          for (let i=0; i<m; i++) {
            const want = nt.map[i], a = assign[i];
            if (a !== -1) { if (a !== NONE && a === want) fixed++; }
            else if (want !== NONE && !usedWoman[want] && dom[i].has(want)) could++;
          }
          if (nt.beams < fixed || nt.beams > (fixed+could)) return false;
        }
        return true;
      }

      function dfs(pos) {
        if (pos === m) {
          if (usedNone === noneQuota) {
            total++;
            for(let i=0; i<m; i++) { const j=assign[i]; if(j>=0 && j<n) counts[i][j]++; }
          }
          return;
        }
        const i = order[pos];
        for (const j of dom[i]) {
          nodes++;
          if ((nodes & 0xFFFF) === 0) self.postMessage({type:'progress', nodes});
          if (j === NONE) {
            if (usedNone < noneQuota) {
              assign[i]=NONE; usedNone++;
              if (prune()) dfs(pos+1);
              assign[i]=-1; usedNone--;
            }
          } else {
            if (!usedWoman[j]) {
              assign[i]=j; usedWoman[j]=true;
              if (prune()) dfs(pos+1);
              assign[i]=-1; usedWoman[j]=false;
            }
          }
        }
      }

      const t0 = performance.now();
      dfs(0);
      self.postMessage({
        type: 'result',
        total: total.toString(),
        counts: counts.map(r => r.map(c => c.toString())),
        duration: Math.round(performance.now() - t0)
      });
    };
  `;

  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(blob);

  solveBtn.onclick = () => {
    const participants = get("aytoTeilnehmer", { A: [], B: [] });
    if (participants.A.length < 2) return alert("Bitte Teilnehmer anlegen!");

    showOverlay();
    const ovTitle = document.querySelector(".overlay-title");
    if(ovTitle) ovTitle.textContent = "Berechne Kombinationen...";

    const worker = new Worker(workerUrl);
    worker.postMessage({
      A: participants.A,
      B: participants.B,
      M: get("aytoMatchbox", []),
      Nraw: get("aytoMatchingNights", [])
    });

    worker.onmessage = (e) => {
      if (e.data.type === 'progress') {
        const bar = document.querySelector(".progress .bar");
        if (bar) bar.style.width = Math.min(95, 5 + (Math.log10(e.data.nodes) * 10)) + "%";
      }
      if (e.data.type === 'result') {
        const total = BigInt(e.data.total);
        const counts = e.data.counts.map(r => r.map(c => BigInt(c)));
        renderTable(total, counts, e.data.duration, participants);
        hideOverlay();
        worker.terminate();
      }
    };
  };

  function renderTable(total, counts, duration, data) {
    summaryBox.innerHTML = `<h3>Ergebnis</h3><div>${total.toString()} Kombinationen (${duration}ms)</div>`;
    if (total === 0n) { matrixBox.innerHTML = "Keine Lösung gefunden."; return; }

    let html = `<div class="ayto-table-container"><table class="ayto-table"><tr><th>A\\B</th>${data.B.map(b=>`<th>${b}</th>`).join("")}</tr>`;
    data.A.forEach((nameA, i) => {
      html += `<tr><td style="position:sticky;left:0;background:#23283f;font-weight:bold">${nameA}</td>`;
      data.B.forEach((nameB, j) => {
        const p = Number((counts[i][j] * 10000n) / total) / 100;
        const bg = `hsl(${p * 1.2}, 70%, ${20 + p * 0.3}%)`;
        html += `<td style="background:${bg};color:white;text-align:center">${p.toFixed(2)}%</td>`;
      });
      html += "</tr>";
    });
    matrixBox.innerHTML = html + "</table></div>";
    matrixBox.style.display = "block";
  }
});
