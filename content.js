const aiOverviewH1 = [...document.querySelectorAll('h1')].find(h1 => /ai overview/i.test(h1.innerText));

if(aiOverviewH1?.parentElement) {
  aiOverviewH1.parentElement.style.display = 'none';
}
