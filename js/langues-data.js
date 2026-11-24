// Données et outils de l'espace Langues.
// data/langues.json (leçon du jour) et data/langues-semaine.json (7 derniers jours)
// sont réécrits chaque matin par la tâche programmée.
import { isoLocal } from './store.js';

export const LANGS = {
  en: { nom: 'Anglais', drapeau: '🇬🇧', voix: 'en-GB' },
  es: { nom: 'Espagnol', drapeau: '🇪🇸', voix: 'es-ES' }
};

const charger = async (url, defaut) => {
  try { const r = await fetch(url, { cache: 'no-cache' }); if (!r.ok) throw 0; return await r.json(); }
  catch { return defaut; }
};
export const loadLangues = () => charger('data/langues.json', {});
export const loadSemaine = () => charger('data/langues-semaine.json', { jours: [] });

// ===== Progression (stockée sur l'appareil) =====
const KEY = 'mon-espace:langues';
const VIDE = () => ({ serie: { last: null, n: 0 }, xp: 0, mots: { en: [], es: [] }, faits: {}, evals: [], brouillons: {} });

export function progres() {
  let p;
  try { p = JSON.parse(localStorage.getItem(KEY)); } catch { p = null; }
  p = { ...VIDE(), ...(p || {}) };
  p.mots = { en: [], es: [], ...p.mots };
  // La série est cassée si le dernier jour actif date d'avant-hier ou plus
  const hier = new Date(); hier.setDate(hier.getDate() - 1);
  if (p.serie.last && p.serie.last < isoLocal(hier)) p.serie.n = 0;
  return p;
}
export function saveProgres(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {} }
export function marquerJour(p, today) {
  if (p.serie.last === today) return;
  const hier = new Date(); hier.setDate(hier.getDate() - 1);
  p.serie.n = p.serie.last === isoLocal(hier) ? p.serie.n + 1 : 1;
  p.serie.last = today;
}

// ===== Synthèse vocale =====
export function speak(texte, langue) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texte);
  u.lang = LANGS[langue].voix;
  u.rate = 0.9;
  const voix = speechSynthesis.getVoices().find((v) => v.lang.replace('_', '-').startsWith(LANGS[langue].voix));
  if (voix) u.voice = voix;
  speechSynthesis.speak(u);
}

// ===== Reconnaissance vocale (Safari et Chrome) =====
const Reco = window.SpeechRecognition || window.webkitSpeechRecognition;
export const reconnaissanceDispo = () => !!Reco;

export function ecouter(langue, long = false) {
  return new Promise((resolve, reject) => {
    if (!Reco) return reject(new Error("Ce navigateur ne permet pas d'utiliser le micro. Essaie dans Safari ou Chrome."));
    const r = new Reco();
    r.lang = LANGS[langue].voix;
    r.interimResults = false;
    r.continuous = long;
    r.maxAlternatives = 1;
    let texte = '';
    let timer;
    r.onresult = (e) => {
      texte = Array.from(e.results).map((x) => x[0].transcript).join(' ');
      if (long) { clearTimeout(timer); timer = setTimeout(() => r.stop(), 2500); }
    };
    r.onerror = (e) => reject(new Error(e.error === 'not-allowed'
      ? "L'accès au micro a été refusé. Autorise-le dans les réglages du navigateur."
      : e.error === 'no-speech' ? "Je n'ai rien entendu. Réessaie en parlant un peu plus fort." : 'Le micro a rencontré un problème. Réessaie.'));
    r.onend = () => (texte ? resolve(texte.trim()) : reject(new Error("Je n'ai rien entendu. Réessaie.")));
    if (long) setTimeout(() => r.stop(), 60000);
    r.start();
  });
}

// Compare la phrase attendue et ce qui a été compris : % de mots retrouvés
const mots = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zñ0-9' ]/g, ' ').split(/\s+/).filter(Boolean);
export function scoreOral(attendu, dit) {
  const ditMots = mots(dit);
  const res = attendu.split(/\s+/).map((brut) => {
    const m = mots(brut)[0] || '';
    const i = ditMots.indexOf(m);
    if (i >= 0) ditMots.splice(i, 1);
    return { mot: brut, ok: !m || i >= 0 };
  });
  return { score: Math.round((res.filter((x) => x.ok).length / res.length) * 100), mots: res };
}
