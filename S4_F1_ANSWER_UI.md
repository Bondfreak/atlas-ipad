# Navigator S4 Mål B — F1 Answer UI

Touch-first Atlas panel for the Server F1 Canonical Read Core endpoint.

## Data path

**Navigator UI / Atlas → Shaka Server → F1** (`POST /api/v1/f1/answer`)

No Foundation Drive writes. No direct Core/DB access from the browser.

## UI entry point

On the assembly / level-4 seawater-pump screen (`#assemblyScreen`), the injected script `s4-f1-answer.js` adds an **F1 · CANONICAL READ** panel (next to KAI):

- Danish labels: **Konklusion**, **Basis**, **Epistemisk status**, **Kilder** (plus optional **Usikkerhed / konflikt** and **Policy**)
- Button: **Spørg F1**
- Dynamic values are rendered with `textContent` only (fail-closed)

`m08-kai-info.js` still calls `POST /api/v1/kai/explain` and degrades gracefully if F1/evidens or LLM is unavailable — Atlas navigation continues to work.

## SERVER_ORIGIN configuration

Default remains the deployed Render Server:

`https://shaka-server.onrender.com`

Override resolution order (`server-origin.js` → `AtlasServer.resolveServerOrigin()`):

1. Explicit option (`baseUrl` / `serverOrigin`) when calling `ShakaCore.postF1Answer`
2. Query string: `?server=http://127.0.0.1:8000` or `?SERVER_ORIGIN=...`
3. `localStorage` key `ATLAS_SERVER_ORIGIN`
4. `window.__ATLAS_SERVER_ORIGIN__`
5. Default Render URL

### Point Atlas at a local Server

```bash
# Terminal A — Shaka Server (freeze b28f835 or local checkout) on port 8000
# Terminal B — Atlas static host
cd /path/to/atlas-ipad
python3 -m http.server 5500
```

Open:

`http://127.0.0.1:5500/?server=http://127.0.0.1:8000`

Or once in the browser console:

```js
localStorage.setItem('ATLAS_SERVER_ORIGIN', 'http://127.0.0.1:8000');
location.reload();
```

CORS for localhost + GitHub Pages is assumed to be enabled on Server (sister S4A task).

## Client API

`ShakaCore.postF1Answer(query, { baseUrl? })` posts `{ query }` to `/api/v1/f1/answer` and requires `conclusion`, `basis`, `epistemic_status`, and `sources` in the JSON body.

## Out of scope

- S2 live Foundation Drive import
- Cloud Agents
- Changing Server F1 freeze semantics
