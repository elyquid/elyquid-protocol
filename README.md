# ELYQUID

Water finds its level. Trades find their purpose.

[![Live site](https://img.shields.io/badge/site-elyquid.xyz-7de0f7?style=flat-square&labelColor=012531)](https://elyquid.xyz)

**Chain:** Elysium (chain ID 99901, gas in HYPE)
**Contract address:** `TBA` (announced on X first, then shown at the top of the site)

## Overview

ELYQUID is a community token for the Elysium network. The site pairs the brand with a live market board that reads public feeds and refreshes on its own.

## Features

- Contract address slot pinned to the top of the page, with click-to-copy once an address is stated
- Live market board of the ten busiest pairs across Elysium, with a matching ticker
- Row one reserved for ELYQUID: a brand placeholder until launch, then live data from the stated address
- Count-up numbers, skeleton loaders, scroll-reveal, parallax hero and spotlight hover, all with a reduced-motion fallback
- Dependency-free build that writes a ready-to-deploy `dist/` folder

## Links

- Site: https://elyquid.xyz
- X: https://x.com/Enter_Elyquid
- Explorer: https://explorer.elysium.kinetiq.xyz
- RPC: https://rpc.elysium.kinetiq.xyz

## Development

```bash
npm run build   # writes dist/
npm run serve   # preview dist/ at http://localhost:4173
```

External facts (address, social links, chain, market sources) live in one place: `src/register.js`.

## License

MIT, see [LICENSE](LICENSE).
