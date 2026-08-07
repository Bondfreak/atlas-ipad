# Atlas iPad Alpha v0.1

Dette er den første installerbare Atlas-version til iPad.

## Indeholder
- Atlas Hjemhavn
- Touch-optimeret hotspot til maskinrummet
- Første motorkølingsrejse
- PWA-manifest
- Service worker og offline-cache
- Apple touch-ikon
- Landscape-lås i brugeroplevelsen

## Vigtigt
PWA-funktioner kræver, at mappen hostes via HTTPS eller localhost.
Åbning direkte fra Filer-appen som `file://` giver ikke installation eller service worker.

## Hurtig lokal test på en computer
Kør fra denne mappe:

```bash
python3 -m http.server 8000
```

Åbn derefter `http://localhost:8000`.

## Installation på iPad
1. Publicér mappen på en HTTPS-adresse.
2. Åbn adressen i Safari på iPad.
3. Tryk på Del.
4. Vælg Føj til hjemmeskærm.
5. Start Atlas fra det nye ikon.

## Næste leverance
- Fast HTTPS-hosting
- Fagligt korrekt D4-300 kølesystem
- Versionskontrol og opdateringsstatus
