#!/usr/bin/env python3
"""
AfrikaBurn Map - Pi schedule-update server.

Serves all static files from the current directory plus a tiny write API so
power users can push live schedule additions/edits/deletions to connected clients.

Usage:
    # Plain HTTP (no GPS in browser, no warnings):
    python3 pi_server.py --port 80 --password secret

    # HTTPS only (GPS works, one-time self-signed cert warning):
    python3 pi_server.py --port 443 --password secret \
        --ssl-cert cert.pem --ssl-key key.pem --no-http-redirect

    # HTTPS + HTTP redirect (single instance serving both):
    python3 pi_server.py --port 443 --password secret \
        --ssl-cert cert.pem --ssl-key key.pem

API — all via POST /api/updates:
    { "action": "sync", "updates": [...] }
        — version-gated full replacement; no auth required; only accepted if
          the incoming _version entry is newer than the server's current version.
          Any client that has a newer copy will call this automatically.

    { "auth": "<password>", "action": "upsert", "id": "...", ...eventFields }
        — add or replace an event in the live feed
    { "auth": "<password>", "action": "delete", "id": "..." }
        — add a tombstone that suppresses that ID on all clients
    { "auth": "<password>", "action": "remove", "id": "..." }
        — remove an entry from the live feed entirely (undo upsert or delete)
    { "auth": "<password>", "action": "ping" }
        — verify credentials without making changes

Public:
    GET /schedule-updates.json  — served by the static file handler
"""

import argparse
import json
import ssl
import time
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler, BaseHTTPRequestHandler
from pathlib import Path

UPDATES_FILE = "schedule-updates.json"
_lock = threading.Lock()
_password = "password"


def _get_version(updates):
    for u in updates:
        if isinstance(u, dict) and u.get("action") == "_version":
            return int(u.get("_version", 0))
    return 0


def _read_updates():
    try:
        return json.loads(Path(UPDATES_FILE).read_text(encoding="utf-8"))
    except Exception:
        return []


def _write_updates(updates):
    """Write updates, always stamping a fresh _version as the first entry."""
    payload = [u for u in updates if not (isinstance(u, dict) and u.get("action") == "_version")]
    payload = [{"action": "_version", "_version": int(time.time() * 1000)}] + payload
    Path(UPDATES_FILE).write_text(
        json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8"
    )


# Paths that iOS/Android/Windows use to detect captive portals.
# We redirect them to the map so the "sign in to network" popup appears.
_CAPTIVE_PATHS = {
    "/hotspot-detect.html",          # iOS / macOS
    "/library/test/success.html",    # iOS older
    "/generate_204",                 # Android / Chrome
    "/gen_204",                      # Android alt
    "/connecttest.txt",              # Windows
    "/ncsi.txt",                     # Windows alt
    "/redirect",                     # Android alt
    "/canonical.html",               # Firefox
}


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split("?")[0].rstrip("/") or "/"
        if path in _CAPTIVE_PATHS:
            self.send_response(302)
            self.send_header("Location", "/")
            self.end_headers()
            return
        super().do_GET()

    def do_POST(self):
        if self.path != "/api/updates":
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)
        try:
            data = json.loads(body)
        except (json.JSONDecodeError, ValueError):
            self.send_error(400, "Invalid JSON")
            return
        if not isinstance(data, dict):
            self.send_error(400, "Expected JSON object")
            return

        action = str(data.get("action", "upsert"))

        if action == "sync":
            incoming = data.get("updates")
            if not isinstance(incoming, list):
                self.send_error(400, "Expected updates list")
                return
            with _lock:
                current = _read_updates()
                current_v = _get_version(current)
                incoming_v = _get_version(incoming)
                if incoming_v > current_v:
                    _write_updates(incoming)
                    self._json_response(200, b'{"ok":true,"accepted":true}')
                    print(f"[sync] accepted v{incoming_v} (was v{current_v})")
                else:
                    self._json_response(200, b'{"ok":true,"accepted":false}')
                    print(f"[sync] rejected v{incoming_v} (have v{current_v})")
            return

        if data.get("auth") != _password:
            self._json_response(401, b'{"error":"Unauthorized"}')
            return

        if action == "ping":
            self._json_response(200, b'{"ok":true}')
            return

        event_id = str(data.get("id", "")).strip()
        if not event_id:
            self.send_error(400, "Missing or empty id field")
            return

        entry = {k: v for k, v in data.items() if k != "auth"}
        with _lock:
            updates = _read_updates()
            updates = [u for u in updates if not (isinstance(u, dict) and (
                u.get("action") == "_version" or str(u.get("id", "")) == event_id
            ))]
            if action != "remove":
                updates.append(entry)
            _write_updates(updates)
        self._json_response(200, b'{"ok":true}')
        print(f"[{action}] id={event_id}")

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def _json_response(self, code, body):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        if self.command == "POST":
            super().log_message(fmt, *args)


class _RedirectHandler(BaseHTTPRequestHandler):
    """Redirects plain HTTP requests to the HTTPS site."""
    _https_host = "map.laidler.co.za"

    def do_GET(self):
        path = self.path.split("?")[0].rstrip("/") or "/"
        dest = "/" if path in _CAPTIVE_PATHS else self.path
        self.send_response(302)
        self.send_header("Location", f"https://{self._https_host}{dest}")
        self.end_headers()

    def do_POST(self):
        self.send_response(307)
        self.send_header("Location", f"https://{self._https_host}{self.path}")
        self.end_headers()

    def log_message(self, fmt, *args):
        pass


def _serve_in_thread(server):
    t = threading.Thread(target=server.serve_forever, daemon=True)
    t.start()
    return t


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AfrikaBurn Map Pi server")
    parser.add_argument("--port", type=int, default=80, help="Port to listen on (default 80, or 443 with SSL)")
    parser.add_argument("--password", default="password", help="Admin password for write API")
    parser.add_argument("--ssl-cert", help="Path to SSL certificate PEM file")
    parser.add_argument("--ssl-key", help="Path to SSL private key PEM file")
    parser.add_argument("--no-http-redirect", action="store_true",
                        help="With SSL: skip starting the HTTP-to-HTTPS redirect on port 80")
    args = parser.parse_args()
    _password = args.password

    if not Path(UPDATES_FILE).exists():
        _write_updates([])
        print(f"Created empty {UPDATES_FILE}")

    use_ssl = bool(args.ssl_cert and args.ssl_key)

    if use_ssl:
        port = args.port if args.port != 80 else 443
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(args.ssl_cert, args.ssl_key)
        https_server = HTTPServer(("", port), Handler)
        https_server.socket = context.wrap_socket(https_server.socket, server_side=True)

        if not args.no_http_redirect:
            redirect_server = HTTPServer(("", 80), _RedirectHandler)
            _serve_in_thread(redirect_server)
            print("HTTP redirect running on port 80 → https://burn.map/")

        print(f"Serving HTTPS on https://burn.map/ (port {port})")
        print(f"Admin password: {args.password}")
        https_server.serve_forever()
    else:
        print(f"Serving HTTP on http://0.0.0.0:{args.port}")
        print(f"Admin password: {args.password}")
        HTTPServer(("", args.port), Handler).serve_forever()
