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

// Saving selector of AI overview to local storage
const STORAGE_KEYS = {
  SEARCH_RESULT: "aiOverviewSearchResultSelector",
  ABOVE_RESULTS: "aiOverviewAboveResultsSelector",
};

// CSS selectors for AI overview containers
const AI_OVERVIEW_SELECTORS = {
  SEARCH_RESULT_SELECTOR: "div#rso > div",
  ABOVE_SEARCH_RESULTS_SELECTOR: "div#rcnt > div",
};

// Main DOM selectors
const DOM_SELECTORS = {
  MAIN_BODY: "div#rcnt",
  HEADER_TABS: "div#hdtb-sc > div",
  MAIN_ELEMENT: '[role="main"]',
  PEOPLE_ALSO_ASK: "div.related-question-pair",
  TABS_LIST: '[role="list"]',
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

const saveSelector = (element, key) => {
  console.log(element, "Saving selector for AI overview:", key);
  if (element.id) {
    localStorage.setItem(key, `#${element.id}`);
  } else if (element.className) {
    localStorage.setItem(
      key,
      `.${element.className.trim().split(/\s+/)[0]}`, //grabs the first class name
    );
  }
};

const getAiOverview = (mainBody) => {
  if (!mainBody) return null;

  // Check if we have a saved selector so we dont have to wait for generated AI box each time
  for (const key of Object.values(STORAGE_KEYS)) {
    const cachedSelector = localStorage.getItem(key);
    if (cachedSelector) {
      console.log("found cached selector for AI overview:", cachedSelector);
      const cached = document.querySelector(cachedSelector);
      if (cached) return cached;
    }
  }

  // Find all headings that match AI overview patterns
  const aiTexts = [
    ...mainBody.querySelectorAll("h1, h2, [role='heading']"),
  ].filter((e) =>
    AI_OVERVIEW_PATTERNS.some((pattern) => pattern.test(e.innerText)),
  );

  // For each matching heading, check both possible div containers
  for (const aiText of aiTexts) {
    let el = aiText;
    while (el && el.parentElement) {
      if (el.parentElement.matches("#rcnt")) {
        saveSelector(el, STORAGE_KEYS.ABOVE_RESULTS);
        return el;
      }
      if (el.parentElement.parentElement?.matches("#rso")) {
        saveSelector(el, STORAGE_KEYS.SEARCH_RESULT);
        return el;
      }
      el = el.parentElement;
    }
  }

  return null;
};

const observer = new MutationObserver(() => {
  // each time there's a mutation in the document see if there's an ai overview to hide
  const mainBody = document.querySelector(DOM_SELECTORS.MAIN_BODY);

  const aiOverview = getAiOverview(mainBody);

  // Hide AI overview
  if (aiOverview) aiOverview.style.display = CSS_VALUES.HIDDEN;

  // Restore padding after header tabs
  const headerTabs = document.querySelector(DOM_SELECTORS.HEADER_TABS);
  if (headerTabs) headerTabs.style.paddingBottom = CSS_VALUES.HEADER_PADDING;

  // For debugging
  // console.log([...mainBody?.querySelectorAll('h1, h2')].map(e => { return { text: e.innerText, obj: e }}));
  const mainElement = document.querySelector(DOM_SELECTORS.MAIN_ELEMENT);
  if (mainElement) {
    mainElement.style.marginTop = CSS_VALUES.MAIN_MARGIN;
  }

  // Remove entries in "People also ask" section if it contains "AI overview"
  const peopleAlsoAskAiOverviews = [
    ...document.querySelectorAll(DOM_SELECTORS.PEOPLE_ALSO_ASK),
  ].filter((el) =>
    AI_OVERVIEW_PATTERNS.some((pattern) => pattern.test(el.innerHTML)),
  );

  peopleAlsoAskAiOverviews.forEach((el) => {
    el.parentElement.parentElement.style.display = CSS_VALUES.HIDDEN;
  });

  // Hide AI Mode tab
  const tabsList = document.querySelector(DOM_SELECTORS.TABS_LIST)?.children;
  if (tabsList?.length) {
    const aiModeTab = tabsList[0];
    const text = aiModeTab.innerText.trim();

    if (TAB_PATTERNS.AI_MODE.test(text)) {
      aiModeTab.style.display = CSS_VALUES.HIDDEN;
    }
  }
});

observer.observe(document, {
  childList: true,
  subtree: true,
});
