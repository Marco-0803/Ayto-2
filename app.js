/* === 🔄 Auto-Update & Cache-Reset === */
(function(){
  try {
    const meta = document.querySelector('meta[name="app-version"]');
    const version = meta ? meta.content : null;
    const last = localStorage.getItem('aytoAppVersion');
    if (version && version !== last) {
      localStorage.clear();
      localStorage.setItem('aytoAppVersion', version);
      location.reload(true);
    }
  } catch (e) {}
})();

/* === 🌐 Navigation === */
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.getElementById('nav');
  const pages = document.querySelectorAll('.page');
  if(nav) {
    nav.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if(!btn) return;
      document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const id = btn.getAttribute('data-target');
      pages.forEach(p => p.classList.toggle('active', p.id === id));
      if(id === 'page-matchbox') updateMatchboxDropdowns();
      if(id === 'page-nights') renderNightsList();
    });
  }
});

function showOverlay() { 
  const ov = document.getElementById('overlay');
  if(ov) {
    ov.classList.add('show');
    const bar = ov.querySelector('.bar');
    if(bar) bar.style.width = "0%";
  }
}
function hideOverlay() { document.getElementById('overlay')?.classList.remove('show'); }

/* === 👥 Teilnehmer === */
function createPerson(name, group) {
  const container = document.getElementById(group === "A" ? "listA" : "listB");
  if(!container) return;
  const div = document.createElement("div");
  div.className = "row";
  div.style.marginBottom = "8px";
  div.innerHTML = `<input type="text" value="${name}" style="flex:1; padding:8px;"><button class="danger small" style="margin-left:5px">✖</button>`;
  div.querySelector("input").oninput = saveTeilnehmer;
  div.querySelector("button").onclick = () => { div.remove(); saveTeilnehmer(); };
  container.appendChild(div);
  saveTeilnehmer();
}

function saveTeilnehmer() {
  const A = [...document.querySelectorAll("#listA input")].map(i => i.value.trim()).filter(Boolean);
  const B = [...document.querySelectorAll("#listB input")].map(i => i.value.trim()).filter(Boolean);
  localStorage.setItem("aytoTeilnehmer", JSON.stringify({ A, B }));
}

document.getElementById("addA")?.addEventListener("click", () => createPerson("", "A"));
document.getElementById("addB")?.addEventListener("click", () => createPerson("", "B"));

/* === 💞 Matchbox === */
function updateMatchboxDropdowns() {
  const { A, B } = JSON.parse(localStorage.getItem("aytoTeilnehmer") || '{"A":[],"B":[]}');
  const selA = document.getElementById("tbA"), selB = document.getElementById("tbB");
  if(!selA || !selB) return;
  selA.innerHTML = '<option value="">-- Frau --</option>' + A.map(n => `<option>${n}</option>`).join("");
  selB.innerHTML = '<option value="">-- Mann --</option>' + B.map(n => `<option>${n}</option>`).join("");
}

document.getElementById("addTB")?.addEventListener("click", () => {
  const a = document.getElementById("tbA").value, b = document.getElementById("tbB").value, t = document.getElementById("tbType").value;
  if(!a || !b) return;
  const list = JSON.parse(localStorage.getItem("aytoMatchbox") || '[]');
  list.push({ A: a, B: b, type: t });
  localStorage.setItem("aytoMatchbox", JSON.stringify(list));
  renderTBList();
});

function renderTBList() {
  const container = document.getElementById("tbList");
  if(!container) return;
  const list = JSON.parse(localStorage.getItem("aytoMatchbox") || '[]');
  container.innerHTML = list.map((m, i) => `
    <div class="row card" style="margin-bottom:8px; align-items:center; justify-content:space-between">
      <span>${m.A} × ${m.B}</span>
      <div class="row" style="gap:10px">
        <span class="tag ${m.type === 'PM' ? 'good' : 'bad'}">${m.type}</span>
        <button onclick="removeTB(${i})" class="danger small">✖</button>
      </div>
    </div>
  `).join("");
}
window.removeTB = (i) => {
  const list = JSON.parse(localStorage.getItem("aytoMatchbox") || '[]');
  list.splice(i, 1);
  localStorage.setItem("aytoMatchbox", JSON.stringify(list));
  renderTBList();
};

