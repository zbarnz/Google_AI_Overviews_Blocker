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
  TABS_LIST: '[role="list"]',
  THINGS_TO_KNOW: "[data-maindata]",
};

// CSS values
const CSS_VALUES = {
  HIDDEN: "none",
  HEADER_PADDING: "12px",
  MAIN_MARGIN: "24px",
};

// "People also ask" detection. Every PAA answer is now an AI Overview, so the
// whole section is hidden. Google's class names change often, so questions are
// found by any of several independent signals rather than one selector.
const PAA_SELECTORS = {
  // Class Google has used on PAA questions for years
  QUESTION: "div.related-question-pair",
  // Generic accordion toggle; a PAA question is one whose label is a question
  TOGGLE:
    '[role="button"][aria-expanded][aria-controls], button[aria-expanded][aria-controls]',
  // Containers the section must never be widened past
  LANDMARK: '#rso, #rcnt, #center_col, #search, [role="main"], body',
  HIDDEN_ATTR: "data-aiob-paa-hidden",
};
const QUESTION_PATTERN = /[?？؟]$/;
// Siblings with less visible text than this (and no links) are section chrome,
// e.g. the "People also ask" heading or the "Feedback" footer
const PAA_CHROME_MAX_TEXT = 60;

// Tab patterns
const TAB_PATTERNS = {
  AI_MODE: /^AI Mode$/i,
};

// AI Mode is the udm=50 search vertical in every language, so its tab is found
// by link target rather than by label or position
const AI_MODE_SELECTORS = {
  LINK: 'a[href*="udm="]',
  TAB: '[role="listitem"]',
};
const AI_MODE_UDM = "50";

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

const getPaaQuestions = (root) => {
  const found = new Set(root.querySelectorAll(PAA_SELECTORS.QUESTION));

  for (const toggle of root.querySelectorAll(PAA_SELECTORS.TOGGLE)) {
    if (QUESTION_PATTERN.test(toggle.textContent.trim())) found.add(toggle);
  }

  // A toggle inside a .related-question-pair is the same question twice; keep
  // the outermost element, and skip sections that are already hidden
  return [...found].filter(
    (el) =>
      !el.closest(`[${PAA_SELECTORS.HIDDEN_ATTR}]`) &&
      ![...found].some((other) => other !== el && other.contains(el)),
  );
};

const isPaaChrome = (el) =>
  el.innerText.trim().length <= PAA_CHROME_MAX_TEXT &&
  ![...el.querySelectorAll("a[href]")].some((a) => a.getClientRects().length);

// Widen from the question list to the wrapper that also holds the heading and
// footer, stopping before anything that holds other search results
function getPaaSectionContainer(list) {
  let el = list;

  while (el.parentElement && !el.parentElement.matches(PAA_SELECTORS.LANDMARK)) {
    const parent = el.parentElement;
    const others = [...parent.children].filter((child) => child !== el);
    if (!others.every(isPaaChrome)) break;
    el = parent;
  }

  return el;
}

// Returns the outer container of each "People also ask" section on the page.
// A section needs at least two questions so a lone accordion is never hidden.
const getPeopleAlsoAskSections = (root) => {
  if (!root) return [];

  const questions = getPaaQuestions(root);
  const sections = new Set();

  for (const question of questions) {
    let list = question.parentElement;
    while (list && list !== root) {
      if (questions.filter((q) => q !== question && list.contains(q)).length) {
        sections.add(getPaaSectionContainer(list));
        break;
      }
      list = list.parentElement;
    }
  }

  return [...sections];
};

const isAiModeLink = (link) => {
  try {
    return new URL(link.href).searchParams.get("udm") === AI_MODE_UDM;
  } catch {
    return false;
  }
};

const getAiModeTabs = () => {
  const tabs = new Set();

  for (const link of document.querySelectorAll(AI_MODE_SELECTORS.LINK)) {
    if (isAiModeLink(link)) tabs.add(link.closest(AI_MODE_SELECTORS.TAB) || link);
  }

  // English label fallback in case the link target changes
  const tabsList = document.querySelector(DOM_SELECTORS.TABS_LIST)?.children;
  for (const tab of tabsList || []) {
    if (TAB_PATTERNS.AI_MODE.test(tab.innerText.trim())) tabs.add(tab);
  }

  return [...tabs];
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

  // Hide "People also ask"; its answers are AI Overviews
  getPeopleAlsoAskSections(mainBody).forEach((el) => {
    el.style.display = CSS_VALUES.HIDDEN;
    el.setAttribute(PAA_SELECTORS.HIDDEN_ATTR, "");
  });

  // Hide Things to Know
  const thingsToKnow = getThingsToKnow();
  if (thingsToKnow) {
    thingsToKnow.style.display = CSS_VALUES.HIDDEN;
  }

  // Hide AI Mode tab
  getAiModeTabs().forEach((tab) => {
    tab.style.display = CSS_VALUES.HIDDEN;
  });
});

observer.observe(document, {
  childList: true,
  subtree: true,
});
