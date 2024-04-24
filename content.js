var headers = document.querySelectorAll("h1");

function findParentWithCorrectAttributes(element) {
  while (element && element.parentElement) {
    element = element.parentElement;
    if (element.hasAttribute("jsname") || element.hasAttribute("id")) {
      return element;
    }
  }
  return null;
}

// Iterate through each h1 element to find the one with the exact text "AI Overview"
Array.from(headers).forEach(function (header) {
  if (header.textContent.trim() === "AI Overview") {
    const parent = findParentWithCorrectAttributes(header);
    if (parent) {
      parent.style.display = "none";
    } else {
      header.parentNode.style.display = "none";
    }

    if (parent.className || header.parentNode.className) {
      chrome.storage.local.set({
        "overviewClass": parent.className || header.parentNode.className,
      });
    }
  }
});