/* === 🌙 Matching Night === */
document.getElementById("addNight")?.addEventListener("click", () => {
  const { A, B } = JSON.parse(localStorage.getItem("aytoTeilnehmer") || '{"A":[],"B":[]}');
  const nightContainer = document.getElementById("nights");
  const div = document.createElement("div");
  div.className = "card stack night-entry";
  let pairsHTML = A.map(nameA => `
    <div class="row" style="margin-bottom:8px; justify-content:space-between; align-items:center">
      <label style="font-size:12px">${nameA}</label>
      <select class="pair-sel" data-a="${nameA}" style="width:60%">
        <option value="NONE">-- Partner --</option>
        ${B.map(n => `<option value="${n}">${n}</option>`).join("")}
      </select>
    </div>
  `).join("");
  div.innerHTML = `<h4>Neue Night</h4>${pairsHTML}<div class="row" style="margin-top:10px">Lichter: <input type="number" class="beam-count" value="0" style="width:50px; margin-left:10px"></div>
    <button class="primary small save-night-btn" style="width:100%; margin-top:10px">Speichern</button>`;
  div.querySelector(".save-night-btn").onclick = () => {
    const pairs = [...div.querySelectorAll(".pair-sel")].map(sel => ({ A: sel.dataset.a, B: sel.value })).filter(p => p.B !== "NONE");
    const allNights = JSON.parse(localStorage.getItem("aytoNights") || '[]');
    allNights.push({ pairs, lights: parseInt(div.querySelector(".beam-count").value) });
    localStorage.setItem("aytoNights", JSON.stringify(allNights));
    renderNightsList();
  };
  nightContainer.prepend(div);
});

function renderNightsList() {
  const container = document.getElementById("nights");
  if(!container) return;
  const list = JSON.parse(localStorage.getItem("aytoNights") || '[]');
  container.innerHTML = list.map((n, i) => `<div class="card row" style="justify-content:space-between"><span>Night ${i+1}: ${n.lights} Beams</span> <button onclick="removeNight(${i})" class="danger small">✖</button></div>`).join("");
}
window.removeNight = (i) => {
  const list = JSON.parse(localStorage.getItem("aytoNights") || '[]');
  list.splice(i, 1);
  localStorage.setItem("aytoNights", JSON.stringify(list));
  renderNightsList();
};

/* === 🧠 Solver Worker === */
const workerCode = `
self.onmessage = function(e) {
  const { A, B, m, n, NONE_VAL, forced, forbidden, nights } = e.data;
  const noneQuota = Math.max(0, m - n);
  let total = 0n;
  const counts = Array.from({length: m}, () => Array(n).fill(0n));
  const assign = Array(m).fill(-1);
  const usedWoman = new Array(n).fill(false);
  let usedNone = 0;

  function prune() {
    for (const nt of nights) {
      let fixed = 0, could = 0;
      for (let i = 0; i < m; i++) {
        const want = nt.map[i], a = assign[i];
        if (a !== -1) { if (a !== NONE_VAL && a === want) fixed++; } 
        else { if (want !== NONE_VAL && !usedWoman[want] && !forbidden[i].includes(want)) could++; }
      }
      if (nt.beams < fixed || nt.beams > (fixed + could)) return false;
    }
    return true;
  }

  function dfs(pos) {
    if (pos === m) {
        total++;
        for (let i = 0; i < m; i++) { if (assign[i] !== NONE_VAL) counts[i][assign[i]]++; }
        return;
    }
    const possible = (forced[pos] !== -1) ? [forced[pos]] : [...Array(n).keys()].filter(j => !forbidden[pos].includes(j));
    if (forced[pos] === -1 && noneQuota > 0) possible.push(NONE_VAL);

    for (const j of possible) {
      if (j === NONE_VAL) {
        if (usedNone < noneQuota) {
          assign[pos] = NONE_VAL; usedNone++;
          if (prune()) dfs(pos + 1);
          usedNone--; assign[pos] = -1;
        }
      } else if (!usedWoman[j]) {
        assign[pos] = j; usedWoman[j] = true;
        if (prune()) dfs(pos + 1);
        usedWoman[j] = false; assign[pos] = -1;
      }
    }
  }
  dfs(0);
  self.postMessage({ total: total.toString(), counts: counts });
};`;

