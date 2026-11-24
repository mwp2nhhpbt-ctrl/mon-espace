# Revue de presse du matin : consignes de la tâche programmée

Chaque matin, une tâche Claude suit ces consignes pour réécrire `data/actu.json`, puis pousse le fichier sur `main`.
Le site (GitHub Pages) affiche alors l'actu du jour dans les pages « Aujourd'hui » et « Actu ».

Principe : **simple et essentiel**. Le but est de comprendre le monde, pas d'être exhaustif.

## 1. Lire les médias (gratuits uniquement)

Lis les flux ci-dessous avec l'outil de lecture web (WebFetch), pas avec curl, car le réseau de l'environnement les bloque.
Si un flux ne répond pas, passe au suivant sans t'arrêter. Ne garde que les articles des dernières 24 à 36 heures.
N'utilise jamais un média payant. Les grands sites (Le Monde, Le Figaro, Libération, franceinfo, L'Équipe, El País, AS, Marca…) bloquent l'outil : ne les essaie pas.

Marqués ✓ = testés avec succès le 24/11/2026. Les autres sont à essayer ; note dans ton message final ceux qui ont échoué.

| Rubrique (id) | Médias et flux |
|---|---|
| Politique & Éco (`politique`) | Gauche : Reporterre https://reporterre.net/spip.php?page=backend · Basta! https://basta.media/spip.php?page=backend — Centre : The Conversation France https://theconversation.com/fr/articles.atom · Public Sénat https://www.publicsenat.fr/rss.xml · 20 Minutes https://www.20minutes.fr/feeds/rss-une.xml · Ouest-France https://www.ouest-france.fr/rss/une — Droite / libéral : Contrepoints https://www.contrepoints.org/feed · Atlantico https://atlantico.fr/rss |
| Géopolitique (`geo`) | ✓ Le Grand Continent https://legrandcontinent.eu/fr/feed/ · ✓ IRIS https://www.iris-france.org/feed/ · Toute l'Europe https://www.touteleurope.eu/feed/ · The Guardian (EN) https://www.theguardian.com/world/rss · BBC (EN) https://feeds.bbci.co.uk/news/world/rss.xml · ✓ elDiario.es (ES) https://www.eldiario.es/rss/ · 20minutos (ES) https://www.20minutos.es/rss/ |
| Défense (`defense`) | ✓ FOB https://www.forcesoperations.com/feed/ · ✓ Defense News https://www.defensenews.com/arc/outboundfeeds/rss/?outputType=xml · Breaking Defense https://breakingdefense.com/feed/ |
| Foot & Sport (`sport`) | ✓ ESPN https://www.espn.com/espn/rss/soccer/news · 20 Minutes Sport https://www.20minutes.fr/feeds/rss-sport.xml · Foot Mercato https://www.footmercato.net/rss · The Guardian Football (EN) https://www.theguardian.com/football/rss · 20minutos Deportes (ES) https://www.20minutos.es/rss/deportes/ |
| Rap & Pop culture (`rap`) | ✓ XXL https://www.xxlmag.com/feed/ · ✓ Mondo Sonoro https://www.mondosonoro.com/feed/ · Abcdr du Son https://www.abcdrduson.com/feed/ · The Backpackerz https://www.thebackpackerz.com/feed/ |

## 2. Écrire `data/actu.json`

- **12 à 15 articles au total**, 2 à 4 par rubrique, les plus importants du jour.
- Tout en **français** : titre reformulé, résumé de 2 phrases simples qui expliquent le contexte (« pourquoi c'est important »).
- En Politique & Éco, essaie d'avoir au moins un média de gauche, un du centre et un de droite (`bord`: `gauche`, `centre`, `droite`).
- `vo`: `"en"` ou `"es"` si l'article source est en anglais ou en espagnol (le résumé reste en français).
- `synthese` : 4 ou 5 phrases en français sur l'essentiel du jour.
- **Lire en VO** (`lecture`) : 1 à 2 textes en anglais **et** 1 à 2 en espagnol. L'outil web ne permet de citer que de courts extraits, et le site est public : n'essaie pas de recopier l'article. À la place, lis l'article source (The Guardian, BBC, Defense News, ESPN, XXL, elDiario.es, 20minutos, Mondo Sonoro…) et **rédige toi-même un texte de 250 à 300 mots dans la langue d'origine**, au style journalistique (niveau B2, vocabulaire de presse et d'économie), qui raconte l'actualité et son contexte. Indique `"source": "Rédigé d'après <Média>"` et mets le lien de l'article dans `url`. Ajoute 5 à 8 mots ou expressions difficiles du texte avec leur traduction française dans `vocab`.
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
