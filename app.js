const futbolistas = [
"Pelé",
"Diego Maradona",
"Lionel Messi",
"Cristiano Ronaldo",
"Johan Cruyff",
"Zinedine Zidane",
"Ronaldo Nazário",
"Franz Beckenbauer",
"Alfredo Di Stéfano",
"Ronaldinho",
];

const segmentos = {
"G1": "Generación clásica (antes del 2000)",
"G2": "Generación moderna (2000–2015)",
"G3": "Generación actual (2015–presente)",
"T": "Interés táctico",
"E": "Interés estadístico",
};

const contextos = {
"T": "¿Quién fue más talentoso técnicamente?",
"I": "¿Quién tuvo mayor impacto histórico?",
"G": "¿Quién fue más determinante en momentos grandes?",
"C": "¿Quién tuvo mejor carrera en términos de títulos?",
};

const RATING_INICIAL = 1000;
const K = 32;
const STORAGE_KEY = "footballmash_state_v1";

function defaultState(){
const buckets = {};
for (const seg of Object.keys(segmentos)){
for (const ctx of Object.keys(contextos)){
const key = `${seg}__${ctx}`;
buckets[key] = {};
futbolistas.forEach(f => buckets[key][f] = RATING_INICIAL);
}
}
return { buckets, votes: [] };
}

function loadState(){
const raw = localStorage.getItem(STORAGE_KEY);
if (!raw) return defaultState();
try { return JSON.parse(raw); }
catch { return defaultState(); }
}

function saveState(){
localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

let state = loadState();

function expectedScore(ra, rb){
return 1 / (1 + Math.pow(10, (rb - ra) / 400));
}

function updateElo(bucket, A, B, winner){
const ra = bucket[A], rb = bucket[B];
const ea = expectedScore(ra, rb);
const eb = expectedScore(rb, ra);

const sa = (winner === "A") ? 1 : 0;
const sb = (winner === "B") ? 1 : 0;

bucket[A] = ra + K * (sa - ea);
bucket[B] = rb + K * (sb - eb);
}

function randomPair(){
const a = futbolistas[Math.floor(Math.random() * futbolistas.length)];
let b = a;
while (b === a){
b = futbolistas[Math.floor(Math.random() * futbolistas.length)];
}
return [a, b];
}

function bucketKey(seg, ctx){ return `${seg}__${ctx}`; }

function topN(bucket, n=10){
const arr = Object.entries(bucket).map(([f, rating]) => ({f, rating}));
arr.sort((x,y) => y.rating - x.rating);
return arr.slice(0, n);
}

const segmentSelect = document.getElementById("segmentSelect");
const contextSelect = document.getElementById("contextSelect");
const questionEl = document.getElementById("question");
const labelA = document.getElementById("labelA");
const labelB = document.getElementById("labelB");
const btnA = document.getElementById("btnA");
const btnB = document.getElementById("btnB");
const btnNewPair = document.getElementById("btnNewPair");
const btnShowTop = document.getElementById("btnShowTop");
const topBox = document.getElementById("topBox");
const btnReset = document.getElementById("btnReset");
const btnExport = document.getElementById("btnExport");

let currentA = null;
let currentB = null;

function fillSelect(selectEl, obj){
selectEl.innerHTML = "";
for (const [k, v] of Object.entries(obj)){
const opt = document.createElement("option");
opt.value = k;
opt.textContent = `${k} — ${v}`;
selectEl.appendChild(opt);
}
}

fillSelect(segmentSelect, segmentos);
fillSelect(contextSelect, contextos);

segmentSelect.value = "G1";
contextSelect.value = "T";

function refreshQuestion(){
questionEl.textContent = contextos[contextSelect.value];
}

function newDuel(){
[currentA, currentB] = randomPair();
labelA.textContent = currentA;
labelB.textContent = currentB;
refreshQuestion();
}

function renderTop(){
const seg = segmentSelect.value;
const ctx = contextSelect.value;
const bucket = state.buckets[bucketKey(seg, ctx)];

const rows = topN(bucket, 10);
topBox.innerHTML = rows.map((r, idx) => `     <div class="toprow">       <div><b>${idx+1}.</b> ${r.f}</div>       <div>${r.rating.toFixed(1)}</div>     </div>
  `).join("");
}

function vote(winner){
const seg = segmentSelect.value;
const ctx = contextSelect.value;
const key = bucketKey(seg, ctx);
const bucket = state.buckets[key];

updateElo(bucket, currentA, currentB, winner);

const ganador = (winner === "A") ? currentA : currentB;
const perdedor = (winner === "A") ? currentB : currentA;

state.votes.push({
ts: new Date().toISOString(),
segmento: segmentos[seg],
contexto: contextos[ctx],
A: currentA,
B: currentB,
ganador,
perdedor
});

saveState();
renderTop();
newDuel();
}

btnA.addEventListener("click", () => vote("A"));
btnB.addEventListener("click", () => vote("B"));
btnNewPair.addEventListener("click", () => newDuel());
btnShowTop.addEventListener("click", () => renderTop());

segmentSelect.addEventListener("change", () => { renderTop(); refreshQuestion(); });
contextSelect.addEventListener("change", () => { renderTop(); refreshQuestion(); });

btnReset.addEventListener("click", () => {
if (!confirm("Esto borrará rankings y votos guardados. ¿Continuar?")) return;
state = defaultState();
saveState();
renderTop();
newDuel();
});

newDuel();
renderTop();
refreshQuestion();
