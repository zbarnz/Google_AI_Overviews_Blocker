const patterns = [
  /übersicht mit ki/i, // de
  /ai overview/i, // en
  /prezentare generală generată de ai/i, // ro
  /AI による概要/, // ja
  /Обзор от ИИ/, // ru
  /AI 摘要/, // zh-TW
  /AI-overzicht/i, // nl
  /Vista creada con IA/i, // es
  /Přehled od AI/i, // cz
];

let enabled;

chrome.storage.local.get({ enabled: true }, (result) => {
  enabled = result.enabled;
});

const observer = new MutationObserver(() => {
  if (!enabled) return; // if disabled, do nothing

  let aiText;

  // each time there's a mutation in the document see if there's an ai overview to hide
  //rcnt is the main ID for desktop, center_col is for mobile
  const mainBody =
    document.querySelector("div#rcnt") ||
    document.querySelector("div#center_col");

  if (mainBody) {
    aiText = [...mainBody?.querySelectorAll("h1, h2")].find((e) =>
      patterns.some((pattern) => pattern.test(e.innerText))
    );
  }

  var aiOverview =
    aiText?.closest("div#rso > div") || aiText?.closest("div#rcnt > div"); // AI overview as a search result

  // Hide AI overview
  if (aiOverview) aiOverview.style.display = "none";

  // Restore padding after header tabs
  const headerTabs = document.querySelector("div#hdtb-sc > div");
  if (headerTabs) headerTabs.style.paddingBottom = "12px";

  // For debugging
  // console.log([...mainBody?.querySelectorAll('h1, h2')].map(e => { return { text: e.innerText, obj: e }}));
  const mainElement = document.querySelector('[role="main"]');
  if (mainElement) {
    mainElement.style.marginTop = "24px";
  }

  // Remove entries in "People also ask" section if it contains "AI overview"
  const peopleAlsoAskAiOverviews = [
    ...document.querySelectorAll("div.related-question-pair"),
  ].filter((el) => patterns.some((pattern) => pattern.test(el.innerHTML)));

  peopleAlsoAskAiOverviews.forEach((el) => {
    el.parentElement.parentElement.style.display = "none";
  });

  // Hide AI Mode tab
  const tabsList = document.querySelector('[role="list"]').children;
  const aiModeTab = tabsList[0];

  const text = aiModeTab.innerText.trim();

  if (/^AI Mode$/i.test(text)) {
    aiModeTab.style.display = "none";
  }
});

const observerConfig = { childList: true, subtree: true };

observer.observe(document, {
  childList: true,
  subtree: true,
});
