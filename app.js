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
      
      // UI Refreshes beim Seitenwechsel
      if(id === 'page-matchbox') { updateDropdowns(); renderMatchboxList(); }
      if(id === 'page-nights') { renderNightsList(); }
    });
  }
});

function showOverlay() { document.getElementById('overlay')?.classList.add('show'); }
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
function updateDropdowns() {
  const { A, B } = JSON.parse(localStorage.getItem("aytoTeilnehmer") || '{"A":[],"B":[]}');
  const selA = document.getElementById("selA"), selB = document.getElementById("selB");
  if(!selA || !selB) return;
  selA.innerHTML = '<option value="">-- A wählen --</option>' + A.map(n => `<option>${n}</option>`).join("");
  selB.innerHTML = '<option value="">-- B wählen --</option>' + B.map(n => `<option>${n}</option>`).join("");
}

document.getElementById("addMBox")?.addEventListener("click", () => {
  const a = document.getElementById("selA").value, b = document.getElementById("selB").value, t = document.getElementById("selType").value;
  if(!a || !b) return;
  const list = JSON.parse(localStorage.getItem("aytoMatchbox") || '[]');
  list.push({ A: a, B: b, type: t });
  localStorage.setItem("aytoMatchbox", JSON.stringify(list));
  renderMatchboxList();
});

function renderMatchboxList() {
  const container = document.getElementById("mboxList");
  if(!container) return;
  const list = JSON.parse(localStorage.getItem("aytoMatchbox") || '[]');
  container.innerHTML = list.map((m, i) => `
    <div class="row card" style="margin-bottom:5px">
      <span style="flex:1">${m.A} × ${m.B}</span>
      <span class="tag ${m.type === 'PM' ? 'good' : 'bad'}">${m.type}</span>
      <button onclick="removeMBox(${i})" class="danger small">✖</button>
    </div>
  `).join("");
}
window.removeMBox = (i) => {
  const list = JSON.parse(localStorage.getItem("aytoMatchbox") || '[]');
  list.splice(i, 1);
  localStorage.setItem("aytoMatchbox", JSON.stringify(list));
  renderMatchboxList();
};

/* === 🌙 Matching Night Logik === */
document.getElementById("addNight")?.addEventListener("click", () => {
  const { A, B } = JSON.parse(localStorage.getItem("aytoTeilnehmer") || '{"A":[],"B":[]}');
  if(!A.length || !B.length) return alert("Zuerst Teilnehmer anlegen!");

  const nightContainer = document.getElementById("nights");
  const div = document.createElement("div");
  div.className = "card stack night-entry";
  div.style.padding = "10px";
  
  let optionsB = B.map(n => `<option value="${n}">${n}</option>`).join("");
  let pairsHTML = A.map(nameA => `
    <div class="row" style="margin-bottom:5px">
      <label style="flex:1">${nameA}</label>
      <select class="pair-sel" data-a="${nameA}" style="flex:1">
        <option value="">-- Partner --</option>
        <option value="NONE">Kein Partner</option>
        ${optionsB}
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
      A: sel.dataset.a,
      B: sel.value
    })).filter(p => p.B && p.B !== "NONE");

    const lights = div.querySelector(".beam-count").value;
    const allNights = JSON.parse(localStorage.getItem("aytoMatchingNights") || '[]');
    allNights.push({ pairs, lights: parseInt(lights) });
    localStorage.setItem("aytoMatchingNights", JSON.stringify(allNights));
    renderNightsList();
  };

  nightContainer.prepend(div);
});

function renderNightsList() {
  const container = document.getElementById("nightsList") || document.getElementById("nights");
  if(!container) return;
  const list = JSON.parse(localStorage.getItem("aytoMatchingNights") || '[]');
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
  const list = JSON.parse(localStorage.getItem("aytoMatchingNights") || '[]');
  list.splice(i, 1);
  localStorage.setItem("aytoMatchingNights", JSON.stringify(list));
  renderNightsList();
};

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
  const dataN = JSON.parse(localStorage.getItem("aytoMatchingNights") || '[]');
  const { A, B } = dataA;
  if (A.length < 2 || B.length < 2) return alert("Bitte Teilnehmer eintragen!");

  showOverlay();
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
  worker.postMessage({ A, B, m, n, NONE_VAL, forced, forbidden, nights });
  worker.onmessage = (e) => {
    renderMatrix(BigInt(e.data.total), e.data.counts, A, B);
    hideOverlay();
    worker.terminate();
  };
});

function renderMatrix(total, counts, A, B) {
  const container = document.getElementById("matrix");
  const summary = document.getElementById("summary");
  if(!container || !summary) return;

  summary.innerHTML = `<h3>${total.toString()} Möglichkeiten</h3>`;
  if (total === 0n) return container.innerHTML = "<div class='card bad'>Keine Lösung möglich! Widerspruch in den Daten.</div>";

  let html = `<div class="ayto-table-container"><table class="ayto-table"><tr><th>A\\B</th>${B.map(b => `<th>${b}</th>`).join("")}</tr>`;
  A.forEach((nameA, i) => {
    html += `<tr><td><strong>${nameA}</strong></td>`;
    B.forEach((nameB, j) => {
      const p = Number((BigInt(counts[i][j]) * 10000n) / total) / 100;
      const hue = p === 0 ? 0 : p === 100 ? 120 : p * 1.2;
      const bg = `hsl(${hue}, 60%, 25%)`;
      html += `<td style="background:${bg};color:white;text-align:center">${p.toFixed(1)}%</td>`;
    });
    html += "</tr>";
  });
  container.innerHTML = html + "</table></div>";
}

/* === Initialisierung === */
window.onload = () => {
  const saved = JSON.parse(localStorage.getItem("aytoTeilnehmer") || '{"A":[],"B":[]}');
  saved.A.forEach(n => createPerson(n, "A"));
  saved.B.forEach(n => createPerson(n, "B"));
  updateDropdowns();
  renderMatchboxList();
  renderNightsList();
};