/* === 🚀 Solve & Render === */
document.getElementById("solveBtn")?.addEventListener("click", () => {
  const dataA = JSON.parse(localStorage.getItem("aytoTeilnehmer") || '{"A":[],"B":[]}');
  const { A, B } = dataA;
  if (A.length < 2) return alert("Zuerst Teilnehmer anlegen!");

  showOverlay();
  const start = Date.now();
  const dataM = JSON.parse(localStorage.getItem("aytoMatchbox") || '[]');
  const dataN = JSON.parse(localStorage.getItem("aytoNights") || '[]');

  const worker = new Worker(URL.createObjectURL(new Blob([workerCode], {type: 'text/javascript'})));
  worker.postMessage({ 
    A, B, m: A.length, n: B.length, NONE_VAL: 99, 
    forced: A.map(name => {
        const m = dataM.find(x => x.A === name && x.type === "PM");
        return m ? B.indexOf(m.B) : -1;
    }),
    forbidden: A.map(name => dataM.filter(x => x.A === name && x.type === "NM").map(x => B.indexOf(x.B))),
    nights: dataN.map(n => ({ map: A.map(a => B.indexOf(n.pairs.find(p => p.A === a)?.B) ?? 99), beams: n.lights }))
  });

  worker.onmessage = (e) => {
    renderMatrix(BigInt(e.data.total), e.data.counts, A, B, Date.now() - start);
    hideOverlay();
    worker.terminate();
  };
});

function renderMatrix(total, counts, A, B, duration) {
  const container = document.getElementById("matrix");
  const summary = document.getElementById("summary");
  const matchboxData = JSON.parse(localStorage.getItem("aytoMatchbox") || '[]');

  // 1. Top 3 berechnen
  let matches = [];
  A.forEach((na, i) => B.forEach((nb, j) => {
    const p = Number((BigInt(counts[i][j]) * 10000n) / total) / 100;
    if(p > 0) matches.push({ a: na, b: nb, p });
  }));
  matches.sort((x, y) => y.p - x.p);
  const top3 = matches.slice(0, 3);

  // 2. Summary
  summary.innerHTML = `
    <div class="card" style="background:rgba(52,111,255,0.1); margin-bottom:15px">
      <div class="row" style="justify-content:space-between">
        <strong>${total.toString()} Kombinationen</strong>
        <span class="small muted">${duration}ms</span>
      </div>
    </div>
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:10px; margin-bottom:15px">
      ${top3.map((m, i) => `
        <div class="card" style="border-left: 4px solid ${m.p === 100 ? '#0fa' : '#346fff'}; margin:0">
          <div class="small muted">#${i+1} Match</div>
          <div style="font-weight:bold; font-size:13px">${m.a} & ${m.b}</div>
          <div style="color:${m.p === 100 ? '#0fa' : '#fff'}; font-weight:bold">${m.p.toFixed(1)}%</div>
        </div>
      `).join("")}
    </div>`;

  // 3. Matrix
  let tableHtml = `<div class="table-wrap" style="overflow-x:auto; -webkit-overflow-scrolling:touch;"><table class="ayto-table" id="matrixTable"><thead><tr><th style="position:sticky; left:0; z-index:5; background:#23263c">A\\B</th>${B.map((b, j) => `<th class="col-${j}">${b}</th>`).join("")}</tr></thead><tbody>`;
  
  A.forEach((na, i) => {
    tableHtml += `<tr class="row-${i}"><td class="name-cell" style="position:sticky; left:0; z-index:4; background:#1e213c; font-weight:bold">${na}</td>`;
    B.forEach((nb, j) => {
      const p = Number((BigInt(counts[i][j]) * 10000n) / total) / 100;
      
      // EXAKTE Prüfung auf Matchbox NO (NM)
      const isNoMatch = matchboxData.some(m => m.A === na && m.B === nb && m.type === "NM") || p === 0;
      
      const bg = isNoMatch ? "#2d2f3d" : `hsl(${Math.pow(p/100, 1.5)*120}, 65%, 25%)`;
      tableHtml += `<td class="cell col-${j}" data-col="${j}" style="background:${bg} !important; color:${isNoMatch ? '#666' : '#fff'}; min-width:80px">
        ${isNoMatch ? 'No Match' : p.toFixed(1)+'%'}
      </td>`;
    });
    tableHtml += "</tr>";
  });
  container.innerHTML = tableHtml + "</tbody></table></div>";

  // Highlighting
  document.getElementById("matrixTable").onclick = (e) => {
    const td = e.target.closest("td");
    if(!td) return;
    document.querySelectorAll(".highlight").forEach(el => el.classList.remove("highlight"));
    const r = td.parentElement.rowIndex - 1;
    const c = td.dataset.col;
    if(r >= 0) document.querySelector(`.row-${r}`).classList.add("highlight");
    if(c) document.querySelectorAll(`.col-${c}`).forEach(el => el.classList.add("highlight"));
  };
}

window.onload = () => {
  const saved = JSON.parse(localStorage.getItem("aytoTeilnehmer") || '{"A":[],"B":[]}');
  saved.A.forEach(n => createPerson(n, "A"));
  saved.B.forEach(n => createPerson(n, "B"));
  renderTBList();
  renderNightsList();
};
