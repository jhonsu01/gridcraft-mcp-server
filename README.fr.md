<p align="center"><img src="icon.png" width="120" alt="Icône de GridCraft Bridge"></p>

<h1 align="center">GridCraft MCP Server</h1>

<p align="center">
  <a href="README.md">English</a> · <a href="README.es.md">Español</a> · <a href="README.pt-BR.md">Português</a> · <b>Français</b> · <a href="README.de.md">Deutsch</a> · <a href="README.ru.md">Русский</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a>
</p>

<p align="center">
  Laissez Claude créer et lire des tableurs avec le <b>GridCraft</b> installé sur votre ordinateur — <b>Windows, macOS et Linux</b> :<br>
  feuilles avec formules vivantes, tableaux, formats, mise en forme conditionnelle, graphiques et tableaux croisés dynamiques, valeurs calculées, xlsx, csv, json, html et pdf.
</p>

---

## Pourquoi

[GridCraft](https://github.com/storytold/gridcraft) est un tableur open source de la classe d'Excel, avec une CLI sans interface (`gridcraft-cli`), 339 commandes, 513 fonctions de feuille (tableaux dynamiques compris), XLSX comme format natif et un mode MCP. Ce serveur [Model Context Protocol](https://modelcontextprotocol.io) transforme ce moteur en **outils fichier en entrée / fichier en sortie** pour Claude, pour demander par exemple :

> *« Crée un classeur de budget mensuel avec des formules, une feuille de synthèse et un graphique, en XLSX et PDF. »*
> *« Lis `ventes.xlsx` et donne-moi le total par région et le meilleur mois. »*
> *« Ajoute à ce classeur un tableau croisé dynamique du chiffre d'affaires par région et produit. »*
> *« Dans tous les classeurs de `D:\Rapports`, remplace « 2025 » par « 2026 » et enregistre des copies. »*
> *« Convertis ce CSV en Excel avec un tableau mis en forme, et tous les classeurs de ce dossier en CSV. »*

Frère de [designcraft-mcp-server](https://github.com/jhonsu01/designcraft-mcp-server), [effectcraft-mcp-server](https://github.com/jhonsu01/effectcraft-mcp-server), [lightcraft-mcp-server](https://github.com/jhonsu01/lightcraft-mcp-server), [photocraft-mcp-server](https://github.com/jhonsu01/photocraft-mcp-server), [vectorcraft-mcp-server](https://github.com/jhonsu01/vectorcraft-mcp-server), [filmcraft-mcp-server](https://github.com/jhonsu01/filmcraft-mcp-server), [pdfcraft-mcp-server](https://github.com/jhonsu01/pdfcraft-mcp-server), [wordcraft-mcp-server](https://github.com/jhonsu01/wordcraft-mcp-server), [soundcraft-mcp-server](https://github.com/jhonsu01/soundcraft-mcp-server), [deckcraft-mcp-server](https://github.com/jhonsu01/deckcraft-mcp-server) et [audacity-mcp-server](https://github.com/jhonsu01/audacity-mcp-server).

## Plateformes

| OS | Paquet GridCraft à installer | Où le serveur le trouve (sans configuration) | État |
| --- | --- | --- | --- |
| **Windows** 10/11 (x64, x86, arm64) | MSI ou zip portable | `C:\Program Files\GridCraft`, `%LOCALAPPDATA%\Programs\GridCraft`, `PATH` | ✅ Vérifié (Windows 11) |
| **Linux** (x86_64, aarch64, riscv64) | `.deb`, `.rpm` ou `.tar.gz` | `/usr/bin`, `/usr/local/bin`, `/opt/gridcraft/bin`, `~/.local/bin`, `PATH` | ✅ Vérifié (Debian 12, sans interface) |
| **macOS** 11+ (Apple silicon et Intel) | `.dmg` (l'application) **plus** `gridcraft-cli-<version>-macos-universal.zip` | `/Applications/GridCraft.app`, `/usr/local/bin`, `/opt/homebrew/bin`, `~/.local/bin`, `~/bin`, `PATH` | 🟡 Pris en charge, pas encore testé sur un Mac |

Tous les téléchargements : [versions de GridCraft](https://github.com/storytold/gridcraft/releases) (il existe aussi un tar.gz pour FreeBSD ; pointez `GRIDCRAFT_DIR` dessus). Ailleurs : définissez `GRIDCRAFT_DIR` (dossier, racine du `.tar.gz` ou `GridCraft.app`) ou `GRIDCRAFT_CLI`.

- **macOS :** le DMG ne contient que l'application. Décompressez le zip séparé de `gridcraft-cli` et déplacez `gridcraft-cli` vers `/usr/local/bin` (ou pointez `GRIDCRAFT_CLI` dessus). Le premier lancement vérifie en ligne la notarisation d'Apple.
- **Linux :** l'AppImage et le Flatpak ne contiennent que l'application, pas `gridcraft-cli` ; utilisez le deb, le rpm ou le tar.gz. Pour une application AppImage, définissez `GRIDCRAFT_APP` pour que `open_in_gridcraft` puisse la lancer. Sur un serveur sans GPU, la configuration vérifiée utilisait `libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig`.

## Fonctionnement

| Élément | Ce que c'est |
| --- | --- |
| **Moteur GridCraft** (`gridcraft-cli mcp`) | Le moteur de GridCraft lui-même : cellules, moteur de calcul avec 513 fonctions, styles, formats de nombre, tableaux, mises en forme conditionnelles, validation, graphiques, tableaux croisés dynamiques et écrivains XLSX / CSV / JSON / HTML / PDF. Démarré à neuf et **sans interface** pour chaque tâche : il ne touche jamais l'app GridCraft ni un classeur ouvert. |
| **Serveur MCP** (Node.js) | 9 outils de haut niveau. Construit les classeurs à partir d'une description simple des feuilles (données et formules, en-tête, tableau, ligne de totaux, formats, règles, graphiques), nomme les feuilles des tableaux croisés, vérifie chaque sortie au préalable et renvoie les **valeurs calculées** des premières lignes de chaque feuille ainsi que les erreurs de formule, pour que l'assistant voie ce que donnent les formules. |
| **App en direct** (facultatif) | `open_in_gridcraft control=true` lance l'app avec son canal de contrôle local uniquement (port 7979) et `run_gridcraft_commands live=true` la pilote. Fermez l'app quand vous avez fini. |

## Outils

| Outil | Ce qu'il fait |
| --- | --- |
| `create_workbook` | Un nouveau classeur (ou un exemple : budget, sales, grades) à partir de feuilles : valeurs et formules, style d'en-tête, tableaux Excel, lignes de totaux, formats de nombre, polices, couleurs, bordures, fusions, mise en forme conditionnelle (surbrillances, barres de données, nuances de couleur, jeux d'icônes), listes déroulantes, notes, graphiques (17 types), volets figés, mise en page ; tableaux croisés dynamiques ; thème et propriétés |
| `edit_workbook` | Un classeur, une liste ou un dossier : écrire valeurs et formules, rechercher et remplacer, insérer ou supprimer lignes et colonnes, trier, supprimer les doublons, ajouter, renommer ou supprimer des feuilles, formats, mises en forme conditionnelles, tableaux, graphiques, tableaux croisés ; enregistré comme nouvelle copie |
| `read_workbook` | Valeurs calculées, formules ou texte affiché d'une plage ou d'une feuille, et formules évaluées sur le classeur sans le modifier |
| `convert_workbook` | Un classeur, une liste ou un dossier → xlsx, csv, tsv, json, html, pdf (une feuille ou toutes) |
| `get_workbook_info` | Feuilles avec plage utilisée, tableaux, graphiques, fusions, filtres, volets figés, règles, validations, notes ; noms définis ; premières lignes en valeurs calculées ; erreurs de formule |
| `list_gridcraft_catalog` | 339 commandes avec paramètres, 513 fonctions de feuille avec leur syntaxe, types de graphiques, exemples, formats |
| `run_gridcraft_commands` | N'importe quelles commandes du moteur plus `write_range`, `read_range`, `set_cell`, `evaluate_formula`, `format_range`, `insert_chart`... dans une session (références `$steps[N].champ`), sans interface ou en direct, puis enregistrement |
| `open_in_gridcraft` | Ouvre des classeurs (ou un exemple) dans l'app GridCraft, éventuellement avec le canal de contrôle |
| `get_gridcraft_status` | Plateforme, installation, version, commandes, fonctions, app / port de contrôle |

| | |
| --- | --- |
| **Ouvre** | xlsx, xlsm, xls (valeurs, formules, formats de nombre), xlsb et ods (données), csv, tsv, txt, json |
| **Enregistre** | xlsx (toutes les feuilles, formules, styles, tableaux, graphiques, tableaux croisés), csv, tsv, json, html, pdf |

Les cellules utilisent la notation **A1** (`B2`, `A1:D10`) ; dans les formules, mettez entre apostrophes les noms de feuille avec espaces (`'Ma feuille'!A1`). Les textes commençant par `=` sont des formules ; un texte comme `12%` ou `2026-03-01` est lu comme s'il était saisi.

## Exemple

```json
{
  "name": "Sales 2026",
  "sheets": [
    {
      "name": "Data",
      "data": [
        ["Region", "Product", "Units", "Price", "Total"],
        ["North", "A", 10, 12.5, "=C2*D2"],
        ["South", "A", 8, 12.5, "=C3*D3"],
        ["North", "B", 12, 20, "=C4*D4"],
        ["South", "B", 9, 20, "=C5*D5"]
      ],
      "table": true,
      "totals_row": ["none", "none", "sum", "average", "sum"],
      "formats": [{ "range": "D2:E6", "number_format": "Currency" }],
      "conditional_formats": [{ "range": "E2:E5", "type": "data_bar" }],
      "validations": [{ "range": "A2:A5", "list": ["North", "South", "East", "West"] }],
      "charts": [{ "range": "A1:A5", "type": "column", "title": "Units", "at": "G2" }]
    },
    {
      "name": "By region",
      "data": [["Region", "Total"], ["North", "=SUMIFS(Data!E:E,Data!A:A,A2)"], ["South", "=SUMIFS(Data!E:E,Data!A:A,A3)"]],
      "formats": [{ "range": "B2:B3", "number_format": "Currency" }],
      "charts": [{ "range": "A1:B3", "type": "pie", "title": "Sales by region", "at": "D2" }]
    }
  ],
  "pivots": [{ "source": "Data!A1:E5", "rows": ["Region"], "columns": ["Product"], "values": [{ "field": "Total", "func": "sum" }] }],
  "formats": ["xlsx", "pdf"],
  "output_dir": "C:\\Sheets"
}
```

## Prérequis

- **GridCraft** avec `gridcraft-cli` (testé avec **0.6.1**) ; voir [Plateformes](#plateformes)
- Node.js ≥ 20 (fourni avec Claude Desktop pour les installations `.mcpb`)

## Installation

### Claude Desktop (recommandé, toutes plateformes)

1. Téléchargez `gridcraft-mcp-server.mcpb` depuis la [dernière version](https://github.com/jhonsu01/gridcraft-mcp-server/releases/latest).
2. Double-cliquez dessus (ou glissez-le dans Claude Desktop → *Paramètres → Extensions*) et cliquez sur **Installer**.
3. Facultatif : si GridCraft n'est pas à un emplacement standard, indiquez son dossier ou le chemin de `gridcraft-cli` dans les paramètres de l'extension.

### Sunsam Code

Installez **GridCraft Bridge** depuis la marketplace de [Sunsam Code](https://github.com/jhonsu01/marketplace-SunsamCode), ou déposez le `.mcpb` dans *MCP → Installer une extension*.

### Codex (OpenAI)

**Recommandé — le marketplace (reçoit les mises à jour) :** *Plugins → Ajouter → Ajouter un marketplace*, source `jhonsu01/craft-marketplace`, référence `main`, puis installez **GridCraft Bridge** depuis **Craft Bridges** ([craft-marketplace](https://github.com/jhonsu01/craft-marketplace)). Les nouvelles versions arrivent en actualisant le marketplace. Ou envoyez le zip (Codex le garde dans votre compte et refuse un zip plus récent portant le même nom) :

1. Téléchargez `gridcraft-mcp-server-<version>-codex.zip` depuis la [dernière version](https://github.com/jhonsu01/gridcraft-mcp-server/releases/latest).
2. Dans Codex : *Plugins → Ajouter → Nouveau plugin*, choisissez le zip et cliquez sur **Ajouter le plugin**.
3. Codex lance le serveur avec `node` : Node.js ≥ 20 doit donc être dans le `PATH`. Si GridCraft n'est pas à un emplacement standard, définissez `GRIDCRAFT_DIR` ou `GRIDCRAFT_CLI` comme variables d'environnement système (Codex n'a pas de formulaire de paramètres pour les plugins locaux).

### DeepSeek Harness

1. *Plugins → Add plugin*, saisissez `github:jhonsu01/craft-marketplace#path:/plugins/gridcraft-mcp-server` puis cliquez sur **Install**, puis sur **Enable now**.
2. Harness lance le serveur avec son propre client MCP et `node` (Node.js ≥ 20 dans le `PATH`) ; les outils apparaissent sous la forme `mcp__gridcraft__<outil>` et les fichiers produits comme des cartes qui s'ouvrent dans Harness.
3. Harness ne met pas encore les plugins à jour tout seul : pour mettre à jour, désinstallez le plugin puis réinstallez-le avec la même adresse.

### Claude Code / autres clients MCP

```bash
git clone https://github.com/jhonsu01/gridcraft-mcp-server.git
cd gridcraft-mcp-server
npm install
npm run build
```

Windows :

```bash
claude mcp add gridcraft -- node "%CD%\dist\bundle.cjs"
```

macOS / Linux :

```bash
claude mcp add gridcraft -- node "$PWD/dist/bundle.cjs"
```

## Configuration

| Variable | Signification |
| --- | --- |
| `GRIDCRAFT_DIR` | Dossier de GridCraft, l'un de ses exécutables, la racine d'un `.tar.gz` (avec `bin/`) ou `GridCraft.app`. Par défaut : détection automatique |
| `GRIDCRAFT_CLI` | Chemin de `gridcraft-cli` / `gridcraft-cli.exe` (prioritaire sur `GRIDCRAFT_DIR`) |
| `GRIDCRAFT_APP` | Chemin de l'application de bureau si elle est ailleurs (par ex. une AppImage Linux) |
| `GRIDCRAFT_CONTROL_PORT` | Port de contrôle de l'application de bureau (7979 par défaut) |
| `GRIDCRAFT_MCP_TIMEOUT` | Nombre maximal de secondes par appel au moteur (3600 par défaut) |

## Sécurité

- Les fichiers ne sont **jamais écrasés** sans `overwrite: true` : dans un dossier, un nom libre (`_2`) est utilisé et un `output_path` existant est une erreur. Les entrées sont seulement lues ; un fichier modifié est enregistré uniquement comme nouvelle copie (`_edited`).
- Tous les chemins doivent être absolus. Le moteur tourne sans interface et ne touche jamais à l'application GridCraft sauf avec `live: true`.
- Tout s'exécute en local, sans accès réseau. Chaque tâche utilise un moteur privé dans un dossier temporaire supprimé à la fin.

## Développement

```bash
npm run build       # TypeScript + bundle en un seul fichier (dist/bundle.cjs)
npm test            # tests unitaires (logique des chemins Windows, macOS et Linux)
npm run test:e2e    # 25 vérifications de bout en bout (27 avec `E2E_LIVE=1`) via un vrai MCP stdio (CSV synthétique)
npm run pack:mcpb   # gridcraft-mcp-server.mcpb
npm run pack:codex  # zip du plugin Codex / DeepSeek Harness
```

Test Linux dans Docker (décompressez d'abord `gridcraft-<version>-linux-x86_64.tar.gz`) :

```bash
docker run --rm -v "$PWD:/work:ro" -v "/chemin/vers/gridcraft-0.6.1-linux-x86_64:/opt/gridcraft:ro" -e GRIDCRAFT_DIR=/opt/gridcraft -w /work node:22-bookworm bash -c "apt-get update && apt-get install -y libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig && node scripts/e2e.mjs"
```

## Licence

Apache-2.0. GridCraft est © ses auteurs (Storytold), MIT ou Apache-2.0.
Ce projet n'est ni affilié ni approuvé par GridCraft ou Storytold. Excel est une marque de Microsoft.
