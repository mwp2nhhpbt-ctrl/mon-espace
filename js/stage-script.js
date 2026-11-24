// Code du script Google (Apps Script) à coller dans le tableau de stage.
// Il ne contient aucune donnée : la clé secrète est ajoutée sur l'appareil au moment de l'installation.
export const scriptGoogle = (cle) => `/** @OnlyCurrentDoc */
// Mon Espace : relie l'onglet Stage de l'appli à ce tableau.
// Ne partage jamais cette clé. Le script n'a accès qu'à ce tableau (pas à Gmail ni au reste du Drive).
const CLE = '${cle}';
const ONGLETS = ['Suivi candidatures', 'Offres de stage'];
const COLONNES_MAX = { 'Suivi candidatures': 7, 'Offres de stage': 10 };

function doGet(e) { return repondre(e.parameter || {}); }
function doPost(e) { return repondre(JSON.parse(e.postData.contents || '{}')); }

function repondre(p) {
  try {
    if (p.cle !== CLE) return json({ erreur: 'Clé invalide' });
    if (p.action === 'lire') return json({ onglets: ONGLETS.map(lire), maj: new Date().toISOString() });
    if (p.action === 'modifier') return json(modifier(p));
    if (p.action === 'ajouter') return json(ajouter(p));
    return json({ erreur: 'Action inconnue' });
  } catch (err) { return json({ erreur: String(err) }); }
}

function feuille(nom) {
  if (ONGLETS.indexOf(nom) < 0) throw new Error('Onglet non autorisé');
  return SpreadsheetApp.getActive().getSheetByName(nom);
}

function lire(nom) {
  const f = feuille(nom);
  const nbCol = Math.min(COLONNES_MAX[nom], f.getLastColumn());
  const valeurs = f.getRange(1, 1, Math.max(f.getLastRow(), 1), nbCol).getDisplayValues();
  const entetes = valeurs.shift();
  const lignes = valeurs
    .map((v, i) => ({ ligne: i + 2, valeurs: v }))
    .filter((l) => l.valeurs.some((x) => String(x).trim() !== ''));
  return { nom: nom, entetes: entetes, lignes: lignes };
}

function modifier(p) {
  const f = feuille(p.onglet);
  if (p.colonne < 1 || p.colonne > COLONNES_MAX[p.onglet] || p.ligne < 2) throw new Error('Cellule non autorisée');
  f.getRange(p.ligne, p.colonne).setValue(p.valeur);
  return { ok: true };
}

function ajouter(p) {
  const f = feuille(p.onglet);
  f.appendRow(p.valeurs.slice(0, COLONNES_MAX[p.onglet]));
  return { ok: true, ligne: f.getLastRow() };
}

function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
`;
