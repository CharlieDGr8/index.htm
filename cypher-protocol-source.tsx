/* React arrives as a global from the script tags in index.html. */
const { useState, useEffect, useRef, useCallback, useMemo } = React;

/* Icons, drawn here so the app carries no third-party dependency. */
const mkIcon = body => ({ size = 20, style, className, ...rest }) =>
  React.createElement("svg", {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round",
    strokeLinejoin: "round", style, className, "aria-hidden": "true",
    dangerouslySetInnerHTML: { __html: body }, ...rest
  });

const ChevronRight  = mkIcon('<path d="m9 18 6-6-6-6"/>');
const Search        = mkIcon('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>');
const Plus          = mkIcon('<path d="M5 12h14"/><path d="M12 5v14"/>');
const Trash2        = mkIcon('<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>');
const Mic           = mkIcon('<rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M12 19v3"/>');
const Square        = mkIcon('<rect x="4" y="4" width="16" height="16" rx="2"/>');
const Crosshair     = mkIcon('<circle cx="12" cy="12" r="9"/><path d="M22 12h-4"/><path d="M6 12H2"/><path d="M12 6V2"/><path d="M12 22v-4"/>');
const Download      = mkIcon('<path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M5 21h14"/>');
const Upload        = mkIcon('<path d="M12 21V9"/><path d="m7 13 5-5 5 5"/><path d="M5 4h14"/>');
const X             = mkIcon('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>');
const RefreshCw     = mkIcon('<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>');
const Film          = mkIcon('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 3v18"/><path d="M17 3v18"/><path d="M3 12h18"/>');
const Play          = mkIcon('<path d="M7 4.5v15l13-7.5Z"/>');
const ArrowLeft     = mkIcon('<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>');
const AlertTriangle = mkIcon('<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>');
const Printer       = mkIcon('<path d="M6 9V3h12v6"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>');

/* ------------------------------------------------------------------ *
 * Cypher Protocol — field journal for paranormal investigations
 * Persistence via IndexedDB. Runs as a plain web page — no build step.
 * ------------------------------------------------------------------ */

const APP_CSS = `
.cp-root{
  --ink:#080C10; --panel:#111A21; --panel2:#16212A; --rule:#243440;
  --bone:#DDE5E9; --mute:#7E9099; --amber:#E9A63C; --red:#D9584B; --green:#5FBF8E;
  background:var(--ink); color:var(--bone); min-height:100vh;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
  font-size:16px; line-height:1.45; -webkit-font-smoothing:antialiased;
}
.cp-root *{box-sizing:border-box;}
.cp-mono{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,monospace;
  font-variant-numeric:tabular-nums; letter-spacing:-0.01em;}
.cp-wrap{max-width:720px;margin:0 auto;padding:0 14px 96px;}
.cp-top{position:sticky;top:0;z-index:20;background:rgba(8,12,16,.94);
  backdrop-filter:blur(8px);border-bottom:1px solid var(--rule);padding:10px 0 12px;}
.cp-title{font-size:20px;font-weight:600;letter-spacing:-0.02em;margin:0;}
.cp-brand{display:flex;align-items:center;gap:9px;}
.cp-seal{display:flex;color:var(--bone);opacity:.92;flex:none;}
@keyframes cp-coin{
  0%{transform:rotateY(0deg) scaleX(1);}
  50%{transform:rotateY(180deg) scaleX(1);}
  100%{transform:rotateY(360deg) scaleX(1);}
}
@keyframes cp-fade{from{opacity:0;}to{opacity:1;}}
.cp-coin{display:flex;align-items:center;justify-content:center;color:var(--bone);
  animation:cp-coin 1.5s cubic-bezier(.42,0,.58,1) infinite;transform-style:preserve-3d;}
.cp-load{display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:16px;padding:44px 0;perspective:600px;animation:cp-fade .25s ease;}
.cp-load p{color:var(--mute);font-size:12px;letter-spacing:.18em;text-transform:uppercase;margin:0;}
.cp-veil{position:fixed;inset:0;z-index:200;background:rgba(8,12,16,.88);
  backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;
  perspective:600px;animation:cp-fade .2s ease;}
@media (prefers-reduced-motion:reduce){ .cp-coin{animation-duration:3.2s;} }
.cp-sub{color:var(--mute);font-size:12px;margin:2px 0 0;}
.cp-card{background:var(--panel);border:1px solid var(--rule);border-radius:10px;margin:10px 0;}
.cp-sec{background:var(--panel);border:1px solid var(--rule);border-left:3px solid var(--rule);
  border-radius:8px;margin:8px 0;overflow:hidden;}
.cp-sec[data-open="1"]{border-left-color:var(--amber);}
.cp-secHead{display:flex;align-items:center;gap:10px;width:100%;min-height:56px;
  padding:10px 14px;background:none;border:0;color:var(--bone);text-align:left;
  font:inherit;cursor:pointer;}
.cp-secHead:hover{background:var(--panel2);}
.cp-secNum{color:var(--mute);font-size:12px;width:16px;flex:0 0 16px;}
.cp-secName{flex:1;font-weight:550;font-size:15px;}
.cp-secSum{color:var(--mute);font-size:12px;}
.cp-secBody{padding:4px 14px 18px;border-top:1px solid var(--rule);}
.cp-chev{transition:transform .18s ease;color:var(--mute);flex:0 0 auto;}
.cp-chev[data-open="1"]{transform:rotate(90deg);color:var(--amber);}
.cp-label{display:block;color:var(--mute);font-size:12px;margin:14px 0 5px;}
.cp-input,.cp-ta,.cp-select{width:100%;background:var(--ink);border:1px solid var(--rule);
  border-radius:7px;color:var(--bone);font-size:16px;font-family:inherit;padding:11px 12px;
  min-height:46px;outline:none;}
.cp-ta{min-height:76px;resize:vertical;line-height:1.5;}
.cp-input:focus,.cp-ta:focus,.cp-select:focus{border-color:var(--amber);box-shadow:0 0 0 2px rgba(233,166,60,.18);}
.cp-input::placeholder,.cp-ta::placeholder{color:#4E6069;}
.cp-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;
  min-height:46px;padding:0 16px;border-radius:7px;border:1px solid var(--rule);
  background:var(--panel2);color:var(--bone);font:inherit;font-size:15px;cursor:pointer;}
.cp-btn:active{transform:translateY(1px);}
.cp-btn:hover{border-color:#375061;}
.cp-btn--go{background:var(--amber);border-color:var(--amber);color:#1A1206;font-weight:600;}
.cp-btn--rec{background:var(--red);border-color:var(--red);color:#fff;font-weight:600;}
.cp-btn--sm{min-height:38px;font-size:14px;padding:0 11px;}
.cp-btn--icon{min-width:46px;padding:0 10px;}
.cp-btn--ghost{background:none;color:var(--mute);}
.cp-btn:focus-visible,.cp-secHead:focus-visible{outline:2px solid var(--amber);outline-offset:2px;}
.cp-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}
.cp-g2{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.cp-chip{display:inline-flex;align-items:center;gap:6px;font-size:11px;padding:5px 11px;
  border-radius:999px;border:1px solid var(--rule);color:var(--mute);
  background:transparent;font-family:inherit;cursor:pointer;}
.cp-chip--on{color:var(--amber);border-color:#5A431B;background:rgba(233,166,60,.12);}
.cp-chip--Planned{color:#8FB6CF;border-color:#2E4A5C;}
.cp-chip--Active{color:var(--amber);border-color:#5A431B;background:rgba(233,166,60,.08);}
.cp-chip--Closed{color:var(--mute);border-color:var(--rule);}
.cp-caseRow{display:block;width:100%;text-align:left;background:var(--panel);
  border:1px solid var(--rule);border-radius:9px;padding:13px 14px;margin:8px 0;
  color:var(--bone);font:inherit;cursor:pointer;}
.cp-caseRow:hover{background:var(--panel2);}
.cp-item{background:var(--panel2);border:1px solid var(--rule);border-radius:8px;
  padding:11px 12px;margin:8px 0;}
.cp-hint{color:var(--mute);font-size:13px;line-height:1.5;}
.cp-warn{border:1px solid #5A2F2A;background:rgba(217,88,75,.1);color:#F0B3AC;
  border-radius:8px;padding:10px 12px;font-size:13px;margin:10px 0;display:flex;gap:8px;}
.cp-note{border:1px solid #3B4A22;background:rgba(160,200,90,.07);color:#C6D9A5;
  border-radius:8px;padding:10px 12px;font-size:13px;margin:10px 0;}
.cp-tagbtn{border:1px solid var(--rule);background:var(--ink);color:var(--mute);
  border-radius:999px;padding:8px 12px;font-size:13px;font-family:inherit;cursor:pointer;min-height:40px;}
.cp-tagbtn[data-on="1"]{border-color:var(--amber);color:var(--amber);background:rgba(233,166,60,.1);}
.cp-tagbtn[data-on="1"][data-danger="1"]{border-color:var(--red);color:#F0B3AC;background:rgba(217,88,75,.12);}
.cp-check{display:flex;align-items:center;gap:10px;min-height:44px;cursor:pointer;font-size:15px;}
.cp-check input{width:22px;height:22px;accent-color:var(--amber);flex:0 0 auto;}
.cp-tbl{width:100%;border-collapse:collapse;font-size:13px;}
.cp-tbl th{color:var(--mute);font-weight:500;text-align:left;padding:6px 6px;border-bottom:1px solid var(--rule);}
.cp-tbl td{padding:4px 6px;border-bottom:1px solid var(--rule);vertical-align:top;}
.cp-tbl input{background:var(--ink);border:1px solid var(--rule);border-radius:5px;
  color:var(--bone);padding:8px;font-size:16px;width:100%;min-height:40px;font-family:inherit;}
.cp-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;}
.cp-thumbs{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px;}
.cp-thumb{width:100%;aspect-ratio:1;object-fit:cover;border-radius:7px;border:1px solid var(--rule);display:block;}
.cp-map{height:260px;border-radius:8px;border:1px solid var(--rule);overflow:hidden;background:var(--panel2);}
.cp-logline{border-left:2px solid var(--rule);padding:2px 0 2px 11px;margin:10px 0;}
.cp-logline[data-tag="Anomaly"]{border-left-color:var(--red);}
.cp-logline[data-tag="Equipment Event"]{border-left-color:var(--amber);}
.cp-logline[data-tag="Personal Impression"]{border-left-color:#6F8FB0;}
.cp-ts{color:var(--mute);font-size:11px;}
.cp-empty{color:var(--mute);font-size:14px;padding:22px 4px;text-align:center;}
.cp-fab{position:fixed;right:16px;bottom:20px;z-index:30;box-shadow:0 6px 24px rgba(0,0,0,.5);}
.cp-saving{color:var(--mute);font-size:11px;}
.cp-syncbar{display:flex;align-items:center;gap:7px;color:var(--mute);font-size:10.5pt;
  font-size:11px;letter-spacing:.02em;}
.cp-dot{width:7px;height:7px;border-radius:999px;background:#3C4B55;flex:0 0 auto;}
.cp-dot[data-live="1"]{background:var(--green);}
@media (prefers-reduced-motion: reduce){.cp-chev{transition:none;}}
@media (min-width:980px){
  .cp-shell{display:grid;grid-template-columns:340px minmax(0,1fr);gap:22px;
    align-items:start;max-width:1240px;margin:0 auto;padding:0 20px;}
  .cp-rail{position:sticky;top:0;height:100vh;overflow-y:auto;
    border-right:1px solid var(--rule);padding-right:16px;}
  .cp-rail .cp-wrap,.cp-detail .cp-wrap{max-width:none;margin:0;padding:0 0 60px;}
  .cp-detail .cp-wrap{max-width:900px;}
  .cp-detail .cp-top{top:0;}
  .cp-g2{grid-template-columns:1fr 1fr;gap:8px 14px;}
  .cp-secBody{padding:6px 18px 22px;}
  .cp-thumbs{grid-template-columns:repeat(auto-fill,minmax(130px,1fr));}
  .cp-plate{max-width:none;}
}
`;

/* ---------------------------- storage ---------------------------- */

const MAX_VALUE_CHARS = 40_000_000; // IndexedDB is roomy; this is a sanity limit, not a platform one

let lastStorageError = "";
let storageLive = null;            // null = untested, true = writing, false = session-only
const mem = new Map();             // fallback so the app still works if the database is unavailable

/* IndexedDB, one store of key -> JSON string. Chosen over localStorage because
   photos and audio blow through the 5MB localStorage ceiling immediately. */
const DB_NAME = "cypher-protocol";
const STORE = "kv";
let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("no IndexedDB in this browser"));
    let req;
    try { req = indexedDB.open(DB_NAME, 1); }
    catch (e) { return reject(e); }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("IndexedDB refused to open"));
    req.onblocked = () => reject(new Error("IndexedDB blocked by another tab"));
  }).catch(e => { dbPromise = null; throw e; });
  return dbPromise;
}

function tx(mode, fn) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    let out;
    try { out = fn(store); } catch (e) { return reject(e); }
    t.oncomplete = () => resolve(out && out.result !== undefined ? out.result : out);
    t.onerror = () => reject(t.error || new Error("transaction failed"));
    t.onabort = () => reject(t.error || new Error("transaction aborted"));
  }));
}

const S = {
  async get(key) {
    try {
      const raw = await tx("readonly", st => st.get(key));
      if (raw != null) return JSON.parse(raw);
    } catch (e) { /* fall through to this session's memory */ }
    return mem.has(key) ? mem.get(key) : null;
  },
  // Resolves true if it reached the database, false if it only reached this session.
  // Throws only for data too large to ever fit.
  async set(key, val) {
    const s = JSON.stringify(val);
    if (s.length > MAX_VALUE_CHARS) throw new Error("TOO_BIG");
    mem.set(key, val);
    try {
      await tx("readwrite", st => st.put(s, key));
      storageLive = true;
      lastStorageError = "";
      return true;
    } catch (e) {
      storageLive = false;
      lastStorageError = (e && e.message) ? e.message : String(e);
      return false;
    }
  },
  async del(key) {
    mem.delete(key);
    try { await tx("readwrite", st => st.delete(key)); } catch (e) {}
  },
  async list(prefix) {
    const local = [...mem.keys()].filter(k => k.startsWith(prefix));
    try {
      const keys = await tx("readonly", st => st.getAllKeys());
      const hit = (keys || []).filter(k => typeof k === "string" && k.startsWith(prefix));
      return [...new Set([...hit, ...local])];
    } catch (e) { return local; }
  },
  status: () => ({ live: storageLive, error: lastStorageError })
};

const K = {
  index: "cypher-protocol:index",
  case: id => `case:${id}`,
  media: (cid, mid) => `media:${cid}:${mid}`,
  gear: "cypher-protocol:gear"
};

/* ---------------------------- utils ------------------------------ */

const pad = (n, w = 2) => String(n).padStart(w, "0");
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const nowISO = () => new Date().toISOString();
const dateStamp = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const compactStamp = (d = new Date()) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
const clockOf = iso => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};
const dayOf = iso => dateStamp(new Date(iso));

/* CP-YYYYMMDD-NNN. The date is the day the case was opened; NNN is a running
   count of every case ever opened, so it keeps climbing across days. Numbers
   are never reused, even after a case is deleted. */
