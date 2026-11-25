/* =========================================================
   AURA REAL MODE (bonus)
   This function becomes a bookmarklet (see script.js).
   Click the bookmark on ANY website and a small Aura panel
   opens in the corner of that page. From the panel you can:

   1. Profile  : change the colors (Voyager / Beacon / Guardian)
   2. Enforcer : REALLY scan the page and fix problems:
                 - text with too low contrast  -> color fixed
                 - buttons smaller than 24x24 px -> made bigger
                 - images without alt text     -> found + labelled
   3. Clarify  : easier reading (bigger text, more spacing,
                 no moving animations)
   4. Narrative: reads the page (or the text you selected)
                 out loud with your computer's own offline voices

   Everything runs inside your own browser. Nothing is saved
   or sent anywhere. Click the bookmark again to close Aura.

   The whole code must be inside this one function (no outside
   variables), because it runs inside other people's websites.
   The same code is used by the Chrome extension
   (extension/aura-real-mode.js is a copy of this file).
   ========================================================= */
function auraRealMode() {
  var HOST_ID = "aura-rm-host";

  /* Clicking the bookmark again closes Aura and undoes everything */
  var existing = document.getElementById(HOST_ID);
  if (existing) {
    if (existing.auraClose) existing.auraClose(); else existing.remove();
    return;
  }

  /* ---------- Profiles: extra CSS added to the page ---------- */
  var PROFILES = {
    off: "",
    voyager:
      "a{text-decoration:underline !important;font-weight:700 !important;}" +
      "body>*:not(#aura-rm-host){filter:contrast(1.1) saturate(1.2) !important;}",
    beacon:
      "html{font-size:125% !important;}" +
      "*:not(#aura-rm-host){background-color:#000 !important;color:#fff !important;border-color:#ffd400 !important;}" +
      "a:not(#aura-rm-host),a:not(#aura-rm-host) *{color:#ffd400 !important;text-decoration:underline !important;}" +
      "h1:not(#aura-rm-host),h2:not(#aura-rm-host),h3:not(#aura-rm-host){color:#ffd400 !important;}",
    guardian:
      "body>*:not(#aura-rm-host){filter:sepia(0.4) brightness(0.85) contrast(0.95) !important;}"
  };

  var CLARIFY_CSS =
    "p,li,dd,td,blockquote,figcaption{font-size:1.15em !important;line-height:1.8 !important;" +
    "letter-spacing:0.03em !important;word-spacing:0.08em !important;}" +
    "*{animation:none !important;transition:none !important;}";

  var profileStyle = document.createElement("style");
  var clarifyStyle = document.createElement("style");
  document.head.appendChild(profileStyle);
  document.head.appendChild(clarifyStyle);

  /* ---------- Enforcer helpers: color contrast (WCAG formula) ---------- */
  function parseColor(text) {
    var n = (text.match(/[\d.]+/g) || []).map(Number);
    return { r: n[0] || 0, g: n[1] || 0, b: n[2] || 0, a: n.length > 3 ? n[3] : 1 };
  }

  function luminance(c) {
    var parts = [c.r, c.g, c.b].map(function (v) {
      v = v / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * parts[0] + 0.7152 * parts[1] + 0.0722 * parts[2];
  }

  function contrast(c1, c2) {
    var l1 = luminance(c1), l2 = luminance(c2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  /* Find the real background color behind an element.
     Returns null if there is a background image (we can't measure that). */
  function backgroundOf(el) {
    while (el && el.nodeType === 1) {
      var s = getComputedStyle(el);
      if (s.backgroundImage !== "none") return null;
      var c = parseColor(s.backgroundColor);
      if (c.a > 0.9) return c;
      el = el.parentElement;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  }

  function isVisible(el) {
    return el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden";
  }

  /* Everything the Enforcer changes is remembered here, so it can be undone */
  var changes = [];
  function remember(el) {
    changes.push({ el: el, css: el.getAttribute("style"), alt: el.getAttribute("alt") });
  }
  function mark(el, color) {
    el.style.setProperty("outline", "3px solid " + color, "important");
    el.style.setProperty("outline-offset", "2px", "important");
  }

  function scanAndFix() {
    var result = { contrast: 0, targets: 0, alt: 0 };

    /* 1. Low contrast text */
    var textElements = new Set();
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      var parent = walker.currentNode.parentElement;
      if (walker.currentNode.textContent.trim() && parent && !parent.closest("#" + HOST_ID) &&
          !/^(SCRIPT|STYLE|NOSCRIPT)$/.test(parent.tagName)) {
        textElements.add(parent);
      }
      if (textElements.size > 3000) break; // keep big pages fast
    }
    textElements.forEach(function (el) {
      if (!isVisible(el)) return;
      var s = getComputedStyle(el);
      var bg = backgroundOf(el);
      if (!bg) return;
      var size = parseFloat(s.fontSize);
      var large = size >= 24 || (size >= 18.6 && Number(s.fontWeight) >= 700);
      var needed = large ? 3 : 4.5; // WCAG AA minimum
      if (contrast(parseColor(s.color), bg) < needed) {
        var black = { r: 0, g: 0, b: 0 }, white = { r: 255, g: 255, b: 255 };
        remember(el);
        el.style.setProperty("color", contrast(black, bg) > contrast(white, bg) ? "#000" : "#fff", "important");
        mark(el, "#ff9f1c");
        result.contrast++;
      }
    });

    /* 2. Tiny click targets (smaller than 24 x 24 px) */
    document.querySelectorAll("button, [role=button], input[type=button], input[type=submit], input[type=checkbox], input[type=radio], a:not(p a):not(li a)")
      .forEach(function (el) {
        if (el.closest("#" + HOST_ID) || !isVisible(el)) return;
        var box = el.getBoundingClientRect();
        if (box.width > 0 && (box.width < 24 || box.height < 24)) {
          remember(el);
          el.style.setProperty("min-width", "32px", "important");
          el.style.setProperty("min-height", "32px", "important");
          if (getComputedStyle(el).display === "inline") el.style.setProperty("display", "inline-block", "important");
          mark(el, "#3b82f6");
          result.targets++;
        }
      });

    /* 3. Images without alt text (screen readers can't describe them) */
    document.querySelectorAll("img:not([alt])").forEach(function (img) {
      if (!isVisible(img)) return;
      remember(img);
      var fileName = (img.src.split("/").pop() || "image").split(/[?#]/)[0].replace(/\.\w+$/, "").replace(/[-_]+/g, " ");
      img.setAttribute("alt", "Image: " + fileName);
      mark(img, "#ef4444");
      result.alt++;
    });

    return result;
  }

  function undoFixes() {
    changes.reverse().forEach(function (c) {
      c.el.setAttribute("style", c.css || "");
      if (c.css === null) c.el.removeAttribute("style"); // Chrome needs the line above first
      if (c.alt === null) c.el.removeAttribute("alt"); else c.el.setAttribute("alt", c.alt);
    });
    changes = [];
  }

  /* ---------- The floating panel (Shadow DOM keeps it safe from the page's CSS) ---------- */
  var host = document.createElement("div");
  host.id = HOST_ID;
  host.style.cssText = "position:fixed;right:20px;bottom:20px;z-index:2147483647;filter:none;";
  var root = host.attachShadow({ mode: "open" });
  root.innerHTML =
    "<style>" +
    ".panel{width:290px;font:14px/1.5 'Segoe UI',system-ui,sans-serif;color:#f1f5ff;background:#0c1530;" +
    "border:2px solid #3b82f6;border-radius:14px;padding:14px 16px;box-shadow:0 10px 40px rgba(0,0,0,.5);}" +
    ".top{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;}" +
    ".logo{font-weight:800;letter-spacing:.12em;color:#8b9dff;}" +
    "button{font:inherit;cursor:pointer;border-radius:8px;}" +
    ".close{background:none;border:none;color:#a3b0cf;font-size:20px;line-height:1;padding:2px 6px;}" +
    "label{display:flex;justify-content:space-between;align-items:center;margin:8px 0;gap:8px;}" +
    "select{font:inherit;background:#050a1f;color:#fff;border:2px solid #3b82f6;border-radius:8px;padding:4px;}" +
    "input[type=checkbox]{width:20px;height:20px;accent-color:#3b82f6;}" +
    ".status{font:12px/1.6 Consolas,monospace;background:#050a1f;border-radius:8px;padding:8px 10px;margin-top:10px;}" +
    ".legend{font-size:11px;color:#a3b0cf;margin-top:6px;}" +
    ".dot{display:inline-block;width:9px;height:9px;border-radius:2px;margin:0 4px 0 8px;}" +
    ".narrative{display:flex;gap:8px;margin-top:10px;}" +
    ".narrative button{flex:1;padding:7px;font-weight:600;border:2px solid #3b82f6;}" +
    "#read{background:#2563eb;color:#fff;}#stop{background:transparent;color:#f1f5ff;}" +
    "#say{font-size:11px;color:#a3b0cf;min-height:1em;margin-top:4px;}" +
    "</style>" +
    "<div class='panel' role='dialog' aria-label='Aura Real Mode'>" +
    "  <div class='top'><span class='logo'>AURA</span><button class='close' aria-label='Close Aura'>&times;</button></div>" +
    "  <label>Profile <select id='profile'>" +
    "    <option value='off'>Off</option><option value='voyager'>Voyager (Color Blind)</option>" +
    "    <option value='beacon'>Beacon (Low Vision)</option><option value='guardian'>Guardian (Eye Strain)</option>" +
    "  </select></label>" +
    "  <label>Enforcer: scan &amp; fix <input type='checkbox' id='enforcer'></label>" +
    "  <label>Clarify: easier reading <input type='checkbox' id='clarify'></label>" +
    "  <div class='narrative'><button id='read'>Read aloud</button><button id='stop'>Stop</button></div>" +
    "  <div id='say' aria-live='polite'></div>" +
    "  <div class='status' aria-live='polite'>" +
    "    Scanning: <span id='site'></span><br>Fixes Applied: <span id='fixes'>0</span><br>Mode: <span id='mode'>STANDBY</span>" +
    "    <div id='details'></div>" +
    "  </div>" +
    "  <div class='legend'><span class='dot' style='background:#ff9f1c'></span>contrast" +
    "    <span class='dot' style='background:#3b82f6'></span>small target<span class='dot' style='background:#ef4444'></span>no alt text</div>" +
    "</div>";
  document.body.appendChild(host);

  var $ = function (id) { return root.getElementById(id); };
  $("site").textContent = location.hostname || "this page";

  function runEnforcer() {
    undoFixes();
    if (!$("enforcer").checked) {
      $("fixes").textContent = "0";
      $("mode").textContent = "STANDBY";
      $("details").textContent = "";
      return;
    }
    var r = scanAndFix();
    $("fixes").textContent = r.contrast + r.targets + r.alt;
    $("mode").textContent = "ENFORCING";
    $("details").textContent = "Contrast: " + r.contrast + " | Targets: " + r.targets + " | Alt: " + r.alt;
  }

  $("profile").addEventListener("change", function () {
    profileStyle.textContent = PROFILES[this.value];
    runEnforcer(); // colors changed, so scan again
  });
  $("enforcer").addEventListener("change", runEnforcer);
  $("clarify").addEventListener("change", function () {
    clarifyStyle.textContent = this.checked ? CLARIFY_CSS : "";
  });

  /* ---------- Aura Narrative: read out loud ----------
     Uses the browser's built-in speechSynthesis with OFFLINE voices
     only (localService = true), so the text never leaves the computer. */
  function pickVoice() {
    var voices = speechSynthesis.getVoices().filter(function (v) { return v.localService; });
    var lang = (document.documentElement.lang || navigator.language || "en").slice(0, 2).toLowerCase();
    return voices.find(function (v) { return v.lang.toLowerCase().indexOf(lang) === 0; }) ||
           voices.find(function (v) { return v.default; }) || voices[0] || null;
  }

  function textToRead() {
    var selected = String(window.getSelection()).trim();
    if (selected) return selected; // the user selected some text: read only that

    var parts = [document.title];
    var h1 = document.querySelector("h1");
    if (h1 && h1.innerText.trim() !== document.title) parts.push(h1.innerText.trim());
    var area = document.querySelector("main, article, [role=main]") || document.body;
    var length = 0;
    area.querySelectorAll("p").forEach(function (p) {
      var text = p.innerText.trim();
      if (length < 600 && text.length > 40 && isVisible(p)) {
        parts.push(text);
        length += text.length;
      }
    });
    return parts
      .filter(function (part) { return part; }) // skip empty parts (e.g. no page title)
      .map(function (part) { return /[.!?:]$/.test(part) ? part : part + "."; })
      .join(" ");
  }

  function speak() {
    if (!window.speechSynthesis) { $("say").textContent = "This browser cannot read aloud."; return; }
    if (!speechSynthesis.getVoices().length) {
      $("say").textContent = "Loading voices...";
      speechSynthesis.addEventListener("voiceschanged", speak, { once: true }); // voices load a bit later
      return;
    }
    speechSynthesis.cancel();
    var voice = pickVoice();
    if (!voice) { $("say").textContent = "No offline voice found on this computer."; return; }
    var speech = new SpeechSynthesisUtterance(textToRead());
    speech.voice = voice;
    speech.lang = voice.lang;
    speech.rate = 0.95;
    speech.onend = function () { $("say").textContent = ""; };
    $("say").textContent = "Reading with: " + voice.name;
    speechSynthesis.speak(speech);
  }

  // preventDefault on mousedown keeps the user's text selection on the page
  $("read").addEventListener("mousedown", function (e) { e.preventDefault(); });
  $("read").addEventListener("click", speak);
  $("stop").addEventListener("click", function () {
    if (window.speechSynthesis) speechSynthesis.cancel();
    $("say").textContent = "";
  });

  host.auraClose = function () {
    if (window.speechSynthesis) speechSynthesis.cancel();
    undoFixes();
    profileStyle.remove();
    clarifyStyle.remove();
    host.remove();
  };
  root.querySelector(".close").addEventListener("click", host.auraClose);
}
