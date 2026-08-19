# Atlas

Atlas is Navigator's visual application and user experience for Shaka. This repository keeps the technical name `atlas-ipad` for continuity, but Atlas is not the overall system name: **Navigator** is the complete project/system, while **KAI** is the AI/agent layer.

## Current role

Atlas provides the touch-first visual experience for Navigator, including navigation, system visualization, information panels and contextual actions. The primary client is iPad, with the same browser-based application intended to remain usable on a Windows touch-screen/mini-PC setup.

Normal accepted runtime reads follow the bounded architecture:

**Navigator UI / Atlas / KAI → Shaka Server → Shaka Core → Shaka DB**

Atlas must not receive database credentials, invent unsupported domain facts or silently bypass Shaka Server for accepted runtime flows.

## Repository/runtime notes

- PWA/browser client hosted over HTTPS.
- Touch-first UI and iPad installation remain supported.
- GitHub Pages is the current repository-hosted frontend path used in accepted integration work.
- Repository name, historical release labels, commits and SIP activity identifiers are technically/historically valid and are not renamed merely to match current product terminology.

## Local browser test

From the repository directory:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000` in a browser. PWA/service-worker behavior requires HTTPS or localhost; opening the files directly through `file://` is not an accepted installation/runtime path.

## Evidence and authority

This README is an orientation document. Current implementation truth is defined by `main`, the deployed frontend, repository tests/CI and the governed Navigator acceptance records. Shaka Core remains authoritative for accepted domain facts, relations and provenance returned through the bounded Server path.
