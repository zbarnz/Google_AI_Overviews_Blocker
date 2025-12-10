document.addEventListener("DOMContentLoaded", () => {
  console.log("POPUP JS IS RUNNING");

  const toggle = document.getElementById("toggle");
  const status = document.getElementById("status");

  function setUI(enabled) {
    toggle.checked = !!enabled;
    status.textContent = enabled ? "Enabled" : "Disabled";
  }

  // read stored value (default true)
  chrome.storage.local.get({ enabled: true }, (items) => {
    setUI(items.enabled);
  });

  toggle.addEventListener("change", () => {
    const enabled = toggle.checked;
    chrome.storage.local.set({ enabled }, () => {
      setUI(enabled);
      // notify background (optional)
      chrome.runtime.sendMessage({ type: "SET_ENABLED", enabled });
    });
  });
});
