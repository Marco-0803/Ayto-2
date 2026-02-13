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

/* === 🌐 Navigation & UI Helper === */
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
      if(id === 'page-nights' || id === 'page-entscheidungen') {
        renderNightsList();
        renderTimeline();
      }
    });
  }
});

function showOverlay() { 
    const ov = document.getElementById('overlay');
    if(ov) {
        ov.classList.add('show');
        ov.querySelector('.bar').style.width = "0%";
    }
}
function hideOverlay() { document.getElementById('overlay')?.classList.remove('show'); }

/* === 👥 Teilnehmer-Verwaltung === */
function createPerson(name, group) {
  const container = document.getElementById(group === "A" ? "listA" : "listB");
  if(!container) return;
  const div = document.createElement("div");
  div.className = "row";
  div.innerHTML = `<input type="text" value="${name}" style="flex:1"><button class="danger small">✖</button>`;
  div.querySelector("input").oninput = saveTeilnehmer;
  div.querySelector("button").onclick = () => { div.remove(); saveTeilnehmer(); };
  container.appendChild(div);
  saveTeilnehmer();
}

function saveTeilnehmer() {
  const A = [...document.querySelectorAll("#listA input")].map(i => i.value.trim()).filter(Boolean);
  const B = [...document.querySelectorAll("#listB input")].map(i => i.value.trim()).filter(Boolean);
  localStorage.setItem("aytoTeilnehmer", JSON.stringify({ A, B }));
  updateMatchboxDropdowns();
}

document.getElementById("addA")?.addEventListener("click", () => createPerson("", "A"));
document.getElementById("addB")?.addEventListener("click", () => createPerson("", "B"));
document.getElementById("prefill")?.addEventListener("click", () => {
  const A = ["Adrianna","Alicia","Aurora","Elena","Ella","Laura","Linda","Marla","Michelle","Tiziana","Tonia"];
  const B = ["Chris","Ema","Evi","Jeronymo","Jerry","Julian.M","Julian.S","Luke","Meji","Noel"];
  document.getElementById("listA").innerHTML = "";
  document.getElementById("listB").innerHTML = "";
  A.forEach(n => createPerson(n, "A"));
  B.forEach(n => createPerson(n, "B"));
});

