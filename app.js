/* === 🔄 NAVIGATION === */
document.querySelectorAll('.bottom-nav button').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(btn.dataset.target);
    target.classList.add('active');
    if(btn.dataset.target === 'page-matchbox') updateDropdowns();
  };
});

/* === 👥 TEILNEHMER === */
const getT = () => JSON.parse(localStorage.getItem("aytoT") || '{"A":[],"B":[]}');
const saveT = (data) => localStorage.setItem("aytoT", JSON.stringify(data));

function renderT() {
  const {A, B} = getT();
  document.getElementById("listA").innerHTML = A.map((n, i) => `<div class="row"><input value="${n}" oninput="editT('A',${i},this.value)"><button onclick="remT('A',${i})">✖</button></div>`).join("");
  document.getElementById("listB").innerHTML = B.map((n, i) => `<div class="row"><input value="${n}" oninput="editT('B',${i},this.value)"><button onclick="remT('B',${i})">✖</button></div>`).join("");
}
window.editT = (g, i, v) => { const d = getT(); d[g][i] = v; saveT(d); };
window.remT = (g, i) => { const d = getT(); d[g].splice(i,1); saveT(d); renderT(); };
document.getElementById("addA").onclick = () => { const d = getT(); d.A.push(""); saveT(d); renderT(); };
document.getElementById("addB").onclick = () => { const d = getT(); d.B.push(""); saveT(d); renderT(); };

document.getElementById("prefill").onclick = () => {
  saveT({A: ["Adrianna","Alicia","Aurora","Elena","Ella","Laura","Linda","Marla","Michelle","Tiziana","Tonia"], 
         B: ["Chris","Ema","Evi","Jeronymo","Jerry","Julian.M","Julian.S","Luke","Meji","Noel"]});
  renderT();
};

/* === 💞 MATCHBOX === */
function updateDropdowns() {
  const {A, B} = getT();
  document.getElementById("tbA").innerHTML = A.map(n => `<option>${n}</option>`).join("");
  document.getElementById("tbB").innerHTML = B.map(n => `<option>${n}</option>`).join("");
}
document.getElementById("addTB").onclick = () => {
  const list = JSON.parse(localStorage.getItem("aytoMB") || '[]');
  list.push({A: document.getElementById("tbA").value, B: document.getElementById("tbB").value, type: document.getElementById("tbType").value});
  localStorage.setItem("aytoMB", JSON.stringify(list));
  renderMB();
};
function renderMB() {
  const list = JSON.parse(localStorage.getItem("aytoMB") || '[]');
  document.getElementById("tbList").innerHTML = list.map((m, i) => `<div class="card row"><span>${m.A} × ${m.B} (${m.type})</span><button onclick="remMB(${i})">✖</button></div>`).join("");
}
window.remMB = (i) => { const l = JSON.parse(localStorage.getItem("aytoMB") || '[]'); l.splice(i,1); localStorage.setItem("aytoMB", JSON.stringify(l)); renderMB(); };

/* === 🌙 NIGHTS === */
document.getElementById("addNight").onclick = () => {
  const {A, B} = getT();
  const nList = JSON.parse(localStorage.getItem("aytoN") || '[]');
  nList.push({pairs: A.map(f => ({A: f, B: B[0]})), lights: 0});
  localStorage.setItem("aytoN", JSON.stringify(nList));
  renderN();
};
function renderN() {
  const {B} = getT();
  const list = JSON.parse(localStorage.getItem("aytoN") || '[]');
  document.getElementById("nights").innerHTML = list.map((n, i) => `
    <div class="card stack">
      <h3>Night ${i+1}</h3>
      ${n.pairs.map((p, pi) => `
        <div class="row"><span>${p.A}</span><select onchange="editN(${i},${pi},this.value)">${B.map(m => `<option ${p.B==m?'selected':''}>${m}</option>`).join("")}</select></div>
      `).join("")}
      <div class="row">Lichter: <input type="number" value="${n.lights}" oninput="editNL(${i},this.value)"></div>
      <button onclick="remN(${i})" class="danger">Löschen</button>
    </div>
  `).join("");
}
window.editN = (i, pi, v) => { const l = JSON.parse(localStorage.getItem("aytoN") || '[]'); l[i].pairs[pi].B = v; localStorage.setItem("aytoN", JSON.stringify(l)); };
window.editNL = (i, v) => { const l = JSON.parse(localStorage.getItem("aytoN") || '[]'); l[i].lights = parseInt(v); localStorage.setItem("aytoN", JSON.stringify(l)); };
window.remN = (i) => { const l = JSON.parse(localStorage.getItem("aytoN") || '[]'); l.splice(i,1); localStorage.setItem("aytoN", JSON.stringify(l)); renderN(); };

