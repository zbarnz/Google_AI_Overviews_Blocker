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

const observer = new MutationObserver(() => {
  // each time there's a mutation in the document see if there's an ai overview to hide
  const mainBody =
    document.querySelector(DOM_SELECTORS.MAIN_BODY) ||
    document.querySelector(DOM_SELECTORS.MAIN_BODY_MOBILE);

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
  ].filter(isAiOverviewPaaTab);

  // peopleAlsoAskAiOverviews.forEach((el) => {
  //   el.parentElement.parentElement.style.display = CSS_VALUES.HIDDEN;
  // });

  // Hide Things to Know
  const thingsToKnow = getThingsToKnow();
  if (thingsToKnow) {
    thingsToKnow.style.display = CSS_VALUES.HIDDEN;
  }

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
