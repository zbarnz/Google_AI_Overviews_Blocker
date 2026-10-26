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
  // People Also Ask section (data-initq holds the search) and its questions
  PEOPLE_ALSO_ASK: "[data-initq], div.related-question-pair",
  // Every Things to Know section has a title, but only non-AI sections have content
  THINGS_TO_KNOW_TITLE: '[data-attrid^="lab/title/"], [data-attrid^="lab/cluster/title/"]',
  THINGS_TO_KNOW_CONTENT: '[data-attrid^="lab/content/"], [data-attrid^="lab/cluster/content/"]',
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

    // Google sometimes wraps the AI overview together with the organic results,
    // so stop below any parent that also holds a result title link
    const holdsOtherResults = [...parent.children].some(
      (child) => child !== el && child.querySelector("a[href] h3"),
    );
    if (holdsOtherResults) return el;

    el = parent;
  }

  return startEl;
}

function getResultBlock(startEl) {
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

// On some searches the AI Overview title sits in its own box above the results, apart from its body
const getAiOverviewTitleBlocks = (mainBody) => {
  if (!mainBody) return [];

  return [...mainBody.querySelectorAll('[role="heading"]')]
    .filter((heading) =>
      AI_OVERVIEW_PATTERNS.some((pattern) => pattern.test(heading.textContent.trim())),
    )
    .map(getAiContainerParent)
    // Only boxes above the results, never #rso or anything containing it
    .filter((block) => block.parentElement?.id === "rcnt" && !block.querySelector("#rso"));
};

const getThingsToKnow = () => {
  const thingsToKnow = document.querySelectorAll(DOM_SELECTORS.THINGS_TO_KNOW_TITLE);
  for (const el of thingsToKnow) {
    const block = getResultBlock(el);
    if (block) {
      return block;
    }
  }
};

// Each section is the child of the closest element holding every section title
const getThingsToKnowSections = (titles) => {
  let list = titles[0].parentElement;
  while (!titles.every((title) => list.contains(title))) {
    list = list.parentElement;
  }
  return titles.map((title) => [...list.children].find((child) => child.contains(title)));
};

// Hide the AI sections, or the whole block (header included) if every section is AI
const hideThingsToKnow = (block) => {
  const titles = [...block.querySelectorAll(DOM_SELECTORS.THINGS_TO_KNOW_TITLE)];
  const sections = titles.length > 1 ? getThingsToKnowSections(titles) : [block];
  const aiSections = sections.filter(
    (section) => !section.querySelector(DOM_SELECTORS.THINGS_TO_KNOW_CONTENT),
  );

  if (aiSections.length === sections.length) {
    block.style.display = CSS_VALUES.HIDDEN;
    return;
  }

  // Re-run on every mutation, so anything hidden before its content loaded is shown again
  block.style.display = "";
  sections.forEach((section) => {
    section.style.display = aiSections.includes(section) ? CSS_VALUES.HIDDEN : "";
  });
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
  getAiOverviewTitleBlocks(mainBody).forEach((block) => {
    block.style.display = CSS_VALUES.HIDDEN;
  });

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
  document.querySelectorAll(DOM_SELECTORS.PEOPLE_ALSO_ASK).forEach((el) => {
    (getResultBlock(el) || el).style.display = CSS_VALUES.HIDDEN;
  });

  // Hide Things to Know
  const thingsToKnow = getThingsToKnow();
  if (thingsToKnow) hideThingsToKnow(thingsToKnow);

  // Hide AI Mode tab
  getAiModeTabs().forEach((tab) => {
    tab.style.display = CSS_VALUES.HIDDEN;
  });
});

observer.observe(document, {
  childList: true,
  subtree: true,
});