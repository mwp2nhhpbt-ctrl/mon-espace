# Mon Espace (appli perso)

Appli web statique (HTML/CSS/JS, sans outil de build), installable comme une appli (PWA).

## Structure
- `index.html` : coquille de l'appli (menu latéral sur Mac, barre d'onglets sur iPhone)
- `css/style.css` : style (bleu Majorelle #6050DC en dégradé, mode clair/sombre auto)
- `js/modules.js` : liste des espaces + icônes. Ajouter un module = créer `js/pages/<id>.js` puis `ready: true`
- `js/store.js` : données (stockées dans le navigateur, données d'exemple au départ)
- `js/pages/aujourdhui.js` : page Aujourd'hui
- `manifest.webmanifest`, `sw.js`, `icons/` : installation et hors ligne

## Tester en local
`python3 -m http.server 8765` dans ce dossier, puis ouvrir http://localhost:8765

## En ligne
Site : https://mwp2nhhpbt-ctrl.github.io/mon-espace/
L'actu est mise à jour chaque matin par une tâche Claude programmée (voir `AUTOMATISATION.md`).