/* === 💞 Matchbox Logik === */
function updateMatchboxDropdowns() {
  const { A, B } = JSON.parse(localStorage.getItem("aytoTeilnehmer") || '{"A":[],"B":[]}');
  const selA = document.getElementById("tbA"), selB = document.getElementById("tbB");
  if(!selA || !selB) return;
  selA.innerHTML = '<option value="">-- A wählen --</option>' + A.map(n => `<option>${n}</option>`).join("");
  selB.innerHTML = '<option value="">-- B wählen --</option>' + B.map(n => `<option>${n}</option>`).join("");
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
    <div class="row card" style="margin-bottom:5px">
      <span style="flex:1">${m.A} × ${m.B}</span>
      <span class="tag ${m.type === 'PM' ? 'good' : 'bad'}">${m.type}</span>
      <button onclick="removeTB(${i})" class="danger small">✖</button>
    </div>
  `).join("");
}
window.removeTB = (i) => {
  const list = JSON.parse(localStorage.getItem("aytoMatchbox") || '[]');
  list.splice(i, 1);
  localStorage.setItem("aytoMatchbox", JSON.stringify(list));
  renderTBList();
};

/* === 🌙 Matching Night Logik === */
document.getElementById("addNight")?.addEventListener("click", () => {
  const { A, B } = JSON.parse(localStorage.getItem("aytoTeilnehmer") || '{"A":[],"B":[]}');
  const nightContainer = document.getElementById("nights");
  const div = document.createElement("div");
  div.className = "card stack night-entry";
  
  let pairsHTML = A.map(nameA => `
    <div class="row" style="margin-bottom:5px">
      <label style="flex:1">${nameA}</label>
      <select class="pair-sel" data-a="${nameA}" style="flex:1">
        <option value="NONE">-- Kein Partner --</option>
        ${B.map(n => `<option value="${n}">${n}</option>`).join("")}
      </select>
    </div>
  `).join("");

  div.innerHTML = `
    <h4>Neue Matching Night</h4>
    ${pairsHTML}
    <div class="row" style="margin-top:10px">
      <label>Beams:</label>
      <input type="number" class="beam-count" min="0" max="${A.length}" value="0">
    </div>
    <div class="row">
      <button class="primary small save-night-btn">Speichern</button>
      <button class="ghost small" onclick="this.closest('.night-entry').remove()">Abbrechen</button>
    </div>
  `;

  div.querySelector(".save-night-btn").onclick = () => {
    const pairs = [...div.querySelectorAll(".pair-sel")].map(sel => ({ A: sel.dataset.a, B: sel.value })).filter(p => p.B !== "NONE");
    const lights = div.querySelector(".beam-count").value;
    const allNights = JSON.parse(localStorage.getItem("aytoNights") || '[]');
    allNights.push({ pairs, lights: parseInt(lights) });
    localStorage.setItem("aytoNights", JSON.stringify(allNights));
    renderNightsList();
  };
  nightContainer.prepend(div);
});

function renderNightsList() {
  const container = document.getElementById("nights");
  if(!container) return;
  const list = JSON.parse(localStorage.getItem("aytoNights") || '[]');
  container.innerHTML = list.map((n, i) => `
    <div class="card stack" style="margin-bottom:10px">
      <div class="row"><strong>Night ${i+1}</strong> <span class="tag good">${n.lights} Beams</span> <button onclick="removeNight(${i})" class="danger small">✖</button></div>
      <div class="small muted">${n.pairs.map(p => `${p.A}×${p.B}`).join(", ")}</div>
    </div>
  `).join("");
}
window.removeNight = (i) => {
  const list = JSON.parse(localStorage.getItem("aytoNights") || '[]');
  list.splice(i, 1);
  localStorage.setItem("aytoNights", JSON.stringify(list));
  renderNightsList();
};

/* === 🕒 Timeline === */
function renderTimeline() {
    const box = document.getElementById("timelineBox");
    if(!box) return;
    const mbox = JSON.parse(localStorage.getItem("aytoMatchbox") || '[]');
    const nights = JSON.parse(localStorage.getItem("aytoNights") || '[]');
    box.innerHTML = "<h4>Verlauf</h4>";
    mbox.forEach((m, i) => box.innerHTML += `<div class="card small">MB ${i+1}: ${m.A} × ${m.B} (${m.type})</div>`);
    nights.forEach((n, i) => box.innerHTML += `<div class="card small">Night ${i+1}: ${n.lights} Beams</div>`);
}

/* === 🧠 Web Worker Solver === */
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
      if (usedNone === noneQuota) {
        for (const nt of nights) {
          let hits = 0;
          for (let i = 0; i < m; i++) { if (assign[i] !== NONE_VAL && assign[i] === nt.map[i]) hits++; }
          if (hits !== nt.beams) return false;
        }
        total++;
        for (let i = 0; i < m; i++) { if (assign[i] !== NONE_VAL) counts[i][assign[i]]++; }
      }
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

document.getElementById("solveBtn")?.addEventListener("click", () => {
  const dataA = JSON.parse(localStorage.getItem("aytoTeilnehmer") || '{"A":[],"B":[]}');
  const dataM = JSON.parse(localStorage.getItem("aytoMatchbox") || '[]');
  const dataN = JSON.parse(localStorage.getItem("aytoNights") || '[]');
  const { A, B } = dataA;
  if (A.length < 2) return alert("Teilnehmer fehlen!");

  showOverlay();
  const start = Date.now();
  const worker = new Worker(URL.createObjectURL(new Blob([workerCode], {type: 'text/javascript'})));
  
  worker.postMessage({ 
    A, B, m: A.length, n: B.length, NONE_VAL: 99, 
    forced: A.map((_, i) => {
        const match = dataM.find(m => m.A === A[i] && m.type === "PM");
        return match ? B.indexOf(match.B) : -1;
    }),
    forbidden: A.map((_, i) => dataM.filter(m => m.A === A[i] && m.type === "NO").map(m => B.indexOf(m.B))),
    nights: dataN.map(n => ({
        map: A.map(nameA => {
            const p = n.pairs.find(pair => pair.A === nameA);
            return p ? B.indexOf(p.B) : 99;
        }),
        beams: n.lights
    }))
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
  summary.innerHTML = `<div class="card stack"><h3>${total.toString()} Kombinationen (${duration}ms)</h3><button id="pngExport" class="primary small">📸 PNG Export</button></div>`;
  
  if (total === 0n) return container.innerHTML = "<div class='card bad'>Keine Lösung möglich!</div>";

  let html = `<div class="table-wrap"><table class="ayto-table" id="matrixTable"><thead><tr><th>A\\B</th>${B.map((b, j) => `<th class="col-${j}">${b}</th>`).join("")}</tr></thead><tbody>`;
  
  A.forEach((na, i) => {
    html += `<tr class="row-${i}"><td class="name-cell"><strong>${na}</strong></td>`;
    B.forEach((nb, j) => {
      const p = Number((BigInt(counts[i][j]) * 10000n) / total) / 100;
      const isNoMatch = p === 0;
      const bg = isNoMatch ? "#2d2f3d" : `hsl(${Math.pow(p/100, 1.5)*120}, 65%, 25%)`;
      html += `<td class="cell col-${j}" data-row="${i}" data-col="${j}" style="background:${bg}; color:${isNoMatch ? '#888' : '#fff'}; text-align:center; cursor:pointer;">${isNoMatch ? 'No Match' : p.toFixed(1)+'%'}</td>`;
    });
    html += "</tr>";
  });
  container.innerHTML = html + "</tbody></table></div>";

  // Interaktive Klick-Logik
  const table = document.getElementById("matrixTable");
  table.addEventListener("click", (e) => {
    const td = e.target.closest("td");
    if (!td) return;
    const rowIdx = td.parentElement.rowIndex - 1; 
    const colIdx = td.classList.contains("cell") ? td.dataset.col : -1;

    document.querySelectorAll(".ayto-table tr, .ayto-table td, .ayto-table th").forEach(el => el.classList.remove("highlight"));
    
    if (rowIdx >= 0) document.querySelector(`.row-${rowIdx}`)?.classList.add("highlight");
    if (colIdx >= 0) document.querySelectorAll(`.col-${colIdx}`).forEach(el => el.classList.add("highlight"));
  });

  document.getElementById("pngExport").onclick = () => {
    html2canvas(document.getElementById("page-ergebnisse"), { backgroundColor: "#191b2d", scale: 2 }).then(canvas => {
      const link = document.createElement("a");
      link.download = `AYTO-Export.png`;
      link.href = canvas.toDataURL();
      link.click();
    });
  };
}

/* === Import / Export / Reset === */
document.getElementById("exportBtn")?.addEventListener("click", () => {
    const data = { t: localStorage.getItem("aytoTeilnehmer"), m: localStorage.getItem("aytoMatchbox"), n: localStorage.getItem("aytoNights") };
    const blob = new Blob([JSON.stringify(data)], {type: "application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ayto_backup.json";
    a.click();
});
document.getElementById("resetBtn")?.addEventListener("click", () => { if(confirm("Löschen?")) { localStorage.clear(); location.reload(); }});

window.onload = () => {
  const saved = JSON.parse(localStorage.getItem("aytoTeilnehmer") || '{"A":[],"B":[]}');
  saved.A.forEach(n => createPerson(n, "A"));
  saved.B.forEach(n => createPerson(n, "B"));
  updateMatchboxDropdowns();
  renderTBList();
  renderNightsList();
};
