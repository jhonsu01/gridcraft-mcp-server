<p align="center"><img src="icon.png" width="120" alt="GridCraft Bridge のアイコン"></p>

<h1 align="center">GridCraft MCP Server</h1>

<p align="center">
  <a href="README.md">English</a> · <a href="README.es.md">Español</a> · <a href="README.pt-BR.md">Português</a> · <a href="README.fr.md">Français</a> · <a href="README.de.md">Deutsch</a> · <a href="README.ru.md">Русский</a> · <a href="README.zh-CN.md">简体中文</a> · <b>日本語</b> · <a href="README.ko.md">한국어</a>
</p>

<p align="center">
  お使いのコンピューターにインストールされた <b>GridCraft</b> で、Claude にスプレッドシートを作成・読み取りさせましょう — <b>Windows、macOS、Linux</b>：<br>
  生きた数式のあるシート、テーブル、書式、条件付き書式、グラフとピボットテーブル、計算結果、xlsx、csv、json、html、pdf。
</p>

---

## なぜ

[GridCraft](https://github.com/storytold/gridcraft) はオープンソースの Excel クラスの表計算アプリで、画面なしの CLI（`gridcraft-cli`）、339 のコマンド、513 のワークシート関数（動的配列を含む）、XLSX をネイティブ形式とし、MCP モードを備えています。この [Model Context Protocol](https://modelcontextprotocol.io) サーバーはそのエンジンを Claude 用の **「ファイルを入れてファイルを出す」ツール**に変えるので、次のように頼めます：

> *「数式、集計シート、グラフ付きの月次予算ブックを XLSX と PDF で作って。」*
> *「`売上.xlsx` を読んで、地域別の合計と一番良かった月を教えて。」*
> *「このブックに地域と製品別の売上のピボットテーブルを追加して。」*
> *「`D:\レポート` のすべてのブックで『2025』を『2026』に置き換えてコピーを保存して。」*
> *「この CSV を書式付きテーブルの Excel に、このフォルダーのすべてのブックを CSV に変換して。」*

姉妹プロジェクト： [designcraft-mcp-server](https://github.com/jhonsu01/designcraft-mcp-server), [effectcraft-mcp-server](https://github.com/jhonsu01/effectcraft-mcp-server), [lightcraft-mcp-server](https://github.com/jhonsu01/lightcraft-mcp-server), [photocraft-mcp-server](https://github.com/jhonsu01/photocraft-mcp-server), [vectorcraft-mcp-server](https://github.com/jhonsu01/vectorcraft-mcp-server), [filmcraft-mcp-server](https://github.com/jhonsu01/filmcraft-mcp-server), [pdfcraft-mcp-server](https://github.com/jhonsu01/pdfcraft-mcp-server), [wordcraft-mcp-server](https://github.com/jhonsu01/wordcraft-mcp-server), [soundcraft-mcp-server](https://github.com/jhonsu01/soundcraft-mcp-server), [deckcraft-mcp-server](https://github.com/jhonsu01/deckcraft-mcp-server)、[audacity-mcp-server](https://github.com/jhonsu01/audacity-mcp-server).

## 対応プラットフォーム

| OS | インストールする GridCraft パッケージ | サーバーが探す場所（設定不要） | 状態 |
| --- | --- | --- | --- |
| **Windows** 10/11（x64、x86、arm64） | MSI またはポータブル zip | `C:\Program Files\GridCraft`、`%LOCALAPPDATA%\Programs\GridCraft`、`PATH` | ✅ 検証済み（Windows 11） |
| **Linux**（x86_64、aarch64） | `.deb`、`.rpm` または `.tar.gz` | `/usr/bin`、`/usr/local/bin`、`/opt/gridcraft/bin`、`~/.local/bin`、`PATH` | ✅ 検証済み（Debian 12、画面なし） |
| **macOS** 11+（Apple シリコンと Intel） | `.dmg`（アプリ）**に加えて** `gridcraft-cli-<バージョン>-macos-universal.zip` | `/Applications/GridCraft.app`、`/usr/local/bin`、`/opt/homebrew/bin`、`~/.local/bin`、`~/bin`、`PATH` | 🟡 対応済み、Mac では未検証 |

ダウンロード：[GridCraft のリリース](https://github.com/storytold/gridcraft/releases)（FreeBSD 用の tar.gz もあります。`GRIDCRAFT_DIR` で指定してください）。それ以外の場所なら `GRIDCRAFT_DIR`（フォルダー、`.tar.gz` のルート、`GridCraft.app`）または `GRIDCRAFT_CLI` を設定します。

- **macOS：** DMG にはアプリしか入っていません。別配布の `gridcraft-cli` の zip を展開し、`gridcraft-cli` を `/usr/local/bin` に移動してください（または `GRIDCRAFT_CLI` で指定）。初回起動時に Apple の公証がオンラインで確認されます。
- **Linux：** AppImage と Flatpak にはアプリしか入っておらず、`gridcraft-cli` は含まれません。deb、rpm、tar.gz を使ってください。アプリが AppImage の場合は、`open_in_gridcraft` が起動できるよう `GRIDCRAFT_APP` を設定します。GPU のないサーバーでの検証環境では `libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig` を使いました。

## 仕組み

| 構成要素 | 内容 |
| --- | --- |
| **GridCraft エンジン**（`gridcraft-cli mcp`） | GridCraft 自身のエンジン：セル、513 の関数を持つ計算エンジン、スタイル、表示形式、テーブル、条件付き書式、データの入力規則、グラフ、ピボットテーブル、XLSX / CSV / JSON / HTML / PDF の書き出し。ジョブごとに新しく**画面なし**で起動するため、GridCraft アプリや開いているブックには一切触れません。 |
| **MCP サーバー**（Node.js） | 9 の高レベルツール。シートのシンプルな記述（データと数式、見出し、テーブル、集計行、書式、ルール、グラフ）からブックを組み立て、ピボットテーブルのシートに名前を付け、出力を事前に確認し、各シートの先頭行の**計算結果**と数式エラーを返すので、アシスタントは数式の結果を確認できます。 |
| **ライブアプリ**（任意） | `open_in_gridcraft control=true` はローカル専用の制御チャネル（ポート 7979）付きでアプリを起動し、`run_gridcraft_commands live=true` で操作します。終わったらアプリを閉じてください。 |

## ツール

| ツール | 機能 |
| --- | --- |
| `create_workbook` | シートから新しいブック（またはサンプル：budget、sales、grades）を作成：値と数式、見出しのスタイル、Excel テーブル、集計行、表示形式、フォント、色、罫線、セルの結合、条件付き書式（強調表示、データバー、カラースケール、アイコンセット）、ドロップダウンリスト、メモ、グラフ（17 種類）、ウィンドウ枠の固定、印刷設定、ピボットテーブル、テーマとプロパティ |
| `edit_workbook` | 1 つのブック、リスト、またはフォルダー：値と数式の書き込み、検索と置換、行と列の挿入や削除、並べ替え、重複の削除、シートの追加・名前変更・削除、書式、条件付き書式、テーブル、グラフ、ピボットテーブル。新しいコピーとして保存 |
| `read_workbook` | 範囲やシートの計算結果、数式、表示テキストを読み取り、ブックを変更せずに数式を評価 |
| `convert_workbook` | 1 つのブック、リスト、またはフォルダー → xlsx、csv、tsv、json、html、pdf（1 シートまたは全シート） |
| `get_workbook_info` | シートの使用範囲、テーブル、グラフ、結合、フィルター、固定、ルール、入力規則、メモ。定義された名前。先頭行の計算結果。数式エラー |
| `list_gridcraft_catalog` | パラメーター付きの 339 コマンド、構文付きの 513 ワークシート関数、グラフの種類、サンプル、形式 |
| `run_gridcraft_commands` | 任意のエンジンコマンドと `write_range`、`read_range`、`set_cell`、`evaluate_formula`、`format_range`、`insert_chart`... を 1 つのセッションで実行（`$steps[N].フィールド` 参照）、画面なしまたはライブで実行して保存 |
| `open_in_gridcraft` | GridCraft アプリでブック（またはサンプル）を開く（制御チャネル付きも可） |
| `get_gridcraft_status` | プラットフォーム、インストール、バージョン、コマンド、関数、アプリ / 制御ポート |

| | |
| --- | --- |
| **開く** | xlsx、xlsm、xls（値、数式、表示形式）、xlsb と ods（データ）、csv、tsv、txt、json |
| **保存** | xlsx（全シート、数式、スタイル、テーブル、グラフ、ピボットテーブル）、csv、tsv、json、html、pdf |

セルは **A1** 形式で指定します（`B2`、`A1:D10`）。数式では空白を含むシート名を引用符で囲みます（`'マイシート'!A1`）。`=` で始まる文字列は数式で、`12%` や `2026-03-01` のような文字列は入力したとおりに解釈されます。

## 例

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

## 必要なもの

- `gridcraft-cli` 付きの **GridCraft**（**0.6.1** で検証）。[対応プラットフォーム](#対応プラットフォーム)を参照
- Node.js ≥ 20（`.mcpb` でインストールする場合は Claude Desktop に同梱）

## インストール

### Claude Desktop（推奨、全プラットフォーム）

1. [最新リリース](https://github.com/jhonsu01/gridcraft-mcp-server/releases/latest)から `gridcraft-mcp-server.mcpb` をダウンロードします。
2. ダブルクリック（または Claude Desktop → *設定 → 拡張機能* にドラッグ）して **インストール** をクリックします。
3. 任意：GridCraft が標準の場所にない場合は、拡張機能の設定でそのフォルダーか `gridcraft-cli` のパスを入力します。

### Sunsam Code

[Sunsam Code](https://github.com/jhonsu01/marketplace-SunsamCode) のマーケットプレイスから **GridCraft Bridge** をインストールするか、`.mcpb` を *MCP → 拡張機能をインストール* にドロップします。

### Codex（OpenAI）

**推奨 — マーケットプレイス（更新を受け取れます）：** *プラグイン → 追加 → マーケットプレイスを追加* で、ソースに `jhonsu01/craft-marketplace`、参照に `main` を指定し、**Craft Bridges** から **GridCraft Bridge** をインストールします（[craft-marketplace](https://github.com/jhonsu01/craft-marketplace)）。新しいバージョンはマーケットプレイスの更新で届きます。または zip をアップロードします（Codex はアカウントに保存し、同じ名前の新しい zip を拒否します）：

1. [最新リリース](https://github.com/jhonsu01/gridcraft-mcp-server/releases/latest)から `gridcraft-mcp-server-<バージョン>-codex.zip` をダウンロードします。
2. Codex で *プラグイン → 追加 → 新しいプラグイン* を開き、zip を選んで **プラグインを追加** をクリックします。
3. Codex はサーバーを `node` で起動するため、`PATH` に Node.js ≥ 20 が必要です。GridCraft が標準の場所にない場合は、`GRIDCRAFT_DIR` または `GRIDCRAFT_CLI` をシステムの環境変数として設定してください（Codex にはローカルプラグイン用の設定画面がありません）。

### DeepSeek Harness

1. *Plugins → Add plugin* で `github:jhonsu01/craft-marketplace#path:/plugins/gridcraft-mcp-server` を入力し、**Install**、続けて **Enable now** をクリックします。
2. Harness は独自の MCP クライアントと `node`（`PATH` に Node.js ≥ 20 が必要）でサーバーを起動します。ツールは `mcp__gridcraft__<ツール>` として表示され、出力ファイルは Harness で開けるカードになります。
3. Harness はまだプラグインを自動更新しません。更新するには、プラグインをアンインストールして同じアドレスで再インストールしてください。

### Claude Code / その他の MCP クライアント

```bash
git clone https://github.com/jhonsu01/gridcraft-mcp-server.git
cd gridcraft-mcp-server
npm install
npm run build
```

Windows：

```bash
claude mcp add gridcraft -- node "%CD%\dist\bundle.cjs"
```

macOS / Linux：

```bash
claude mcp add gridcraft -- node "$PWD/dist/bundle.cjs"
```

## 設定

| 変数 | 意味 |
| --- | --- |
| `GRIDCRAFT_DIR` | GridCraft のフォルダー、その実行ファイルのいずれか、`.tar.gz` のルート（`bin/` を含む）または `GridCraft.app`。既定：自動検出 |
| `GRIDCRAFT_CLI` | `gridcraft-cli` / `gridcraft-cli.exe` のパス（`GRIDCRAFT_DIR` より優先） |
| `GRIDCRAFT_APP` | デスクトップアプリが別の場所にある場合のパス（例：Linux の AppImage） |
| `GRIDCRAFT_CONTROL_PORT` | デスクトップアプリの制御ポート（既定 7979） |
| `GRIDCRAFT_MCP_TIMEOUT` | エンジン呼び出し 1 回あたりの最大秒数（既定 3600） |

## 安全性

- `overwrite: true` でない限りファイルは**上書きされません**：フォルダーでは空いている名前（`_2`）を使い、既存の `output_path` はエラーになります。入力は読み取るだけで、編集したファイルは新しいコピー（`_edited`）としてのみ保存されます。
- パスはすべて絶対パスで指定します。エンジンは画面なしで動き、`live: true` でない限り GridCraft アプリには触れません。
- すべてローカルで実行され、ネットワークにはアクセスしません。ジョブごとに専用のエンジンを一時フォルダーで動かし、最後に削除します。

## 開発

```bash
npm run build       # TypeScript + 単一ファイルのバンドル（dist/bundle.cjs）
npm test            # ユニットテスト（Windows、macOS、Linux のパス処理）
npm run test:e2e    # 実際の MCP stdio による 25 のエンドツーエンドチェック（`E2E_LIVE=1` で 27、合成 CSV）
npm run pack:mcpb   # gridcraft-mcp-server.mcpb
npm run pack:codex  # Codex / DeepSeek Harness 用プラグイン zip
```

Docker での Linux テスト（先に `gridcraft-<バージョン>-linux-x86_64.tar.gz` を展開）：

```bash
docker run --rm -v "$PWD:/work:ro" -v "/path/to/gridcraft-0.6.1-linux-x86_64:/opt/gridcraft:ro" -e GRIDCRAFT_DIR=/opt/gridcraft -w /work node:22-bookworm bash -c "apt-get update && apt-get install -y libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig && node scripts/e2e.mjs"
```

## ライセンス

Apache-2.0。GridCraft の著作権はその作者（Storytold）に帰属し、MIT または Apache-2.0 で提供されています。
本プロジェクトは GridCraft および Storytold とは無関係であり、承認も受けていません。Excel は Microsoft の商標です。
