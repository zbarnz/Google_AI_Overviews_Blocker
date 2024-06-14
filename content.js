const EXPIRATION_DAYS = 30;

var headers = document.querySelectorAll("h1");

function findParentWithCorrectAttributes(element) {
  while (element && element.parentElement) {
    element = element.parentElement;
    if (element.hasAttribute("data-mcpr") || element.hasAttribute("data-mcp")) {
      return element;
    }
  }
  return null;
}

function updateStorageWithClass(className) {
  chrome.storage.local.get({ overviewClasses: [] }, function (result) {
    const classes = result.overviewClasses.filter(
      (entry) =>
        Date.now() - entry.timestamp < EXPIRATION_DAYS * 24 * 60 * 60 * 1000
    ); // Remove expired entries
    const newClass = { name: className, timestamp: Date.now() };

    if (!classes.some((entry) => entry.name === className)) {
      classes.push(newClass);
      chrome.storage.local.set({ overviewClasses: classes });
    }
  });
}

// Iterate through each h1 element to find the one with the exact text "AI Overview"
Array.from(headers).forEach(function (header) {
  if (header.textContent.trim() === "AI Overview") {
    const parent = findParentWithCorrectAttributes(header);
    const targetParent = parent || header.parentNode;

    targetParent.querySelectorAll("*").forEach((child) => {
      child.style.display = "none";
    });

    if (targetParent.className) {
      targetParent.className.split(" ").forEach((className) => {
        updateStorageWithClass(className);
      });
    }

    // Add bottom margin if it doesn't exist
    if (
      !targetParent.style.marginBottom ||
      targetParent.style.marginBottom === "0px"
    ) {
      targetParent.style.marginBottom = "30px"; // Adjust the margin value as needed
    }
  }
});
