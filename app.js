// =====================
// 1) Datos (Jugadores)
// =====================

const jugadores = [
  "Pelé",
  "Diego Maradona",
  "Lionel Messi",
  "Cristiano Ronaldo",
  "Johan Cruyff",
  "Zinedine Zidane",
  "Alfredo Di Stéfano",
  "Ronaldo Nazário",
  "Franz Beckenbauer",
  "Michel Platini"
];

const segmentos = {
  "H": "Historiadores del fútbol",
  "J": "Jóvenes aficionados",
  "E": "Enfoque estadístico",
  "T": "Enfoque en títulos",
};

const contextos = {
  "TAL": "¿Quién tuvo más TALENTO individual?",
  "IMP": "¿Quién tuvo mayor IMPACTO histórico?",
  "TIT": "¿Quién fue más decisivo en TÍTULOS?",
};

// Elo
const RATING_INICIAL = 1000;
const K = 32;

const STORAGE_KEY = "playermash_state_v1";

function defaultState(){
  const buckets = {};
  for (const seg of Object.keys(segmentos)){
    for (const ctx of Object.keys(contextos)){
      const key = `${seg}__${ctx}`;
      buckets[key] = {};
      jugadores.forEach(j => buckets[key][j] = RATING_INICIAL);
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

// =====================
// Elo
// =====================

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
  const a = jugadores[Math.floor(Math.random() * jugadores.length)];
  let b = a;
  while (b === a){
    b = jugadores[Math.floor(Math.random() * jugadores.length)];
  }
  return [a, b];
}

function bucketKey(seg, ctx){ return `${seg}__${ctx}`; }

function topN(bucket, n=10){
  const arr = Object.entries(bucket).map(([jugador, rating]) => ({jugador, rating}));
  arr.sort((x,y) => y.rating - x.rating);
  return arr.slice(0, n);
}

// =====================
// UI
// =====================

const segmentSelect = document.getElementById("segmentSelect");
const contextSelect = document.getElementById("contextSelect");
const questionEl = document.getElementById("question");
const labelA = document.getElementById("labelA");
const labelB = document.getElementById("labelB");
const topBox = document.getElementById("topBox");

let currentA = null;
let currentB = null;

function fillSelect(selectEl, obj){
  selectEl.innerHTML = "";
  for (const [k, v] of Object.entries(obj)){
    const opt = document.createElement("option");
    opt.value = k;
    opt.textContent = `${v}`;
    selectEl.appendChild(opt);
  }
}

fillSelect(segmentSelect, segmentos);
fillSelect(contextSelect, contextos);

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
  const bucket = state.buckets[bucketKey(segmentSelect.value, contextSelect.value)];
  const rows = topN(bucket, 10);
  topBox.innerHTML = rows.map((r, i) => `
    <div class="toprow">
      <div><b>${i+1}.</b> ${r.jugador}</div>
      <div>${r.rating.toFixed(1)}</div>
    </div>
  `).join("");
}

function vote(winner){
  const bucket = state.buckets[bucketKey(segmentSelect.value, contextSelect.value)];
  updateElo(bucket, currentA, currentB, winner);
  saveState();
  renderTop();
  newDuel();
}

document.getElementById("btnA").addEventListener("click", () => vote("A"));
document.getElementById("btnB").addEventListener("click", () => vote("B"));
document.getElementById("btnNewPair").addEventListener("click", newDuel);
document.getElementById("btnShowTop").addEventListener("click", renderTop);

document.getElementById("btnReset").addEventListener("click", () => {
  state = defaultState();
  saveState();
  renderTop();
  newDuel();
});

newDuel();
renderTop();
refreshQuestion();
