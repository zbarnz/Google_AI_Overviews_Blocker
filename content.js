const patterns = [
  /ai overview/i,  // en
  /übersicht mit ki/i, // de
  /AI による概要/, // ja
  /Обзор от ИИ/ // ru
  /AI 摘要/ // zh-TW
  /AI-overzicht/i, // nl
  /Vista creada con IA/i // es
  /Přehled od AI/i, // cz
]

const observer = new MutationObserver(() => {
  // each time there's a mutation in the document see if there's an ai overview to hide
  const aiOverviewH1 = [...document.querySelectorAll('h1')].find(h1 => patterns.some(pattern => pattern.test(h1.innerText)));

  if (aiOverviewH1?.parentElement) {
    aiOverviewH1.parentElement.style.display = "none";
  }

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
