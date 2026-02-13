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

/* === 💞 Matchbox === */
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

/* === 🌙 Matching Night === */
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
  div.innerHTML = `<h4>Neue Night</h4>${pairsHTML}<div class="row">Lichter: <input type="number" class="beam-count" value="0"></div>
    <button class="primary small save-night-btn">Speichern</button>`;
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
  container.innerHTML = list.map((n, i) => `<div class="card">Night ${i+1}: ${n.lights} Beams <button onclick="removeNight(${i})" class="danger small">✖</button></div>`).join("");
}
window.removeNight = (i) => {
  const list = JSON.parse(localStorage.getItem("aytoNights") || '[]');
  list.splice(i, 1);
  localStorage.setItem("aytoNights", JSON.stringify(list));
  renderNightsList();
};

/* === 🧠 Solver Worker Code === */
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
    forbidden: A.map(name => dataM.filter(x => x.A === name && x.type === "NO").map(x => B.indexOf(x.B))),
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
  if(!container || !summary) return;

  // 1. Top 3 berechnen
  let matches = [];
  A.forEach((na, i) => B.forEach((nb, j) => {
    const p = Number((BigInt(counts[i][j]) * 10000n) / total) / 100;
    if(p > 0) matches.push({ a: na, b: nb, p });
  }));
  matches.sort((x, y) => y.p - x.p);
  const top3 = matches.slice(0, 3);

  // 2. Summary & Top 3 HTML
  summary.innerHTML = `
    <div class="stack">
      <div class="card row" style="justify-content:space-between">
        <strong>${total.toString()} Kombinationen</strong>
        <span class="small muted">${duration}ms</span>
        <button id="pngExport" class="primary small">📸 Export</button>
      </div>
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:10px;">
        ${top3.map((m, i) => `
          <div class="card" style="border-left: 4px solid #0fa">
            <div class="small muted">#${i+1} Match</div>
            <div style="font-size:13px; font-weight:bold; margin:5px 0">${m.a} & ${m.b}</div>
            <div style="color:#0fa; font-weight:bold">${m.p.toFixed(1)}%</div>
          </div>
        `).join("")}
      </div>
    </div>`;

  // 3. Matrix HTML
  let tableHtml = `<div class="table-wrap" style="margin-top:15px"><table class="ayto-table" id="matrixTable"><thead><tr><th>A\\B</th>${B.map((b, j) => `<th class="col-${j}">${b}</th>`).join("")}</tr></thead><tbody>`;
  
  A.forEach((na, i) => {
    tableHtml += `<tr class="row-${i}"><td class="name-cell"><strong>${na}</strong></td>`;
    B.forEach((nb, j) => {
      const p = Number((BigInt(counts[i][j]) * 10000n) / total) / 100;
      const isNo = p === 0;
      const bg = isNo ? "#2d2f3d" : `hsl(${Math.pow(p/100, 1.5)*120}, 65%, 25%)`;
      tableHtml += `<td class="cell col-${j}" data-row="${i}" data-col="${j}" style="background:${bg} !important; color:${isNo ? '#666' : '#fff'}; text-align:center; cursor:pointer;">${isNo ? 'No Match' : p.toFixed(1)+'%'}</td>`;
    });
    tableHtml += "</tr>";
  });
  container.innerHTML = tableHtml + "</tbody></table></div>";

  // 4. Klick-Logik
  document.getElementById("matrixTable").onclick = (e) => {
    const td = e.target.closest("td");
    if(!td) return;
    document.querySelectorAll(".highlight").forEach(el => el.classList.remove("highlight"));
    const r = td.parentElement.rowIndex - 1, c = td.dataset.col;
    if(r >= 0) document.querySelector(`.row-${r}`).classList.add("highlight");
    if(c) document.querySelectorAll(`.col-${c}`).forEach(el => el.classList.add("highlight"));
  };

  document.getElementById("pngExport").onclick = () => {
    html2canvas(document.getElementById("page-ergebnisse"), { backgroundColor: "#0e0f1a" }).then(canvas => {
      const link = document.createElement("a");
      link.download = "AYTO-Ergebnis.png";
      link.href = canvas.toDataURL();
      link.click();
    });
  };
}

/* === Init === */
window.onload = () => {
  const saved = JSON.parse(localStorage.getItem("aytoTeilnehmer") || '{"A":[],"B":[]}');
  saved.A.forEach(n => createPerson(n, "A"));
  saved.B.forEach(n => createPerson(n, "B"));
  renderTBList();
  renderNightsList();
};
