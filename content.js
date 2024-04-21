//Backup script if content is every dynamically loaded
//or if CSS fails for whatever reason...

var AIheaders = document.querySelectorAll("h1");
var AIparentElement = document.querySelector(".M8OgIe");
var AIparentElementPreLoad = document.querySelector(".rEow3c");

if (
  AIparentElementPreLoad &&
  AIparentElementPreLoad.firstChild.tagName === "H1" &&
  AIparentElementPreLoad.firstChild.textContent.trim() === "Search Results"
) {
  AIparentElementPreLoad.style.display = "none";
} else if (
  AIparentElement &&
  AIparentElement.firstChild.tagName === "H1" &&
  AIparentElement.firstChild.textContent.trim() === "Search Results"
) {
  AIparentElement.style.display = "none";
} else {
  // Iterate through each h1 element to find the one with the exact text "AI Overview"
  Array.from(AIheaders).forEach(function (header) {
    if (header.textContent.trim() === "AI Overview") {
      header.parentNode.style.display = "none";
    }
  });
}