function nextCaseNumber(index) {
  const prefix = `CP-${compactStamp()}-`;
  let max = 0;
  for (const c of index) {
    if (!c.caseNumber) continue;
    const tail = String(c.caseNumber).split("-").pop();   // the NNN, whatever the date
    const n = parseInt(tail, 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return `${prefix}${pad(max + 1, 3)}`;
}

// Astronomical moon phase — computed locally, no network needed.
function moonPhase(date = new Date()) {
  const SYN = 29.530588853;
  const ref = Date.UTC(2000, 0, 6, 18, 14, 0);
  let age = ((date.getTime() - ref) / 86400000) % SYN;
  if (age < 0) age += SYN;
  const frac = age / SYN;
  const illum = Math.round(((1 - Math.cos(2 * Math.PI * frac)) / 2) * 100);
  const names = ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous",
    "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"];
  const i = Math.floor((frac * 8) + 0.5) % 8;
  return `${names[i]} — ${illum}% illuminated, day ${age.toFixed(1)} of cycle`;
}

function readAsDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(new Error("Could not read the file."));
    r.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("Could not decode the image."));
    img.src = src;
  });
}

async function compressImage(file, maxDim = 1600) {
  const raw = await readAsDataURL(file);
  let img;
  try { img = await loadImage(raw); } catch (e) { return raw; }
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  c.getContext("2d").drawImage(img, 0, 0, w, h);
  let q = 0.75;
  let out = c.toDataURL("image/jpeg", q);
  while (out.length > MAX_VALUE_CHARS * 0.9 && q > 0.28) {
    q -= 0.12;
    out = c.toDataURL("image/jpeg", q);
  }
  return out.length < raw.length ? out : raw;
}

const kb = n => n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`;

/* Sync scaffolding. There is no change-notification API, so every device
   polls the same keys and announces itself with a short-lived beacon. */
const SESSION = uid();
const DEVICE = (typeof window !== "undefined" && window.innerWidth >= 980) ? "desktop" : "mobile";
const bodyOf = c => JSON.stringify({ ...c, updatedAt: "" });

async function pingBeacon() {
  try { await S.set(`beacon:${SESSION}`, { ts: Date.now(), device: DEVICE }); } catch (e) {}
}

async function seenElsewhere() {
  const keys = await S.list("beacon:");
  const others = [];
  for (const k of keys) {
    if (k.endsWith(SESSION)) continue;
    const b = await S.get(k);
    if (b && b.ts && Date.now() - b.ts < 150000) others.push(b);
  }
  return others.sort((a, b) => b.ts - a.ts);
}

function download(name, text, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* Save with a folder picker where the platform offers one:
   iOS share sheet -> Save to Files, desktop save dialog, else a plain download. */
async function saveFile(name, text, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  try {
    if (navigator.share && navigator.canShare) {
      const f = new File([blob], name, { type: mime });
      if (navigator.canShare({ files: [f] })) {
        await navigator.share({ files: [f], title: name });
        return "shared";
      }
    }
  } catch (e) {
    if (e && e.name === "AbortError") return "cancelled";
  }
  try {
    if (window.showSaveFilePicker) {
      const handle = await window.showSaveFilePicker({ suggestedName: name });
      const w = await handle.createWritable();
      await w.write(blob);
      await w.close();
      return "saved";
    }
  } catch (e) {
    if (e && e.name === "AbortError") return "cancelled";
  }
  download(name, text, mime);
  return "downloaded";
}

function saveResultMessage(result, what) {
  if (result === "shared") return `Share sheet is open — choose Save to Files and browse to the folder you want.`;
  if (result === "saved") return `${what} saved where you chose.`;
  if (result === "cancelled") return `Cancelled. Nothing was saved.`;
  return `${what} went to your default download folder — the picker was not available on that tap. Tap Save again to browse for a location.`;
}

/* ------------------------- data model ---------------------------- */

const DEFAULT_GEAR = [
  "EMF meter", "K-II meter", "REM pod", "Digital audio recorder", "DSLR camera",
  "Full-spectrum camera", "Thermal imager", "Infrared camera", "Laser grid",
  "Motion sensor", "Spirit box", "Ovilus", "Dowsing rods", "Pendulum",
  "EVP recorder", "Tripod", "Flashlight", "Spare batteries", "First aid kit"
];

const TAGS = ["Observation", "Anomaly", "Personal Impression", "Equipment Event"];
const STATUSES = ["Planned", "Active", "Closed"];
const CLASSES = ["Unclassified", "Explained", "Unexplained", "Inconclusive"];

function blankCase(caseNumber) {
  return {
    id: uid(),
    caseNumber,
    title: "",
    status: "Planned",
    date: dateStamp(),
    createdAt: nowISO(),
    updatedAt: nowISO(),
    plan: {
      objective: "", team: "", arrival: "", departure: "",
      permissionsObtained: false, permissionsNotes: "", safety: "", research: ""
    },
    location: {
      name: "", address: "", description: "", age: "",
      priorActivity: "", access: "", witnesses: []
    },
    pins: [],
    weather: {
      temp: "", humidity: "", pressure: "", wind: "", cloud: "",
      precip: "", moon: "", notes: "", source: ""
    },
    equipment: {},
    readings: [],
    log: [],
    media: [],
    analysis: { review: "", debunk: "", conclusions: "", classifications: {}, followups: [] }
  };
}

const summarize = c => ({
  id: c.id, caseNumber: c.caseNumber, title: c.title, status: c.status,
  date: c.date, locationName: c.location.name, updatedAt: c.updatedAt
});

/* ------------------------- primitives ---------------------------- */

function Field({ label, value, onChange, placeholder, mono, type = "text", inputMode }) {
  return (
    <div>
      {label && <label className="cp-label">{label}</label>}
      <input
        className={"cp-input" + (mono ? " cp-mono" : "")}
        type={type}
        inputMode={inputMode}
        value={value ?? ""}
        placeholder={placeholder || ""}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

function Area({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div>
      {label && <label className="cp-label">{label}</label>}
      <textarea
        className="cp-ta"
        rows={rows}
        value={value ?? ""}
        placeholder={placeholder || ""}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

function Check({ checked, onChange, children }) {
  return (
    <label className="cp-check">
      <input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)} />
      <span>{children}</span>
    </label>
  );
}

function Section({ n, title, summary, open, onToggle, children }) {
  return (
    <section className="cp-sec" data-open={open ? "1" : "0"}>
      <button className="cp-secHead" onClick={onToggle} aria-expanded={open}>
        <span className="cp-secNum cp-mono">{n}</span>
        <span className="cp-secName">{title}</span>
        {summary ? <span className="cp-secSum cp-mono">{summary}</span> : null}
        <ChevronRight size={18} className="cp-chev" data-open={open ? "1" : "0"} />
      </button>
      {open && <div className="cp-secBody">{children}</div>}
    </section>
  );
}

function Warn({ children }) {
  return <div className="cp-warn"><AlertTriangle size={16} style={{ flex: "0 0 auto", marginTop: 2 }} /><div>{children}</div></div>;
}

/* ------------------- 1. Pre-investigation planning ---------------- */

function PlanSection({ v, up }) {
  const set = (k, val) => up(p => ({ ...p, plan: { ...p.plan, [k]: val } }));
  return (
    <>
      <Area label="Objective / hypothesis" value={v.objective} onChange={x => set("objective", x)}
        placeholder="What are you testing, and what would count as an answer?" />
      <Area label="Team members present" value={v.team} onChange={x => set("team", x)} rows={2}
        placeholder="Names and roles" />
      <div className="cp-g2">
        <Field label="Planned arrival" type="datetime-local" value={v.arrival} onChange={x => set("arrival", x)} />
        <Field label="Planned departure" type="datetime-local" value={v.departure} onChange={x => set("departure", x)} />
      </div>
      <label className="cp-label">Permissions</label>
      <Check checked={v.permissionsObtained} onChange={x => set("permissionsObtained", x)}>
        Permission obtained from property owner
      </Check>
      <Area value={v.permissionsNotes} onChange={x => set("permissionsNotes", x)} rows={2}
        placeholder="Who granted it, when, any conditions" />
      <Area label="Safety considerations and hazards" value={v.safety} onChange={x => set("safety", x)}
        placeholder="Floors, wildlife, air quality, exits, cell coverage" />
      <Area label="Research done beforehand" value={v.research} onChange={x => set("research", x)}
        placeholder="Records, prior reports, sources checked" />
    </>
  );
}

/* --------------------- 2. Location profile ------------------------ */

function LocationSection({ v, up }) {
  const set = (k, val) => up(p => ({ ...p, location: { ...p.location, [k]: val } }));
  const setW = (id, k, val) => up(p => ({
    ...p,
    location: {
      ...p.location,
      witnesses: p.location.witnesses.map(w => w.id === id ? { ...w, [k]: val } : w)
    }
  }));
  const addW = () => up(p => ({
    ...p,
    location: {
      ...p.location,
      witnesses: [...p.location.witnesses, { id: uid(), name: "", date: "", account: "" }]
    }
  }));
  const delW = id => up(p => ({
    ...p,
    location: { ...p.location, witnesses: p.location.witnesses.filter(w => w.id !== id) }
  }));

  return (
    <>
      <Field label="Location name" value={v.name} onChange={x => set("name", x)} placeholder="Old Jefferson Mill" />
      <Area label="Address" value={v.address} onChange={x => set("address", x)} rows={2} />
      <Area label="Description" value={v.description} onChange={x => set("description", x)}
        placeholder="Layout, condition, rooms of interest" />
      <Field label="Structure age / history" value={v.age} onChange={x => set("age", x)}
        placeholder="Built 1878, mill until 1954, vacant since" />
      <Area label="Prior reported activity" value={v.priorActivity} onChange={x => set("priorActivity", x)} />
      <Area label="Access notes" value={v.access} onChange={x => set("access", x)} rows={2}
        placeholder="Gate codes, parking, which door, who to call" />

      <label className="cp-label">Witness testimony</label>
      {v.witnesses.length === 0 && <p className="cp-hint">No witness accounts recorded.</p>}
      {v.witnesses.map(w => (
        <div className="cp-item" key={w.id}>
          <div className="cp-row" style={{ justifyContent: "space-between" }}>
            <strong style={{ fontSize: 14 }}>{w.name || "Unnamed witness"}</strong>
            <button className="cp-btn cp-btn--sm cp-btn--ghost" onClick={() => delW(w.id)} aria-label="Remove witness">
              <Trash2 size={15} />
            </button>
          </div>
          <div className="cp-g2">
            <Field label="Name" value={w.name} onChange={x => setW(w.id, "name", x)} />
            <Field label="Date of experience" type="date" value={w.date} onChange={x => setW(w.id, "date", x)} />
          </div>
          <Area label="Their account" value={w.account} onChange={x => setW(w.id, "account", x)} rows={4} />
        </div>
      ))}
      <button className="cp-btn" onClick={addW} style={{ marginTop: 10 }}><Plus size={16} /> Add witness</button>
    </>
  );
}

/* --------------------- 3. Map & coordinates ----------------------- */

function useLeaflet() {
  const [state, setState] = useState(() => (typeof window !== "undefined" && window.L) ? "ready" : "loading");
  useEffect(() => {
    if (window.L) { setState("ready"); return; }
    const base = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/";
    if (!document.getElementById("cp-leaflet-css")) {
      const css = document.createElement("link");
      css.id = "cp-leaflet-css"; css.rel = "stylesheet"; css.href = base + "leaflet.min.css";
      document.head.appendChild(css);
    }
    let s = document.getElementById("cp-leaflet-js");
    if (!s) {
      s = document.createElement("script");
      s.id = "cp-leaflet-js"; s.src = base + "leaflet.min.js"; s.async = true;
      document.head.appendChild(s);
    }
    const done = () => setState(window.L ? "ready" : "failed");
    s.addEventListener("load", done);
    s.addEventListener("error", () => setState("failed"));
    const t = setTimeout(() => setState(v => (v === "loading" ? "failed" : v)), 9000);
    return () => { clearTimeout(t); s.removeEventListener("load", done); };
  }, []);
  return state;
}

function MapPane({ pins }) {
  const status = useLeaflet();
  const ref = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  const [tiles, setTiles] = useState("loading");

  useEffect(() => {
    if (status !== "ready" || !ref.current || map.current) return;
    const L = window.L;
    const first = pins.find(p => p.lat && p.lng);
    map.current = L.map(ref.current, { attributionControl: true })
      .setView(first ? [Number(first.lat), Number(first.lng)] : [39.5, -86.5], first ? 15 : 5);
    const tl = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: "© OpenStreetMap contributors"
    });
    tl.on("tileerror", () => setTiles("blocked"));
    tl.on("tileload", () => setTiles("ok"));
    tl.addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    setTimeout(() => map.current && map.current.invalidateSize(), 120);
  }, [status]);

  useEffect(() => {
    if (!map.current || !layer.current) return;
    const L = window.L;
    layer.current.clearLayers();
    const pts = pins.filter(p => p.lat !== "" && p.lng !== "" && !isNaN(Number(p.lat)) && !isNaN(Number(p.lng)));
    pts.forEach(p => {
      L.marker([Number(p.lat), Number(p.lng)])
        .bindPopup(p.label || "Unlabeled pin")
        .addTo(layer.current);
    });
    if (pts.length === 1) map.current.setView([Number(pts[0].lat), Number(pts[0].lng)], 16);
    else if (pts.length > 1) map.current.fitBounds(pts.map(p => [Number(p.lat), Number(p.lng)]), { padding: [30, 30] });
  }, [pins, status, tiles]);

  if (status === "loading") return <div className="cp-map" style={{ display: "grid", placeItems: "center" }}>
    <span className="cp-hint">Loading map…</span></div>;

  if (status === "failed") return (
    <Warn>
      The map library could not load (no connection?). Coordinates are still saved and exported,
      and the links below open each pin in OpenStreetMap.
    </Warn>
  );

  return (
    <>
      <div className="cp-map" ref={ref} />
      {tiles === "blocked" && <Warn>Map tiles are being blocked here, so the map may render blank.
        Your coordinates are saved regardless.</Warn>}
    </>
  );
}

function MapSection({ v, up }) {
  const [geoMsg, setGeoMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const setPin = (id, k, val) => up(p => ({ ...p, pins: p.pins.map(x => x.id === id ? { ...x, [k]: val } : x) }));
  const addPin = (lat = "", lng = "", label = "") =>
    up(p => ({ ...p, pins: [...p.pins, { id: uid(), label, lat, lng, note: "", ts: nowISO() }] }));
  const delPin = id => up(p => ({ ...p, pins: p.pins.filter(x => x.id !== id) }));

  const capture = () => {
    if (!navigator.geolocation) { setGeoMsg("This browser exposes no geolocation API."); return; }
    setBusy(true); setGeoMsg("");
    navigator.geolocation.getCurrentPosition(
      pos => {
        setBusy(false);
        addPin(pos.coords.latitude.toFixed(6), pos.coords.longitude.toFixed(6), "");
        setGeoMsg(`Pin captured, accuracy ±${Math.round(pos.coords.accuracy)} m. Give it a label.`);
      },
      err => {
        setBusy(false);
        setGeoMsg(`Location unavailable: ${err.message}. Enter latitude and longitude by hand below.`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  return (
    <>
      <div className="cp-row">
        <button className="cp-btn cp-btn--go" onClick={capture} disabled={busy}>
          <Crosshair size={17} /> {busy ? "Locating…" : "Capture current GPS"}
        </button>
        <button className="cp-btn" onClick={() => addPin()}><Plus size={16} /> Add pin manually</button>
      </div>
      {geoMsg && <p className="cp-hint" style={{ marginTop: 8 }}>{geoMsg}</p>}

      <div style={{ marginTop: 12 }}><MapPane pins={v.pins} /></div>

      {v.pins.length === 0 && <p className="cp-empty">No pins yet. Capture your position at the site, or type coordinates in.</p>}
      {v.pins.map(p => (
        <div className="cp-item" key={p.id}>
          <div className="cp-row" style={{ justifyContent: "space-between" }}>
            <span className="cp-mono cp-hint">{p.lat && p.lng ? `${p.lat}, ${p.lng}` : "no coordinates"}</span>
            <button className="cp-btn cp-btn--sm cp-btn--ghost" onClick={() => delPin(p.id)} aria-label="Remove pin">
              <Trash2 size={15} />
            </button>
          </div>
          <Field label="Label" value={p.label} onChange={x => setPin(p.id, "label", x)}
            placeholder="Basement hotspot" />
          <div className="cp-g2">
            <Field label="Latitude" mono inputMode="decimal" value={p.lat} onChange={x => setPin(p.id, "lat", x)} />
            <Field label="Longitude" mono inputMode="decimal" value={p.lng} onChange={x => setPin(p.id, "lng", x)} />
          </div>
          <Area label="Note" rows={2} value={p.note} onChange={x => setPin(p.id, "note", x)} />
          {p.lat && p.lng &&
            <a className="cp-hint" target="_blank" rel="noreferrer"
              style={{ color: "var(--amber)", display: "inline-block", marginTop: 8 }}
              href={`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=17/${p.lat}/${p.lng}`}>
              Open this pin in OpenStreetMap
            </a>}
        </div>
      ))}
    </>
  );
}

/* ----------------------- 4. Weather ------------------------------- */

function WeatherSection({ v, pins, up }) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k, val) => up(p => ({ ...p, weather: { ...p.weather, [k]: val } }));
  const pin = pins.find(p => p.lat && p.lng);

  const fill = async () => {
    if (!pin) { setMsg("Capture or enter coordinates in section 3 first."); return; }
    setBusy(true); setMsg("");
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${pin.lat}&longitude=${pin.lng}` +
        `&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,cloud_cover,precipitation` +
        `&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch`;
      const r = await fetch(url);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      const c = d.current || {};
      up(p => ({
        ...p,
        weather: {
          ...p.weather,
          temp: c.temperature_2m != null ? `${c.temperature_2m} °F` : p.weather.temp,
          humidity: c.relative_humidity_2m != null ? `${c.relative_humidity_2m} %` : p.weather.humidity,
          pressure: c.surface_pressure != null ? `${c.surface_pressure} hPa` : p.weather.pressure,
          wind: c.wind_speed_10m != null ? `${c.wind_speed_10m} mph @ ${c.wind_direction_10m ?? "?"}°` : p.weather.wind,
          cloud: c.cloud_cover != null ? `${c.cloud_cover} %` : p.weather.cloud,
          precip: c.precipitation != null ? `${c.precipitation} in` : p.weather.precip,
          moon: p.weather.moon || moonPhase(),
          source: `Open-Meteo, fetched ${clockOf(nowISO())}`
        }
      }));
      setMsg("Filled from Open-Meteo. Check it against what you actually feel on site.");
    } catch (e) {
      setMsg(`Weather fetch failed (${e.message}). Nothing was filled in — enter the readings manually.`);
    } finally { setBusy(false); }
  };

  return (
    <>
      <div className="cp-row">
        <button className="cp-btn cp-btn--go" onClick={fill} disabled={busy}>
          <RefreshCw size={16} /> {busy ? "Fetching…" : "Fetch from coordinates"}
        </button>
        <button className="cp-btn" onClick={() => set("moon", moonPhase())}>Calculate moon phase</button>
      </div>
      {msg && <p className="cp-hint" style={{ marginTop: 8 }}>{msg}</p>}
      <div className="cp-g2">
        <Field label="Temperature" mono value={v.temp} onChange={x => set("temp", x)} placeholder="41 °F" />
        <Field label="Humidity" mono value={v.humidity} onChange={x => set("humidity", x)} placeholder="72 %" />
        <Field label="Barometric pressure" mono value={v.pressure} onChange={x => set("pressure", x)} placeholder="1013 hPa" />
        <Field label="Wind" mono value={v.wind} onChange={x => set("wind", x)} placeholder="6 mph NW" />
        <Field label="Cloud cover" mono value={v.cloud} onChange={x => set("cloud", x)} placeholder="80 %" />
        <Field label="Precipitation" mono value={v.precip} onChange={x => set("precip", x)} placeholder="0 in" />
      </div>
      <Field label="Moon phase" value={v.moon} onChange={x => set("moon", x)} />
      <Area label="Anything unusual" value={v.notes} onChange={x => set("notes", x)}
        placeholder="Fog rolling in, storm front, temperature dropping fast" />
      {v.source && <p className="cp-hint cp-mono" style={{ marginTop: 8 }}>{v.source}</p>}
    </>
  );
}

