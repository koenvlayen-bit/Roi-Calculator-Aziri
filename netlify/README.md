# Aziri ROI Calculator

Statische web-app gehost op Netlify. Geen framework, geen build step.

## Bestandsstructuur

```
aziri-roi/
├── index.html                    ← De app (één pagina)
├── netlify.toml                  ← Netlify configuratie
├── css/
│   └── style.css                 ← Alle stijlen
├── js/
│   └── app.js                    ← Alle logica + berekeningen
└── netlify/
    └── functions/
        └── extract.js            ← Serverless proxy voor Claude API
```

## Lokaal testen

```bash
npm install -g netlify-cli
netlify dev
```

Bezoek daarna http://localhost:8888

## Deployen

Zie het stappenplan in de README of de Claude-chat.

## Omgevingsvariabelen

Zet in Netlify onder Site settings → Environment variables:
- `ANTHROPIC_API_KEY` → jouw Anthropic API key
