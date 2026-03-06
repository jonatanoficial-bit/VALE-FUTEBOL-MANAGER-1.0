/*
 * Data loader: loads all JSON files from the /data directory and returns
 * a consolidated object. The loader ensures all files are fetched
 * before proceeding. Should be called at the start of the game.
 */

const DATA_FILES = ['cities.json', 'units.json', 'cases.json', 'localization.json', 'audio.json', 'backgrounds.json'];

export async function loadData() {
  const results = {};
  let anyFetchSucceeded = false;

  for (const file of DATA_FILES) {
    try {
      // Resolve the file relative to this module. loader.js lives in js/data,
      // so ../../data points to the root data folder.
      const url = new URL(`../../data/${file}?v=1`, import.meta.url);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      const key = file.replace('.json', '');
      results[key] = json;
      anyFetchSucceeded = true;
    } catch (err) {
      // When opening index.html directly (file://) some browsers block fetch.
      // We'll fall back to embedded data instead of breaking the demo.
      console.warn(`[loader] fetch falhou para ${file}:`, err);
    }
  }

  if (anyFetchSucceeded) return results;

  // Fallback: embedded data snapshot (keeps the game runnable without a server).
  const embeddedUrl = new URL(`../../data/_embedded.js?v=1`, import.meta.url);
  const mod = await import(embeddedUrl.href);
  return mod.EMBEDDED_DATA || mod.default;
}