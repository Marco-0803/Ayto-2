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
        ov.querySelector('.overlay-title').textContent = "Berechnung startet...";
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
  if(!A.length || !B.length) return alert("Zuerst Teilnehmer anlegen!");

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
    <div class="row" style="margin-top:10px; border-top:1px solid #444; padding-top:10px">
      <label>Lichter (Beams):</label>
      <input type="number" class="beam-count" min="0" max="${A.length}" value="0" style="width:60px">
    </div>
    <div class="row" style="margin-top:10px">
      <button class="primary small save-night-btn">Speichern</button>
      <button class="ghost small" onclick="this.closest('.night-entry').remove()">Abbrechen</button>
    </div>
  `;

  div.querySelector(".save-night-btn").onclick = () => {
    const pairs = [...div.querySelectorAll(".pair-sel")].map(sel => ({
      A: sel.dataset.a, B: sel.value
    })).filter(p => p.B !== "NONE");

    const lights = div.querySelector(".beam-count").value;
    const allNights = JSON.parse(localStorage.getItem("aytoNights") || '[]');
    allNights.push({ pairs, lights: parseInt(lights) });
    localStorage.setItem("aytoNights", JSON.stringify(allNights));
    renderNightsList();
    renderTimeline();
  };
  nightContainer.prepend(div);
});

function renderNightsList() {
  const container = document.getElementById("nights");
  if(!container) return;
  const list = JSON.parse(localStorage.getItem("aytoNights") || '[]');
  container.innerHTML = list.map((n, i) => `
    <div class="card stack" style="margin-bottom:10px">
      <div class="row">
        <strong>Night ${i+1}</strong>
        <span class="tag good">${n.lights} Lichter</span>
        <button onclick="removeNight(${i})" class="danger small">✖</button>
      </div>
      <div class="small muted">${n.pairs.map(p => `${p.A}×${p.B}`).join(", ")}</div>
    </div>
  `).join("");
}
window.removeNight = (i) => {
  const list = JSON.parse(localStorage.getItem("aytoNights") || '[]');
  list.splice(i, 1);
  localStorage.setItem("aytoNights", JSON.stringify(list));
  renderNightsList();
  renderTimeline();
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
        if (a !== -1) {
          if (a !== NONE_VAL && a === want) fixed++;
        } else {
          if (want !== NONE_VAL && !usedWoman[want] && !forbidden[i].includes(want)) could++;
        }
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
  if (A.length < 2) return alert("Bitte Teilnehmer eintragen!");

  showOverlay();
  const startTime = Date.now();
  const m = A.length, n = B.length, NONE_VAL = 99;
  const forced = Array(m).fill(-1), forbidden = Array.from({length: m}, () => []);

  dataM.forEach(mBox => {
    const ai = A.indexOf(mBox.A), bi = B.indexOf(mBox.B);
    if (ai !== -1 && bi !== -1) (mBox.type === "PM") ? forced[ai] = bi : forbidden[ai].push(bi);
  });

  const nights = dataN.map(night => {
    const map = Array(m).fill(NONE_VAL);
    night.pairs.forEach(p => {
      const ai = A.indexOf(p.A), bi = B.indexOf(p.B);
      if (ai !== -1 && bi !== -1) map[ai] = bi;
    });
    return { map, beams: parseInt(night.lights), NONE_VAL };
  });

  const worker = new Worker(URL.createObjectURL(new Blob([workerCode], {type: 'text/javascript'})));
  
  let currentProgress = 0;
  const bar = document.querySelector('.bar');
  const title = document.querySelector('.overlay-title');

  const iv = setInterval(() => {
    if (currentProgress < 90) {
      currentProgress += Math.random() * 15;
      if (bar) bar.style.width = Math.min(90, currentProgress) + "%";
      if (title) title.textContent = `Berechnung läuft... (${Math.floor(Math.min(90, currentProgress))}%)`;
    }
  }, 80);

  worker.postMessage({ A, B, m, n, NONE_VAL, forced, forbidden, nights });
  worker.onmessage = (e) => {
    const duration = Date.now() - startTime;
    const minDelay = 600; // Mindestdauer der Animation in ms
    const remainingDelay = Math.max(0, minDelay - duration);

    setTimeout(() => {
      clearInterval(iv);
      if (bar) bar.style.width = "100%";
      if (title) title.textContent = "Berechnung abgeschlossen (100%)";
      
      setTimeout(() => {
        renderMatrix(BigInt(e.data.total), e.data.counts, A, B, duration);
        hideOverlay();
        worker.terminate();
      }, 300);
    }, remainingDelay);
  };
});

function renderMatrix(total, counts, A, B, duration) {
  const container = document.getElementById("matrix");
  const summary = document.getElementById("summary");
  if(!container || !summary) return;

  summary.innerHTML = `
    <div class="card stack">
      <h3>${total.toString()} Kombinationen gefunden</h3>
      <div class="small muted" style="margin-bottom:10px">Berechnet in ${duration}ms</div>
      <button id="pngExport" class="primary small">📸 Matrix als Bild speichern</button>
    </div>
  `;
  
  if (total === 0n) return container.innerHTML = "<div class='card bad'>Keine Lösung möglich! Widerspruch in den Daten.</div>";

  let html = `<div class="table-wrap"><table class="ayto-table" id="matrixTable"><thead><tr><th>A\\B</th>${B.map(b => `<th>${b}</th>`).join("")}</tr></thead><tbody>`;
  
  A.forEach((nameA, i) => {
    html += `<tr><td class="name-cell"><strong>${nameA}</strong></td>`;
    B.forEach((nameB, j) => {
      const p = Number((BigInt(counts[i][j]) * 10000n) / total) / 100;
      let opacity = p === 0 ? 0.2 : 1;
      const hue = Math.pow(p / 100, 1.5) * 120; 
      const bg = p === 0 ? "rgba(0,0,0,0.1)" : `hsl(${hue}, 65%, 25%)`;
      html += `<td style="background:${bg};color:${p === 0 ? '#666' : '#fff'};opacity:${opacity};text-align:center;font-weight:${p > 50 ? 'bold' : 'normal'}">${p > 0 ? p.toFixed(1) + "%" : "—"}</td>`;
    });
    html += "</tr>";
  });
  container.innerHTML = html + "</tbody></table></div>";

  document.getElementById("pngExport").onclick = () => {
    const target = document.getElementById("page-ergebnisse");
    html2canvas(target, { backgroundColor: "#191b2d", scale: 2 }).then(canvas => {
      const link = document.createElement("a");
      link.download = `AYTO-Ergebnis-${new Date().getTime()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    });
  };
}

/* === Import / Export / Reset === */
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

/* === Initialisierung === */
window.onload = () => {
  const saved = JSON.parse(localStorage.getItem("aytoTeilnehmer") || '{"A":[],"B":[]}');
  saved.A.forEach(n => createPerson(n, "A"));
  saved.B.forEach(n => createPerson(n, "B"));
  updateMatchboxDropdowns();
  renderTBList();
  renderNightsList();
};
