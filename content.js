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

const observer = new MutationObserver(() => {
  // each time there's a mutation in the document see if there's an ai overview to hide
  const mainBody = document.querySelector('div#rcnt');
  const aiText = [...mainBody?.querySelectorAll('h1, h2')].find(e => patterns.some(pattern => pattern.test(e.innerText)));

  var aiOverview = aiText?.closest('div#rso > div'); // AI overview as a search result
  if (!aiOverview) aiOverview = aiText?.closest('div#rcnt > div'); // AI overview above search results

  // Hide AI overview
  if (aiOverview) aiOverview.style.display = "none";

  // Restore padding after header tabs
  const headerTabs = document.querySelector('div#hdtb-sc > div');
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
});

observer.observe(document, {
  childList: true,
  subtree: true,
});
