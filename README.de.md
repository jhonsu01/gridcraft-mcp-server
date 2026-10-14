<p align="center"><img src="icon.png" width="120" alt="GridCraft-Bridge-Symbol"></p>

<h1 align="center">GridCraft MCP Server</h1>

<p align="center">
  <a href="README.md">English</a> · <a href="README.es.md">Español</a> · <a href="README.pt-BR.md">Português</a> · <a href="README.fr.md">Français</a> · <b>Deutsch</b> · <a href="README.ru.md">Русский</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a>
</p>

<p align="center">
  Lass Claude Tabellen mit dem auf deinem Computer installierten <b>GridCraft</b> erstellen und lesen — <b>Windows, macOS und Linux</b>:<br>
  Blätter mit lebenden Formeln, Tabellen, Formate, bedingte Formatierung, Diagramme und PivotTables, berechnete Werte, xlsx, csv, json, html und pdf.
</p>

---

## Warum

[GridCraft](https://github.com/storytold/gridcraft) ist eine quelloffene Tabellenkalkulation der Excel-Klasse mit einer CLI ohne Oberfläche (`gridcraft-cli`), 339 Befehlen, 513 Tabellenfunktionen (inklusive dynamischer Arrays), XLSX als nativem Format und einem MCP-Modus. Dieser [Model Context Protocol](https://modelcontextprotocol.io)-Server macht aus dieser Engine **Datei-rein / Datei-raus-Werkzeuge** für Claude, sodass du zum Beispiel fragen kannst:

> *„Erstelle eine Monatsbudget-Mappe mit Formeln, einem Übersichtsblatt und einem Diagramm, als XLSX und PDF."*
> *„Lies `umsatz.xlsx` und sag mir die Summe nach Region und den besten Monat."*
> *„Füge dieser Mappe eine PivotTable des Umsatzes nach Region und Produkt hinzu."*
> *„Ersetze in allen Mappen in `D:\Berichte` '2025' durch '2026' und speichere Kopien."*
> *„Wandle diese CSV in Excel mit formatierter Tabelle um und alle Mappen in diesem Ordner in CSV."*

Geschwister von [designcraft-mcp-server](https://github.com/jhonsu01/designcraft-mcp-server), [effectcraft-mcp-server](https://github.com/jhonsu01/effectcraft-mcp-server), [lightcraft-mcp-server](https://github.com/jhonsu01/lightcraft-mcp-server), [photocraft-mcp-server](https://github.com/jhonsu01/photocraft-mcp-server), [vectorcraft-mcp-server](https://github.com/jhonsu01/vectorcraft-mcp-server), [filmcraft-mcp-server](https://github.com/jhonsu01/filmcraft-mcp-server), [pdfcraft-mcp-server](https://github.com/jhonsu01/pdfcraft-mcp-server), [wordcraft-mcp-server](https://github.com/jhonsu01/wordcraft-mcp-server), [soundcraft-mcp-server](https://github.com/jhonsu01/soundcraft-mcp-server), [deckcraft-mcp-server](https://github.com/jhonsu01/deckcraft-mcp-server) und [audacity-mcp-server](https://github.com/jhonsu01/audacity-mcp-server).

## Plattformen

| Betriebssystem | Zu installierendes GridCraft-Paket | Wo der Server es findet (ohne Einrichtung) | Status |
| --- | --- | --- | --- |
| **Windows** 10/11 (x64, x86, arm64) | MSI oder portables Zip | `C:\Program Files\GridCraft`, `%LOCALAPPDATA%\Programs\GridCraft`, `PATH` | ✅ Geprüft (Windows 11) |
| **Linux** (x86_64, aarch64, riscv64) | `.deb`, `.rpm` oder `.tar.gz` | `/usr/bin`, `/usr/local/bin`, `/opt/gridcraft/bin`, `~/.local/bin`, `PATH` | ✅ Geprüft (Debian 12, ohne Oberfläche) |
| **macOS** 11+ (Apple Silicon und Intel) | `.dmg` (die App) **plus** `gridcraft-cli-<version>-macos-universal.zip` | `/Applications/GridCraft.app`, `/usr/local/bin`, `/opt/homebrew/bin`, `~/.local/bin`, `~/bin`, `PATH` | 🟡 Unterstützt, noch nicht auf einem Mac getestet |

Alle Downloads: [GridCraft-Releases](https://github.com/storytold/gridcraft/releases) (es gibt auch ein FreeBSD-tar.gz; setzen Sie `GRIDCRAFT_DIR` darauf). An jedem anderen Ort: `GRIDCRAFT_DIR` (Ordner, `.tar.gz`-Wurzel oder `GridCraft.app`) oder `GRIDCRAFT_CLI` setzen.

- **macOS:** Das DMG enthält nur die App. Entpacken Sie das separate `gridcraft-cli`-Zip und verschieben Sie `gridcraft-cli` nach `/usr/local/bin` (oder setzen Sie `GRIDCRAFT_CLI` darauf). Beim ersten Start wird Apples Notarisierung online geprüft.
- **Linux:** AppImage und Flatpak enthalten nur die App, nicht `gridcraft-cli`; verwenden Sie deb, rpm oder tar.gz. Für eine AppImage-App setzen Sie `GRIDCRAFT_APP`, damit `open_in_gridcraft` sie starten kann. Auf einem Server ohne GPU nutzte die geprüfte Einrichtung `libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig`.

## Funktionsweise

| Teil | Was es ist |
| --- | --- |
| **GridCraft-Engine** (`gridcraft-cli mcp`) | GridCrafts eigene Engine: Zellen, die Berechnungsengine mit 513 Funktionen, Formatvorlagen, Zahlenformate, Tabellen, bedingte Formate, Gültigkeitsprüfung, Diagramme, PivotTables und die Writer für XLSX / CSV / JSON / HTML / PDF. Für jeden Auftrag frisch und **ohne Oberfläche** gestartet, sodass sie nie die GridCraft-App oder eine geöffnete Mappe berührt. |
| **MCP-Server** (Node.js) | 9 übergeordnete Werkzeuge. Baut Mappen aus einer einfachen Beschreibung der Blätter (Daten und Formeln, Kopfzeile, Tabelle, Summenzeile, Formate, Regeln, Diagramme), benennt PivotTable-Blätter, prüft jede Ausgabe vorab und liefert die **berechneten Werte** der ersten Zeilen jedes Blatts sowie alle Formelfehler, damit der Assistent sieht, was die Formeln ergeben. |
| **Live-App** (optional) | `open_in_gridcraft control=true` startet die App mit ihrem nur lokalen Steuerkanal (Port 7979) und `run_gridcraft_commands live=true` steuert sie. Schließe die App, wenn du fertig bist. |

## Werkzeuge

| Werkzeug | Was es tut |
| --- | --- |
| `create_workbook` | Eine neue Mappe (oder ein Beispiel: budget, sales, grades) aus Blättern: Werte und Formeln, Kopfzeilenstil, Excel-Tabellen, Summenzeilen, Zahlenformate, Schriften, Farben, Rahmen, verbundene Zellen, bedingte Formatierung (Hervorhebungen, Datenbalken, Farbskalen, Symbolsätze), Dropdown-Listen, Notizen, Diagramme (17 Typen), fixierte Bereiche, Druckeinrichtung; PivotTables; Design und Eigenschaften |
| `edit_workbook` | Eine Mappe, eine Liste oder ein Ordner: Werte und Formeln schreiben, Suchen und Ersetzen, Zeilen und Spalten einfügen oder löschen, sortieren, Duplikate entfernen, Blätter hinzufügen, umbenennen oder löschen, Formate, bedingte Formate, Tabellen, Diagramme, PivotTables; als neue Kopie gespeichert |
| `read_workbook` | Berechnete Werte, Formeln oder angezeigter Text eines Bereichs oder Blatts, und Formeln, die gegen die Mappe ausgewertet werden, ohne sie zu ändern |
| `convert_workbook` | Eine Mappe, eine Liste oder ein Ordner → xlsx, csv, tsv, json, html, pdf (ein Blatt oder alle) |
| `get_workbook_info` | Blätter mit verwendetem Bereich, Tabellen, Diagrammen, Verbünden, Filtern, fixierten Bereichen, Regeln, Gültigkeitsprüfungen, Notizen; definierte Namen; erste Zeilen als berechnete Werte; Formelfehler |
| `list_gridcraft_catalog` | 339 Befehle mit Parametern, 513 Tabellenfunktionen mit Syntax, Diagrammtypen, Beispiele, Formate |
| `run_gridcraft_commands` | Beliebige Engine-Befehle plus `write_range`, `read_range`, `set_cell`, `evaluate_formula`, `format_range`, `insert_chart`... in einer Sitzung (Verweise `$steps[N].feld`), ohne Oberfläche oder live, danach speichern |
| `open_in_gridcraft` | Öffnet Mappen (oder ein Beispiel) in der GridCraft-App, optional mit dem Steuerkanal |
| `get_gridcraft_status` | Plattform, Installation, Version, Befehle, Funktionen, App / Steuerport |

| | |
| --- | --- |
| **Öffnet** | xlsx, xlsm, xls (Werte, Formeln, Zahlenformate), xlsb und ods (Daten), csv, tsv, txt, json |
| **Speichert** | xlsx (alle Blätter, Formeln, Formatvorlagen, Tabellen, Diagramme, PivotTables), csv, tsv, json, html, pdf |

Zellen verwenden die **A1**-Schreibweise (`B2`, `A1:D10`); setze Blattnamen mit Leerzeichen in Formeln in Hochkommas (`'Mein Blatt'!A1`). Text, der mit `=` beginnt, ist eine Formel; Text wie `12%` oder `2026-03-01` wird wie eingetippt gelesen.

## Beispiel

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

## Voraussetzungen

- **GridCraft** mit `gridcraft-cli` (getestet mit **0.6.1**); siehe [Plattformen](#plattformen)
- Node.js ≥ 20 (bei `.mcpb`-Installationen in Claude Desktop enthalten)

## Installation

### Claude Desktop (empfohlen, alle Plattformen)

1. Laden Sie `gridcraft-mcp-server.mcpb` aus dem [neuesten Release](https://github.com/jhonsu01/gridcraft-mcp-server/releases/latest) herunter.
2. Doppelklicken Sie darauf (oder ziehen Sie sie in Claude Desktop → *Einstellungen → Erweiterungen*) und klicken Sie auf **Installieren**.
3. Optional: Liegt GridCraft nicht an einem Standardort, geben Sie in den Einstellungen der Erweiterung den Ordner oder den Pfad zu `gridcraft-cli` an.

### Sunsam Code

Installiere **GridCraft Bridge** aus dem Marketplace von [Sunsam Code](https://github.com/jhonsu01/marketplace-SunsamCode) oder zieh die `.mcpb` in *MCP → Erweiterung installieren*.

### Codex (OpenAI)

**Empfohlen — der Marketplace (erhält Updates):** *Plugins → Hinzufügen → Marketplace hinzufügen*, Quelle `jhonsu01/craft-marketplace`, Referenz `main`, dann **GridCraft Bridge** aus **Craft Bridges** installieren ([craft-marketplace](https://github.com/jhonsu01/craft-marketplace)). Neue Versionen kommen durch Aktualisieren des Marketplace. Oder das Zip hochladen (Codex speichert es in Ihrem Konto und lehnt ein neueres Zip mit demselben Namen ab):

1. Laden Sie `gridcraft-mcp-server-<version>-codex.zip` aus dem [neuesten Release](https://github.com/jhonsu01/gridcraft-mcp-server/releases/latest) herunter.
2. In Codex: *Plugins → Hinzufügen → Neues Plugin*, das Zip wählen und auf **Plugin hinzufügen** klicken.
3. Codex startet den Server mit `node`, daher muss Node.js ≥ 20 im `PATH` liegen. Liegt GridCraft nicht an einem Standardort, setzen Sie `GRIDCRAFT_DIR` oder `GRIDCRAFT_CLI` als Systemumgebungsvariablen (Codex hat für lokale Plugins kein Einstellungsformular).

### DeepSeek Harness

1. *Plugins → Add plugin*, `github:jhonsu01/craft-marketplace#path:/plugins/gridcraft-mcp-server` eingeben, auf **Install** und dann auf **Enable now** klicken.
2. Harness startet den Server mit seinem eigenen MCP-Client und `node` (Node.js ≥ 20 im `PATH`); die Werkzeuge erscheinen als `mcp__gridcraft__<werkzeug>`, die Ausgabedateien als Karten, die sich in Harness öffnen.
3. Harness aktualisiert Plugins noch nicht selbst: Zum Aktualisieren das Plugin deinstallieren und mit derselben Adresse neu installieren.

### Claude Code / andere MCP-Clients

```bash
git clone https://github.com/jhonsu01/gridcraft-mcp-server.git
cd gridcraft-mcp-server
npm install
npm run build
```

Windows:

```bash
claude mcp add gridcraft -- node "%CD%\dist\bundle.cjs"
```

macOS / Linux:

```bash
claude mcp add gridcraft -- node "$PWD/dist/bundle.cjs"
```

## Konfiguration

| Variable | Bedeutung |
| --- | --- |
| `GRIDCRAFT_DIR` | GridCraft-Ordner, eine seiner ausführbaren Dateien, eine `.tar.gz`-Wurzel (mit `bin/`) oder `GridCraft.app`. Standard: automatische Erkennung |
| `GRIDCRAFT_CLI` | Pfad zu `gridcraft-cli` / `gridcraft-cli.exe` (hat Vorrang vor `GRIDCRAFT_DIR`) |
| `GRIDCRAFT_APP` | Pfad der Desktop-App, wenn sie woanders liegt (z. B. ein Linux-AppImage) |
| `GRIDCRAFT_CONTROL_PORT` | Steuerport der Desktop-App (Standard 7979) |
| `GRIDCRAFT_MCP_TIMEOUT` | Maximale Sekunden pro Engine-Aufruf (Standard 3600) |

## Sicherheit

- Dateien werden **nie überschrieben**, außer mit `overwrite: true`: in Ordnern wird ein freier Name (`_2`) verwendet und ein vorhandener `output_path` ist ein Fehler. Eingaben werden nur gelesen; eine bearbeitete Datei wird nur als neue Kopie gespeichert (`_edited`).
- Alle Pfade müssen absolut sein. Die Engine läuft ohne Oberfläche und berührt die GridCraft-App nie, außer mit `live: true`.
- Alles läuft lokal ohne Netzwerkzugriff. Jeder Auftrag nutzt eine eigene Engine in einem temporären Ordner, der am Ende gelöscht wird.

## Entwicklung

```bash
npm run build       # TypeScript + Ein-Datei-Bundle (dist/bundle.cjs)
npm test            # Unit-Tests (Pfadlogik für Windows, macOS und Linux)
npm run test:e2e    # 25 End-to-End-Prüfungen (27 mit `E2E_LIVE=1`) über echtes MCP-stdio (synthetische CSV)
npm run pack:mcpb   # gridcraft-mcp-server.mcpb
npm run pack:codex  # Plugin-Zip für Codex / DeepSeek Harness
```

Linux-Test in Docker (zuerst `gridcraft-<version>-linux-x86_64.tar.gz` entpacken):

```bash
docker run --rm -v "$PWD:/work:ro" -v "/pfad/zu/gridcraft-0.6.1-linux-x86_64:/opt/gridcraft:ro" -e GRIDCRAFT_DIR=/opt/gridcraft -w /work node:22-bookworm bash -c "apt-get update && apt-get install -y libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig && node scripts/e2e.mjs"
```

## Lizenz

Apache-2.0. GridCraft ist © seiner Autoren (Storytold), MIT oder Apache-2.0.
Dieses Projekt ist weder mit GridCraft noch mit Storytold verbunden oder von ihnen unterstützt. Excel ist eine Marke von Microsoft.
