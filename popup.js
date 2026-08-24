// Kept in sync with content.js by hand rather than shared via import: a
// content script's ES-module imports must be listed in
// web_accessible_resources to be fetchable, which is more manifest surface
// than this small, stable object is worth.
const TOGGLE_DEFAULTS = {
  hideAiOverview: true,
  hideAiModeTab: true,
  hidePaaAiEntries: true,
  hideThingsToKnow: true,
};

function getStoredToggles() {
  return new Promise((resolve) => {
    chrome.storage.local.get(TOGGLE_DEFAULTS, resolve);
  });
}

async function init() {
  const stored = await getStoredToggles();

  for (const key of Object.keys(TOGGLE_DEFAULTS)) {
    const checkbox = document.querySelector(`[data-toggle="${key}"]`);
    if (!checkbox) continue;

    checkbox.checked = stored[key];

    checkbox.addEventListener("change", () => {
      chrome.storage.local.set({ [key]: checkbox.checked });
    });
  }
}

init();
