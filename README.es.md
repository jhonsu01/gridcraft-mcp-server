<p align="center"><img src="icon.png" width="120" alt="Icono de GridCraft Bridge"></p>

<h1 align="center">GridCraft MCP Server</h1>

<p align="center">
  <a href="README.md">English</a> · <b>Español</b> · <a href="README.pt-BR.md">Português</a> · <a href="README.fr.md">Français</a> · <a href="README.de.md">Deutsch</a> · <a href="README.ru.md">Русский</a> · <a href="README.zh-CN.md">简体中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.ko.md">한국어</a>
</p>

<p align="center">
  Deja que Claude cree y lea hojas de cálculo con el <b>GridCraft</b> instalado en tu equipo — <b>Windows, macOS y Linux</b>:<br>
  hojas con fórmulas vivas, tablas, formatos, formato condicional, gráficos y tablas dinámicas, valores calculados, xlsx, csv, json, html y pdf.
</p>

---

## Por qué

[GridCraft](https://github.com/storytold/gridcraft) es una aplicación de hojas de cálculo de código abierto al estilo de Excel, con una CLI sin interfaz (`gridcraft-cli`), 339 comandos, 513 funciones de hoja (incluidas las matrices dinámicas), XLSX como formato nativo y un modo MCP. Este servidor [Model Context Protocol](https://modelcontextprotocol.io) convierte ese motor en **herramientas de archivo de entrada / archivo de salida** para Claude, para que puedas pedir cosas como:

> *"Crea un libro de presupuesto mensual con fórmulas, una hoja de resumen y un gráfico, en XLSX y PDF."*
> *"Lee `ventas.xlsx` y dime el total por región y el mejor mes."*
> *"Añade a este libro una tabla dinámica de ingresos por región y producto."*
> *"En todos los libros de `D:\Informes`, cambia '2025' por '2026' y guarda copias."*
> *"Convierte este CSV a Excel con una tabla con formato, y todos los libros de esta carpeta a CSV."*

Hermano de [designcraft-mcp-server](https://github.com/jhonsu01/designcraft-mcp-server), [effectcraft-mcp-server](https://github.com/jhonsu01/effectcraft-mcp-server), [lightcraft-mcp-server](https://github.com/jhonsu01/lightcraft-mcp-server), [photocraft-mcp-server](https://github.com/jhonsu01/photocraft-mcp-server), [vectorcraft-mcp-server](https://github.com/jhonsu01/vectorcraft-mcp-server), [filmcraft-mcp-server](https://github.com/jhonsu01/filmcraft-mcp-server), [pdfcraft-mcp-server](https://github.com/jhonsu01/pdfcraft-mcp-server), [wordcraft-mcp-server](https://github.com/jhonsu01/wordcraft-mcp-server), [soundcraft-mcp-server](https://github.com/jhonsu01/soundcraft-mcp-server), [deckcraft-mcp-server](https://github.com/jhonsu01/deckcraft-mcp-server) y [audacity-mcp-server](https://github.com/jhonsu01/audacity-mcp-server).

## Plataformas

| SO | Paquete de GridCraft que instalar | Dónde lo encuentra el servidor (sin configurar nada) | Estado |
| --- | --- | --- | --- |
| **Windows** 10/11 (x64, x86, arm64) | MSI o zip portable | `C:\Program Files\GridCraft`, `%LOCALAPPDATA%\Programs\GridCraft`, `PATH` | ✅ Verificado (Windows 11) |
| **Linux** (x86_64, aarch64, riscv64) | `.deb`, `.rpm` o `.tar.gz` | `/usr/bin`, `/usr/local/bin`, `/opt/gridcraft/bin`, `~/.local/bin`, `PATH` | ✅ Verificado (Debian 12, sin interfaz) |
| **macOS** 11+ (Apple silicon e Intel) | `.dmg` (la app) **más** `gridcraft-cli-<versión>-macos-universal.zip` | `/Applications/GridCraft.app`, `/usr/local/bin`, `/opt/homebrew/bin`, `~/.local/bin`, `~/bin`, `PATH` | 🟡 Soportado, aún sin probar en un Mac |

Todas las descargas: [versiones de GridCraft](https://github.com/storytold/gridcraft/releases) (también hay un tar.gz para FreeBSD; apunta `GRIDCRAFT_DIR` a él). En cualquier otra ubicación: define `GRIDCRAFT_DIR` (carpeta, raíz del `.tar.gz` o `GridCraft.app`) o `GRIDCRAFT_CLI`.

- **macOS:** el DMG solo contiene la app. Descomprime el zip aparte de `gridcraft-cli` y mueve `gridcraft-cli` a `/usr/local/bin` (o apunta `GRIDCRAFT_CLI` a él). La primera ejecución comprueba en línea la notarización de Apple.
- **Linux:** la AppImage y el Flatpak solo contienen la app, no `gridcraft-cli`; usa el deb, el rpm o el tar.gz. Para una app AppImage, define `GRIDCRAFT_APP` para que `open_in_gridcraft` pueda abrirla. En un servidor sin GPU, la configuración verificada usó `libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig`.

## Cómo funciona

| Parte | Qué es |
| --- | --- |
| **Motor de GridCraft** (`gridcraft-cli mcp`) | El propio motor de GridCraft: celdas, el motor de cálculo con 513 funciones, estilos, formatos de número, tablas, formatos condicionales, validación, gráficos, tablas dinámicas y los escritores XLSX / CSV / JSON / HTML / PDF. Se inicia nuevo y **sin interfaz** en cada trabajo, así que nunca toca la app de GridCraft ni un libro abierto. |
| **Servidor MCP** (Node.js) | 9 herramientas de alto nivel. Construye libros a partir de una descripción sencilla de hojas (datos y fórmulas, encabezado, tabla, fila de totales, formatos, reglas, gráficos), pone nombre a las hojas de tablas dinámicas, comprueba cada salida antes y devuelve los **valores calculados** de las primeras filas de cada hoja y cualquier error de fórmula, para que el asistente vea lo que dan las fórmulas. |
| **App en vivo** (opcional) | `open_in_gridcraft control=true` abre la app con su canal de control solo local (puerto 7979) y `run_gridcraft_commands live=true` la maneja. Cierra la app cuando termines. |

## Herramientas

| Herramienta | Qué hace |
| --- | --- |
| `create_workbook` | Un libro nuevo (o una muestra: budget, sales, grades) a partir de hojas: valores y fórmulas, estilo de encabezado, tablas de Excel, filas de totales, formatos de número, fuentes, colores, bordes, celdas combinadas, formato condicional (resaltados, barras de datos, escalas de color, conjuntos de iconos), listas desplegables, notas, gráficos (17 tipos), paneles inmovilizados, configuración de impresión; tablas dinámicas; tema y propiedades |
| `edit_workbook` | Un libro, una lista o una carpeta: escribir valores y fórmulas, buscar y reemplazar, insertar o eliminar filas y columnas, ordenar, quitar duplicados, añadir, renombrar o eliminar hojas, formatos, formatos condicionales, tablas, gráficos, tablas dinámicas; se guarda como copia nueva |
| `read_workbook` | Valores calculados, fórmulas o texto mostrado de un rango u hoja, y fórmulas evaluadas sobre el libro sin cambiarlo |
| `convert_workbook` | Un libro, una lista o una carpeta → xlsx, csv, tsv, json, html, pdf (una hoja o todas) |
| `get_workbook_info` | Hojas con rango usado, tablas, gráficos, celdas combinadas, filtros, paneles inmovilizados, reglas, validaciones, notas; nombres definidos; primeras filas como valores calculados; errores de fórmula |
| `list_gridcraft_catalog` | 339 comandos con parámetros, 513 funciones de hoja con su sintaxis, tipos de gráfico, muestras, formatos |
| `run_gridcraft_commands` | Cualquier comando del motor más `write_range`, `read_range`, `set_cell`, `evaluate_formula`, `format_range`, `insert_chart`... en una sesión (referencias `$steps[N].campo`), sin interfaz o en vivo, y luego guardar |
| `open_in_gridcraft` | Abre libros (o una muestra) en la app de GridCraft, opcionalmente con el canal de control |
| `get_gridcraft_status` | Plataforma, instalación, versión, comandos, funciones, app / puerto de control |

| | |
| --- | --- |
| **Abre** | xlsx, xlsm, xls (valores, fórmulas, formatos de número), xlsb y ods (datos), csv, tsv, txt, json |
| **Guarda** | xlsx (todas las hojas, fórmulas, estilos, tablas, gráficos, tablas dinámicas), csv, tsv, json, html, pdf |

Las celdas usan notación **A1** (`B2`, `A1:D10`); en las fórmulas, pon entre comillas los nombres de hoja con espacios (`'Mi hoja'!A1`). Los textos que empiezan por `=` son fórmulas; texto como `12%` o `2026-03-01` se lee como si se escribiera.

## Ejemplo

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

- **GridCraft** con `gridcraft-cli` (probado con **0.6.1**); ver [Plataformas](#plataformas)
- Node.js ≥ 20 (incluido en Claude Desktop para instalaciones `.mcpb`)

## Instalación

### Claude Desktop (recomendado, todas las plataformas)

1. Descarga `gridcraft-mcp-server.mcpb` de la [última versión](https://github.com/jhonsu01/gridcraft-mcp-server/releases/latest).
2. Haz doble clic (o arrástralo a Claude Desktop → *Configuración → Extensiones*) y pulsa **Instalar**.
3. Opcional: si GridCraft no está en una ubicación estándar, indica su carpeta o la ruta de `gridcraft-cli` en la configuración de la extensión.

### Sunsam Code

Instala **GridCraft Bridge** desde el marketplace de [Sunsam Code](https://github.com/jhonsu01/marketplace-SunsamCode), o suelta el `.mcpb` en *MCP → Instalar extensión*.

### Codex (OpenAI)

**Recomendado — el marketplace (recibe actualizaciones):** *Complementos → Añadir → Añadir marketplace*, origen `jhonsu01/craft-marketplace`, referencia `main`, y luego instala **GridCraft Bridge** desde **Craft Bridges** ([craft-marketplace](https://github.com/jhonsu01/craft-marketplace)). Las versiones nuevas llegan al actualizar el marketplace. O sube el zip (Codex lo guarda en tu cuenta y rechaza un zip más nuevo con el mismo nombre):

1. Descarga `gridcraft-mcp-server-<versión>-codex.zip` de la [última versión](https://github.com/jhonsu01/gridcraft-mcp-server/releases/latest).
2. En Codex: *Complementos → Añadir → Nuevo complemento*, elige el zip y pulsa **Añadir complemento**.
3. Codex arranca el servidor con `node`, así que Node.js ≥ 20 debe estar en el `PATH`. Si GridCraft no está en una ubicación estándar, define `GRIDCRAFT_DIR` o `GRIDCRAFT_CLI` como variables de entorno del sistema (Codex no tiene formulario de configuración para complementos locales).

### DeepSeek Harness

1. *Plugins → Add plugin*, escribe `github:jhonsu01/craft-marketplace#path:/plugins/gridcraft-mcp-server` y pulsa **Install** y luego **Enable now**.
2. Harness arranca el servidor con su propio cliente MCP y `node` (Node.js ≥ 20 en el `PATH`); las herramientas aparecen como `mcp__gridcraft__<herramienta>` y los archivos de salida como tarjetas que se abren en Harness.
3. Harness aún no actualiza los plugins por sí solo: para actualizar, desinstala el plugin y vuelve a instalarlo con la misma dirección.

### Claude Code / otros clientes MCP

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

## Configuración

| Variable | Significado |
| --- | --- |
| `GRIDCRAFT_DIR` | Carpeta de GridCraft, uno de sus ejecutables, la raíz de un `.tar.gz` (con `bin/`) o `GridCraft.app`. Por defecto: detección automática |
| `GRIDCRAFT_CLI` | Ruta de `gridcraft-cli` / `gridcraft-cli.exe` (tiene prioridad sobre `GRIDCRAFT_DIR`) |
| `GRIDCRAFT_APP` | Ruta de la app de escritorio cuando está en otro sitio (p. ej. una AppImage de Linux) |
| `GRIDCRAFT_CONTROL_PORT` | Puerto de control de la app de escritorio (por defecto 7979) |
| `GRIDCRAFT_MCP_TIMEOUT` | Segundos máximos por llamada al motor (por defecto 3600) |

## Seguridad

- Los archivos **nunca se sobrescriben** salvo con `overwrite: true`: en carpetas se usa un nombre libre (`_2`) y un `output_path` existente es un error. Las entradas solo se leen; un archivo editado solo se guarda como copia nueva (`_edited`).
- Todas las rutas deben ser absolutas. El motor se ejecuta sin interfaz y nunca toca la app de GridCraft salvo con `live: true`.
- Todo se ejecuta en local, sin acceso a la red. Cada tarea usa un motor privado en una carpeta temporal que se borra al final.

## Desarrollo

```bash
npm run build       # TypeScript + bundle de un solo archivo (dist/bundle.cjs)
npm test            # pruebas unitarias (lógica de rutas de Windows, macOS y Linux)
npm run test:e2e    # 25 comprobaciones de extremo a extremo (27 con `E2E_LIVE=1`) por MCP stdio real (CSV sintético)
npm run pack:mcpb   # gridcraft-mcp-server.mcpb
npm run pack:codex  # zip del plugin para Codex / DeepSeek Harness
```

Prueba de Linux en Docker (descomprime antes `gridcraft-<versión>-linux-x86_64.tar.gz`):

```bash
docker run --rm -v "$PWD:/work:ro" -v "/ruta/a/gridcraft-0.6.1-linux-x86_64:/opt/gridcraft:ro" -e GRIDCRAFT_DIR=/opt/gridcraft -w /work node:22-bookworm bash -c "apt-get update && apt-get install -y libxkbcommon0 libvulkan1 libegl1 mesa-vulkan-drivers libasound2 fontconfig && node scripts/e2e.mjs"
```

## Licencia

Apache-2.0. GridCraft es © de sus autores (Storytold), MIT o Apache-2.0.
Este proyecto no está afiliado ni respaldado por GridCraft ni Storytold. Excel es una marca de Microsoft.
