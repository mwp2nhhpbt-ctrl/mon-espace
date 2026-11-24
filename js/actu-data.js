// Charge la revue de presse du jour (data/actu.json).
// Ce fichier sera réécrit automatiquement chaque matin une fois l'automatisation en place.
let cache;
export async function loadActu() {
  if (cache) return cache;
  try {
    const res = await fetch('data/actu.json', { cache: 'no-cache' });
    cache = await res.json();
  } catch {
    cache = { demo: true, rubriques: [], articles: [], lecture: [], synthese: '' };
  }
  return cache;
}

export const BORDS = { gauche: 'Gauche', centre: 'Centre', droite: 'Droite' };
export const LANGUES = { en: { nom: 'Anglais', drapeau: '🇬🇧' }, es: { nom: 'Espagnol', drapeau: '🇪🇸' } };
