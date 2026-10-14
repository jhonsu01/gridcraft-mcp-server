<p align="center"><img src="icon.png" width="120" alt="GridCraft Bridge 아이콘"></p>

<h1 align="center">GridCraft MCP Server</h1>

<p align="center">
  <a href="README.md">English</a> · <a href="README.es.md">Español</a> · <a href="README.pt-BR.md">Português</a> · <a href="README.fr.md">Français</a> · <a href="README.de.md">Deutsch</a> · <a href="README.ru.md">Русский</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <b>한국어</b>
</p>

<p align="center">
  컴퓨터에 설치된 <b>GridCraft</b>로 Claude가 스프레드시트를 만들고 읽게 하세요 — <b>Windows, macOS, Linux</b>:<br>
  살아 있는 수식이 있는 시트, 표, 서식, 조건부 서식, 차트와 피벗 테이블, 계산된 값, xlsx, csv, json, html, pdf.
</p>

---

## 왜 필요한가

[GridCraft](https://github.com/storytold/gridcraft)는 오픈 소스 Excel급 스프레드시트 앱으로, 화면 없는 CLI(`gridcraft-cli`), 339개 명령, 513개 워크시트 함수(동적 배열 포함), XLSX 기본 형식, MCP 모드를 갖추고 있습니다. 이 [Model Context Protocol](https://modelcontextprotocol.io) 서버는 그 엔진을 Claude용 **파일 입력 / 파일 출력 도구**로 바꿔 주므로, 이렇게 요청할 수 있습니다:

> *"수식, 요약 시트, 차트가 있는 월간 예산 통합 문서를 XLSX와 PDF로 만들어 줘."*
> *"`매출.xlsx`를 읽고 지역별 합계와 가장 좋았던 달을 알려 줘."*
> *"이 통합 문서에 지역과 제품별 매출 피벗 테이블을 추가해 줘."*
> *"`D:\보고서`의 모든 통합 문서에서 '2025'를 '2026'으로 바꾸고 사본을 저장해 줘."*
> *"이 CSV를 서식 있는 표가 있는 Excel로, 이 폴더의 모든 통합 문서를 CSV로 변환해 줘."*

형제 프로젝트: [designcraft-mcp-server](https://github.com/jhonsu01/designcraft-mcp-server), [effectcraft-mcp-server](https://github.com/jhonsu01/effectcraft-mcp-server), [lightcraft-mcp-server](https://github.com/jhonsu01/lightcraft-mcp-server), [photocraft-mcp-server](https://github.com/jhonsu01/photocraft-mcp-server), [vectorcraft-mcp-server](https://github.com/jhonsu01/vectorcraft-mcp-server), [filmcraft-mcp-server](https://github.com/jhonsu01/filmcraft-mcp-server), [pdfcraft-mcp-server](https://github.com/jhonsu01/pdfcraft-mcp-server), [wordcraft-mcp-server](https://github.com/jhonsu01/wordcraft-mcp-server), [soundcraft-mcp-server](https://github.com/jhonsu01/soundcraft-mcp-server), [deckcraft-mcp-server](https://github.com/jhonsu01/deckcraft-mcp-server), [audacity-mcp-server](https://github.com/jhonsu01/audacity-mcp-server).

## 플랫폼

| OS | 설치할 GridCraft 패키지 | 서버가 찾는 위치(설정 불필요) | 상태 |
| --- | --- | --- | --- |
| **Windows** 10/11 (x64, x86, arm64) | MSI 또는 포터블 zip | `C:\Program Files\GridCraft`, `%LOCALAPPDATA%\Programs\GridCraft`, `PATH` | ✅ 검증됨 (Windows 11) |
| **Linux** (x86_64, aarch64, riscv64) | `.deb`, `.rpm` 또는 `.tar.gz` | `/usr/bin`, `/usr/local/bin`, `/opt/gridcraft/bin`, `~/.local/bin`, `PATH` | ✅ 검증됨 (Debian 12, 화면 없음) |
| **macOS** 11+ (Apple 실리콘 및 Intel) | `.dmg`(앱) **와 함께** `gridcraft-cli-<버전>-macos-universal.zip` | `/Applications/GridCraft.app`, `/usr/local/bin`, `/opt/homebrew/bin`, `~/.local/bin`, `~/bin`, `PATH` | 🟡 지원됨, Mac에서는 아직 미검증 |

모든 다운로드: [GridCraft 릴리스](https://github.com/storytold/gridcraft/releases) (FreeBSD용 tar.gz도 있습니다. `GRIDCRAFT_DIR`로 지정하세요). 다른 위치라면 `GRIDCRAFT_DIR`(폴더, `.tar.gz` 루트 또는 `GridCraft.app`)이나 `GRIDCRAFT_CLI`를 설정하세요.

- **macOS:** DMG에는 앱만 들어 있습니다. 별도의 `gridcraft-cli` zip을 풀고 `gridcraft-cli`를 `/usr/local/bin`으로 옮기세요(또는 `GRIDCRAFT_CLI`로 지정). 처음 실행할 때 Apple 공증을 온라인으로 확인합니다.
- **Linux:** AppImage와 Flatpak에는 앱만 있고 `gridcraft-cli`는 없습니다. deb, rpm 또는 tar.gz를 사용하세요. 앱이 AppImage라면 `open_in_gridcraft`가 실행할 수 있도록 `GRIDCRAFT_APP`을 설정하세요. GPU가 없는 서버에서 검증한 환경은 `libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig`를 사용했습니다.

## 작동 방식

| 구성 요소 | 설명 |
| --- | --- |
| **GridCraft 엔진** (`gridcraft-cli mcp`) | GridCraft 자체 엔진: 셀, 513개 함수가 있는 계산 엔진, 스타일, 숫자 서식, 표, 조건부 서식, 데이터 유효성 검사, 차트, 피벗 테이블과 XLSX / CSV / JSON / HTML / PDF 출력기. 작업마다 새로 **화면 없이** 시작되므로 GridCraft 앱이나 열려 있는 통합 문서를 절대 건드리지 않습니다. |
| **MCP 서버** (Node.js) | 9개의 고수준 도구. 시트에 대한 간단한 설명(데이터와 수식, 머리글, 표, 요약 행, 서식, 규칙, 차트)으로 통합 문서를 만들고, 피벗 테이블 시트에 이름을 붙이고, 모든 출력을 미리 확인하며, 각 시트 앞부분의 **계산된 값**과 수식 오류를 돌려주어 어시스턴트가 수식 결과를 볼 수 있게 합니다. |
| **라이브 앱** (선택) | `open_in_gridcraft control=true`는 로컬 전용 제어 채널(포트 7979)로 앱을 시작하고, `run_gridcraft_commands live=true`가 앱을 조작합니다. 작업이 끝나면 앱을 닫으세요. |

## 도구

| 도구 | 기능 |
| --- | --- |
| `create_workbook` | 시트로 새 통합 문서(또는 예제: budget, sales, grades) 만들기: 값과 수식, 머리글 스타일, Excel 표, 요약 행, 숫자 서식, 글꼴, 색, 테두리, 셀 병합, 조건부 서식(강조, 데이터 막대, 색조, 아이콘 집합), 드롭다운 목록, 메모, 차트(17종), 틀 고정, 인쇄 설정; 피벗 테이블; 테마와 속성 |
| `edit_workbook` | 통합 문서 하나, 목록 또는 폴더: 값과 수식 쓰기, 찾기 및 바꾸기, 행과 열 삽입 또는 삭제, 정렬, 중복 제거, 시트 추가·이름 바꾸기·삭제, 서식, 조건부 서식, 표, 차트, 피벗 테이블; 새 사본으로 저장 |
| `read_workbook` | 범위나 시트의 계산된 값, 수식 또는 표시 텍스트를 읽고, 통합 문서를 바꾸지 않고 수식 계산 |
| `convert_workbook` | 통합 문서 하나, 목록 또는 폴더 → xlsx, csv, tsv, json, html, pdf(시트 하나 또는 전체) |
| `get_workbook_info` | 시트의 사용 범위, 표, 차트, 병합, 필터, 틀 고정, 규칙, 유효성 검사, 메모; 정의된 이름; 앞부분 행의 계산된 값; 수식 오류 |
| `list_gridcraft_catalog` | 매개변수가 있는 339개 명령, 구문이 있는 513개 워크시트 함수, 차트 종류, 예제, 형식 |
| `run_gridcraft_commands` | 모든 엔진 명령과 `write_range`, `read_range`, `set_cell`, `evaluate_formula`, `format_range`, `insert_chart`...를 한 세션에서 실행(`$steps[N].필드` 참조), 화면 없이 또는 라이브로 실행 후 저장 |
| `open_in_gridcraft` | GridCraft 앱에서 통합 문서(또는 예제) 열기(제어 채널 선택 가능) |
| `get_gridcraft_status` | 플랫폼, 설치, 버전, 명령, 함수, 앱 / 제어 포트 |

| | |
| --- | --- |
| **열기** | xlsx, xlsm, xls(값, 수식, 숫자 서식), xlsb와 ods(데이터), csv, tsv, txt, json |
| **저장** | xlsx(모든 시트, 수식, 스타일, 표, 차트, 피벗 테이블), csv, tsv, json, html, pdf |

셀은 **A1** 표기법을 씁니다(`B2`, `A1:D10`). 수식에서 공백이 있는 시트 이름은 작은따옴표로 감쌉니다(`'내 시트'!A1`). `=`로 시작하는 문자열은 수식이고, `12%`나 `2026-03-01` 같은 텍스트는 입력한 그대로 해석됩니다.

## 예시

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

## 요구 사항

- `gridcraft-cli`가 포함된 **GridCraft**(**0.6.1**으로 검증), [플랫폼](#플랫폼) 참고
- Node.js ≥ 20 (`.mcpb`로 설치할 때는 Claude Desktop에 포함)

## 설치

### Claude Desktop (권장, 모든 플랫폼)

1. [최신 릴리스](https://github.com/jhonsu01/gridcraft-mcp-server/releases/latest)에서 `gridcraft-mcp-server.mcpb`를 내려받습니다.
2. 두 번 클릭하거나 Claude Desktop → *설정 → 확장 프로그램*으로 끌어다 놓고 **설치**를 누릅니다.
3. 선택: GridCraft가 표준 위치에 없다면 확장 프로그램 설정에서 해당 폴더나 `gridcraft-cli` 경로를 입력합니다.

### Sunsam Code

[Sunsam Code](https://github.com/jhonsu01/marketplace-SunsamCode) 마켓플레이스에서 **GridCraft Bridge**를 설치하거나 `.mcpb`를 *MCP → 확장 프로그램 설치*에 끌어다 놓으세요.

### Codex (OpenAI)

**권장 — 마켓플레이스(업데이트 받음):** *플러그인 → 추가 → 마켓플레이스 추가*에서 소스 `jhonsu01/craft-marketplace`, 참조 `main`을 지정한 뒤 **Craft Bridges**에서 **GridCraft Bridge**를 설치합니다([craft-marketplace](https://github.com/jhonsu01/craft-marketplace)). 마켓플레이스를 새로 고치면 새 버전이 설치됩니다. 또는 zip을 업로드합니다(Codex는 계정에 저장하고 같은 이름의 새 zip은 거부합니다):

1. [최신 릴리스](https://github.com/jhonsu01/gridcraft-mcp-server/releases/latest)에서 `gridcraft-mcp-server-<버전>-codex.zip`을 내려받습니다.
2. Codex에서 *플러그인 → 추가 → 새 플러그인*을 열고 zip을 선택한 뒤 **플러그인 추가**를 누릅니다.
3. Codex는 `node`로 서버를 시작하므로 `PATH`에 Node.js ≥ 20이 있어야 합니다. GridCraft가 표준 위치에 없다면 `GRIDCRAFT_DIR` 또는 `GRIDCRAFT_CLI`를 시스템 환경 변수로 설정하세요(Codex에는 로컬 플러그인용 설정 화면이 없습니다).

### DeepSeek Harness

1. *Plugins → Add plugin*에서 `github:jhonsu01/craft-marketplace#path:/plugins/gridcraft-mcp-server`를 입력하고 **Install**, 이어서 **Enable now**를 누릅니다.
2. Harness는 자체 MCP 클라이언트와 `node`(`PATH`에 Node.js ≥ 20 필요)로 서버를 시작합니다. 도구는 `mcp__gridcraft__<도구>`로 표시되고, 출력 파일은 Harness에서 열리는 카드로 표시됩니다.
3. Harness는 아직 플러그인을 자동으로 업데이트하지 않습니다. 업데이트하려면 플러그인을 제거한 뒤 같은 주소로 다시 설치하세요.

### Claude Code / 기타 MCP 클라이언트

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

## 설정

| 변수 | 의미 |
| --- | --- |
| `GRIDCRAFT_DIR` | GridCraft 폴더, 그 안의 실행 파일, `.tar.gz` 루트(`bin/` 포함) 또는 `GridCraft.app`. 기본값: 자동 감지 |
| `GRIDCRAFT_CLI` | `gridcraft-cli` / `gridcraft-cli.exe` 경로(`GRIDCRAFT_DIR`보다 우선) |
| `GRIDCRAFT_APP` | 데스크톱 앱이 다른 곳에 있을 때의 경로(예: Linux AppImage) |
| `GRIDCRAFT_CONTROL_PORT` | 데스크톱 앱의 제어 포트(기본값 7979) |
| `GRIDCRAFT_MCP_TIMEOUT` | 엔진 호출당 최대 초(기본값 3600) |

## 안전

- `overwrite: true`가 아니면 파일을 **절대 덮어쓰지 않습니다**: 폴더에서는 빈 이름(`_2`)을 쓰고, 이미 있는 `output_path`는 오류입니다. 입력 파일은 읽기만 하며, 편집한 파일은 새 사본(`_edited`)으로만 저장됩니다.
- 모든 경로는 절대 경로여야 합니다. 엔진은 화면 없이 실행되며, `live: true`가 아니면 GridCraft 앱을 건드리지 않습니다.
- 모든 작업은 네트워크 접근 없이 로컬에서 실행됩니다. 작업마다 임시 폴더에서 전용 엔진을 사용하고, 끝나면 폴더를 삭제합니다.

## 개발

```bash
npm run build       # TypeScript + 단일 파일 번들(dist/bundle.cjs)
npm test            # 단위 테스트(Windows, macOS, Linux 경로 처리)
npm run test:e2e    # 실제 MCP stdio로 25개 엔드투엔드 검사(`E2E_LIVE=1`이면 27개, 합성 CSV)
npm run pack:mcpb   # gridcraft-mcp-server.mcpb
npm run pack:codex  # Codex / DeepSeek Harness 플러그인 zip
```

Docker에서 Linux 테스트(먼저 `gridcraft-<버전>-linux-x86_64.tar.gz`를 풀어 두세요):

```bash
docker run --rm -v "$PWD:/work:ro" -v "/path/to/gridcraft-0.6.1-linux-x86_64:/opt/gridcraft:ro" -e GRIDCRAFT_DIR=/opt/gridcraft -w /work node:22-bookworm bash -c "apt-get update && apt-get install -y libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig && node scripts/e2e.mjs"
```

## 라이선스

Apache-2.0. GridCraft의 저작권은 저작자(Storytold)에게 있으며 MIT 또는 Apache-2.0으로 제공됩니다.
이 프로젝트는 GridCraft 또는 Storytold와 관련이 없으며 이들의 보증을 받지 않았습니다. Excel은(는) Microsoft의 상표입니다.
