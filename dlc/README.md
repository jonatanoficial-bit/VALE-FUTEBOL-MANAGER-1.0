# DLC (offline / sem API)

Este jogo suporta **packs de DLC** via arquivos JSON hospedados junto do site (GitHub Pages/Vercel).

## Como funciona
- Se existir `./dlc/manifest.json`, o jogo tenta carregar automaticamente.
- O arquivo `manifest.json` lista os packs:

```json
{
  "packs": [
    { "id": "tokyo", "path": "./dlc/packs/tokyo_pack.json" }
  ]
}
```

## Formato de um pack
Um pack pode conter:
- `cities`: novas cidades (mesmo formato de `data/cities.js`)
- `calls`: novas chamadas (mesmo formato de `data/calls.js`)

Exemplo mínimo:

```json
{
  "cities": [
    { "id": "jp_tyo", "name": "🇯🇵 Tokyo (DLC)", "country": "JP" }
  ],
  "calls": [
    { "id": "dlc_demo_01", "agency": "police", "title": "Distúrbio em estação", "baseSeverity": "medio" }
  ]
}
```

> Dica: para DLC comercial, você pode versionar packs como pastas separadas e ativar via `manifest.json`.