/* === 🚀 SOLVER WORKER === */
const workerCode = `
self.onmessage = function(e) {
  const {A, B, mb, nights} = e.data;
  const m = A.length, n = B.length;
  let total = 0n;
  const counts = Array.from({length: m}, () => Array(n).fill(0n));
  const forbidden = A.map(name => mb.filter(x => x.A === name && x.type === "NM").map(x => B.indexOf(x.B)));
  const forced = A.map(name => { const f = mb.find(x => x.A === name && x.type === "PM"); return f ? B.indexOf(f.B) : -1; });

  function dfs(idx, used, currentAssign) {
    if (idx === m) {
      for (const nt of nights) {
        let hits = 0;
        for (let i = 0; i < m; i++) if (currentAssign[i] !== -1 && currentAssign[i] === nt.map[i]) hits++;
        if (hits !== nt.lights) return;
      }
      total++;
      for (let i = 0; i < m; i++) if (currentAssign[i] !== -1) counts[i][currentAssign[i]]++;
      return;
    }
    const canUse = forced[idx] !== -1 ? [forced[idx]] : [...Array(n).keys()].filter(j => !used.has(j) && !forbidden[idx].includes(j));
    if (forced[idx] === -1) canUse.push(-1); // NONE Option

    for (const j of canUse) {
      if (j !== -1) used.add(j);
      currentAssign[idx] = j;
      dfs(idx + 1, used, currentAssign);
      if (j !== -1) used.delete(j);
    }
  }
  dfs(0, new Set(), []);
  self.postMessage({total: total.toString(), counts});
};`;

document.getElementById("solveBtn").onclick = () => {
  const {A, B} = getT();
  const mb = JSON.parse(localStorage.getItem("aytoMB") || '[]');
  const nRaw = JSON.parse(localStorage.getItem("aytoN") || '[]');
  const nights = nRaw.map(n => ({ lights: n.lights, map: A.map(name => B.indexOf(n.pairs.find(p => p.A === name).B)) }));

  document.getElementById("overlay").classList.add("show");
  const bar = document.getElementById("pBar");
  bar.style.width = "10%";

  const worker = new Worker(URL.createObjectURL(new Blob([workerCode], {type: 'application/javascript'})));
  worker.postMessage({A, B, mb, nights});
  
  worker.onmessage = (e) => {
    bar.style.width = "100%";
    setTimeout(() => {
      renderMatrix(BigInt(e.data.total), e.data.counts, A, B);
      document.getElementById("overlay").classList.remove("show");
    }, 500);
  };
};

function renderMatrix(total, counts, A, B) {
  const mb = JSON.parse(localStorage.getItem("aytoMB") || '[]');
  let html = `<div class="table-wrap"><table><tr><th>A \\ B</th>${B.map(b => `<th>${b}</th>`).join("")}</tr>`;
  A.forEach((na, i) => {
    html += `<tr><td class="sticky-col">${na}</td>`;
    B.forEach((nb, j) => {
      const p = total > 0n ? Number((BigInt(counts[i][j]) * 100n) / total) : 0;
      const isNM = mb.some(m => m.A === na && m.B === nb && m.type === "NM") || (total > 0n && p === 0);
      const isPM = mb.some(m => m.A === na && m.B === nb && m.type === "PM") || p === 100;
      
      const color = isPM ? "#00d2d3" : (isNM ? "#2d2f3d" : `hsl(${p * 1.2}, 60%, 40%)`);
      html += `<td style="background:${color}; color:white">${isNM ? 'NM' : p+'%'}</td>`;
    });
    html += `</tr>`;
  });
  document.getElementById("matrix").innerHTML = html + "</table></div>";
}

window.onload = () => { renderT(); renderMB(); renderN(); };
