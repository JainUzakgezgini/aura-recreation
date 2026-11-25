# Aura Recreation

A reverse-engineered recreation of **Aura**, an accessibility concept app shown in a demo video. Made for the APL project 2026, task 4: *Reverse Engineer a Result*.

Aura is described as "The Guardian of Accessibility": a tool that helps people with disabilities (color blindness, low vision, eye strain) use their computer more easily, while keeping all data on the user's own machine.

## Features

- **3 accessibility profiles**: The Voyager (Color Blind), The Beacon (Low Vision), The Guardian (Eye Strain)
- **Enforcer simulation**: shows frames and labels around every element Aura "detects"
- **Clarify Content**: swaps text for simpler sentences and makes it bigger and easier to read
- **Status card**: simulated scan data (like in the original video) from a small Python API (`/api/status`), with demo data as a fallback
- **Playground**: type your own text and compare it "Without Aura" (a typical hard-to-read site) and "With Aura" (any profile + easier reading)
- **Real Mode (bonus)**: an Aura panel on any real website, as a **bookmarklet** (no install, any browser) or a **Chrome extension** (toolbar icon, `Ctrl+Shift+Y`):
  - Profiles: the 3 color profiles
  - Enforcer: really scans the page and fixes low-contrast text (WCAG AA), boosts click targets smaller than 24x24 px and finds images without alt text
  - Clarify: easier reading (bigger text, more spacing, no animations)
  - Narrative: reads the selected text, or the page title and first paragraphs, out loud with the computer's own offline voices
  - Everything can be undone: closing the panel restores the page
- **Privacy**: no external fonts, scripts or tracking. Everything runs locally.

## Built with

- Python 3 + Flask (backend)
- HTML, CSS, JavaScript (frontend)

## How to run

```
pip install -r requirements.txt
python app.py
```

Then open **http://127.0.0.1:5000** in your browser. Stop the server with `Ctrl + C`.

### Install the Chrome extension (optional)

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and choose the `extension` folder.
3. On any website, click the Aura icon or press `Ctrl + Shift + Y`.

The extension only uses the `activeTab` and `scripting` permissions: it can only touch the tab you click it on.

## Project structure

```
aura-recreation/
├── app.py              # Flask backend: serves the page + /api/status
├── requirements.txt    # Python packages needed
├── README.md
├── static/
│   ├── index.html          # Page structure
│   ├── style.css           # Themes, layout, enforcer frames
│   ├── script.js           # Profiles, enforcer, clarify, live status
│   └── bookmarklet.js      # Real Mode (bonus), shared code
└── extension/
    ├── manifest.json       # Chrome extension settings
    ├── background.js       # Runs Real Mode when the icon is clicked
    ├── aura-real-mode.js   # Copy of static/bookmarklet.js
    └── icons/              # Toolbar icons
```

Note: `extension/aura-real-mode.js` must stay identical to `static/bookmarklet.js`. If you change one, copy it to the other.

## Limitations

- The status card on the homepage is simulated, like in the original. Real scanning only happens in Real Mode, and only on web pages (not Windows apps).
- Clarify Content rewrites text into simpler sentences only on the Aura homepage (pre-written versions). Rewriting any website's text would need an AI language model, so in Real Mode Clarify only improves readability.
- Some websites block bookmarklets with strict security settings (Content Security Policy).
- Chrome does not allow extensions on its own pages (`chrome://...`, Chrome Web Store).
- Narrative only uses offline voices installed on the computer. If none are installed, it shows a message instead of using an online voice.
