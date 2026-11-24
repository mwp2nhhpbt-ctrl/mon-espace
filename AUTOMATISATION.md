# Revue de presse du matin : consignes de la tâche programmée

Chaque matin, une tâche Claude suit ces consignes pour réécrire `data/actu.json`, puis pousse le fichier sur `main`.
Le site (GitHub Pages) affiche alors l'actu du jour dans les pages « Aujourd'hui » et « Actu ».

Principe : **simple et essentiel**. Le but est de comprendre le monde, pas d'être exhaustif.

## 1. Lire les médias (gratuits uniquement)

Lis les flux ci-dessous avec l'outil de lecture web (WebFetch), pas avec curl, car le réseau de l'environnement les bloque.
Si un flux ne répond pas, passe au suivant sans t'arrêter. Ne garde que les articles des dernières 24 à 36 heures.
N'utilise jamais un média payant (Mediapart, L'Opinion, Le Monde diplomatique, The Economist, Financial Times, NYT, WSJ, Foreign Affairs, The Athletic…).
Pour Le Monde, Le Figaro et Libération, utilise seulement le titre et le chapô du flux (pas d'articles réservés aux abonnés).

| Rubrique (id) | Médias et flux |
|---|---|
| Politique & Éco (`politique`) | Gauche : Libération https://www.liberation.fr/arc/outboundfeeds/rss-all/?outputType=xml · Blast https://www.blast-info.fr/rss.xml — Centre : franceinfo https://www.francetvinfo.fr/titres.rss · Le Monde https://www.lemonde.fr/rss/une.xml — Droite : Le Figaro https://www.lefigaro.fr/rss/figaro_actualites.xml |
| Géopolitique (`geo`) | Le Grand Continent https://legrandcontinent.eu/fr/feed/ · IRIS https://www.iris-france.org/feed/ · El País https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada · elDiario.es https://www.eldiario.es/rss/ |
| Défense (`defense`) | Opex360 https://www.opex360.com/feed/ · FOB https://www.forcesoperations.com/feed/ · Disclose https://disclose.ngo/fr/feed · Defense News https://www.defensenews.com/arc/outboundfeeds/rss/?outputType=xml · Breaking Defense https://breakingdefense.com/feed/ |
| Foot & Sport (`sport`) | L'Équipe https://dwh.lequipe.fr/api/edito/rss?path=/ · So Foot https://www.sofoot.com/rss.xml · RMC Sport https://rmcsport.bfmtv.com/rss/football/ · ESPN https://www.espn.com/espn/rss/soccer/news · Marca https://e00-marca.uecdn.es/rss/portada.xml · AS https://feeds.as.com/mrss-s/pages/as/site/as.com/portada |
| Rap & Pop culture (`rap`) | Booska-P https://www.booska-p.com/feed/ · Abcdr du Son https://www.abcdrduson.com/feed/ · The Backpackerz https://www.thebackpackerz.com/feed/ · XXL https://www.xxlmag.com/feed/ · Rolling Stone https://www.rollingstone.com/music/feed/ · Mondo Sonoro https://www.mondosonoro.com/feed/ |

## 2. Écrire `data/actu.json`

- **12 à 15 articles au total**, 2 à 4 par rubrique, les plus importants du jour.
- Tout en **français** : titre reformulé, résumé de 2 phrases simples qui expliquent le contexte (« pourquoi c'est important »).
- En Politique & Éco, essaie d'avoir au moins un média de gauche, un du centre et un de droite (`bord`: `gauche`, `centre`, `droite`).
- `vo`: `"en"` ou `"es"` si l'article source est en anglais ou en espagnol (le résumé reste en français).
- `synthese` : 4 ou 5 phrases en français sur l'essentiel du jour.
- **Lire en VO** (`lecture`) : 1 à 2 articles en anglais **et** 1 à 2 en espagnol, choisis parmi les médias gratuits (Defense News, Breaking Defense, ESPN, XXL, Rolling Stone, elDiario.es, El País, Marca, AS, Mondo Sonoro). Lis l'article avec WebFetch et garde un **long extrait** dans la langue d'origine, sans le traduire : 3 à 5 paragraphes, 350 mots maximum (le site est public, on ne republie pas l'article entier), plus le lien `url` vers l'article complet. Ajoute 5 à 8 mots ou expressions difficiles avec leur traduction française dans `vocab`.
- Mets `"demo": false` et la date du jour (heure de Paris) dans `date`.

Format exact :

```json
{
  "demo": false,
  "date": "AAAA-MM-JJ",
  "synthese": "…",
  "rubriques": [
    { "id": "politique", "nom": "Politique & Éco" },
    { "id": "geo", "nom": "Géopolitique" },
    { "id": "defense", "nom": "Défense" },
    { "id": "sport", "nom": "Foot & Sport" },
    { "id": "rap", "nom": "Rap & Pop culture" }
  ],
  "articles": [
    { "rubrique": "politique", "titre": "…", "resume": "…", "source": "Le Figaro", "bord": "droite", "url": "https://…" },
    { "rubrique": "defense", "titre": "…", "resume": "…", "source": "Defense News", "url": "https://…", "vo": "en" }
  ],
  "lecture": [
    { "langue": "en", "rubrique": "defense", "source": "Defense News", "titre": "…", "url": "https://…",
      "texte": ["paragraphe 1", "paragraphe 2"], "vocab": [{ "mot": "…", "trad": "…" }] }
  ]
}
```

## 3. Vérifier et publier

1. Vérifie que le fichier est du JSON valide (`python3 -m json.tool data/actu.json`).
2. Commit sur `main` avec le message `Actu du AAAA-MM-JJ`, puis push.
3. Ne modifie aucun autre fichier.
