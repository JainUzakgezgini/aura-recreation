/* =========================================================
   AURA REAL MODE - Chrome extension (background script)
   When the user clicks the Aura icon in the toolbar
   (or presses Ctrl+Shift+Y), we run the same auraRealMode()
   function as the bookmarklet on the current page.

   Permissions are kept as small as possible:
   - activeTab: only the tab the user clicked on, only at that moment
   - scripting: needed to run our code on that tab
   The extension cannot read any page on its own.
   ========================================================= */

importScripts("aura-real-mode.js"); // loads the auraRealMode() function

chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: "MAIN", // run like the bookmarklet, inside the page itself
      func: auraRealMode,
    });
  } catch (error) {
    // Chrome does not allow extensions on its own pages (chrome://, Web Store)
    console.warn("Aura cannot run on this page:", error.message);
  }
});
