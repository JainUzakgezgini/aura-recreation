/* =========================================================
   AURA RECREATION - page logic
   1. Profiles (themes)
   2. Enforcer simulation
   3. Clarify Content
   4. Live status from the backend (/api/status)
   5. Playground preview
   6. Real Mode bookmarklet link
   ========================================================= */

const body = document.body;
const profileSelect = document.getElementById("profileSelect");
const enforcerBtn = document.getElementById("enforcerBtn");
const clarifyToggle = document.getElementById("clarifyToggle");

/* ---------- 1. PROFILES ----------
   Changing the profile swaps one class on <body>.
   The CSS for that class changes all the colors. */
const THEMES = ["theme-voyager", "theme-beacon", "theme-guardian"];

function setProfile(profile) {
  body.classList.remove(...THEMES);
  body.classList.add("theme-" + profile);
  setPreviewProfile(profile); // the Playground follows the main profile

  // Remember the choice for next visit (if the browser allows it)
  try { localStorage.setItem("aura-profile", profile); } catch (e) { /* ignore */ }
}

profileSelect.addEventListener("change", () => setProfile(profileSelect.value));

/* ---------- 2. ENFORCER SIMULATION ----------
   Adds the "enforcing" class: CSS then draws frames and
   labels around every element Aura "detected". */
function toggleEnforcer() {
  const isOn = body.classList.toggle("enforcing");
  enforcerBtn.textContent = isOn ? "Stop Enforcement" : "Simulate Aura Enforcer";
  document.getElementById("statusMode").textContent = isOn ? "ENFORCING" : "STANDBY";
}

enforcerBtn.addEventListener("click", toggleEnforcer);

/* ---------- 3. CLARIFY CONTENT ----------
   Every element with a data-simple attribute has two versions
   of its text. We save the original the first time, then swap. */
function toggleClarify(isOn) {
  body.classList.toggle("clarify", isOn);

  document.querySelectorAll("[data-simple]").forEach((el) => {
    if (!el.dataset.original) {
      el.dataset.original = el.innerHTML; // save the original text once
    }
    el.innerHTML = isOn ? el.dataset.simple : el.dataset.original;
  });
}

clarifyToggle.addEventListener("change", () => toggleClarify(clarifyToggle.checked));

/* ---------- 4. LIVE STATUS ----------
   Asks the Python backend for scan data every 3 seconds.
   Like in the original Aura video, this data is SIMULATED:
   it shows what the Windows app would display.
   (Real scanning happens in Real Mode, see bookmarklet.js.)
   If the backend is not running (for example the HTML file was
   opened directly), we fall back to demo data instead of crashing. */
const DEMO_STATUS = { scanning: "Notepad.exe", fixes_applied: 12 };

async function updateStatus() {
  const source = document.getElementById("statusSource");
  let data;

  try {
    const response = await fetch("/api/status");
    if (!response.ok) throw new Error("Bad response: " + response.status);
    data = await response.json();
    source.textContent = "Simulated demo data from local API (127.0.0.1)";
  } catch (error) {
    data = DEMO_STATUS;
    source.textContent = "Offline: showing demo data";
  }

  document.getElementById("statusApp").textContent = data.scanning;
  document.getElementById("statusFixes").textContent = data.fixes_applied;
}

updateStatus();
setInterval(updateStatus, 3000);

/* ---------- 5. PLAYGROUND ----------
   Shows the user's text twice: on a typical hard-to-read
   website ("Without Aura") and with an Aura profile ("With Aura").
   textContent (not innerHTML) is used, so typed HTML is shown
   as plain text and cannot run as code. */
const playgroundInput = document.getElementById("playgroundInput");
const pgAfter = document.getElementById("pgAfter");
const pgTabs = document.querySelectorAll(".pg-tab");
const PROFILE_NAMES = {
  voyager: "The Voyager (Color Blind)",
  beacon: "The Beacon (Low Vision)",
  guardian: "The Guardian (Eye Strain)",
};

function updatePlayground() {
  const text = playgroundInput.value || "(type something in the text box)";
  document.querySelectorAll(".pg-text").forEach((p) => { p.textContent = text; });
}

function setPreviewProfile(profile) {
  pgAfter.classList.remove(...THEMES);
  pgAfter.classList.add("theme-" + profile);
  document.getElementById("previewProfile").textContent = PROFILE_NAMES[profile];
  pgTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.profile === profile));
}

pgTabs.forEach((tab) => {
  tab.addEventListener("click", () => setPreviewProfile(tab.dataset.profile));
});

document.getElementById("pgClarify").addEventListener("change", (event) => {
  pgAfter.classList.toggle("easy-reading", event.target.checked);
});

// The example buttons only show the size difference
document.querySelectorAll(".pg-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.getElementById("pgHint").textContent =
      "This is only an example button. Compare its size: Aura makes small buttons bigger and easier to click.";
  });
});

playgroundInput.addEventListener("input", updatePlayground);
updatePlayground();

/* ---------- 6. REAL MODE BOOKMARKLET ----------
   Turns the auraRealMode function (from bookmarklet.js)
   into a "javascript:" link that can be saved as a bookmark. */
const bookmarkletLink = document.getElementById("bookmarkletLink");
bookmarkletLink.href = "javascript:" + encodeURIComponent("(" + auraRealMode.toString() + ")();");
bookmarkletLink.addEventListener("click", (event) => {
  event.preventDefault();
  auraRealMode(); // clicking it here just tests it on this page
});

/* ---------- START ---------- */
let savedProfile = "voyager";
try { savedProfile = localStorage.getItem("aura-profile") || "voyager"; } catch (e) { /* ignore */ }
if (!["voyager", "beacon", "guardian"].includes(savedProfile)) savedProfile = "voyager";
profileSelect.value = savedProfile;
setProfile(savedProfile);
