# AfrikaBurn 2026 — interactive map

A hover-to-identify overlay for the official AfrikaBurn 2026 map. Instead of bouncing between the map's tiny 3-letter codes and the index on the side, just hover any marker to see the camp, artwork, service, support camp, plaza, or toilet location.

**Live:** https://bernardbravenboer.github.io/afrikaburnmap-2026/

## Features

- **Hover** any camp, support camp, or artwork marker → tooltip with its name and grid reference
- **Scroll / pinch** to zoom (up to 8×), **drag** to pan, double-click to zoom in
- **Search** by name or code — matches are highlighted with a pulsing yellow pin and the map auto-frames them
- **Filter** theme camps vs artworks with checkboxes
- Works on desktop and mobile

## How it was built

The site is three static files: `index.html`, `data.js`, and the map image. No framework, no build step.

Placing the hotspots was the interesting bit. The map has ~180 camps and artworks, each labeled with a 2- or 3-letter code. Getting each hotspot onto the right spot required:

- Manually transcribing the index (camp name → code → grid cell) from the printed sidebar
- Running OCR on the map image at multiple resolutions to locate the 3-letter camp codes
- Detecting the stylized pink diamond markers for artworks visually (by color/shape) since OCR couldn't read the pink-on-pink text
- Matching each code to its nearest detected position, with grid-cell fallback for the handful that couldn't be auto-located
- Then manually checking and adjusting the places that needed correction
- Extracting support camp names and locations from the official site map PDF text layer, with OCR and grid-cell fallbacks for labels that could not be read directly
- Digitizing service, support camp, plaza, and toilet regions from the visual map

All current markers are pinned to pixel positions on the map. Some positions come from OCR-derived map regions, while audited entries have been manually checked and adjusted against the visual map.

## Running locally

```bash
git clone https://github.com/bernardbravenboer/afrikaburnmap-2026.git
cd afrikaburnmap-2026
python3 -m http.server 8000
# open http://localhost:8000
```

Or just open `index.html` directly in a browser — no server required for basic use.

## Credits

- Map artwork © AfrikaBurn (used for reference / navigation aid)
- This overlay is an unofficial community tool, not affiliated with AfrikaBurn
- Built with [Claude Code](https://claude.com/claude-code)

## Corrections

Spotted a name in the wrong spot, or want to add missing info? Open an issue or PR.
