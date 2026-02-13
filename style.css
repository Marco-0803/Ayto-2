/* === Allgemeines Layout === */
body {
  margin: 0;
  font-family: "Segoe UI", Roboto, sans-serif;
  background: #0e0f1a;
  color: #f5f5f5;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

h1, h2, h3 {
  margin: 0;
  font-weight: 600;
  color: #ffffff;
}

/* === Header mit Farbverlauf von Pink → Blau === */
header {
  text-align: center;
  padding: 12px 8px;
  background: linear-gradient(90deg, #ff4fa8 0%, #4a82ff 100%);
  border-bottom: 1px solid rgba(255,255,255,0.1);
  color: #fff;
}
/* === Sanft animierter Farbverlauf (optional) === */
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

header {
  background: linear-gradient(90deg, #ff4fa8, #4a82ff, #ff4fa8);
  background-size: 200% 200%;
  animation: gradientShift 12s ease infinite;
}
/* Logo bleibt mittig, leicht betont */
header img.logo {
  width: 90px;
  display: block;
  margin: 0 auto 6px;
}

/* Untertitel dezenter */
header .small {
  font-size: 12px;
  color: rgba(255,255,255,0.8);
}
header img.logo {
  width: 90px;
  display: block;
  margin: 0 auto 5px;
}
header .small {
  font-size: 12px;
  color: #aaa;
}

/* === Hauptcontainer === */
main {
  flex: 1;
  padding-bottom: 70px;
}
.page {
  display: none;
  padding: 12px;
}
.page.active {
  display: block;
}

/* === Karten / Sektionen === */
.card {
  background: rgba(30, 33, 60, 0.9);
  border-radius: 10px;
  padding: 10px 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  margin-bottom: 14px;
}
.stack > *:not(:last-child) {
  margin-bottom: 8px;
}

/* === Buttons === */
button {
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.3s;
}
button.primary {
  background: #346fff;
  color: #fff;
}
button.primary:hover {
  background: #4a82ff;
}
button.ghost {
  background: rgba(255,255,255,0.1);
  color: #fff;
}
button.ghost:hover {
  background: rgba(255,255,255,0.2);
}
button.danger {
  background: #c42c2c;
  color: #fff;
}
button.danger:hover {
  background: #e03e3e;
}
button.small {
  font-size: 12px;
  padding: 5px 8px;
}

/* === Warnungen & Texte === */
.warning {
  background: rgba(255, 170, 0, 0.1);
  border-left: 3px solid #ffaa00;
  padding: 6px;
  color: #ffcc55;
}
.small {
  font-size: 13px;
}
.muted {
  color: #999;
}

/* === Navigation unten === */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-around;
  background: rgba(20, 22, 35, 0.95);
  border-top: 1px solid rgba(255,255,255,0.1);
  padding: 4px 0;
  backdrop-filter: blur(8px);
}
.bottom-nav button {
  flex: 1;
  background: none;
  color: #aaa;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 0;
}
.bottom-nav button.active {
  color: #fff;
  font-weight: 600;
}
.bottom-nav .icon {
  font-size: 18px;
}

/* === Overlay / Berechnungsanzeige === */
#overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.9);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
#overlay.show {
  display: flex;
}
.overlay-box {
  background: rgba(25, 27, 45, 0.95);
  border-radius: 12px;
  padding: 20px 24px;
  text-align: center;
  width: 260px;
  box-shadow: 0 0 25px rgba(0,0,0,0.4);
  animation: pulseBox 0.8s ease-in-out infinite alternate;
}
@keyframes pulseBox {
  from { box-shadow: 0 0 15px rgba(52,111,255,0.2); }
  to { box-shadow: 0 0 25px rgba(52,111,255,0.6); }
}
.overlay-logo {
  width: 80px;
  margin-bottom: 10px;
}
.overlay-title {
  font-size: 16px;
  color: #fff;
  margin-bottom: 12px;
}

/* Ladebalken animiert */
.progress {
  width: 100%;
  height: 8px;
  background: rgba(255,255,255,0.1);
  border-radius: 5px;
  overflow: hidden;
}
.progress .bar {
  width: 0%;
  height: 100%;
  background: linear-gradient(90deg, #4a82ff, #9eb7ff);
  border-radius: 5px;
  transition: width 5s linear;
}
@keyframes progressAnim {
  0% { width: 0%; }
  50% { width: 100%; }
  100% { width: 0%; }
}

/* === Tabellen-Design (Matrix) === */
.ayto-table-container {
  overflow-x: auto;
  border-radius: 10px;
  margin-top: 10px;
  box-shadow: 0 0 12px rgba(0,0,0,0.4);
}
.ayto-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  background: rgba(25, 27, 45, 0.9);
}
.ayto-table th, .ayto-table td {
  padding: 6px 8px;
  text-align: center;
  border: 1px solid rgba(255,255,255,0.05);
  color: #fff;
  white-space: nowrap;
}
.ayto-table th {
  background: rgba(35, 38, 60, 0.95);
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 2;
}
.ayto-table .a-name {
  text-align: left;
  font-weight: 600;
  background: rgba(35,38,60,0.9);
  position: sticky;
  left: 0;
  z-index: 3;
}

/* Tooltip in Matrix */
.ayto-table td {
  position: relative;
}
.ayto-tooltip {
  visibility: hidden;
  opacity: 0;
  position: absolute;
  background: rgba(0,0,0,0.85);
  color: #fff;
  padding: 3px 6px;
  border-radius: 5px;
  font-size: 11px;
  bottom: 120%;
  left: 50%;
  transform: translateX(-50%);
  transition: opacity 0.3s;
  white-space: nowrap;
}
.ayto-table td:hover .ayto-tooltip {
  visibility: visible;
  opacity: 1;
}

/* === Inputs & Listen === */
input[type="text"], select {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 6px;
  color: #fff;
  padding: 6px;
  font-size: 14px;
  width: 100%;
}
input::placeholder {
  color: #777;
}
.list .row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

/* === Tags (Perfect Match etc.) === */
.tag {
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 11px;
  margin-left: 5px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.tag.good { background: #138a0e; color: #fff; }
.tag.bad { background: #b92020; color: #fff; }
.tag.neutral { background: #555; color: #fff; }

/* === Timeline === */
.timeline h3 {
  border-bottom: 1px solid rgba(255,255,255,0.1);
  padding-bottom: 4px;
  margin-bottom: 6px;
}
.timeline .card {
  background: rgba(35,38,60,0.9);
  margin-bottom: 10px;
  padding: 10px;
}
