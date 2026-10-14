<p align="center"><img src="icon.png" width="120" alt="Значок GridCraft Bridge"></p>

<h1 align="center">GridCraft MCP Server</h1>

<p align="center">
  <a href="README.md">English</a> · <a href="README.es.md">Español</a> · <a href="README.pt-BR.md">Português</a> · <a href="README.fr.md">Français</a> · <a href="README.de.md">Deutsch</a> · <b>Русский</b> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a>
</p>

<p align="center">
  Позвольте Claude создавать и читать таблицы с помощью <b>GridCraft</b>, установленного на вашем компьютере, — <b>Windows, macOS и Linux</b>:<br>
  листы с живыми формулами, таблицы, форматы, условное форматирование, диаграммы и сводные таблицы, вычисленные значения, xlsx, csv, json, html и pdf.
</p>

---

## Зачем

[GridCraft](https://github.com/storytold/gridcraft) — табличный процессор с открытым исходным кодом уровня Excel, с CLI без интерфейса (`gridcraft-cli`), 339 командами, 513 функциями листа (включая динамические массивы), XLSX как основным форматом и режимом MCP. Этот сервер [Model Context Protocol](https://modelcontextprotocol.io) превращает движок в **инструменты «файл на входе / файл на выходе»** для Claude, чтобы можно было просить, например:

> *«Создай книгу месячного бюджета с формулами, листом сводки и диаграммой, в XLSX и PDF.»*
> *«Прочитай `продажи.xlsx` и скажи итог по регионам и лучший месяц.»*
> *«Добавь в эту книгу сводную таблицу выручки по регионам и продуктам.»*
> *«Во всех книгах из `D:\Отчёты` замени «2025» на «2026» и сохрани копии.»*
> *«Преобразуй этот CSV в Excel с оформленной таблицей, а все книги в этой папке — в CSV.»*

Родственные проекты: [designcraft-mcp-server](https://github.com/jhonsu01/designcraft-mcp-server), [effectcraft-mcp-server](https://github.com/jhonsu01/effectcraft-mcp-server), [lightcraft-mcp-server](https://github.com/jhonsu01/lightcraft-mcp-server), [photocraft-mcp-server](https://github.com/jhonsu01/photocraft-mcp-server), [vectorcraft-mcp-server](https://github.com/jhonsu01/vectorcraft-mcp-server), [filmcraft-mcp-server](https://github.com/jhonsu01/filmcraft-mcp-server), [pdfcraft-mcp-server](https://github.com/jhonsu01/pdfcraft-mcp-server), [wordcraft-mcp-server](https://github.com/jhonsu01/wordcraft-mcp-server), [soundcraft-mcp-server](https://github.com/jhonsu01/soundcraft-mcp-server), [deckcraft-mcp-server](https://github.com/jhonsu01/deckcraft-mcp-server) и [audacity-mcp-server](https://github.com/jhonsu01/audacity-mcp-server).

## Платформы

| ОС | Какой пакет GridCraft установить | Где сервер его находит (без настройки) | Статус |
| --- | --- | --- | --- |
| **Windows** 10/11 (x64, x86, arm64) | MSI или переносной zip | `C:\Program Files\GridCraft`, `%LOCALAPPDATA%\Programs\GridCraft`, `PATH` | ✅ Проверено (Windows 11) |
| **Linux** (x86_64, aarch64, riscv64) | `.deb`, `.rpm` или `.tar.gz` | `/usr/bin`, `/usr/local/bin`, `/opt/gridcraft/bin`, `~/.local/bin`, `PATH` | ✅ Проверено (Debian 12, без графики) |
| **macOS** 11+ (Apple silicon и Intel) | `.dmg` (приложение) **плюс** `gridcraft-cli-<версия>-macos-universal.zip` | `/Applications/GridCraft.app`, `/usr/local/bin`, `/opt/homebrew/bin`, `~/.local/bin`, `~/bin`, `PATH` | 🟡 Поддерживается, на Mac ещё не проверено |

Все загрузки: [релизы GridCraft](https://github.com/storytold/gridcraft/releases) (есть и tar.gz для FreeBSD — укажите его в `GRIDCRAFT_DIR`). В любом другом месте задайте `GRIDCRAFT_DIR` (папка, корень `.tar.gz` или `GridCraft.app`) или `GRIDCRAFT_CLI`.

- **macOS:** в DMG только само приложение. Распакуйте отдельный zip с `gridcraft-cli` и переместите `gridcraft-cli` в `/usr/local/bin` (или укажите его в `GRIDCRAFT_CLI`). При первом запуске нотаризация Apple проверяется через интернет.
- **Linux:** AppImage и Flatpak содержат только приложение, без `gridcraft-cli`; используйте deb, rpm или tar.gz. Для приложения в AppImage задайте `GRIDCRAFT_APP`, чтобы `open_in_gridcraft` мог его запустить. На сервере без GPU в проверенной конфигурации использовались `libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig`.

## Как это работает

| Часть | Что это |
| --- | --- |
| **Движок GridCraft** (`gridcraft-cli mcp`) | Собственный движок GridCraft: ячейки, вычислительный движок с 513 функциями, стили, числовые форматы, таблицы, условные форматы, проверка данных, диаграммы, сводные таблицы и модули записи XLSX / CSV / JSON / HTML / PDF. Запускается заново и **без интерфейса** для каждой задачи, поэтому никогда не трогает приложение GridCraft или открытую книгу. |
| **Сервер MCP** (Node.js) | 9 высокоуровневых инструментов. Собирает книги из простого описания листов (данные и формулы, заголовок, таблица, строка итогов, форматы, правила, диаграммы), даёт имена листам сводных таблиц, заранее проверяет каждый выходной файл и возвращает **вычисленные значения** первых строк каждого листа и все ошибки формул, чтобы ассистент видел, что дают формулы. |
| **Приложение вживую** (необязательно) | `open_in_gridcraft control=true` запускает приложение с каналом управления только для локальных подключений (порт 7979), а `run_gridcraft_commands live=true` управляет им. Закройте приложение, когда закончите. |

## Инструменты

| Инструмент | Что делает |
| --- | --- |
| `create_workbook` | Новая книга (или пример: budget, sales, grades) из листов: значения и формулы, стиль заголовка, таблицы Excel, строки итогов, числовые форматы, шрифты, цвета, границы, объединения, условное форматирование (выделение, гистограммы, цветовые шкалы, наборы значков), раскрывающиеся списки, примечания, диаграммы (17 типов), закреплённые области, параметры печати; сводные таблицы; тема и свойства |
| `edit_workbook` | Книга, список или папка: запись значений и формул, поиск и замена, вставка и удаление строк и столбцов, сортировка, удаление дубликатов, добавление, переименование и удаление листов, форматы, условные форматы, таблицы, диаграммы, сводные таблицы; сохраняется как новая копия |
| `read_workbook` | Вычисленные значения, формулы или отображаемый текст диапазона или листа, а также формулы, вычисленные по книге без её изменения |
| `convert_workbook` | Книга, список или папка → xlsx, csv, tsv, json, html, pdf (один лист или все) |
| `get_workbook_info` | Листы с используемым диапазоном, таблицами, диаграммами, объединениями, фильтрами, закреплёнными областями, правилами, проверками, примечаниями; определённые имена; первые строки как вычисленные значения; ошибки формул |
| `list_gridcraft_catalog` | 339 команд с параметрами, 513 функций листа с синтаксисом, типы диаграмм, примеры, форматы |
| `run_gridcraft_commands` | Любые команды движка плюс `write_range`, `read_range`, `set_cell`, `evaluate_formula`, `format_range`, `insert_chart`... в одной сессии (ссылки `$steps[N].поле`), без интерфейса или вживую, затем сохранение |
| `open_in_gridcraft` | Открывает книги (или пример) в приложении GridCraft, при желании с каналом управления |
| `get_gridcraft_status` | Платформа, установка, версия, команды, функции, приложение / порт управления |

| | |
| --- | --- |
| **Открывает** | xlsx, xlsm, xls (значения, формулы, числовые форматы), xlsb и ods (данные), csv, tsv, txt, json |
| **Сохраняет** | xlsx (все листы, формулы, стили, таблицы, диаграммы, сводные таблицы), csv, tsv, json, html, pdf |

Ячейки задаются в нотации **A1** (`B2`, `A1:D10`); в формулах берите имена листов с пробелами в апострофы (`'Мой лист'!A1`). Строки, начинающиеся с `=`, — формулы; текст вроде `12%` или `2026-03-01` читается как введённый вручную.

## Пример

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

## Требования

- **GridCraft** с `gridcraft-cli` (проверено на **0.6.1**); см. [Платформы](#платформы)
- Node.js ≥ 20 (входит в Claude Desktop при установке `.mcpb`)

## Установка

### Claude Desktop (рекомендуется, все платформы)

1. Скачайте `gridcraft-mcp-server.mcpb` из [последнего релиза](https://github.com/jhonsu01/gridcraft-mcp-server/releases/latest).
2. Дважды щёлкните по файлу (или перетащите его в Claude Desktop → *Настройки → Расширения*) и нажмите **Установить**.
3. По желанию: если GridCraft установлен не в стандартное место, укажите его папку или путь к `gridcraft-cli` в настройках расширения.

### Sunsam Code

Установите **GridCraft Bridge** из маркетплейса [Sunsam Code](https://github.com/jhonsu01/marketplace-SunsamCode) или перетащите `.mcpb` в *MCP → Установить расширение*.

### Codex (OpenAI)

**Рекомендуется — маркетплейс (получает обновления):** *Плагины → Добавить → Добавить маркетплейс*, источник `jhonsu01/craft-marketplace`, ссылка `main`, затем установите **GridCraft Bridge** из **Craft Bridges** ([craft-marketplace](https://github.com/jhonsu01/craft-marketplace)). Новые версии приходят при обновлении маркетплейса. Или загрузите zip (Codex сохранит его в вашей учётной записи и отклонит более новый zip с тем же именем):

1. Скачайте `gridcraft-mcp-server-<версия>-codex.zip` из [последнего релиза](https://github.com/jhonsu01/gridcraft-mcp-server/releases/latest).
2. В Codex: *Плагины → Добавить → Новый плагин*, выберите zip и нажмите **Добавить плагин**.
3. Codex запускает сервер через `node`, поэтому Node.js ≥ 20 должен быть в `PATH`. Если GridCraft установлен не в стандартное место, задайте `GRIDCRAFT_DIR` или `GRIDCRAFT_CLI` как системные переменные окружения (у Codex нет формы настроек для локальных плагинов).

### DeepSeek Harness

1. *Plugins → Add plugin*, введите `github:jhonsu01/craft-marketplace#path:/plugins/gridcraft-mcp-server` и нажмите **Install**, затем **Enable now**.
2. Harness запускает сервер через свой MCP-клиент и `node` (Node.js ≥ 20 в `PATH`); инструменты появляются как `mcp__gridcraft__<инструмент>`, а выходные файлы — как карточки, которые открываются в Harness.
3. Harness пока не обновляет плагины сам: чтобы обновить, удалите плагин и установите его снова по тому же адресу.

### Claude Code / другие MCP-клиенты

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

## Настройка

| Переменная | Значение |
| --- | --- |
| `GRIDCRAFT_DIR` | Папка GridCraft, один из его исполняемых файлов, корень `.tar.gz` (с `bin/`) или `GridCraft.app`. По умолчанию: автоопределение |
| `GRIDCRAFT_CLI` | Путь к `gridcraft-cli` / `gridcraft-cli.exe` (важнее, чем `GRIDCRAFT_DIR`) |
| `GRIDCRAFT_APP` | Путь к настольному приложению, если оно лежит в другом месте (например, AppImage в Linux) |
| `GRIDCRAFT_CONTROL_PORT` | Порт управления настольным приложением (по умолчанию 7979) |
| `GRIDCRAFT_MCP_TIMEOUT` | Максимум секунд на один вызов движка (по умолчанию 3600) |

## Безопасность

- Файлы **никогда не перезаписываются** без `overwrite: true`: в папках берётся свободное имя (`_2`), а существующий `output_path` — ошибка. Входные файлы только читаются; изменённый файл сохраняется только как новая копия (`_edited`).
- Все пути должны быть абсолютными. Движок работает без окна и никогда не трогает приложение GridCraft, если не указано `live: true`.
- Всё выполняется локально, без доступа к сети. Каждая задача использует отдельный движок во временной папке, которая удаляется в конце.

## Разработка

```bash
npm run build       # TypeScript + бандл в одном файле (dist/bundle.cjs)
npm test            # модульные тесты (логика путей Windows, macOS и Linux)
npm run test:e2e    # 25 сквозных проверок (27 с `E2E_LIVE=1`) через настоящий MCP stdio (синтетический CSV)
npm run pack:mcpb   # gridcraft-mcp-server.mcpb
npm run pack:codex  # zip плагина для Codex / DeepSeek Harness
```

Проверка Linux в Docker (сначала распакуйте `gridcraft-<версия>-linux-x86_64.tar.gz`):

```bash
docker run --rm -v "$PWD:/work:ro" -v "/путь/к/gridcraft-0.6.1-linux-x86_64:/opt/gridcraft:ro" -e GRIDCRAFT_DIR=/opt/gridcraft -w /work node:22-bookworm bash -c "apt-get update && apt-get install -y libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig && node scripts/e2e.mjs"
```

## Лицензия

Apache-2.0. GridCraft © его авторы (Storytold), MIT или Apache-2.0.
Этот проект не связан с GridCraft или Storytold и не одобрен ими. Excel — товарный знак Microsoft.
