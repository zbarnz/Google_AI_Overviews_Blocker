// AI Overview text patterns for different languages
const AI_OVERVIEW_PATTERNS = [
  /übersicht mit ki/i, // de
  /ai overview/i, // en
  /prezentare generală generată de ai/i, // ro
  /AI による概要/, // ja
  /Обзор от ИИ/, // ru
  /AI 摘要/, // zh-TW
  /AI-overzicht/i, // nl
  /AI-oversigt/i, // da
  /Vista creada con IA/i, // es
  /Přehled od AI/i, // cz
  /Aperçu IA/i, // fr
];

// CSS selectors for AI overview containers
const AI_OVERVIEW_SELECTORS = {
  SEARCH_RESULT_SELECTOR: "div#rso > div",
  ABOVE_SEARCH_RESULTS_SELECTOR: "div#rcnt > div",
};

// Main DOM selectors
const DOM_SELECTORS = {
  MAIN_BODY: "div#rcnt",
  MAIN_BODY_MOBILE: "div#center_col",
  HEADER_TABS: "div#hdtb-sc > div",
  MAIN_ELEMENT: '[role="main"]',
  PEOPLE_ALSO_ASK: "div.related-question-pair",
  TABS_LIST: '[role="list"]',
  THINGS_TO_KNOW: "[data-maindata]",
};

// CSS values
const CSS_VALUES = {
  HIDDEN: "none",
  HEADER_PADDING: "12px",
  MAIN_MARGIN: "24px",
};

// Tab patterns
const TAB_PATTERNS = {
  AI_MODE: /^AI Mode$/i,
};

// Toggle storage keys — each controls one independently-hideable section,
// persisted in chrome.storage.local, defaulting to on (hidden).
// Kept in sync with popup.js by hand; see the comment there for why they
// aren't shared via import.
const TOGGLE_KEYS = {
  AI_OVERVIEW: "hideAiOverview",
  AI_MODE_TAB: "hideAiModeTab",
  PAA_AI_ENTRIES: "hidePaaAiEntries",
  THINGS_TO_KNOW: "hideThingsToKnow",
};

const TOGGLE_DEFAULTS = {
  [TOGGLE_KEYS.AI_OVERVIEW]: true,
  [TOGGLE_KEYS.AI_MODE_TAB]: true,
  [TOGGLE_KEYS.PAA_AI_ENTRIES]: true,
  [TOGGLE_KEYS.THINGS_TO_KNOW]: true,
};

function getStoredToggles() {
  return new Promise((resolve) => {
    chrome.storage.local.get(TOGGLE_DEFAULTS, resolve);
  });
}

// In-memory mirror of the stored toggle state, kept live via chrome.storage.onChanged
let toggleState = { ...TOGGLE_DEFAULTS };

// For each matching heading, check both possible div containers
function getAiContainerParent(startEl) {
  let el = startEl;

  while (el && el.parentElement) {
    const parent = el.parentElement;

    if (parent.id === "rso") {
      //search results container
      return el;
    }

    if (parent.id === "rcnt") {
      //traditional banner container
      return el;
    }

    el = parent;
  }

  return startEl;
}

function getThingsToKnowContainer(startEl) {
  let el = startEl;

  while (el && el.parentElement) {
    const parent = el.parentElement;

    if (parent.parentElement?.id === "rso") {
      return el;
    }

    el = parent;
  }
}

const getAiOverview = (mainBody) => {
  if (!mainBody) return null;

  const inner =
    mainBody.querySelector('[data-async-type="folsrch"]') ||
    mainBody.querySelector('[id^="folsrch"]');

  if (inner) {
    const block = getAiContainerParent(inner);
    if (block) {
      return block;
    }
  }

  // Specific AI overview language based fallback
  // const aiTexts = [
  //   ...mainBody.querySelectorAll("h1, h2, [role='heading']"),
  // ].filter((e) =>
  //   AI_OVERVIEW_PATTERNS.some((pattern) => pattern.test(e.innerText)),
  // );

  // for (const aiText of aiTexts) {
  //   const block = getAiContainerParent(aiText);
  //   if (block) {
  //     return block;
  //   }
  // }

  return null;
};

const getThingsToKnow = () => {
  const thingsToKnow = document.querySelectorAll('[data-maindata]:not([data-bkt])'); //TODO find a more reliable selector to hide things to know. This is at risk of hiding other non-AI features
  for (const el of thingsToKnow) {
    const block = getThingsToKnowContainer(el);
    if (block) {
      return block;
    }
  }
};

