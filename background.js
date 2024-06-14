const EXPIRATION_DAYS = 30;

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (
    tab.url &&
    tab.url.includes("://www.google.com/search") &&
    changeInfo.status == "loading"
  ) {
    chrome.storage.local.get(["overviewClasses"], function (result) {
      if (result.overviewClasses && result.overviewClasses.length > 0) {
        const validClasses = result.overviewClasses.filter(
          (entry) =>
            Date.now() - entry.timestamp < EXPIRATION_DAYS * 24 * 60 * 60 * 1000
        ); // Only use non-expired classes

        const cssHideCode = validClasses
          .map((entry) => `.${entry.name} * { display: none !important; }`)
          .join(" ");
        const cssMarginCode = validClasses
          .map((entry) => `.${entry.name} { margin-bottom: 30px !important; }`)
          .join(" ");

        const cssCode = `${cssHideCode} ${cssMarginCode}`;

        chrome.scripting.insertCSS(
          {
            target: { tabId: tabId },
            css: cssCode,
          },
          () => {
            console.log(
              `Valid classes "${validClasses
                .map((entry) => entry.name)
                .join(", ")}" hidden and margin added`
            );
          }
        );

        // Update storage with only valid entries
        chrome.storage.local.set({ overviewClasses: validClasses });
      }
    });
  }
});
