// Petit stockage local (dans le navigateur de l'appareil).
// Limite : les données ne se synchronisent pas encore entre Mac et iPhone.
const KEY = 'mon-espace:v1';

// Date au format AAAA-MM-JJ en heure locale (toISOString décale à cause du fuseau).
export const isoLocal = (x) =>
  `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;

const today = new Date();
const d = (offset) => {
  const x = new Date(today);
  x.setDate(x.getDate() + offset);
  return isoLocal(x);
};

// Données d'exemple, remplacées par les vraies au fur et à mesure.
const DEMO = {
  devoirs: [
    { id: 1, titre: 'Fiche de lecture : la Movida', matiere: 'Espagnol · Langue et Culture 1', pour: d(1), fait: false },
    { id: 2, titre: 'Exercices ratios de rentabilité', matiere: 'Analyse financière', pour: d(2), fait: false },
    { id: 3, titre: 'Préparer le jeu de rôle négociation', matiere: 'Négociation commerciale', pour: d(4), fait: false },
    { id: 4, titre: 'Relire le cours Incoterms', matiere: 'Commerce international', pour: d(0), fait: true }
  ],
  lecon: {
    langue: 'Anglais',
    titre: 'Pitching yourself in 30 seconds',
    resume: 'Structure : who you are, what you do, what you want. Utile pour les entretiens de stage.',
    mots: [
      { mot: 'to pitch', trad: 'présenter, convaincre' },
      { mot: 'internship', trad: 'stage' },
      { mot: 'a strong asset', trad: 'un atout' }
    ]
  },
  actu: [
    { cat: 'Géopolitique', titre: 'Exemple : sommet européen sur la défense commune', src: 'Le Monde' },
    { cat: 'Économie', titre: 'Exemple : la BCE maintient ses taux directeurs', src: 'Les Échos' },
    { cat: 'Foot', titre: 'Exemple : Ligue des champions, les affiches de la semaine', src: "L'Équipe" },
    { cat: 'Général', titre: 'Exemple : réforme des bourses étudiantes en discussion', src: 'France Info' }
  ],
  rdv: [
    { id: 1, heure: '10:15', titre: 'Cours de Mondialisation', lieu: 'Rennes 2 · Bât. L', date: d(0) },
    { id: 2, heure: '14:00', titre: 'Appel RH : stage export', lieu: 'Téléphone', date: d(0) },
    { id: 3, heure: '18:30', titre: 'Coupe client (barber)', lieu: 'À domicile', date: d(0) },
    { id: 4, heure: '09:00', titre: 'Partiel blanc Analyse financière', lieu: 'Rennes 2', date: d(3) },
    { id: 5, heure: '17:00', titre: 'Séance street workout', lieu: 'Parc des Gayeulles', date: d(5) },
    { id: 6, heure: '08:30', titre: 'Cours Commerce international', lieu: 'Rennes 2', date: d(-1), repete: 'semaine' }
  ],
  // Annotations du calendrier : { 'AAAA-MM-JJ': [{ id, texte, couleur }] }
  notes: {
    [d(3)]: [
      { id: 1, texte: 'Réviser chapitres 2 et 3 la veille', couleur: 'rouge' },
      { id: 2, texte: 'Apporter la calculatrice', couleur: 'orange' }
    ],
    [d(6)]: [{ id: 3, texte: 'Envoyer 5 candidatures de stage', couleur: 'vert' }]
  }
};

let state;
try {
  state = JSON.parse(localStorage.getItem(KEY)) || structuredClone(DEMO);
} catch {
  state = structuredClone(DEMO);
}
state.notes ||= {};
// Ancien format (une seule note par jour) -> liste de notes
for (const [k, v] of Object.entries(state.notes)) {
  if (!Array.isArray(v)) state.notes[k] = v ? [{ id: Date.now() + Math.random(), ...v }] : [];
}

// ===== Répétitions des rendez-vous =====
export const REPETITIONS = {
  non: 'Une seule fois',
  jour: 'Tous les jours',
  semaine: 'Chaque semaine',
  '2semaines': 'Toutes les 2 semaines',
  mois: 'Chaque mois'
};

// Le rendez-vous r a-t-il lieu le jour iso ?
export function aLieu(r, iso) {
  if (r.date === iso) return !(r.sauf || []).includes(iso);
  if (!r.repete || r.repete === 'non' || iso < r.date) return false;
  if (r.jusqu && iso > r.jusqu) return false;
  if ((r.sauf || []).includes(iso)) return false;
  const a = new Date(r.date + 'T12:00:00'), b = new Date(iso + 'T12:00:00');
  const jours = Math.round((b - a) / 86400000);
  switch (r.repete) {
    case 'jour': return true;
    case 'semaine': return jours % 7 === 0;
    case '2semaines': return jours % 14 === 0;
    case 'mois': return a.getDate() === b.getDate();
    default: return false;
  }
}

export const rdvDuJour = (st, iso) =>
  st.rdv.filter((r) => aLieu(r, iso)).sort((x, y) => x.heure.localeCompare(y.heure));

export const store = {
  get: () => state,
  save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  },
  update(fn) { fn(state); this.save(); },
  reset() { state = structuredClone(DEMO); this.save(); }
};