const isAiOverviewPaaTab = (el) => {
  if (!el) return false;

  if (!el || !el.matches("div.related-question-pair")) return false;

  //pre-hydration tag on AI tabs
  if (el.querySelector("[data-evn]")) return true;

  //Post hydration AI tags:
  if (el.querySelector('[data-subtree~="aimc"], [data-subtree="aimc"]')) {
    return true;
  }

  if (el.querySelector('[data-subtree="aimfl,mfl"], [data-subtree="aimfl"]')) {
    return true;
  }

  // Last-resort fallback once text has rendered
  if (AI_OVERVIEW_PATTERNS.some((pattern) => pattern.test(el.innerText))) {
    return true;
  }

  return false;
};

// Applies (or reverts) every hideable section against the current
// toggleState. Called on every mutation, and again the moment stored toggles
// finish loading, so an "off" flip un-hides — not just skips re-hiding —
// and there's no reload-required gap on an already-open tab.
function applyToggles() {
  const mainBody =
    document.querySelector(DOM_SELECTORS.MAIN_BODY) ||
    document.querySelector(DOM_SELECTORS.MAIN_BODY_MOBILE);

  const hideAiOverview = toggleState[TOGGLE_KEYS.AI_OVERVIEW];

  const aiOverview = getAiOverview(mainBody);
  if (aiOverview) {
    aiOverview.style.display = hideAiOverview ? CSS_VALUES.HIDDEN : "";
  }

  // Padding/margin compensate for the AI overview being hidden, so they
  // follow the same toggle rather than always applying.
  const headerTabs = document.querySelector(DOM_SELECTORS.HEADER_TABS);
  if (headerTabs) {
    headerTabs.style.paddingBottom = hideAiOverview
      ? CSS_VALUES.HEADER_PADDING
      : "";
  }

  const mainElement = document.querySelector(DOM_SELECTORS.MAIN_ELEMENT);
  if (mainElement) {
    mainElement.style.marginTop = hideAiOverview ? CSS_VALUES.MAIN_MARGIN : "";
  }

  // Remove entries in "People also ask" section if it contains "AI overview"
  const hidePaaAiEntries = toggleState[TOGGLE_KEYS.PAA_AI_ENTRIES];
  const peopleAlsoAskAiOverviews = [
    ...document.querySelectorAll(DOM_SELECTORS.PEOPLE_ALSO_ASK),
  ].filter(isAiOverviewPaaTab);

  peopleAlsoAskAiOverviews.forEach((el) => {
    const wrapper = el.parentElement?.parentElement;
    if (wrapper) {
      wrapper.style.display = hidePaaAiEntries ? CSS_VALUES.HIDDEN : "";
    }
  });

  // Hide Things to Know
  const thingsToKnow = getThingsToKnow();
  if (thingsToKnow) {
    thingsToKnow.style.display = toggleState[TOGGLE_KEYS.THINGS_TO_KNOW]
      ? CSS_VALUES.HIDDEN
      : "";
  }

  // Hide AI Mode tab
  const tabsList = document.querySelector(DOM_SELECTORS.TABS_LIST)?.children;
  if (tabsList?.length) {
    const aiModeTab = tabsList[0];
    const text = aiModeTab.innerText.trim();

    if (TAB_PATTERNS.AI_MODE.test(text)) {
      aiModeTab.style.display = toggleState[TOGGLE_KEYS.AI_MODE_TAB]
        ? CSS_VALUES.HIDDEN
        : "";
    }
  }
}

const observer = new MutationObserver(applyToggles);

// Start observing immediately, synchronously, at document_start — same as
// before toggles existed — using the in-memory defaults (all on) so no early
// mutation is ever missed while storage loads.
observer.observe(document, {
  childList: true,
  subtree: true,
});

// Once the real stored toggle state arrives, apply it right away rather than
// waiting for the next incidental mutation, then keep it live as the popup
// changes storage. If this fails (e.g. the extension context was invalidated
// by a reload while this tab was open), hiding simply keeps running on the
// safe all-on defaults already in effect above.
getStoredToggles()
  .then((stored) => {
    toggleState = { ...TOGGLE_DEFAULTS, ...stored };
    applyToggles();
  })
  .catch((error) => {
    console.warn("Google AI Overviews Blocker: failed to load toggle state, using defaults.", error);
  });

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;

  let changed = false;
  for (const key of Object.keys(TOGGLE_DEFAULTS)) {
    if (changes[key]) {
      toggleState[key] = changes[key].newValue;
      changed = true;
    }
  }

  if (changed) applyToggles();
});
