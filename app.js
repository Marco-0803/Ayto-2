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
      if(id === 'page-nights') renderTimeline();
    });
  }
});

function showOverlay() { 
    const ov = document.getElementById('overlay');
    if(ov) {
        ov.classList.add('show');
        ov.querySelector('.bar').style.width = "0%";
        ov.querySelector('.overlay-title').textContent = "Berechnung läuft... (0%)";
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

/* === 💞 Matchbox === */
function updateMatchboxDropdowns() {
  const { A, B } = JSON.parse(localStorage.getItem("aytoTeilnehmer") || '{"A":[],"B":[]}');
  const selA = document.getElementById("tbA"), selB = document.getElementById("tbB");
  if(!selA || !selB) return;
  selA.innerHTML = A.map(n => `<option>${n}</option>`).join("");
  selB.innerHTML = B.map(n => `<option>${n}</option>`).join("");
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
    <div class="row card">
      <span>${m.A} × ${m.B} <b>${m.type}</b></span>
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

/* === 🌙 Matching Nights === */
document.getElementById("addNight")?.addEventListener("click", () => {
  const { A, B } = JSON.parse(localStorage.getItem("aytoTeilnehmer") || '{"A":[],"B":[]}');
  const nightDiv = document.createElement("div");
  nightDiv.className = "card stack night-form";
  
  let pairsHTML = A.map(nameA => `
    <div class="row">
      <label>${nameA}</label>
      <select class="p-sel" data-a="${nameA}">
        <option value="NONE">Kein Partner</option>
        ${B.map(nameB => `<option>${nameB}</option>`).join("")}
      </select>
    </div>
  `).join("");

  nightDiv.innerHTML = `
    <h3>Night Konfiguration</h3>
    ${pairsHTML}
    <div class="row">Lichter: <input type="number" class="lights" value="0" min="0"></div>
    <button class="primary save-n-btn">Speichern</button>
  `;

  nightDiv.querySelector(".save-n-btn").onclick = () => {
    const pairs = [...nightDiv.querySelectorAll(".p-sel")].map(s => ({ A: s.dataset.a, B: s.value })).filter(p => p.B !== "NONE");
    const lights = nightDiv.querySelector(".lights").value;
    const list = JSON.parse(localStorage.getItem("aytoNights") || '[]');
    list.push({ pairs, lights });
    localStorage.setItem("aytoNights", JSON.stringify(list));
    nightDiv.remove();
    renderNightsList();
  };
  document.getElementById("nights").prepend(nightDiv);
});

function renderNightsList() {
    const list = JSON.parse(localStorage.getItem("aytoNights") || '[]');
    document.getElementById("nights").innerHTML = list.map((n, i) => `
        <div class="card row">
            <span>Night ${i+1}: ${n.lights} Lichter</span>
            <button onclick="removeNight(${i})" class="danger small">✖</button>
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
    const mbox = JSON.parse(localStorage.getItem("aytoMatchbox") || '[]');
    const nights = JSON.parse(localStorage.getItem("aytoNights") || '[]');
    box.innerHTML = "<h4>Verlauf</h4>";
    mbox.forEach(m => box.innerHTML += `<div class="small">MB: ${m.A}x${m.B} (${m.type})</div>`);
    nights.forEach((n, i) => box.innerHTML += `<div class="small">Night ${i+1}: ${n.lights} Beams</div>`);
}

/* === 🧠 Worker Solver === */
const workerCode = `
self.onmessage = function(e) {
  const { A, B, m, n, NONE_VAL, forced, forbidden, nights } = e.data;
  const noneQuota = Math.max(0, m - n);
  let total = 0n, counts = Array.from({length: m}, () => Array(n).fill(0n));
  let assign = Array(m).fill(-1), usedW = new Array(n).fill(false), usedNone = 0;

  function prune() {
    for (const nt of nights) {
      let fixed = 0, could = 0;
      for (let i = 0; i < m; i++) {
        let w = nt.map[i], a = assign[i];
        if (a !== -1) { if (a !== NONE_VAL && a === w) fixed++; }
        else { if (w !== NONE_VAL && !usedW[w] && !forbidden[i].includes(w)) could++; }
      }
      if (nt.beams < fixed || nt.beams > (fixed + could)) return false;
    }
    return true;
  }

  function dfs(pos) {
    if (pos === m) {
      if (usedNone !== noneQuota) return;
      for (const nt of nights) {
        let hits = 0;
        for (let i = 0; i < m; i++) { if (assign[i] !== NONE_VAL && assign[i] === nt.map[i]) hits++; }
        if (hits !== nt.beams) return;
      }
      total++;
      for (let i = 0; i < m; i++) { if (assign[i] !== NONE_VAL) counts[i][assign[i]]++; }
      return;
    }
    const opts = (forced[pos] !== -1) ? [forced[pos]] : [...Array(n).keys()].filter(j => !forbidden[pos].includes(j));
    if (forced[pos] === -1 && noneQuota > 0) opts.push(NONE_VAL);

    for (const j of opts) {
      if (j === NONE_VAL) {
        if (usedNone < noneQuota) { assign[pos] = NONE_VAL; usedNone++; if (prune()) dfs(pos + 1); usedNone--; assign[pos] = -1; }
      } else if (!usedW[j]) {
        assign[pos] = j; usedW[j] = true; if (prune()) dfs(pos + 1); usedW[j] = false; assign[pos] = -1;
      }
    }
  }
  dfs(0);
  self.postMessage({ total: total.toString(), counts });
};`;

document.getElementById("solveBtn")?.addEventListener("click", () => {
  const { A, B } = JSON.parse(localStorage.getItem("aytoTeilnehmer") || '{"A":[],"B":[]}');
  const mbox = JSON.parse(localStorage.getItem("aytoMatchbox") || '[]');
  const nightsData = JSON.parse(localStorage.getItem("aytoNights") || '[]');
  if (A.length < 2) return alert("Fehlende Daten!");

  showOverlay();
  const m = A.length, n = B.length, NONE_VAL = 99;
  const forced = Array(m).fill(-1), forbidden = Array.from({length: m}, () => []);

  mbox.forEach(x => {
    const ai = A.indexOf(x.A), bi = B.indexOf(x.B);
    if (ai !== -1 && bi !== -1) (x.type === "PM") ? forced[ai] = bi : forbidden[ai].push(bi);
  });

  const nights = nightsData.map(nd => {
    const map = Array(m).fill(NONE_VAL);
    nd.pairs.forEach(p => { const ai = A.indexOf(p.A), bi = B.indexOf(p.B); if (ai !== -1 && bi !== -1) map[ai] = bi; });
    return { map, beams: parseInt(nd.lights) };
  });

  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const worker = new Worker(URL.createObjectURL(blob));
  
  // Progress-Simulation
  let p = 0; const iv = setInterval(() => { 
      p = Math.min(98, p + 2); 
      document.querySelector('.bar').style.width = p + "%";
      document.querySelector('.overlay-title').textContent = `Berechnung läuft... (${p}%)`;
  }, 150);

  worker.postMessage({ A, B, m, n, NONE_VAL, forced, forbidden, nights });
  worker.onmessage = (e) => {
    clearInterval(iv);
    renderMatrix(BigInt(e.data.total), e.data.counts, A, B);
    hideOverlay();
  };
});

function renderMatrix(total, counts, A, B) {
  const container = document.getElementById("matrix");
  document.getElementById("summary").innerHTML = `<h3>${total.toString()} Kombinationen</h3>`;
  if (total === 0n) return container.innerHTML = "Keine Lösung!";

  let html = `<table class="ayto-table"><tr><th>A\\B</th>${B.map(b => `<th>${b}</th>`).join("")}</tr>`;
  A.forEach((na, i) => {
    html += `<tr><td><strong>${na}</strong></td>`;
    B.forEach((nb, j) => {
      const p = Number((BigInt(counts[i][j]) * 10000n) / total) / 100;
      html += `<td style="background:hsl(${p*1.2},60%,25%);color:white">${p.toFixed(1)}%</td>`;
    });
    html += "</tr>";
  });
  container.innerHTML = html + "</table>";
}

/* === Import / Export === */
document.getElementById("exportBtn")?.addEventListener("click", () => {
    const data = { 
        t: localStorage.getItem("aytoTeilnehmer"),
        m: localStorage.getItem("aytoMatchbox"),
        n: localStorage.getItem("aytoNights")
    };
    const blob = new Blob([JSON.stringify(data)], {type: "application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ayto_backup.json";
    a.click();
});

document.getElementById("importBtn")?.addEventListener("click", () => document.getElementById("importFile").click());
document.getElementById("importFile")?.addEventListener("change", (e) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
        const data = JSON.parse(ev.target.result);
        localStorage.setItem("aytoTeilnehmer", data.t);
        localStorage.setItem("aytoMatchbox", data.m);
        localStorage.setItem("aytoNights", data.n);
        location.reload();
    };
    reader.readAsText(e.target.files[0]);
});

document.getElementById("resetBtn")?.addEventListener("click", () => { if(confirm("Alles löschen?")) { localStorage.clear(); location.reload(); }});

/* === Init === */
window.onload = () => {
  const t = JSON.parse(localStorage.getItem("aytoTeilnehmer") || '{"A":[],"B":[]}');
  t.A.forEach(n => createPerson(n, "A"));
  t.B.forEach(n => createPerson(n, "B"));
  renderTBList();
  renderNightsList();
};
