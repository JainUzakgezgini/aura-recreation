"""
Aura Recreation - backend
A small Flask server that:
  1. shows the website (static/index.html)
  2. gives the website "scan status" data as JSON (the /api/status endpoint)

The scan data is simulated, just like in the original Aura demo.
Nothing is sent to the internet: everything runs on your own computer.
"""

import time

from flask import Flask, jsonify, send_from_directory

app = Flask(__name__, static_folder="static", static_url_path="")

# Programs that Aura "pretends" to scan, and how many fixes each one shows
DEMO_SCANS = [
    ("Notepad.exe", 12),
    ("Explorer.exe", 7),
    ("Chrome.exe", 23),
    ("Outlook.exe", 15),
    ("Calculator.exe", 4),
]


@app.route("/")
def home():
    """Send the main page to the browser."""
    return send_from_directory(app.static_folder, "index.html")


@app.route("/api/status")
def get_status():
    """Return simulated scan data as JSON.

    Like in the original Aura video, this is demo data: it shows what
    the Windows app would display. A new program is "scanned" every
    6 seconds. (Version 1 added +1 fix every 5 seconds forever, so the
    number became unrealistic, e.g. 2647. This version stays realistic.)
    """
    app_name, fixes = DEMO_SCANS[int(time.time() // 6) % len(DEMO_SCANS)]
    return jsonify(
        {
            "scanning": app_name,
            "fixes_applied": fixes,
            "engine": "Aura Enforcer Alpha 0.1",
            "simulated": True,
            "data_sent_online": False,
        }
    )


if __name__ == "__main__":
    print("Aura is running! Open http://127.0.0.1:5000 in your browser.")
    app.run(debug=True)
