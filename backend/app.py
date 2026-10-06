import os
import random
import socket
from datetime import datetime
from flask import Flask, jsonify

app = Flask(__name__)

# Environment variables (with sensible fall-backs)
PORT   = int(os.getenv("PORT", 5000))      # e.g. "5000"
NUMBER = os.getenv("NUMBER", "0")          # e.g. "1" (useful to tell backends apart)

FACTS = [
    "A container is just a process with some walls around it.",
    "DNS is always the problem. Until it isn't. Then it's still DNS.",
    "localhost inside a container means THAT container, not your computer.",
    "The frontend shows things. The backend knows things.",
    "Ports are like apartment numbers: same building (IP), different doors.",
    "Environment variables let you change behaviour without changing code.",
]

# The backend speaks JSON (data), not HTML (pages).
@app.route("/api/fact")
def fact():
    return jsonify({
        "fact": random.choice(FACTS),
        "backend_number": NUMBER,
        "backend_hostname": socket.gethostname(),
        "time": datetime.now().strftime("%H:%M:%S"),
    })

# Simple health-check (always on /healthcheck)
@app.route("/healthcheck")
def healthcheck():
    return "Backend works!", 200

if __name__ == "__main__":
    # 0.0.0.0 = listen on ALL network interfaces (needed for Docker / other machines)
    print(f"Backend {NUMBER} listening on http://0.0.0.0:{PORT}/api/fact")
    app.run(host="0.0.0.0", port=PORT)
