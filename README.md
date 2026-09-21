# Walktoberfest

A responsive neighborhood gathering page for Indian Hill, Worcester, MA. October 24, 2026 at 5 PM. Built with Vite, vanilla JavaScript, and a Vercel Function backed by Upstash Redis.

## Run locally

```sh
npm install
npm run dev
```

Vite runs the frontend with a clearly labeled browser-local preview. Houses persist in localStorage. To run the shared API locally, use `vercel dev` with the storage environment variables configured.

```sh
npm test
npm run build
```

## Deploy to your Vercel account

1. Commit and push this project to `anthonysbrown/walktoberfest`.
2. Import that GitHub repository in Vercel (or use the existing linked Vercel project). The included configuration selects Vite, `npm run build`, and `dist`.
3. Add an Upstash Redis database from the Vercel Marketplace and connect it to this project. Set `KV_REST_API_URL` and `KV_REST_API_TOKEN` in the Vercel project's environment variables. The API also accepts `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. These are server-only secrets; never prefix them with `VITE_` or commit them.
4. Deploy/redeploy. The route banner should say “A route we make together.” If it says “Local preview,” shared storage is not connected. Local preview entries are not automatically uploaded.
5. Check adding a house in one browser and loading it in another before distributing the link.

Anyone with the link can add, edit, remove, and reorder houses, as requested. Addresses and notes are public to visitors; there is no authentication. Route writes use an atomic revision check so two neighbors cannot silently overwrite each other's changes. A conflicting edit reloads the route and asks the visitor to retry. Routes refresh on page load and window focus, not via realtime subscriptions.

The initial route contains 15 Heroult Rd. Each house has a host, street address, optional drink/appetizer and notes, and an editable position. Google Maps links provide walking directions; waypoint support varies by device, so each stop also links to its own address. The Leaflet map shows every located house with a numbered pin matching the route order. Click pins for house details; use “Show all” to fit the stops in view. Walking directions open the full ordered route in Google Maps. Photon resolves addresses; results are cached in the browser and lookups are serialized with a delay. Unmatched addresses are listed for correction or retry instead of placing guessed pins. Map tiles use OpenStreetMap. No API key is needed. The public services require internet access and do not guarantee availability. See [Photon usage](https://github.com/komoot/photon#demo-server), [Leaflet documentation](https://leafletjs.com/reference), and [OSM tile usage](https://operations.osmfoundation.org/policies/tiles/). Set VITE_GEOCODER_URL to a compatible Photon endpoint and VITE_MAP_TILE_URL to a compatible tile URL if changing providers; keep attribution appropriate to your provider.

Event copy is in `src/main.js`; styles are in `src/style.css`; initial route and validation are in `src/route.js`; the shared backend is `api/route.js`. Map tiles and address lookups use OpenStreetMap and Photon; fonts use Google Fonts. These require an internet connection.

Deployment references: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Upstash REST API](https://upstash.com/docs/redis/features/restapi).
