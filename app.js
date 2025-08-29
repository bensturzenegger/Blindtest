// app.js (modules ES)
import { firebaseConfig } from './firebase-config.js';
import {
  initializeApp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getDatabase, ref, child, get, set, update, push, onValue, runTransaction
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';

// -------------------- Firebase init --------------------
export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// -------------------- Helpers généraux --------------------
export const $ = (sel, root=document) => root.querySelector(sel);
export const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

export function randomCode(len=5) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i=0;i<len;i++) out += chars[Math.floor(Math.random()*chars.length)];
  return out;
}

export function normalizeText(s='') {
  return s
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu,'')
    .replace(/[^a-z0-9\s]/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

export function timeNow() { return Date.now(); }

export function computeScore(msElapsed, base=1000, perSecond=10, min=100) {
  const penalty = Math.floor((msElapsed/1000) * perSecond);
  return Math.max(base - penalty, min);
}

export function getRoomRef(code) { return ref(db, `rooms/${code}`); }
export function getAnswersRef(code, qid) { return ref(db, `rooms/${code}/answers/${qid}`); }
export function getPlayersRef(code) { return ref(db, `rooms/${code}/players`); }
export function getQuestionsRef(code) { return ref(db, `rooms/${code}/questions`); }

// UID local (persisté par room)
export function getLocalUID(roomCode) {
  const key = `bt_uid_${roomCode}`;
  let uid = localStorage.getItem(key);
  if (!uid) { uid = crypto.randomUUID(); localStorage.setItem(key, uid); }
  return uid;
}

export async function ensurePlayer(roomCode, name) {
  const uid = getLocalUID(roomCode);
  const pRef = child(getPlayersRef(roomCode), uid);
  await update(pRef, {
    name: name || 'Invité',
    score: 0,
    joinedAt: Date.now()
  });
  return uid;
}

export async function createRoom(customCode) {
  const code = (customCode || randomCode()).toUpperCase();
  const rRef = getRoomRef(code);
  await set(rRef, {
    createdAt: Date.now(),
    state: {
      status: 'lobby', // lobby | question | ended
      round: 0,
      currentQ: null,
      startedAt: null
    },
    players: {},
    questions: {}
  });
  return code;
}

export async function addQuestion(roomCode, q) {
  const listRef = getQuestionsRef(roomCode);
  const newRef = push(listRef);
  const payload = {
    title: q.title || 'Question',
    mediaUrl: q.mediaUrl || '',
    timeLimit: Number(q.timeLimit || 20),
    answers: (q.answers||[]).map(a => normalizeText(a)).filter(Boolean),
    basePoints: Number(q.basePoints || 1000),
    perSecond: Number(q.perSecond || 10)
  };
  await set(newRef, payload);
  return newRef.key;
}

export async function startQuestion(roomCode, qid) {
  const sRef = child(getRoomRef(roomCode), 'state');
  const qRef = child(getQuestionsRef(roomCode), qid);
  const snap = await get(qRef);
  if (!snap.exists()) throw new Error('Question introuvable');
  const q = snap.val();
  await update(sRef, {
    status: 'question',
    currentQ: qid,
    startedAt: Date.now()
  });
}

export async function endQuestion(roomCode) {
  await update(child(getRoomRef(roomCode),'state'), {
    status: 'lobby',
    currentQ: null,
    startedAt: null
  });
}

export async function endGame(roomCode) {
  await update(child(getRoomRef(roomCode),'state'), {
    status: 'ended'
  });
}

export async function submitAnswer(roomCode, qid, uid, answerText) {
  const aNorm = normalizeText(answerText);
  const qSnap = await get(child(getQuestionsRef(roomCode), qid));
  const sSnap = await get(child(getRoomRef(roomCode), 'state'));
  if (!qSnap.exists() || !sSnap.exists()) return { accepted:false, reason:'Données manquantes' };
  const q = qSnap.val();
  const startedAt = sSnap.val().startedAt || Date.now();
  const msElapsed = Math.max(0, Date.now() - startedAt);
  const correct = q.answers.includes(aNorm);

  const ansRef = child(getAnswersRef(roomCode, qid), uid);
  const existing = await get(ansRef);
  if (existing.exists()) return existing.val();

  let score = 0;
  if (correct) score = computeScore(msElapsed, q.basePoints, q.perSecond);

  const payload = {
    uid, answerText, aNorm, correct, score, submittedAt: Date.now(), msElapsed
  };
  await set(ansRef, payload);

  if (score>0) {
    const pRef = child(getPlayersRef(roomCode), uid);
    await runTransaction(pRef, (curr) => {
      if (!curr) return curr;
      return { ...curr, score: (curr.score||0) + score };
    });
  }
  return payload;
}

export function listenRoom(roomCode, cb) {
  return onValue(getRoomRef(roomCode), (snap) => cb(snap.val()));
}
