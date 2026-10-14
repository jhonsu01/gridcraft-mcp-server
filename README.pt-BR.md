<p align="center"><img src="icon.png" width="120" alt="Ícone do GridCraft Bridge"></p>

<h1 align="center">GridCraft MCP Server</h1>

<p align="center">
  <a href="README.md">English</a> · <a href="README.es.md">Español</a> · <b>Português</b> · <a href="README.fr.md">Français</a> · <a href="README.de.md">Deutsch</a> · <a href="README.ru.md">Русский</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a>
</p>

<p align="center">
  Deixe o Claude criar e ler planilhas com o <b>GridCraft</b> instalado no seu computador — <b>Windows, macOS e Linux</b>:<br>
  planilhas com fórmulas vivas, tabelas, formatos, formatação condicional, gráficos e tabelas dinâmicas, valores calculados, xlsx, csv, json, html e pdf.
</p>

---

## Por quê

[GridCraft](https://github.com/storytold/gridcraft) é um aplicativo de planilhas de código aberto no estilo do Excel, com uma CLI sem interface (`gridcraft-cli`), 339 comandos, 513 funções de planilha (incluindo matrizes dinâmicas), XLSX como formato nativo e um modo MCP. Este servidor [Model Context Protocol](https://modelcontextprotocol.io) transforma esse motor em **ferramentas de arquivo de entrada / arquivo de saída** para o Claude, para você pedir coisas como:

> *"Crie uma pasta de trabalho de orçamento mensal com fórmulas, uma aba de resumo e um gráfico, em XLSX e PDF."*
> *"Leia `vendas.xlsx` e diga o total por região e o melhor mês."*
> *"Adicione a esta pasta de trabalho uma tabela dinâmica de receita por região e produto."*
> *"Em todas as pastas de trabalho de `D:\Relatórios`, troque '2025' por '2026' e salve cópias."*
> *"Converta este CSV para Excel com uma tabela formatada, e todas as pastas de trabalho desta pasta para CSV."*

Irmão de [designcraft-mcp-server](https://github.com/jhonsu01/designcraft-mcp-server), [effectcraft-mcp-server](https://github.com/jhonsu01/effectcraft-mcp-server), [lightcraft-mcp-server](https://github.com/jhonsu01/lightcraft-mcp-server), [photocraft-mcp-server](https://github.com/jhonsu01/photocraft-mcp-server), [vectorcraft-mcp-server](https://github.com/jhonsu01/vectorcraft-mcp-server), [filmcraft-mcp-server](https://github.com/jhonsu01/filmcraft-mcp-server), [pdfcraft-mcp-server](https://github.com/jhonsu01/pdfcraft-mcp-server), [wordcraft-mcp-server](https://github.com/jhonsu01/wordcraft-mcp-server), [soundcraft-mcp-server](https://github.com/jhonsu01/soundcraft-mcp-server), [deckcraft-mcp-server](https://github.com/jhonsu01/deckcraft-mcp-server) e [audacity-mcp-server](https://github.com/jhonsu01/audacity-mcp-server).

## Plataformas

| SO | Pacote do GridCraft a instalar | Onde o servidor o encontra (sem configuração) | Status |
| --- | --- | --- | --- |
| **Windows** 10/11 (x64, x86, arm64) | MSI ou zip portátil | `C:\Program Files\GridCraft`, `%LOCALAPPDATA%\Programs\GridCraft`, `PATH` | ✅ Verificado (Windows 11) |
| **Linux** (x86_64, aarch64, riscv64) | `.deb`, `.rpm` ou `.tar.gz` | `/usr/bin`, `/usr/local/bin`, `/opt/gridcraft/bin`, `~/.local/bin`, `PATH` | ✅ Verificado (Debian 12, sem interface) |
| **macOS** 11+ (Apple silicon e Intel) | `.dmg` (o app) **mais** `gridcraft-cli-<versão>-macos-universal.zip` | `/Applications/GridCraft.app`, `/usr/local/bin`, `/opt/homebrew/bin`, `~/.local/bin`, `~/bin`, `PATH` | 🟡 Suportado, ainda não testado em um Mac |

Todos os downloads: [versões do GridCraft](https://github.com/storytold/gridcraft/releases) (também há um tar.gz para FreeBSD; aponte `GRIDCRAFT_DIR` para ele). Em qualquer outro lugar: defina `GRIDCRAFT_DIR` (pasta, raiz do `.tar.gz` ou `GridCraft.app`) ou `GRIDCRAFT_CLI`.

- **macOS:** o DMG contém só o app. Descompacte o zip separado do `gridcraft-cli` e mova `gridcraft-cli` para `/usr/local/bin` (ou aponte `GRIDCRAFT_CLI` para ele). A primeira execução verifica online a notarização da Apple.
- **Linux:** o AppImage e o Flatpak contêm só o app, não o `gridcraft-cli`; use o deb, o rpm ou o tar.gz. Para um app AppImage, defina `GRIDCRAFT_APP` para que `open_in_gridcraft` possa abri-lo. Em um servidor sem GPU, a configuração verificada usou `libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig`.

## Como funciona

| Parte | O que é |
| --- | --- |
| **Motor do GridCraft** (`gridcraft-cli mcp`) | O próprio motor do GridCraft: células, o mecanismo de cálculo com 513 funções, estilos, formatos de número, tabelas, formatação condicional, validação, gráficos, tabelas dinâmicas e os gravadores XLSX / CSV / JSON / HTML / PDF. Iniciado do zero e **sem interface** a cada tarefa, então nunca mexe no app do GridCraft nem em uma pasta de trabalho aberta. |
| **Servidor MCP** (Node.js) | 9 ferramentas de alto nível. Monta pastas de trabalho a partir de uma descrição simples das abas (dados e fórmulas, cabeçalho, tabela, linha de totais, formatos, regras, gráficos), dá nome às abas das tabelas dinâmicas, verifica cada saída antes e devolve os **valores calculados** das primeiras linhas de cada aba e qualquer erro de fórmula, para o assistente ver o que as fórmulas dão. |
| **App ao vivo** (opcional) | `open_in_gridcraft control=true` abre o app com seu canal de controle apenas local (porta 7979) e `run_gridcraft_commands live=true` o controla. Feche o app ao terminar. |

## Ferramentas

| Ferramenta | O que faz |
| --- | --- |
| `create_workbook` | Uma nova pasta de trabalho (ou um exemplo: budget, sales, grades) a partir de abas: valores e fórmulas, estilo de cabeçalho, tabelas do Excel, linhas de totais, formatos de número, fontes, cores, bordas, células mescladas, formatação condicional (destaques, barras de dados, escalas de cor, conjuntos de ícones), listas suspensas, notas, gráficos (17 tipos), painéis congelados, configuração de impressão; tabelas dinâmicas; tema e propriedades |
| `edit_workbook` | Uma pasta de trabalho, uma lista ou uma pasta: gravar valores e fórmulas, localizar e substituir, inserir ou excluir linhas e colunas, classificar, remover duplicatas, adicionar, renomear ou excluir abas, formatos, formatação condicional, tabelas, gráficos, tabelas dinâmicas; salvo como nova cópia |
| `read_workbook` | Valores calculados, fórmulas ou texto exibido de um intervalo ou aba, e fórmulas avaliadas sobre a pasta de trabalho sem alterá-la |
| `convert_workbook` | Uma pasta de trabalho, uma lista ou uma pasta → xlsx, csv, tsv, json, html, pdf (uma aba ou todas) |
| `get_workbook_info` | Abas com intervalo usado, tabelas, gráficos, mesclagens, filtros, painéis congelados, regras, validações, notas; nomes definidos; primeiras linhas como valores calculados; erros de fórmula |
| `list_gridcraft_catalog` | 339 comandos com parâmetros, 513 funções de planilha com assinatura, tipos de gráfico, exemplos, formatos |
| `run_gridcraft_commands` | Quaisquer comandos do motor mais `write_range`, `read_range`, `set_cell`, `evaluate_formula`, `format_range`, `insert_chart`... em uma sessão (referências `$steps[N].campo`), sem interface ou ao vivo, e depois salvar |
| `open_in_gridcraft` | Abre pastas de trabalho (ou um exemplo) no app GridCraft, opcionalmente com o canal de controle |
| `get_gridcraft_status` | Plataforma, instalação, versão, comandos, funções, app / porta de controle |

| | |
| --- | --- |
| **Abre** | xlsx, xlsm, xls (valores, fórmulas, formatos de número), xlsb e ods (dados), csv, tsv, txt, json |
| **Salva** | xlsx (todas as abas, fórmulas, estilos, tabelas, gráficos, tabelas dinâmicas), csv, tsv, json, html, pdf |

As células usam notação **A1** (`B2`, `A1:D10`); nas fórmulas, coloque entre aspas os nomes de abas com espaços (`'Minha aba'!A1`). Textos que começam com `=` são fórmulas; texto como `12%` ou `2026-03-01` é lido como se fosse digitado.

## Exemplo

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

## Requisitos

- **GridCraft** com `gridcraft-cli` (testado com **0.6.1**); veja [Plataformas](#plataformas)
- Node.js ≥ 20 (incluído no Claude Desktop para instalações `.mcpb`)

## Instalação

### Claude Desktop (recomendado, todas as plataformas)

1. Baixe `gridcraft-mcp-server.mcpb` da [versão mais recente](https://github.com/jhonsu01/gridcraft-mcp-server/releases/latest).
2. Dê um clique duplo (ou arraste para o Claude Desktop → *Configurações → Extensões*) e clique em **Instalar**.
3. Opcional: se o GridCraft não estiver em um local padrão, informe a pasta dele ou o caminho do `gridcraft-cli` nas configurações da extensão.

### Sunsam Code

Instale o **GridCraft Bridge** pelo marketplace do [Sunsam Code](https://github.com/jhonsu01/marketplace-SunsamCode), ou solte o `.mcpb` em *MCP → Instalar extensão*.

### Codex (OpenAI)

**Recomendado — o marketplace (recebe atualizações):** *Plugins → Adicionar → Adicionar marketplace*, origem `jhonsu01/craft-marketplace`, referência `main`, e instale o **GridCraft Bridge** em **Craft Bridges** ([craft-marketplace](https://github.com/jhonsu01/craft-marketplace)). As novas versões chegam ao atualizar o marketplace. Ou envie o zip (o Codex o guarda na sua conta e recusa um zip mais novo com o mesmo nome):

1. Baixe `gridcraft-mcp-server-<versão>-codex.zip` da [versão mais recente](https://github.com/jhonsu01/gridcraft-mcp-server/releases/latest).
2. No Codex: *Plugins → Adicionar → Novo plugin*, escolha o zip e clique em **Adicionar plugin**.
3. O Codex inicia o servidor com `node`, então o Node.js ≥ 20 precisa estar no `PATH`. Se o GridCraft não estiver em um local padrão, defina `GRIDCRAFT_DIR` ou `GRIDCRAFT_CLI` como variáveis de ambiente do sistema (o Codex não tem formulário de configuração para plugins locais).

### DeepSeek Harness

1. *Plugins → Add plugin*, digite `github:jhonsu01/craft-marketplace#path:/plugins/gridcraft-mcp-server` e clique em **Install** e depois em **Enable now**.
2. O Harness inicia o servidor com seu próprio cliente MCP e `node` (Node.js ≥ 20 no `PATH`); as ferramentas aparecem como `mcp__gridcraft__<ferramenta>` e os arquivos de saída como cartões que abrem no Harness.
3. O Harness ainda não atualiza plugins sozinho: para atualizar, desinstale o plugin e instale-o de novo com o mesmo endereço.

### Claude Code / outros clientes MCP

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

## Configuração

| Variável | Significado |
| --- | --- |
| `GRIDCRAFT_DIR` | Pasta do GridCraft, um de seus executáveis, a raiz de um `.tar.gz` (com `bin/`) ou `GridCraft.app`. Padrão: detecção automática |
| `GRIDCRAFT_CLI` | Caminho do `gridcraft-cli` / `gridcraft-cli.exe` (tem prioridade sobre `GRIDCRAFT_DIR`) |
| `GRIDCRAFT_APP` | Caminho do app de desktop quando ele está em outro lugar (ex.: um AppImage no Linux) |
| `GRIDCRAFT_CONTROL_PORT` | Porta de controle do app de desktop (padrão 7979) |
| `GRIDCRAFT_MCP_TIMEOUT` | Máximo de segundos por chamada ao motor (padrão 3600) |

## Segurança

- Os arquivos **nunca são sobrescritos** sem `overwrite: true`: em pastas é usado um nome livre (`_2`) e um `output_path` existente é um erro. As entradas são apenas lidas; um arquivo editado é salvo só como nova cópia (`_edited`).
- Todos os caminhos devem ser absolutos. O motor roda sem interface e nunca mexe no app do GridCraft, a menos que `live: true`.
- Tudo roda localmente, sem acesso à rede. Cada tarefa usa um motor privado em uma pasta temporária que é apagada no final.

## Desenvolvimento

```bash
npm run build       # TypeScript + bundle de arquivo único (dist/bundle.cjs)
npm test            # testes unitários (lógica de caminhos de Windows, macOS e Linux)
npm run test:e2e    # 25 verificações de ponta a ponta (27 com `E2E_LIVE=1`) via MCP stdio real (CSV sintético)
npm run pack:mcpb   # gridcraft-mcp-server.mcpb
npm run pack:codex  # zip do plugin para Codex / DeepSeek Harness
```

Teste de Linux no Docker (descompacte antes `gridcraft-<versão>-linux-x86_64.tar.gz`):

```bash
docker run --rm -v "$PWD:/work:ro" -v "/caminho/para/gridcraft-0.6.1-linux-x86_64:/opt/gridcraft:ro" -e GRIDCRAFT_DIR=/opt/gridcraft -w /work node:22-bookworm bash -c "apt-get update && apt-get install -y libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig && node scripts/e2e.mjs"
```

## Licença

Apache-2.0. O GridCraft é © de seus autores (Storytold), MIT ou Apache-2.0.
Este projeto não é afiliado nem endossado pelo GridCraft ou pela Storytold. Excel é uma marca da Microsoft.
