// Code du script Google (Apps Script) à coller dans le tableau de stage.
// Il ne contient aucune donnée : la clé secrète est ajoutée sur l'appareil au moment de l'installation.
export const scriptGoogle = (cle) => `// Mon Espace : relie l'onglet Stage de l'appli à ce tableau.
// Ne partage jamais cette clé.
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
    if (p.action === 'emails') return json({ emails: emails() });
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

// E-mails récents liés au stage : envoyés par les entreprises du tableau, ou avec des mots clés.
function emails() {
  const domaines = {};
  const perso = /gmail|yahoo|hotmail|outlook|icloud|orange|free|laposte|wanadoo|sfr/;
  const tout = SpreadsheetApp.getActive().getSheets().map((s) => s.getDataRange().getDisplayValues().join(' ')).join(' ');
  (tout.match(/[\\w.+-]+@([\\w-]+\\.)+[a-z]{2,}/gi) || []).forEach((m) => {
    const d = m.split('@')[1].toLowerCase();
    if (!perso.test(d)) domaines[d] = true;
  });
  const liste = Object.keys(domaines).slice(0, 40).map((d) => 'from:' + d);
  const motsCles = 'subject:(stage OR internship OR candidature OR alternance OR "offre de stage")';
  const requete = 'newer_than:30d -in:sent -category:promotions (' + (liste.length ? liste.join(' OR ') + ' OR ' : '') + motsCles + ')';
  return GmailApp.search(requete, 0, 15).map((t) => {
    const m = t.getMessages().pop();
    return { de: m.getFrom(), sujet: t.getFirstMessageSubject(), extrait: m.getPlainBody().slice(0, 200), date: m.getDate().toISOString(), lien: 'https://mail.google.com/mail/u/0/#inbox/' + t.getId(), nonLu: t.isUnread() };
  });
}

function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
`;