/* --------------------- 5. Equipment checklist --------------------- */

function EquipmentSection({ v, up, customGear, addCustomGear, removeCustomGear }) {
  const [draft, setDraft] = useState("");
  const items = useMemo(() => [...DEFAULT_GEAR, ...customGear], [customGear]);
  const get = name => v[name] || { brought: false, used: false, notes: "" };
  const set = (name, k, val) => up(p => ({
    ...p, equipment: { ...p.equipment, [name]: { ...(p.equipment[name] || { brought: false, used: false, notes: "" }), [k]: val } }
  }));

  const add = () => {
    const n = draft.trim();
    if (!n) return;
    if (items.some(i => i.toLowerCase() === n.toLowerCase())) { setDraft(""); return; }
    addCustomGear(n);
    setDraft("");
  };

  return (
    <>
      <p className="cp-hint">Brought is what left the truck. Used is what you actually ran.</p>
      {items.map(name => {
        const it = get(name);
        const custom = customGear.includes(name);
        return (
          <div className="cp-item" key={name}>
            <div className="cp-row" style={{ justifyContent: "space-between" }}>
              <strong style={{ fontSize: 15 }}>{name}</strong>
              {custom && (
                <button className="cp-btn cp-btn--sm cp-btn--ghost" onClick={() => removeCustomGear(name)}
                  aria-label={`Remove ${name} from your gear list`}><Trash2 size={15} /></button>
              )}
            </div>
            <div className="cp-row" style={{ gap: 18 }}>
              <Check checked={it.brought} onChange={x => set(name, "brought", x)}>Brought</Check>
              <Check checked={it.used} onChange={x => set(name, "used", x)}>Used</Check>
            </div>
            <input className="cp-input" placeholder="Settings, serial number, malfunctions"
              value={it.notes} onChange={e => set(name, "notes", e.target.value)} />
          </div>
        );
      })}
      <label className="cp-label">Add your own gear (stays on the list for every future case)</label>
      <div className="cp-row">
        <input className="cp-input" style={{ flex: 1, minWidth: 180 }} value={draft}
          placeholder="SLS camera" onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") add(); }} />
        <button className="cp-btn cp-btn--go cp-btn--icon" onClick={add} aria-label="Add equipment"><Plus size={18} /></button>
      </div>
    </>
  );
}

/* ------------------ 6. Baseline / session readings ---------------- */

const READ_COLS = [
  ["area", "Room / area"], ["time", "Time"], ["emf", "EMF"],
  ["temp", "Temp"], ["humidity", "RH"], ["db", "dB"], ["notes", "Notes"]
];

function ReadingTable({ rows, phase, setCell, del }) {
  const list = rows.filter(r => r.phase === phase);
  if (!list.length) return <p className="cp-hint" style={{ margin: "6px 0 14px" }}>No {phase} rows yet.</p>;
  return (
    <div className="cp-scroll" style={{ marginBottom: 14 }}>
      <table className="cp-tbl">
        <thead>
          <tr>{READ_COLS.map(([k, l]) => <th key={k} style={{ minWidth: k === "notes" ? 160 : 78 }}>{l}</th>)}<th /></tr>
        </thead>
        <tbody>
          {list.map(r => (
            <tr key={r.id}>
              {READ_COLS.map(([k]) => (
                <td key={k}><input className="cp-mono" value={r[k] || ""} onChange={e => setCell(r.id, k, e.target.value)} /></td>
              ))}
              <td>
                <button className="cp-btn cp-btn--sm cp-btn--ghost" onClick={() => del(r.id)} aria-label="Delete row">
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReadingsSection({ rows, up }) {
  const setCell = (id, k, val) => up(p => ({ ...p, readings: p.readings.map(r => r.id === id ? { ...r, [k]: val } : r) }));
  const del = id => up(p => ({ ...p, readings: p.readings.filter(r => r.id !== id) }));
  const add = phase => up(p => ({
    ...p,
    readings: [...p.readings, {
      id: uid(), phase, area: "", time: clockOf(nowISO()).slice(0, 5),
      emf: "", temp: "", humidity: "", db: "", notes: ""
    }]
  }));
  return (
    <>
      <h4 style={{ margin: "14px 0 4px", fontSize: 14 }}>Baseline</h4>
      <ReadingTable rows={rows} phase="baseline" setCell={setCell} del={del} />
      <button className="cp-btn cp-btn--sm" onClick={() => add("baseline")}><Plus size={15} /> Baseline row</button>

      <h4 style={{ margin: "22px 0 4px", fontSize: 14 }}>During session</h4>
      <ReadingTable rows={rows} phase="session" setCell={setCell} del={del} />
      <button className="cp-btn cp-btn--sm" onClick={() => add("session")}><Plus size={15} /> Session row</button>
    </>
  );
}

/* ----------------------- 7. Session log --------------------------- */

const SENSES = ["Sight", "Hearing", "Touch", "Smell", "Taste", "Instrument", "Other"];

function LogSection({ log, up }) {
  const [text, setText] = useState("");
  const [tag, setTag] = useState("Observation");

  const add = () => {
    const t = text.trim();
    if (!t) return;
    const entry = {
      id: uid(), ts: nowISO(), tag, text: t,
      anomaly: tag === "Anomaly"
        ? { perceived: "", sense: "", witnesses: "", natural: "" } : null
    };
    up(p => ({ ...p, log: [...p.log, entry] }));
    setText("");
  };
  const setA = (id, k, val) => up(p => ({
    ...p, log: p.log.map(e => e.id === id ? { ...e, anomaly: { ...(e.anomaly || {}), [k]: val } } : e)
  }));
  const del = id => up(p => ({ ...p, log: p.log.filter(e => e.id !== id) }));

  const entries = [...log].sort((a, b) => a.ts.localeCompare(b.ts));

  return (
    <>
      <textarea className="cp-ta" rows={2} value={text} placeholder="What just happened?"
        onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) add(); }} />
      <div className="cp-row" style={{ margin: "8px 0" }}>
        {TAGS.map(t => (
          <button key={t} className="cp-tagbtn" data-on={tag === t ? "1" : "0"}
            data-danger={t === "Anomaly" ? "1" : "0"} onClick={() => setTag(t)}>{t}</button>
        ))}
      </div>
      <button className="cp-btn cp-btn--go" style={{ width: "100%" }} onClick={add}>
        <Plus size={17} /> Add timestamped entry
      </button>

      {entries.length === 0 && <p className="cp-empty">Log is empty.</p>}
      {entries.map(e => (
        <div className="cp-logline" data-tag={e.tag} key={e.id}>
          <div className="cp-row" style={{ justifyContent: "space-between" }}>
            <span className="cp-ts cp-mono">{clockOf(e.ts)} · {e.tag}</span>
            <button className="cp-btn cp-btn--sm cp-btn--ghost" onClick={() => del(e.id)} aria-label="Delete entry">
              <Trash2 size={14} />
            </button>
          </div>
          <div style={{ fontSize: 15, whiteSpace: "pre-wrap" }}>{e.text}</div>
          {e.anomaly && (
            <div style={{ marginTop: 6 }}>
              <Area label="What was perceived" rows={2} value={e.anomaly.perceived} onChange={x => setA(e.id, "perceived", x)} />
              <label className="cp-label">Which sense</label>
              <select className="cp-select" value={e.anomaly.sense} onChange={ev => setA(e.id, "sense", ev.target.value)}>
                <option value="">Choose…</option>
                {SENSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <Field label="Corroborating witnesses" value={e.anomaly.witnesses} onChange={x => setA(e.id, "witnesses", x)}
                placeholder="Who else caught it" />
              <Area label="Possible natural explanation" rows={2} value={e.anomaly.natural}
                onChange={x => setA(e.id, "natural", x)}
                placeholder="Pipes, settling, traffic, drafts, your own eyes" />
            </div>
          )}
        </div>
      ))}
    </>
  );
}

/* -------------------------- 8. Media ------------------------------ */

function MediaSection({ caseId, media, log, pins, up }) {
  const [blobs, setBlobs] = useState({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const [rec, setRec] = useState(null);
  const [secs, setSecs] = useState(0);
  const photoIn = useRef(null), camIn = useRef(null), audioIn = useRef(null), videoIn = useRef(null), vcamIn = useRef(null);

  useEffect(() => {
    let dead = false;
    (async () => {
      for (const m of media) {
        if (blobs[m.id]) continue;
        const stored = await S.get(K.media(caseId, m.id));
        if (dead) return;
        if (stored && stored.dataUrl) setBlobs(b => ({ ...b, [m.id]: stored.dataUrl }));
      }
    })();
    return () => { dead = true; };
  }, [media.length, caseId]);

  useEffect(() => {
    if (!rec) return;
    const t = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [rec]);

  const store = async (dataUrl, kind, mime, name) => {
    setErr("");
    if (dataUrl.length > MAX_VALUE_CHARS) {
      setErr(`"${name}" is about ${kb(dataUrl.length * 0.75)} once encoded, over the ~4.5 MB per-item storage ceiling. Nothing was saved and nothing was altered. Trim the clip or shoot at a lower resolution, then try again.`);
      return;
    }
    const id = uid();
    let ok = true;
    try {
      ok = await S.set(K.media(caseId, id), { kind, mime, name, dataUrl });
    } catch (e) {
      setErr(`"${name}" is too large for one storage slot, so it was not added to the case.`);
      return;
    }
    if (!ok) setErr(`"${name}" is attached and usable now, but it did not reach permanent storage (${S.status().error || "unknown reason"}). Export the case to keep it.`);
    setBlobs(b => ({ ...b, [id]: dataUrl }));
    up(p => ({
      ...p,
      media: [...p.media, {
        id, kind, mime, name, size: dataUrl.length, caption: "",
        ts: nowISO(), linkKind: "", linkId: ""
      }]
    }));
  };

  const onPick = async (e, kind) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    for (const f of files) {
      setBusy(`Processing ${f.name}…`);
      try {
        const data = kind === "photo" ? await compressImage(f) : await readAsDataURL(f);
        await store(data, kind, f.type || "application/octet-stream", f.name);
      } catch (er) {
        setErr(`${f.name}: ${er.message}`);
      }
    }
    setBusy("");
  };

  const startRec = async () => {
    setErr("");
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      setErr("In-app recording is unavailable: this browser exposes no MediaRecorder. Record on your phone's own app and upload the file.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks = [];
      mr.ondataavailable = ev => { if (ev.data.size) chunks.push(ev.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: mr.mimeType || "audio/webm" });
        setBusy("Saving recording…");
        try {
          const data = await readAsDataURL(blob);
          await store(data, "audio", blob.type, `EVP ${clockOf(nowISO())}`);
        } catch (er) { setErr(er.message); }
        setBusy("");
      };
      mr.start();
      setSecs(0);
      setRec(mr);
    } catch (e) {
      setErr(`Microphone unavailable: ${e.message}. Record in another app and upload the file below.`);
    }
  };

  const stopRec = () => { if (rec && rec.state !== "inactive") rec.stop(); setRec(null); };

  const setMeta = (id, k, val) => up(p => ({ ...p, media: p.media.map(m => m.id === id ? { ...m, [k]: val } : m) }));
  const del = async id => {
    await S.del(K.media(caseId, id));
    setBlobs(b => { const n = { ...b }; delete n[id]; return n; });
    up(p => ({ ...p, media: p.media.filter(m => m.id !== id) }));
  };

  const linkOptions = [
    ...log.map(e => ({ v: `log:${e.id}`, l: `Log ${clockOf(e.ts)} — ${e.text.slice(0, 34)}` })),
    ...pins.map(p => ({ v: `pin:${p.id}`, l: `Pin — ${p.label || "unlabeled"}` }))
  ];

  const photos = media.filter(m => m.kind === "photo");
  const others = media.filter(m => m.kind !== "photo");

  const meta = m => (
    <React.Fragment key={m.id + "-meta"}>
      <input className="cp-input" placeholder="Caption" value={m.caption}
        onChange={e => setMeta(m.id, "caption", e.target.value)} style={{ marginTop: 6 }} />
      <div className="cp-row" style={{ marginTop: 6 }}>
        <select className="cp-select" style={{ flex: 1 }}
          value={m.linkKind && m.linkId ? `${m.linkKind}:${m.linkId}` : ""}
          onChange={e => {
            const [k, i] = e.target.value.split(":");
            setMeta(m.id, "linkKind", k || ""); setMeta(m.id, "linkId", i || "");
          }}>
          <option value="">Not linked</option>
          {linkOptions.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
        <button className="cp-btn cp-btn--icon cp-btn--ghost" onClick={() => del(m.id)} aria-label="Delete media">
          <Trash2 size={16} />
        </button>
      </div>
      <div className="cp-ts cp-mono" style={{ marginTop: 4 }}>{clockOf(m.ts)} · {kb(m.size * 0.75)}</div>
    </React.Fragment>
  );

  return (
    <>
      {err && <Warn>{err}</Warn>}
      {busy && <p className="cp-hint">{busy}</p>}

      <div className="cp-row">
        <button className="cp-btn" onClick={() => camIn.current.click()}>Take photo</button>
        <button className="cp-btn" onClick={() => photoIn.current.click()}>Upload photos</button>
        <button className="cp-btn" onClick={() => vcamIn.current.click()}>Record video</button>
        <button className="cp-btn" onClick={() => videoIn.current.click()}>Upload video</button>
        <button className="cp-btn" onClick={() => audioIn.current.click()}>Upload audio</button>
      </div>
      <div className="cp-row" style={{ marginTop: 8 }}>
        {!rec
          ? <button className="cp-btn cp-btn--go" onClick={startRec}><Mic size={17} /> Record audio</button>
          : <button className="cp-btn cp-btn--rec" onClick={stopRec}>
            <Square size={15} /> Stop · {pad(Math.floor(secs / 60))}:{pad(secs % 60)}
          </button>}
      </div>

      <input ref={camIn} type="file" accept="image/*" capture="environment" hidden onChange={e => onPick(e, "photo")} />
      <input ref={photoIn} type="file" accept="image/*" multiple hidden onChange={e => onPick(e, "photo")} />
      <input ref={vcamIn} type="file" accept="video/*" capture="environment" hidden onChange={e => onPick(e, "video")} />
      <input ref={videoIn} type="file" accept="video/*" hidden onChange={e => onPick(e, "video")} />
      <input ref={audioIn} type="file" accept="audio/*" multiple hidden onChange={e => onPick(e, "audio")} />

      <p className="cp-hint" style={{ marginTop: 10 }}>
        Photos are resized and compressed before saving. Audio and video are stored as-is, so anything
        over roughly 4.5 MB is refused with a message rather than half-saved.
      </p>

      {photos.length > 0 && <>
        <label className="cp-label">Photos</label>
        <div className="cp-thumbs">
          {photos.map(m => (
            <div key={m.id}>
              {blobs[m.id]
                ? <img className="cp-thumb" src={blobs[m.id]} alt={m.caption || m.name} />
                : <div className="cp-thumb" style={{ display: "grid", placeItems: "center" }}>
                  <span className="cp-hint">…</span></div>}
            </div>
          ))}
        </div>
        {photos.map(m => (
          <div className="cp-item" key={m.id}>
            <strong style={{ fontSize: 13 }} className="cp-mono">{m.name}</strong>
            {meta(m)}
          </div>
        ))}
      </>}

      {others.map(m => (
        <div className="cp-item" key={m.id}>
          <div className="cp-row" style={{ gap: 6 }}>
            {m.kind === "audio" ? <Play size={15} /> : <Film size={15} />}
            <strong style={{ fontSize: 13 }} className="cp-mono">{m.name}</strong>
          </div>
          {blobs[m.id]
            ? (m.kind === "audio"
              ? <audio controls src={blobs[m.id]} style={{ width: "100%", marginTop: 8 }} />
              : <video controls src={blobs[m.id]} style={{ width: "100%", marginTop: 8, borderRadius: 7 }} />)
            : <p className="cp-hint">Loading…</p>}
          {meta(m)}
        </div>
      ))}

      {media.length === 0 && <p className="cp-empty">No media captured yet.</p>}
    </>
  );
}

/* -------------------- 9. Post-investigation ----------------------- */

function AnalysisSection({ v, media, log, up }) {
  const set = (k, val) => up(p => ({ ...p, analysis: { ...p.analysis, [k]: val } }));
  const setClass = (key, val) => up(p => ({
    ...p, analysis: { ...p.analysis, classifications: { ...p.analysis.classifications, [key]: val } }
  }));
  const addF = () => up(p => ({
    ...p, analysis: { ...p.analysis, followups: [...p.analysis.followups, { id: uid(), text: "", done: false, date: "" }] }
  }));
  const setF = (id, k, val) => up(p => ({
    ...p, analysis: { ...p.analysis, followups: p.analysis.followups.map(f => f.id === id ? { ...f, [k]: val } : f) }
  }));
  const delF = id => up(p => ({
    ...p, analysis: { ...p.analysis, followups: p.analysis.followups.filter(f => f.id !== id) }
  }));

  const evidence = [
    ...media.map(m => ({ key: `media:${m.id}`, label: `${m.kind} — ${m.caption || m.name}` })),
    ...log.filter(e => e.tag === "Anomaly").map(e => ({ key: `log:${e.id}`, label: `Anomaly ${clockOf(e.ts)} — ${e.text.slice(0, 40)}` }))
  ];

  return (
    <>
      <Area label="Review notes" value={v.review} onChange={x => set("review", x)} rows={4}
        placeholder="What the footage and audio actually showed on review" />

      <label className="cp-label">Evidence classification</label>
      {evidence.length === 0 && <p className="cp-hint">Nothing to classify yet — media and anomaly entries show up here.</p>}
      {evidence.map(e => (
        <div className="cp-item" key={e.key}>
          <div style={{ fontSize: 14, marginBottom: 6 }}>{e.label}</div>
          <select className="cp-select" value={v.classifications[e.key] || "Unclassified"}
            onChange={ev => setClass(e.key, ev.target.value)}>
            {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      ))}

      <Area label="Debunking notes" value={v.debunk} onChange={x => set("debunk", x)} rows={4}
        placeholder="What natural causes you ruled out, and how you ruled them out" />
      <Area label="Conclusions" value={v.conclusions} onChange={x => set("conclusions", x)} rows={4} />

      <label className="cp-label">Follow-up actions</label>
      {v.followups.map(f => (
        <div className="cp-item" key={f.id}>
          <div className="cp-row" style={{ justifyContent: "space-between" }}>
            <Check checked={f.done} onChange={x => setF(f.id, "done", x)}>Done</Check>
            <button className="cp-btn cp-btn--sm cp-btn--ghost" onClick={() => delF(f.id)} aria-label="Delete follow-up">
              <Trash2 size={15} />
            </button>
          </div>
          <input className="cp-input" placeholder="What needs doing" value={f.text}
            onChange={e => setF(f.id, "text", e.target.value)} />
          <Field label="Return visit date" type="date" value={f.date} onChange={x => setF(f.id, "date", x)} />
        </div>
      ))}
      <button className="cp-btn" onClick={addF} style={{ marginTop: 8 }}><Plus size={16} /> Add follow-up</button>
    </>
  );
}

/* --------------------------- export ------------------------------- */

function toText(c, gear) {
  const L = [];
  const line = (k, v) => { if (v !== undefined && v !== null && String(v).trim() !== "") L.push(`${k}: ${v}`); };
  const head = t => { L.push("", "-".repeat(58), t.toUpperCase(), "-".repeat(58)); };

  L.push("THRESHOLD — FIELD RECORD", "=".repeat(58));
  line("Case number", c.caseNumber);
  line("Title", c.title || "(untitled)");
  line("Status", c.status);
  line("Date", c.date);
  line("Opened", c.createdAt);
  line("Last updated", c.updatedAt);

  head("1. Pre-investigation planning");
  line("Objective / hypothesis", c.plan.objective);
  line("Team", c.plan.team);
  line("Planned arrival", c.plan.arrival);
  line("Planned departure", c.plan.departure);
  line("Permission obtained", c.plan.permissionsObtained ? "yes" : "no");
  line("Permission notes", c.plan.permissionsNotes);
  line("Safety and hazards", c.plan.safety);
  line("Prior research", c.plan.research);

  head("2. Location profile");
  line("Name", c.location.name);
  line("Address", c.location.address);
  line("Description", c.location.description);
  line("Structure age / history", c.location.age);
  line("Prior reported activity", c.location.priorActivity);
  line("Access notes", c.location.access);
  c.location.witnesses.forEach((w, i) => {
    L.push("", `  Witness ${i + 1}: ${w.name || "unnamed"} (experience dated ${w.date || "unknown"})`);
    if (w.account) L.push(`  ${w.account}`);
  });

  head("3. Map and coordinates");
  if (!c.pins.length) L.push("(no pins)");
  c.pins.forEach(p => {
    L.push(`  ${p.label || "unlabeled"} — ${p.lat || "?"}, ${p.lng || "?"}${p.note ? ` — ${p.note}` : ""}`);
  });

  head("4. Weather conditions");
  line("Temperature", c.weather.temp);
  line("Humidity", c.weather.humidity);
  line("Barometric pressure", c.weather.pressure);
  line("Wind", c.weather.wind);
  line("Cloud cover", c.weather.cloud);
  line("Precipitation", c.weather.precip);
  line("Moon phase", c.weather.moon);
  line("Unusual", c.weather.notes);
  line("Source", c.weather.source);

  head("5. Equipment");
  gear.forEach(name => {
    const it = c.equipment[name];
    if (!it || (!it.brought && !it.used && !it.notes)) return;
    L.push(`  [${it.brought ? "x" : " "}] brought  [${it.used ? "x" : " "}] used  ${name}${it.notes ? ` — ${it.notes}` : ""}`);
  });

  head("6. Environmental readings");
  ["baseline", "session"].forEach(ph => {
    const rows = c.readings.filter(r => r.phase === ph);
    L.push("", `  ${ph === "baseline" ? "Baseline" : "During session"}:`);
    if (!rows.length) L.push("  (none)");
    rows.forEach(r => L.push(
      `  ${r.time || "--:--"}  ${r.area || "?"} | EMF ${r.emf || "-"} | ${r.temp || "-"} | RH ${r.humidity || "-"} | ${r.db || "-"} dB${r.notes ? ` | ${r.notes}` : ""}`
    ));
  });

  head("7. Session log");
  if (!c.log.length) L.push("(empty)");
  [...c.log].sort((a, b) => a.ts.localeCompare(b.ts)).forEach(e => {
    L.push("", `  ${clockOf(e.ts)}  [${e.tag}]  ${e.text}`);
    if (e.anomaly) {
      if (e.anomaly.perceived) L.push(`     perceived: ${e.anomaly.perceived}`);
      if (e.anomaly.sense) L.push(`     sense: ${e.anomaly.sense}`);
      if (e.anomaly.witnesses) L.push(`     corroborated by: ${e.anomaly.witnesses}`);
      if (e.anomaly.natural) L.push(`     possible natural cause: ${e.anomaly.natural}`);
    }
  });

  head("8. Media");
  if (!c.media.length) L.push("(none)");
  c.media.forEach(m => L.push(
    `  ${clockOf(m.ts)}  ${m.kind}  ${m.name}${m.caption ? ` — ${m.caption}` : ""}${m.linkId ? `  [linked to ${m.linkKind} ${m.linkId}]` : ""}`
  ));
  if (c.media.length) L.push("  (files themselves are in the JSON archive, not this text file)");

  head("9. Post-investigation analysis");
  line("Review notes", c.analysis.review);
  const cls = Object.entries(c.analysis.classifications || {});
  if (cls.length) {
    L.push("", "  Classifications:");
    cls.forEach(([k, v]) => L.push(`    ${k} → ${v}`));
  }
  line("Debunking notes", c.analysis.debunk);
  line("Conclusions", c.analysis.conclusions);
  if (c.analysis.followups.length) {
    L.push("", "  Follow-up:");
    c.analysis.followups.forEach(f => L.push(`    [${f.done ? "x" : " "}] ${f.text}${f.date ? ` (return ${f.date})` : ""}`));
  }

  L.push("", `Exported ${nowISO()}`);
  return L.join("\n");
}

/* ------------------- printable case file (PDF) --------------------- */

/* ---- Cypher Protocol seal ---- */
const SEAL_FULL = `
  <g stroke="currentColor" fill="none" stroke-linecap="round">
    <circle cx="32" cy="32" r="30" stroke-width="1.9"/>
    <circle cx="32" cy="32" r="25.5" stroke-width="0.7"/>
    <g stroke-width="0.9">
      <line x1="32" y1="3.2" x2="32" y2="7.6"/>
      <line x1="32" y1="3.2" x2="32" y2="7.6" transform="rotate(90 32 32)"/>
      <line x1="32" y1="3.2" x2="32" y2="7.6" transform="rotate(180 32 32)"/>
      <line x1="32" y1="3.2" x2="32" y2="7.6" transform="rotate(270 32 32)"/>
    </g>
    <g stroke-width="0.7">
      <line x1="32" y1="3.6" x2="32" y2="6.4" transform="rotate(30 32 32)"/>
      <line x1="32" y1="3.6" x2="32" y2="6.4" transform="rotate(60 32 32)"/>
      <line x1="32" y1="3.6" x2="32" y2="6.4" transform="rotate(120 32 32)"/>
      <line x1="32" y1="3.6" x2="32" y2="6.4" transform="rotate(150 32 32)"/>
      <line x1="32" y1="3.6" x2="32" y2="6.4" transform="rotate(210 32 32)"/>
      <line x1="32" y1="3.6" x2="32" y2="6.4" transform="rotate(240 32 32)"/>
      <line x1="32" y1="3.6" x2="32" y2="6.4" transform="rotate(300 32 32)"/>
      <line x1="32" y1="3.6" x2="32" y2="6.4" transform="rotate(330 32 32)"/>
    </g>
    <path d="M 44.21 46.55 A 19 19 0 1 1 44.21 17.45" stroke-width="2.1"/>
  </g>
  <g fill="currentColor">
    <circle cx="32" cy="26" r="6"/>
    <path d="M 29.6 45 L 34.4 45 L 33.4 30 L 30.6 30 Z"/>
  </g>`;

/* Below ~32px the eight minor ticks turn to mud, so the small cut drops them
   and thickens what is left. */
const SEAL_SMALL = `
  <g stroke="currentColor" fill="none" stroke-linecap="round">
    <circle cx="32" cy="32" r="30" stroke-width="2.6"/>
    <circle cx="32" cy="32" r="25.5" stroke-width="1"/>
    <g stroke-width="1.4">
      <line x1="32" y1="3.2" x2="32" y2="7.6"/>
      <line x1="32" y1="3.2" x2="32" y2="7.6" transform="rotate(90 32 32)"/>
      <line x1="32" y1="3.2" x2="32" y2="7.6" transform="rotate(180 32 32)"/>
      <line x1="32" y1="3.2" x2="32" y2="7.6" transform="rotate(270 32 32)"/>
    </g>
    <path d="M 44.21 46.55 A 19 19 0 1 1 44.21 17.45" stroke-width="2.8"/>
  </g>
  <g fill="currentColor">
    <circle cx="32" cy="26" r="6"/>
    <path d="M 29.6 45 L 34.4 45 L 33.4 30 L 30.6 30 Z"/>
  </g>`;

/* size in px; colour is inherited from the surrounding text colour */
const seal = (size, cls = "") =>
  `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"` +
  (cls ? ` class="${cls}"` : "") + `>${size <= 34 ? SEAL_SMALL : SEAL_FULL}</svg>`;

/* explicit-colour copy for favicons and standalone files, where there is no
   inherited colour to pick up */
const sealInk = (size, colour = "#0B0E12") =>
  `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
  (size <= 34 ? SEAL_SMALL : SEAL_FULL).replace(/currentColor/g, colour) + `</svg>`;
const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const esc = v => String(v ?? "").replace(/[&<>"]/g, c => ESCAPES[c] || c);
const para = v => esc(v).replace(/\n/g, "<br>");
const NIL = `<span class="nil">N/A</span>`;
const val = v => (v !== undefined && v !== null && String(v).trim() !== "") ? para(v) : NIL;

const DOSSIER_CSS = `
@page { size: letter; margin: 0.55in 0.6in 0.6in; }
*{box-sizing:border-box;}
body{margin:0;color:#000;background:#fff;
  font:10.5pt/1.42 "Iowan Old Style","Palatino Linotype",Palatino,Georgia,"Times New Roman",serif;
  -webkit-print-color-adjust:exact; print-color-adjust:exact;}
.mono{font-family:"Courier New",Courier,monospace;}
.sheet{max-width:7.3in;margin:0 auto;padding:14px 0 40px;}
.case + .case{page-break-before:always;}
.masthead{border:1.5pt solid #000;margin-bottom:14px;}
.mh-top .seal{vertical-align:-4px;margin-right:7px;}
.vol .seal{display:block;margin:0 auto 18px;}
.mh-top{display:flex;justify-content:space-between;align-items:baseline;
  border-bottom:1pt solid #000;padding:6px 9px;font-family:"Courier New",Courier,monospace;
  font-size:8pt;letter-spacing:.14em;text-transform:uppercase;}
.mh-body{padding:9px 9px 4px;}
.mh-title{font-size:16pt;line-height:1.15;font-weight:600;margin:0 0 2px;}
.mh-grid{display:grid;grid-template-columns:repeat(4,1fr);border-top:1pt solid #000;}
.mh-cell{border-right:.5pt solid #000;padding:5px 9px;}
.mh-cell:last-child{border-right:0;}
.lab{font-family:"Courier New",Courier,monospace;font-size:6.8pt;letter-spacing:.16em;
  text-transform:uppercase;color:#000;display:block;margin-bottom:1px;}
.stamp{border:2pt solid #000;padding:2px 8px;font-family:"Courier New",Courier,monospace;
  font-size:8.5pt;letter-spacing:.2em;transform:rotate(-1.5deg);display:inline-block;}
.sec{margin:16px 0 0;page-break-inside:auto;}
.sec-h{display:flex;align-items:stretch;gap:8px;border-bottom:1.5pt solid #000;
  margin-bottom:7px;page-break-after:avoid;}
.sec-n{border:1pt solid #000;min-width:20px;text-align:center;padding:1px 4px;
  font-family:"Courier New",Courier,monospace;font-size:9pt;align-self:flex-end;margin-bottom:3px;}
.sec-t{flex:1;font-family:"Courier New",Courier,monospace;font-size:9.5pt;letter-spacing:.18em;
  text-transform:uppercase;align-self:flex-end;padding-bottom:4px;}
.f{border-bottom:.5pt dotted #555;padding:4px 0 5px;page-break-inside:avoid;break-inside:avoid;}
.f p{margin:0;}
.two{display:grid;grid-template-columns:1fr 1fr;gap:0 18px;}
.nil{font-family:"Courier New",Courier,monospace;font-size:8pt;letter-spacing:.12em;color:#777;}
table{width:100%;border-collapse:collapse;margin:5px 0 10px;font-size:9pt;page-break-inside:auto;}
th,td{border:.5pt solid #000;padding:3px 5px;text-align:left;vertical-align:top;}
th{font-family:"Courier New",Courier,monospace;font-size:7pt;letter-spacing:.1em;
  text-transform:uppercase;background:#e9e9e9;}
td.m{font-family:"Courier New",Courier,monospace;font-size:8.5pt;white-space:nowrap;}
tr{page-break-inside:avoid;break-inside:avoid;}
.sub{font-family:"Courier New",Courier,monospace;font-size:7.5pt;letter-spacing:.14em;
  text-transform:uppercase;margin:12px 0 3px;}
.entry{border-left:2pt solid #000;padding:3px 0 3px 9px;margin:7px 0;page-break-inside:avoid;break-inside:avoid;}
.entry.anom{border-left-width:4pt;}
.entry-h{font-family:"Courier New",Courier,monospace;font-size:8pt;letter-spacing:.08em;}
.anno{margin:3px 0 0 10px;font-size:9.5pt;}
.anno span{font-family:"Courier New",Courier,monospace;font-size:7pt;letter-spacing:.12em;
  text-transform:uppercase;}
.plates{display:block;font-size:0;}
.plate{display:inline-block;width:48.6%;vertical-align:top;box-sizing:border-box;
  margin:0 2.4% 12px 0;font-size:10pt;border:.75pt solid #000;padding:6px;
  break-inside:avoid;page-break-inside:avoid;-webkit-column-break-inside:avoid;}
.plate:nth-of-type(2n){margin-right:0;}
.plate img{width:100%;max-height:2.9in;object-fit:contain;display:block;background:#000;
  break-inside:avoid;page-break-inside:avoid;}
.plate .cap{font-size:8.5pt;margin-top:5px;}
.chk{font-family:"Courier New",Courier,monospace;}
.cert{border:1pt solid #000;padding:10px 11px;margin-top:20px;page-break-inside:avoid;break-inside:avoid;}
.sigline{border-bottom:.75pt solid #000;height:26px;margin-top:14px;}
.foot{border-top:1pt solid #000;margin-top:16px;padding-top:4px;
  font-family:"Courier New",Courier,monospace;font-size:7pt;letter-spacing:.14em;
  text-transform:uppercase;display:flex;justify-content:space-between;}
.vol{text-align:center;padding:1.4in 0 0;page-break-after:always;}
.vol h1{font-family:"Courier New",Courier,monospace;font-size:22pt;letter-spacing:.3em;margin:0 0 6px;}
.vol .rule{border-top:2pt solid #000;border-bottom:.5pt solid #000;height:4px;margin:16px auto;width:70%;}
@media screen{ body{background:#3a3d40;padding:18px;} .sheet{background:#fff;padding:26px 30px;box-shadow:0 4px 24px rgba(0,0,0,.4);} }
`;

function fld(label, value, cls = "") {
  return `<div class="f ${cls}"><span class="lab">${esc(label)}</span><p>${val(value)}</p></div>`;
}

function secHead(n, title) {
  return `<div class="sec-h"><div class="sec-n mono">${n}</div><div class="sec-t">${esc(title)}</div></div>`;
}

function dossierCase(c, gear, photos) {
  const P = [];
  const stampable = c.status === "Closed" ? "case closed" : c.status === "Active" ? "active file" : "planned";

  P.push(`<div class="case">`);

  /* masthead */
  P.push(`<div class="masthead">
    <div class="mh-top"><span>${seal(15, "seal")}Cypher Protocol — field investigation record</span><span>Form CP-1</span></div>
    <div class="mh-body">
      <span class="lab">Case title</span>
      <h2 class="mh-title">${c.title ? esc(c.title) : "Untitled case"}</h2>
    </div>
    <div class="mh-grid">
      <div class="mh-cell"><span class="lab">Case number</span><span class="mono">${esc(c.caseNumber)}</span></div>
      <div class="mh-cell"><span class="lab">Date of record</span><span class="mono">${esc(c.date)}</span></div>
      <div class="mh-cell"><span class="lab">Status</span><span class="mono">${esc(stampable)}</span></div>
      <div class="mh-cell"><span class="lab">Opened</span><span class="mono">${esc(dayOf(c.createdAt))}</span></div>
    </div>
  </div>`);

  /* 1 */
  P.push(`<div class="sec">${secHead(1, "Pre-investigation planning")}
    ${fld("Objective / hypothesis", c.plan.objective)}
    ${fld("Team members present", c.plan.team)}
    <div class="two">${fld("Planned arrival", c.plan.arrival)}${fld("Planned departure", c.plan.departure)}</div>
    ${fld("Permission obtained", `${c.plan.permissionsObtained ? "[X] yes   [ ] no" : "[ ] yes   [X] no"}${c.plan.permissionsNotes ? "\n" + c.plan.permissionsNotes : ""}`)}
    ${fld("Safety considerations and hazards", c.plan.safety)}
    ${fld("Research completed beforehand", c.plan.research)}
  </div>`);

  /* 2 */
  const wit = c.location.witnesses.map((w, i) => `<div class="entry">
      <div class="entry-h">Witness ${pad(i + 1)} — ${esc(w.name || "name withheld")} · experience dated ${esc(w.date || "unknown")}</div>
      <p style="margin:3px 0 0">${val(w.account)}</p></div>`).join("");
  P.push(`<div class="sec">${secHead(2, "Location profile")}
    <div class="two">${fld("Location name", c.location.name)}${fld("Structure age / history", c.location.age)}</div>
    ${fld("Address", c.location.address)}
    ${fld("Description", c.location.description)}
    ${fld("Prior reported activity", c.location.priorActivity)}
    ${fld("Access notes", c.location.access)}
    <div class="sub">Witness testimony</div>
    ${wit || `<p>${NIL}</p>`}
  </div>`);

  /* 3 */
  const pins = c.pins.length ? `<table><thead><tr><th>Ref</th><th>Label</th><th>Latitude</th><th>Longitude</th><th>Note</th></tr></thead><tbody>
    ${c.pins.map((p, i) => `<tr><td class="m">P-${pad(i + 1)}</td><td>${val(p.label)}</td>
      <td class="m">${val(p.lat)}</td><td class="m">${val(p.lng)}</td><td>${val(p.note)}</td></tr>`).join("")}
    </tbody></table>` : `<p>${NIL}</p>`;
  P.push(`<div class="sec">${secHead(3, "Coordinates and pinned points")}${pins}</div>`);

  /* 4 */
  P.push(`<div class="sec">${secHead(4, "Weather conditions")}
    <table><tbody>
      <tr><th>Temperature</th><td class="m">${val(c.weather.temp)}</td><th>Humidity</th><td class="m">${val(c.weather.humidity)}</td></tr>
      <tr><th>Pressure</th><td class="m">${val(c.weather.pressure)}</td><th>Wind</th><td class="m">${val(c.weather.wind)}</td></tr>
      <tr><th>Cloud cover</th><td class="m">${val(c.weather.cloud)}</td><th>Precipitation</th><td class="m">${val(c.weather.precip)}</td></tr>
      <tr><th>Moon phase</th><td class="m" colspan="3">${val(c.weather.moon)}</td></tr>
    </tbody></table>
    ${fld("Unusual conditions", c.weather.notes)}
    ${c.weather.source ? `<p class="lab">${esc(c.weather.source)}</p>` : ""}
  </div>`);

  /* 5 */
  const used = gear.filter(n => { const it = c.equipment[n]; return it && (it.brought || it.used || it.notes); });
  P.push(`<div class="sec">${secHead(5, "Equipment record")}
    ${used.length ? `<table><thead><tr><th>Item</th><th style="width:52px">Brought</th><th style="width:44px">Used</th><th>Notes / settings / serial</th></tr></thead><tbody>
      ${used.map(n => { const it = c.equipment[n]; return `<tr><td>${esc(n)}</td>
        <td class="chk" style="text-align:center">${it.brought ? "X" : "&nbsp;"}</td>
        <td class="chk" style="text-align:center">${it.used ? "X" : "&nbsp;"}</td>
        <td>${val(it.notes)}</td></tr>`; }).join("")}
    </tbody></table>` : `<p>${NIL}</p>`}
  </div>`);

  /* 6 */
  const readTable = phase => {
    const rows = c.readings.filter(r => r.phase === phase);
    if (!rows.length) return `<p>${NIL}</p>`;
    return `<table><thead><tr><th>Time</th><th>Room / area</th><th>EMF</th><th>Temp</th><th>RH</th><th>dB</th><th>Notes</th></tr></thead><tbody>
      ${rows.map(r => `<tr><td class="m">${val(r.time)}</td><td>${val(r.area)}</td><td class="m">${val(r.emf)}</td>
        <td class="m">${val(r.temp)}</td><td class="m">${val(r.humidity)}</td><td class="m">${val(r.db)}</td>
        <td>${val(r.notes)}</td></tr>`).join("")}</tbody></table>`;
  };
  P.push(`<div class="sec">${secHead(6, "Environmental readings")}
    <div class="sub">Baseline</div>${readTable("baseline")}
    <div class="sub">Recorded during session</div>${readTable("session")}
  </div>`);

  /* 7 */
  const log = [...c.log].sort((a, b) => a.ts.localeCompare(b.ts));
  P.push(`<div class="sec">${secHead(7, "Session log")}
    ${log.length ? log.map(e => `<div class="entry ${e.tag === "Anomaly" ? "anom" : ""}">
      <div class="entry-h">${clockOf(e.ts)} &nbsp;·&nbsp; ${esc(e.tag)}</div>
      <p style="margin:2px 0 0">${para(e.text)}</p>
      ${e.anomaly ? `<div class="anno">
        <div><span>Perceived:</span> ${val(e.anomaly.perceived)}</div>
        <div><span>Sense:</span> ${val(e.anomaly.sense)}</div>
        <div><span>Corroborated by:</span> ${val(e.anomaly.witnesses)}</div>
        <div><span>Possible natural cause:</span> ${val(e.anomaly.natural)}</div>
      </div>` : ""}
    </div>`).join("") : `<p>${NIL}</p>`}
  </div>`);

  /* 8 — photographic plates + index of unprinted media */
  const shots = c.media.filter(m => m.kind === "photo" && photos[m.id]);
  const av = c.media.filter(m => m.kind !== "photo");
  P.push(`<div class="sec">${secHead(8, "Photographic exhibits")}
    ${shots.length ? `<div class="plates">${shots.map((m, i) => `<div class="plate">
      <img src="${photos[m.id]}" alt="">
      <div class="cap"><span class="lab">Plate ${pad(i + 1)} · ${clockOf(m.ts)}</span>${val(m.caption)}</div>
    </div>`).join("")}</div>` : `<p>${NIL}</p>`}
    <div class="sub">Audio and video held digitally — not printed</div>
    ${av.length ? `<table><thead><tr><th>Ref</th><th>Type</th><th>File</th><th>Time</th><th>Caption</th></tr></thead><tbody>
      ${av.map((m, i) => `<tr><td class="m">${m.kind === "audio" ? "A" : "V"}-${pad(i + 1)}</td>
        <td class="m">${esc(m.kind)}</td><td>${esc(m.name)}</td><td class="m">${clockOf(m.ts)}</td>
        <td>${val(m.caption)}</td></tr>`).join("")}</tbody></table>` : `<p>${NIL}</p>`}
  </div>`);

  /* 9 */
  const cls = Object.entries(c.analysis.classifications || {}).filter(([, v]) => v && v !== "Unclassified");
  const label = key => {
    const [kind, id] = key.split(":");
    if (kind === "media") { const m = c.media.find(x => x.id === id); return m ? `${m.kind} — ${m.caption || m.name}` : key; }
    const e = c.log.find(x => x.id === id);
    return e ? `Log ${clockOf(e.ts)} — ${e.text.slice(0, 60)}` : key;
  };
  P.push(`<div class="sec">${secHead(9, "Post-investigation analysis")}
    ${fld("Review notes", c.analysis.review)}
    <div class="sub">Evidence classification</div>
    ${cls.length ? `<table><thead><tr><th>Item</th><th style="width:110px">Finding</th></tr></thead><tbody>
      ${cls.map(([k, v]) => `<tr><td>${esc(label(k))}</td><td class="m">${esc(v)}</td></tr>`).join("")}
    </tbody></table>` : `<p>${NIL}</p>`}
    ${fld("Debunking — natural causes ruled out and how", c.analysis.debunk)}
    ${fld("Conclusions", c.analysis.conclusions)}
    <div class="sub">Follow-up actions</div>
    ${c.analysis.followups.length ? `<table><thead><tr><th style="width:40px">Done</th><th>Action</th><th style="width:110px">Return visit</th></tr></thead><tbody>
      ${c.analysis.followups.map(f => `<tr><td class="chk" style="text-align:center">${f.done ? "X" : "&nbsp;"}</td>
        <td>${val(f.text)}</td><td class="m">${val(f.date)}</td></tr>`).join("")}
    </tbody></table>` : `<p>${NIL}</p>`}
  </div>`);

  P.push(`<div class="cert">
    <span class="lab">Certification</span>
    <p style="margin:2px 0 0">The observations in this file were recorded during or immediately after the investigation described above. Interpretations are separated from observations. Nothing has been added after the fact except where noted in section 9.</p>
    <div class="two" style="gap:0 26px">
      <div><div class="sigline"></div><span class="lab">Investigator signature</span></div>
      <div><div class="sigline"></div><span class="lab">Date signed</span></div>
    </div>
  </div>`);

  P.push(`<div class="foot"><span>Form CP-1 · ${esc(c.caseNumber)}</span><span>Sheet ____ of ____</span></div>`);
  P.push(`</div>`);
  return P.join("\n");
}

function dossierHTML(cases, gear) {
  const many = cases.length > 1;
  const dates = cases.map(c => c.data.date).filter(Boolean).sort();
  const volume = many ? `<div class="vol">
    ${seal(76, "seal")}
    <h1>Cypher Protocol</h1>
    <div class="rule"></div>
    <p class="mono" style="letter-spacing:.2em">Cypher Protocol — Field Investigation Records</p>
    <p style="margin-top:22px">${cases.length} cases${dates.length ? ` · ${esc(dates[0])} to ${esc(dates[dates.length - 1])}` : ""}</p>
    <table style="margin-top:34px;text-align:left">
      <thead><tr><th>Case number</th><th>Date</th><th>Title</th><th>Location</th><th>Status</th></tr></thead>
      <tbody>${cases.map(({ data: c }) => `<tr><td class="m">${esc(c.caseNumber)}</td><td class="m">${esc(c.date)}</td>
        <td>${val(c.title)}</td><td>${val(c.location.name)}</td><td class="m">${esc(c.status)}</td></tr>`).join("")}</tbody>
    </table>
    <p class="lab" style="margin-top:30px">Compiled ${esc(dayOf(nowISO()))}</p>
  </div>` : "";

  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${cases.length === 1 ? esc(cases[0].data.caseNumber) : "Cypher Protocol archive"}</title>
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(sealInk(64))}">
<style>${DOSSIER_CSS}</style></head>
<body><div class="sheet">${volume}${cases.map(c => dossierCase(c.data, gear, c.photos)).join("\n")}</div></body></html>`;
}


function downloadLogo() {
  saveFile("cypher-protocol-seal.svg", sealInk(512), "image/svg+xml");
}

async function photosFor(c) {
  const out = {};
  for (const m of c.media.filter(x => x.kind === "photo")) {
    const rec = await S.get(K.media(c.id, m.id));
    if (rec && rec.dataUrl) out[m.id] = rec.dataUrl;
  }
  return out;
}

// Opens the system print dialog against a hidden frame. Returns false if the
// sandbox refuses, so the caller can fall back to downloading the file.
function printDoc(html) {
  try {
    const f = document.createElement("iframe");
    f.setAttribute("style", "position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0");
    document.body.appendChild(f);
    const d = f.contentWindow.document;
    d.open(); d.write(html); d.close();
    const go = () => {
      try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) {}
      setTimeout(() => { try { document.body.removeChild(f); } catch (e) {} }, 120000);
    };
    let waited = 0;
    const tick = () => {
      const imgs = Array.from(d.images || []);
      if (imgs.every(i => i.complete) || waited > 4000) return go();
      waited += 250;
      setTimeout(tick, 250);
    };
    setTimeout(tick, 300);
    return true;
  } catch (e) { return false; }
}

/* ------------------------- case detail ---------------------------- */

function CaseDetail({ id, onBack, onSaved, gear, addGear, removeGear, rail }) {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState({ 1: true });
  const [state, setState] = useState("Loading…");
  const [printMsg, setPrintMsg] = useState("");
  const [dbusy, setDbusy] = useState("");
  const [conflict, setConflict] = useState(null);
  const saved = useRef("");
  const docCache = useRef(null);
  const dataRef = useRef(null);
  const savedSummary = useRef("");

  useEffect(() => {
    let dead = false;
    (async () => {
      const c = await S.get(K.case(id));
      if (dead) return;
      if (!c) { setState("This case could not be loaded from storage."); return; }
      saved.current = JSON.stringify(c);
      savedSummary.current = JSON.stringify({ ...summarize(c), updatedAt: "" });
      setData(c);
      setState("Saved");
    })();
    return () => { dead = true; };
  }, [id]);

  useEffect(() => {
    if (!data) return;
    const snap = JSON.stringify(data);
    if (snap === saved.current) return;
    setState("Saving…");
    const t = setTimeout(async () => {
      const stamped = { ...data, updatedAt: nowISO() };
      let ok = true;
      try {
        ok = await S.set(K.case(id), stamped);
        saved.current = snap;
        setState(ok ? "Saved" : "Session only");
        const sum = summarize(stamped);
        const sumSnap = JSON.stringify({ ...sum, updatedAt: "" });
        if (sumSnap !== savedSummary.current) {
          savedSummary.current = sumSnap;
          onSaved(sum);
        }
      } catch (e) {
        setState("Not saved");
      }
    }, 650);
    return () => clearTimeout(t);
  }, [data]);

  dataRef.current = data;
  useEffect(() => { docCache.current = null; }, [data]);

  // Pull in edits made on another device. Never overwrites unsaved local work.
  useEffect(() => {
    let stop = false;
    const check = async () => {
      if (stop || document.hidden || !dataRef.current) return;
      const remote = await S.get(K.case(id));
      if (stop || !remote || !dataRef.current) return;
      const local = dataRef.current;
      if (bodyOf(remote) === bodyOf(local)) return;
      const unsaved = JSON.stringify(local) !== saved.current;
      if (unsaved) { setConflict(remote); return; }
      saved.current = JSON.stringify(remote);
      setData(remote);
      setState("Updated from another device");
    };
    const iv = setInterval(check, 8000);
    const onWake = () => check();
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);
    return () => {
      stop = true; clearInterval(iv);
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
    };
  }, [id]);

  const takeRemote = () => {
    if (!conflict) return;
    saved.current = JSON.stringify(conflict);
    setData(conflict);
    setConflict(null);
    setState("Updated from another device");
  };

  const up = useCallback(fn => setData(prev => (prev ? fn(prev) : prev)), []);
  const toggle = n => setOpen(o => ({ ...o, [n]: !o[n] }));

  const exportJson = async () => {
    const payload = { ...data, exportedAt: nowISO(), mediaFiles: {} };
    for (const m of data.media) {
      const rec = await S.get(K.media(id, m.id));
      if (rec) payload.mediaFiles[m.id] = rec;
    }
    const r = await saveFile(`${data.caseNumber}.json`, JSON.stringify(payload, null, 2), "application/json");
    setPrintMsg(saveResultMessage(r, "JSON archive"));
  };

  if (!data) return <div className="cp-wrap"><p className="cp-empty">{state}</p></div>;

  const gearAll = [...DEFAULT_GEAR, ...gear];

  const buildDoc = async () => {
    if (docCache.current) return docCache.current;
    const html = dossierHTML([{ data, photos: await photosFor(data) }], gearAll);
    docCache.current = html;
    return html;
  };
  const printCase = async () => {
    setDbusy("Assembling case file");
    setPrintMsg("Assembling case file…");
    const html = await buildDoc();
    const ok = printDoc(html);
    setDbusy("");
    setPrintMsg(ok
      ? "Print dialog opening. Choose Save as PDF. If no dialog appeared, use Download case file instead."
      : "The browser blocked printing. Use Download case file instead.");
  };
  const saveDoc = async () => {
    if (!docCache.current) { setDbusy("Assembling case file"); setPrintMsg("Assembling case file…"); }
    const html = await buildDoc();
    setDbusy("");
    const r = await saveFile(`${data.caseNumber}-case-file.html`, html, "text/html");
    setPrintMsg(saveResultMessage(r, "Case file") + (r === "shared" || r === "saved" || r === "downloaded"
      ? " Open it afterwards and print it to PDF." : ""));
  };

  const anomalies = data.log.filter(e => e.tag === "Anomaly").length;

  return (
    <div className="cp-wrap">
      {dbusy && <CoinLoad veil label={dbusy} />}
      <div className="cp-top">
        <div className="cp-row" style={{ justifyContent: "space-between" }}>
          {rail
            ? <div className="cp-row" style={{ gap: 6 }}>
              <button className="cp-btn cp-btn--sm cp-btn--ghost"
                onClick={() => setOpen({ 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true })}>
                Expand all
              </button>
              <button className="cp-btn cp-btn--sm cp-btn--ghost" onClick={() => setOpen({})}>Collapse all</button>
            </div>
            : <button className="cp-btn cp-btn--sm cp-btn--ghost" onClick={onBack}><ArrowLeft size={16} /> Cases</button>}
          <span className="cp-saving cp-mono">{state}</span>
        </div>
        <div style={{ marginTop: 8 }}>
          <div className="cp-mono" style={{ color: "var(--amber)", fontSize: 13 }}>{data.caseNumber}</div>
          <input className="cp-input" style={{ marginTop: 6, fontSize: 17, fontWeight: 600 }}
            placeholder="Case title" value={data.title}
            onChange={e => up(p => ({ ...p, title: e.target.value }))} />
        </div>
        <div className="cp-row" style={{ marginTop: 8 }}>
          {STATUSES.map(s => (
            <button key={s} className="cp-tagbtn" data-on={data.status === s ? "1" : "0"}
              onClick={() => up(p => ({ ...p, status: s }))}>{s}</button>
          ))}
          <input className="cp-input cp-mono" type="date" style={{ width: 168 }}
            value={data.date} onChange={e => up(p => ({ ...p, date: e.target.value }))} />
        </div>
      </div>

      {conflict && (
        <div className="cp-warn" style={{ alignItems: "flex-start" }}>
          <AlertTriangle size={16} style={{ flex: "0 0 auto", marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            This case was changed on another device while you had unsaved edits here.
            Loading theirs discards what you just typed. Keeping yours overwrites theirs on the next save.
            <div className="cp-row" style={{ marginTop: 8 }}>
              <button className="cp-btn cp-btn--sm" onClick={takeRemote}>Load theirs</button>
              <button className="cp-btn cp-btn--sm" onClick={() => setConflict(null)}>Keep mine</button>
            </div>
          </div>
        </div>
      )}

      <Section n="1" title="Pre-investigation planning" open={!!open[1]} onToggle={() => toggle(1)}
        summary={data.plan.permissionsObtained ? "permission ok" : ""}>
        <PlanSection v={data.plan} up={up} />
      </Section>

      <Section n="2" title="Location profile" open={!!open[2]} onToggle={() => toggle(2)}
        summary={data.location.witnesses.length ? `${data.location.witnesses.length} witnesses` : ""}>
        <LocationSection v={data.location} up={up} />
      </Section>

      <Section n="3" title="Map and coordinates" open={!!open[3]} onToggle={() => toggle(3)}
        summary={data.pins.length ? `${data.pins.length} pins` : ""}>
        <MapSection v={data} up={up} />
      </Section>

      <Section n="4" title="Weather conditions" open={!!open[4]} onToggle={() => toggle(4)}
        summary={data.weather.temp || ""}>
        <WeatherSection v={data.weather} pins={data.pins} up={up} />
      </Section>

      <Section n="5" title="Equipment checklist" open={!!open[5]} onToggle={() => toggle(5)}
        summary={`${Object.values(data.equipment).filter(e => e.brought).length} brought`}>
        <EquipmentSection v={data.equipment} up={up} customGear={gear}
          addCustomGear={addGear} removeCustomGear={removeGear} />
      </Section>

      <Section n="6" title="Environmental readings" open={!!open[6]} onToggle={() => toggle(6)}
        summary={data.readings.length ? `${data.readings.length} rows` : ""}>
        <ReadingsSection rows={data.readings} up={up} />
      </Section>

      <Section n="7" title="Session log" open={!!open[7]} onToggle={() => toggle(7)}
        summary={data.log.length ? `${data.log.length} entries${anomalies ? ` · ${anomalies} anomalies` : ""}` : ""}>
        <LogSection log={data.log} up={up} />
      </Section>

      <Section n="8" title="Media" open={!!open[8]} onToggle={() => toggle(8)}
        summary={data.media.length ? `${data.media.length} files` : ""}>
        <MediaSection caseId={id} media={data.media} log={data.log} pins={data.pins} up={up} />
      </Section>

      <Section n="9" title="Post-investigation analysis" open={!!open[9]} onToggle={() => toggle(9)}
        summary={data.analysis.followups.filter(f => !f.done).length ? `${data.analysis.followups.filter(f => !f.done).length} open` : ""}>
        <AnalysisSection v={data.analysis} media={data.media} log={data.log} up={up} />
      </Section>

      <div className="cp-row" style={{ marginTop: 18 }}>
        <button className="cp-btn cp-btn--go" onClick={printCase}>
          <Printer size={16} /> Print case file
        </button>
        <button className="cp-btn" onClick={saveDoc}>
          <Download size={16} /> Download case file
        </button>
      </div>
      {printMsg && <p className="cp-hint" style={{ marginTop: 8 }}>{printMsg}</p>}
      <div className="cp-row" style={{ marginTop: 10 }}>
        <button className="cp-btn" onClick={async () => {
          const r = await saveFile(`${data.caseNumber}.txt`, toText(data, gearAll), "text/plain");
          setPrintMsg(saveResultMessage(r, "Text report"));
        }}>
          <Download size={16} /> Text report
        </button>
        <button className="cp-btn" onClick={exportJson}>
          <Download size={16} /> JSON archive with media
        </button>
      </div>
    </div>
  );
}

function useWide() {
  const [wide, setWide] = useState(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(min-width: 980px)").matches : false);
  useEffect(() => {
    if (!window.matchMedia) return;
    const m = window.matchMedia("(min-width: 980px)");
    const h = e => setWide(e.matches);
    m.addEventListener ? m.addEventListener("change", h) : m.addListener(h);
    return () => { m.removeEventListener ? m.removeEventListener("change", h) : m.removeListener(h); };
  }, []);
  return wide;
}

/* --------------------------- case list ---------------------------- */


/* Spinning seal, used wherever the app makes you wait. `veil` covers the screen. */
function CoinLoad({ label = "Working", veil = false }) {
  const body = (
    <div className="cp-load">
      <span className="cp-coin" dangerouslySetInnerHTML={{ __html: seal(58) }} />
      <p className="cp-mono">{label}</p>
    </div>
  );
  return veil ? <div className="cp-veil">{body}</div> : body;
}


/* ==================================================================
   NEARBY — what is around you right now, from three sources.

   1. Shadowlands Haunted Places Index, scraped and geocoded by
      timothyrenner and republished via TidyTuesday. Fetched once, then
      cached in IndexedDB so it works with no signal afterwards. Folklore,
      not verified fact, and many coordinates are the centre of the town
      rather than the building itself.
   2. OpenStreetMap via Overpass — real mapped structures tagged as ruins,
      abandoned, or disused, plus cemeteries. Live query, needs signal, and
      Overpass rejects browser traffic often enough that mirrors matter.
   3. Wikipedia geosearch — articles about places near a point.
   ================================================================== */

const HAUNTED_CSV = "https://raw.githubusercontent.com/rfordatascience/tidytuesday/master/data/2023/2023-10-10/haunted_places.csv";
const HAUNTED_KEY = "nearby:haunted:v1";

const OVERPASS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter"
];

const R_EARTH_MI = 3958.8;
const toRad = d => d * Math.PI / 180;

function distanceMi(aLat, aLon, bLat, bLon) {
  const dLat = toRad(bLat - aLat), dLon = toRad(bLon - aLon);
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return R_EARTH_MI * 2 * Math.asin(Math.min(1, Math.sqrt(x)));
}

function bearing(aLat, aLon, bLat, bLon) {
  const y = Math.sin(toRad(bLon - aLon)) * Math.cos(toRad(bLat));
  const x = Math.cos(toRad(aLat)) * Math.sin(toRad(bLat)) -
    Math.sin(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.cos(toRad(bLon - aLon));
  const deg = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(deg / 45) % 8];
}

/* Minimal CSV reader that survives quoted fields with commas and newlines. */
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

async function loadHaunted(onProgress) {
  const cached = await S.get(HAUNTED_KEY);
  if (cached && cached.length) return cached;
  onProgress && onProgress("Downloading the haunted places index (one time)");
  const res = await fetch(HAUNTED_CSV, { cache: "force-cache" });
  if (!res.ok) throw new Error("index download failed (" + res.status + ")");
  const rows = parseCSV(await res.text());
  const head = rows.shift().map(h => h.trim().toLowerCase());
  const col = n => head.indexOf(n);
  const iDesc = col("description"), iLoc = col("location"), iCity = col("city"),
        iState = col("state"), iLat = col("latitude"), iLon = col("longitude"),
        iCLat = col("city_latitude"), iCLon = col("city_longitude");
  const out = [];
  for (const r of rows) {
    const lat = parseFloat(r[iLat]) || parseFloat(r[iCLat]);
    const lon = parseFloat(r[iLon]) || parseFloat(r[iCLon]);
    if (!isFinite(lat) || !isFinite(lon)) continue;
    const exact = isFinite(parseFloat(r[iLat]));
    out.push({
      n: (r[iLoc] || "").trim() || (r[iCity] || "").trim(),
      c: (r[iCity] || "").trim(),
      s: (r[iState] || "").trim(),
      d: (r[iDesc] || "").trim().slice(0, 400),
      lat, lon, exact
    });
  }
  try { await S.set(HAUNTED_KEY, out); } catch (e) { /* too big to cache; still usable now */ }
  return out;
}

async function queryOverpass(lat, lon, radiusMi) {
  const m = Math.round(radiusMi * 1609.34);
  const q = `[out:json][timeout:25];(
    node["historic"="ruins"](around:${m},${lat},${lon});
    way["historic"="ruins"](around:${m},${lat},${lon});
    node["building"="ruins"](around:${m},${lat},${lon});
    way["building"="ruins"](around:${m},${lat},${lon});
    node["abandoned"="yes"](around:${m},${lat},${lon});
    way["abandoned"="yes"](around:${m},${lat},${lon});
    node["place"="abandoned"](around:${m},${lat},${lon});
    node["historic"="tomb"](around:${m},${lat},${lon});
    way["landuse"="cemetery"](around:${m},${lat},${lon});
    node["amenity"="grave_yard"](around:${m},${lat},${lon});
  );out center 60;`;
  let lastErr = null;
  for (const base of OVERPASS) {
    try {
      // GET, not POST: it avoids the preflight that these servers reject.
      const res = await fetch(base + "?data=" + encodeURIComponent(q));
      if (!res.ok) { lastErr = new Error(base + " said " + res.status); continue; }
      const j = await res.json();
      return (j.elements || []).map(e => {
        const la = e.lat != null ? e.lat : (e.center && e.center.lat);
        const lo = e.lon != null ? e.lon : (e.center && e.center.lon);
        if (la == null || lo == null) return null;
        const t = e.tags || {};
        const kind = t.historic === "ruins" || t.building === "ruins" ? "ruins"
          : t.landuse === "cemetery" || t.amenity === "grave_yard" ? "cemetery"
          : t.place === "abandoned" ? "ghost town" : "abandoned";
        return { n: t.name || ("Unnamed " + kind), d: kind, lat: la, lon: lo, exact: true };
      }).filter(Boolean);
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error("no Overpass mirror answered");
}

async function queryWikipedia(lat, lon, radiusMi) {
  const m = Math.min(10000, Math.round(radiusMi * 1609.34));  // API caps at 10km
  const url = "https://en.wikipedia.org/w/api.php?action=query&list=geosearch" +
    `&gscoord=${lat}%7C${lon}&gsradius=${m}&gslimit=40&format=json&origin=*`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Wikipedia said " + res.status);
  const j = await res.json();
  return ((j.query && j.query.geosearch) || []).map(p => ({
    n: p.title, d: "Wikipedia article", lat: p.lat, lon: p.lon, exact: true,
    url: "https://en.wikipedia.org/wiki/" + encodeURIComponent(p.title.replace(/ /g, "_"))
  }));
}

function Nearby({ onStart, onClose }) {
  const [pos, setPos] = useState(null);
  const [radius, setRadius] = useState(15);
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState("");
  const [warn, setWarn] = useState([]);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(null);
  const [want, setWant] = useState({ haunted: true, osm: true, wiki: true });

  const run = async () => {
    setBusy(true); setRows([]); setWarn([]); setMsg("Getting your position");
    let here = pos;
    if (!here) {
      try {
        here = await new Promise((res, rej) => {
          if (!navigator.geolocation) return rej(new Error("no GPS in this browser"));
          navigator.geolocation.getCurrentPosition(
            p => res({ lat: p.coords.latitude, lon: p.coords.longitude }),
            e => rej(new Error(e.message || "location refused")),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
          );
        });
        setPos(here);
      } catch (e) {
        setBusy(false); setMsg("");
        setWarn([`Could not get your location: ${e.message}`]);
        return;
      }
    }

    const found = [], problems = [];

    if (want.haunted) {
      setMsg("Checking the haunted places index");
      try {
        const all = await loadHaunted(setMsg);
        for (const h of all) {
          const mi = distanceMi(here.lat, here.lon, h.lat, h.lon);
          if (mi <= radius) found.push({
            src: "Shadowlands", name: h.n, note: h.d,
            where: [h.c, h.s].filter(Boolean).join(", "),
            mi, dir: bearing(here.lat, here.lon, h.lat, h.lon),
            lat: h.lat, lon: h.lon, rough: !h.exact
          });
        }
      } catch (e) { problems.push("Haunted index unavailable: " + e.message); }
    }

    if (want.osm) {
      setMsg("Asking OpenStreetMap for ruins and abandoned sites");
      try {
        for (const o of await queryOverpass(here.lat, here.lon, radius)) {
          found.push({
            src: "OpenStreetMap", name: o.n, note: o.d, where: "",
            mi: distanceMi(here.lat, here.lon, o.lat, o.lon),
            dir: bearing(here.lat, here.lon, o.lat, o.lon),
            lat: o.lat, lon: o.lon, rough: false
          });
        }
      } catch (e) { problems.push("OpenStreetMap unavailable: " + e.message); }
    }

    if (want.wiki) {
      setMsg("Asking Wikipedia what is documented here");
      try {
        for (const w of await queryWikipedia(here.lat, here.lon, radius)) {
          found.push({
            src: "Wikipedia", name: w.n, note: w.d, where: "", url: w.url,
            mi: distanceMi(here.lat, here.lon, w.lat, w.lon),
            dir: bearing(here.lat, here.lon, w.lat, w.lon),
            lat: w.lat, lon: w.lon, rough: false
          });
        }
      } catch (e) { problems.push("Wikipedia unavailable: " + e.message); }
    }

    found.sort((a, b) => a.mi - b.mi);
    setRows(found);
    setWarn(problems);
    setMsg(found.length ? "" : "Nothing found within that radius.");
    setBusy(false);
  };

  return (
    <div className="cp-card" style={{ marginTop: 10 }}>
      <div className="cp-row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <strong className="cp-mono" style={{ letterSpacing: ".14em", fontSize: 12 }}>NEARBY</strong>
        <button className="cp-btn cp-btn--sm cp-btn--ghost" onClick={onClose}><X size={15} /></button>
      </div>

      <div className="cp-row" style={{ gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        {[5, 15, 30, 60].map(r => (
          <button key={r} className={"cp-chip" + (radius === r ? " cp-chip--on" : "")}
            onClick={() => setRadius(r)}>{r} mi</button>
        ))}
      </div>

      <div className="cp-row" style={{ gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {[["haunted", "Haunted index"], ["osm", "OpenStreetMap"], ["wiki", "Wikipedia"]].map(([k, label]) => (
          <button key={k} className={"cp-chip" + (want[k] ? " cp-chip--on" : "")}
            onClick={() => setWant(w => ({ ...w, [k]: !w[k] }))}>{label}</button>
        ))}
      </div>

      <button className="cp-btn cp-btn--go" style={{ width: "100%" }} onClick={run} disabled={busy}>
        <Crosshair size={16} /> {busy ? "Searching…" : "Search around me"}
      </button>

      {busy && <CoinLoad label={msg || "Searching"} />}
      {!busy && msg && <p className="cp-hint">{msg}</p>}

      {warn.map((w, i) => (
        <p key={i} className="cp-hint" style={{ color: "var(--amber)" }}>
          <AlertTriangle size={13} style={{ verticalAlign: -2, marginRight: 5 }} />{w}
        </p>
      ))}

      {rows.length > 0 && (
        <p className="cp-hint" style={{ marginTop: 10 }}>
          {rows.length} within {radius} miles. Many of these are private property —
          the sources say nothing about whether you may legally be there.
        </p>
      )}

      {rows.map((r, i) => (
        <div key={i} className="cp-item" style={{ cursor: "pointer" }}
          onClick={() => setOpen(open === i ? null : i)}>
          <div className="cp-row" style={{ justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontWeight: 600 }}>{r.name}</span>
            <span className="cp-mono cp-sub" style={{ whiteSpace: "nowrap" }}>
              {r.mi < 10 ? r.mi.toFixed(1) : Math.round(r.mi)} mi {r.dir}
            </span>
          </div>
          <div className="cp-sub cp-mono" style={{ fontSize: 11, marginTop: 3 }}>
            {r.src}{r.where ? " · " + r.where : ""}{r.rough ? " · town-centre coords" : ""}
          </div>

          {open === i && (
            <div style={{ marginTop: 8 }}>
              {r.note && <p className="cp-hint" style={{ marginTop: 0 }}>{r.note}</p>}
              <div className="cp-row" style={{ gap: 6, flexWrap: "wrap" }}>
                <button className="cp-btn cp-btn--sm" onClick={e => { e.stopPropagation(); onStart(r); }}>
                  <Plus size={14} /> Start a case here
                </button>
                <a className="cp-btn cp-btn--sm" onClick={e => e.stopPropagation()}
                  href={`https://maps.apple.com/?ll=${r.lat},${r.lon}&q=${encodeURIComponent(r.name)}`}
                  target="_blank" rel="noreferrer">Directions</a>
                {r.url && (
                  <a className="cp-btn cp-btn--sm" onClick={e => e.stopPropagation()}
                    href={r.url} target="_blank" rel="noreferrer">Read</a>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CaseList({ index, onOpen, onNew, onDelete, loading, onArchive, onBackup, onImport, rail, activeId }) {
  const [nearby, setNearby] = useState(false);
  const [q, setQ] = useState("");
  const [desc, setDesc] = useState(true);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    const f = index.filter(c => !t ||
      (c.title || "").toLowerCase().includes(t) ||
      (c.locationName || "").toLowerCase().includes(t) ||
      (c.caseNumber || "").toLowerCase().includes(t));
    return f.sort((a, b) => {
      const r = (a.date || "").localeCompare(b.date || "") || (a.caseNumber || "").localeCompare(b.caseNumber || "");
      return desc ? -r : r;
    });
  }, [index, q, desc]);

  return (
    <div className="cp-wrap">
      <div className="cp-top">
        <div className="cp-brand">
          <span className="cp-seal" dangerouslySetInnerHTML={{ __html: seal(26) }} />
          <h1 className="cp-title">Cypher Protocol</h1>
        </div>
        <p className="cp-sub cp-mono">{index.length} case{index.length === 1 ? "" : "s"} on file</p>
        <div className="cp-row" style={{ marginTop: 10 }}>
          <div style={{ flex: 1, position: "relative", minWidth: 180 }}>
            <Search size={16} style={{ position: "absolute", left: 11, top: 15, color: "var(--mute)" }} />
            <input className="cp-input" style={{ paddingLeft: 34 }} value={q}
              placeholder="Search title, location, case number"
              onChange={e => setQ(e.target.value)} />
          </div>
          <button className="cp-btn cp-btn--icon" onClick={() => setDesc(d => !d)}
            title="Sort by date">{desc ? "Newest" : "Oldest"}</button>
        </div>
        {rail && (
          <button className="cp-btn cp-btn--go" style={{ width: "100%", marginTop: 8 }} onClick={onNew}>
            <Plus size={18} /> New case
          </button>
        )}
        <div className="cp-row" style={{ marginTop: 8 }}>
          {index.length > 0 && <>
            <button className="cp-btn cp-btn--sm" onClick={() => onArchive(false)}>
              <Printer size={15} /> Print all
            </button>
            <button className="cp-btn cp-btn--sm" onClick={() => onArchive(true)}>
              <Printer size={15} /> Print file
            </button>
            <button className="cp-btn cp-btn--sm" onClick={onBackup}>
              <Download size={15} /> Back up
            </button>
          </>}
          <button className="cp-btn cp-btn--sm" onClick={onImport}>
            <Upload size={15} /> Restore
          </button>
          <button className="cp-btn cp-btn--sm" onClick={downloadLogo} title="Save the seal as an SVG for letterhead">
            <Download size={15} /> Seal
          </button>
          <button className={"cp-btn cp-btn--sm" + (nearby ? " cp-btn--go" : "")}
            onClick={() => setNearby(v => !v)} title="Find sites around you">
            <Crosshair size={15} /> Nearby
          </button>
        </div>
      </div>

      {nearby && <Nearby onClose={() => setNearby(false)}
        onStart={r => { setNearby(false); onNew(r); }} />}

      {loading && <CoinLoad label="Reading case files" />}
      {!loading && rows.length === 0 && (
        <p className="cp-empty">
          {index.length === 0
            ? "No cases yet. Open one before you head out — the planning section is the point."
            : "Nothing matches that search."}
        </p>
      )}

      {rows.map(c => (
        <div key={c.id} style={{ position: "relative" }}>
          <button className="cp-caseRow" onClick={() => onOpen(c.id)}
            style={c.id === activeId ? { borderColor: "var(--amber)" } : undefined}>
            <div className="cp-row" style={{ justifyContent: "space-between" }}>
              <span className="cp-mono" style={{ color: "var(--amber)", fontSize: 12 }}>{c.caseNumber}</span>
              <span className={`cp-chip cp-chip--${c.status}`}>{c.status}</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 550, margin: "4px 0 2px" }}>{c.title || "Untitled case"}</div>
            <div className="cp-hint">{c.locationName || "No location set"}</div>
            <div className="cp-hint cp-mono" style={{ marginTop: 2 }}>{c.date}</div>
          </button>
          <button className="cp-btn cp-btn--sm cp-btn--ghost"
            style={{ position: "absolute", right: 6, bottom: 8 }}
            onClick={() => onDelete(c)} aria-label={`Delete ${c.caseNumber}`}>
            <Trash2 size={15} />
          </button>
        </div>
      ))}

      {!rail && <button className="cp-btn cp-btn--go cp-fab" onClick={onNew}><Plus size={18} /> New case</button>}
    </div>
  );
}

/* ------------------------------ app ------------------------------- */

function CypherProtocol() {
  const [index, setIndex] = useState([]);
  const [gear, setGear] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const wide = useWide();
  const fileIn = useRef(null);
  const [sync, setSync] = useState({ at: null, others: [], checked: false });
  const archiveCache = useRef(null);
  const backupCache = useRef(null);
  const fresh = useRef(new Set());

  useEffect(() => {
    (async () => {
      const [i, g] = await Promise.all([S.get(K.index), S.get(K.gear)]);
      setIndex(Array.isArray(i) ? i : []);
      setGear(Array.isArray(g) ? g : []);
      setLoading(false);
      const probe = await S.set("cypher-protocol:probe", nowISO());
      if (!probe) setErr(`Storage is not accepting writes here (${S.status().error || "unknown reason"}). The app still works, but anything you enter lives only until you close this page. If you are in Private Browsing, leave it and reopen normally.`);
    })();
  }, []);

  const writeIndex = async next => {
    setIndex(next);
    try { await S.set(K.index, next); } catch (e) {}
  };

  const onSaved = useCallback(sum => {
    setIndex(prev => {
      const next = prev.some(c => c.id === sum.id)
        ? prev.map(c => (c.id === sum.id ? sum : c))
        : [...prev, sum];
      S.set(K.index, next).catch(() => {});
      return next;
    });
  }, []);

  const newCase = async seed => {
    const c = blankCase(nextCaseNumber(index));
    if (seed && seed.name) {
      c.title = seed.name;
      c.location.name = seed.name;
      c.location.address = seed.where || "";
      c.location.description = seed.note ? `${seed.src}: ${seed.note}` : `Found via ${seed.src}.`;
      c.location.priorActivity = seed.src === "Shadowlands" && seed.note ? seed.note : "";
      c.pins.push({
        id: uid(),
        label: seed.name,
        lat: Number(seed.lat).toFixed(6),
        lng: Number(seed.lon).toFixed(6),
        note: seed.rough ? "Town-centre coordinates from the index — refine on site." : "",
        ts: nowISO()
      });
    }
    fresh.current.add(c.id);
    setTimeout(() => fresh.current.delete(c.id), 45000);
    let ok = true;
    try { ok = await S.set(K.case(c.id), c); }
    catch (e) { ok = false; }
    await writeIndex([...index, summarize(c)]);
    setOpenId(c.id);
    if (!ok) setErr(`Case ${c.caseNumber} is open, but it is only held in this session — writing to storage failed (${S.status().error || "unknown reason"}). Export it before you close the tab.`);
  };

  const doDelete = async c => {
    setConfirm(null);
    const keys = await S.list(`media:${c.id}:`);
    for (const k of keys) await S.del(k);
    await S.del(K.case(c.id));
    await writeIndex(index.filter(x => x.id !== c.id));
  };

  // Poll the shared index so cases opened on another device show up here.
  useEffect(() => {
    let stop = false, ticks = 0;
    const check = async () => {
      if (stop || document.hidden) return;
      const remote = await S.get(K.index);
      if (stop) return;
      if (Array.isArray(remote)) {
        setIndex(local => {
          const keep = local.filter(c => fresh.current.has(c.id) && !remote.some(r => r.id === c.id));
          const merged = [...remote, ...keep];
          return JSON.stringify(merged) === JSON.stringify(local) ? local : merged;
        });
      }
      if (ticks % 4 === 0) {
        await pingBeacon();
        const others = await seenElsewhere();
        if (!stop) setSync({ at: Date.now(), others, checked: true });
      } else if (!stop) {
        setSync(s0 => ({ ...s0, at: Date.now(), checked: true }));
      }
      ticks++;
    };
    check();
    const iv = setInterval(check, 8000);
    const onWake = () => check();
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);
    return () => {
      stop = true; clearInterval(iv);
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
    };
  }, []);

  /* Storage is per browser on this device, so this only ever sees other tabs
     or windows here — not your other devices. Backup / Restore moves cases
     between devices. */
  const syncText = !sync.checked ? "Opening case store…"
    : sync.others.length
      ? `Saved on this device — also open in ${sync.others.length} other tab${sync.others.length === 1 ? "" : "s"}`
      : "Saved on this device";

  const printArchive = async asFile => {
    if (asFile && archiveCache.current) {
      const r = await saveFile(`case-log-archive-${dateStamp()}.html`, archiveCache.current, "text/html");
      setNote(saveResultMessage(r, "Archive"));
      return;
    }
    setBusy("Assembling archive");
    setNote(`Assembling ${index.length} case${index.length === 1 ? "" : "s"} — photos take a moment…`);
    const items = [];
    const ordered = [...index].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    for (const row of ordered) {
      const c = await S.get(K.case(row.id));
      if (!c) continue;
      items.push({ data: c, photos: await photosFor(c) });
    }
    if (!items.length) { setNote("No case files could be read."); return; }
    const html = dossierHTML(items, [...DEFAULT_GEAR, ...gear]);
    archiveCache.current = html;
    setTimeout(() => { archiveCache.current = null; }, 120000);
    if (asFile) {
      setBusy("");
      const r = await saveFile(`case-log-archive-${dateStamp()}.html`, html, "text/html");
      setNote(saveResultMessage(r, "Archive") + " Open it afterwards and print it to PDF.");
    } else {
      const ok = printDoc(html);
      setNote(ok
        ? "Print dialog opening. Choose Save as PDF. If nothing appeared, use Download archive."
        : "The browser blocked printing. Use Download archive instead.");
    }
  };

  const backupAll = async () => {
    if (backupCache.current) {
      const r = await saveFile(`case-log-backup-${dateStamp()}.json`, backupCache.current, "application/json");
      setNote(saveResultMessage(r, "Backup"));
      return;
    }
    setBusy("Packing archive");
    setNote("Packing every case and photo — this can take a moment…");
    const payload = { app: "case-log", version: 1, exportedAt: nowISO(), customGear: gear, cases: [] };
    for (const row of index) {
      const c = await S.get(K.case(row.id));
      if (!c) continue;
      const mediaFiles = {};
      for (const m of c.media) {
        const rec = await S.get(K.media(c.id, m.id));
        if (rec) mediaFiles[m.id] = rec;
      }
      payload.cases.push({ ...c, mediaFiles });
    }
    const text = JSON.stringify(payload);
    backupCache.current = text;
    setTimeout(() => { backupCache.current = null; }, 120000);
    setBusy("");
    const r = await saveFile(`case-log-backup-${dateStamp()}.json`, text, "application/json");
    setNote(`${payload.cases.length} case${payload.cases.length === 1 ? "" : "s"} packed. ` + saveResultMessage(r, "Backup"));
  };

  const restore = async file => {
    setNote("Reading backup…");
    let obj;
    try { obj = JSON.parse(await file.text()); }
    catch (e) { setNote("That file is not readable JSON. Nothing was changed."); return; }
    const incoming = Array.isArray(obj && obj.cases) ? obj.cases
      : (obj && obj.caseNumber ? [obj] : null);
    if (!incoming || !incoming.length) { setNote("No cases found in that file. Nothing was changed."); return; }

    let added = 0, updated = 0, skipped = 0, mediaFail = 0;
    let next = [...index];
    for (const raw of incoming) {
      const { mediaFiles = {}, exportedAt, ...body } = raw;
      if (!body.id || !body.caseNumber) { skipped++; continue; }
      const existing = next.find(x => x.id === body.id);
      if (existing && (existing.updatedAt || "") >= (body.updatedAt || "")) { skipped++; continue; }
      try { await S.set(K.case(body.id), body); }
      catch (e) { skipped++; continue; }
      for (const [mid, rec] of Object.entries(mediaFiles)) {
        try { const ok = await S.set(K.media(body.id, mid), rec); if (!ok) mediaFail++; }
        catch (e) { mediaFail++; }
      }
      next = existing ? next.map(x => x.id === body.id ? summarize(body) : x) : [...next, summarize(body)];
      existing ? updated++ : added++;
    }
    if (Array.isArray(obj.customGear) && obj.customGear.length) {
      const merged = [...new Set([...gear, ...obj.customGear])];
      setGear(merged);
      try { await S.set(K.gear, merged); } catch (e) {}
    }
    await writeIndex(next);
    setNote(`Restored ${added} new case${added === 1 ? "" : "s"}, updated ${updated}, left ${skipped} alone because this device already had them or newer.` +
      (mediaFail ? ` ${mediaFail} media file${mediaFail === 1 ? "" : "s"} would not fit in storage and were not restored.` : ""));
  };

  const addGear = async name => {
    const next = [...gear, name];
    setGear(next);
    try { await S.set(K.gear, next); } catch (e) {}
  };
  const removeGear = async name => {
    const next = gear.filter(g => g !== name);
    setGear(next);
    try { await S.set(K.gear, next); } catch (e) {}
  };

  return (
    <div className="cp-root">
      <style>{APP_CSS}</style>
      {err && <div className="cp-wrap" style={{ paddingTop: 10 }}><Warn>{err}</Warn></div>}
      <div className="cp-wrap" style={{ paddingTop: 8, paddingBottom: 0 }}>
        <div className="cp-syncbar cp-mono">
          <span className="cp-dot" data-live={sync.others.length ? "1" : "0"} />{syncText}
        </div>
      </div>
      {busy && <CoinLoad veil label={busy} />}
      {note && <div className="cp-wrap" style={{ paddingTop: 10 }}>
        <div className="cp-note">{note}
          <button className="cp-btn cp-btn--sm cp-btn--ghost" style={{ marginLeft: 8 }}
            onClick={() => setNote("")}>Dismiss</button></div></div>}

      <input ref={fileIn} type="file" accept="application/json,.json" hidden
        onChange={e => { const f = e.target.files && e.target.files[0]; e.target.value = ""; if (f) restore(f); }} />

      {wide ? (
        <div className="cp-shell">
          <aside className="cp-rail">
            <CaseList index={index} loading={loading} onOpen={setOpenId} onNew={newCase}
              onDelete={c => setConfirm(c)} onArchive={printArchive} onBackup={backupAll}
              onImport={() => fileIn.current && fileIn.current.click()} rail activeId={openId} />
          </aside>
          <main className="cp-detail">
            {openId
              ? <CaseDetail key={openId} id={openId} onBack={() => setOpenId(null)} onSaved={onSaved}
                gear={gear} addGear={addGear} removeGear={removeGear} rail />
              : <p className="cp-empty" style={{ paddingTop: 80 }}>
                Pick a case on the left, or open a new one.</p>}
          </main>
        </div>
      ) : (openId
        ? <CaseDetail id={openId} onBack={() => setOpenId(null)} onSaved={onSaved}
          gear={gear} addGear={addGear} removeGear={removeGear} />
        : <CaseList index={index} loading={loading} onOpen={setOpenId} onNew={newCase}
          onDelete={c => setConfirm(c)} onArchive={printArchive} onBackup={backupAll}
          onImport={() => fileIn.current && fileIn.current.click()} />)}

      {confirm && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(4,6,8,.8)", display: "grid",
          placeItems: "center", zIndex: 60, padding: 18
        }}>
          <div className="cp-card" style={{ maxWidth: 380, padding: 18 }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 17 }}>Delete {confirm.caseNumber}?</h3>
            <p className="cp-hint">This removes the case and every photo, recording and clip attached to it. Export it first if you want to keep it.</p>
            <div className="cp-row" style={{ marginTop: 14, justifyContent: "flex-end" }}>
              <button className="cp-btn" onClick={() => setConfirm(null)}>Keep it</button>
              <button className="cp-btn cp-btn--rec" onClick={() => doDelete(confirm)}>Delete case</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


/* ---------------------------- mount ------------------------------ */
const rootEl = document.getElementById("root");
ReactDOM.createRoot(rootEl).render(React.createElement(CypherProtocol));

/* Offline support: register the service worker once the page is up. */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
