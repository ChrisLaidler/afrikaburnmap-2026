#!/usr/bin/env python3
"""
AfrikaBurn Map - Pi schedule-update server.

Serves all static files from the current directory plus a tiny write API so
power users can push live schedule additions/edits/deletions to connected clients.

Usage:
    python3 pi_server.py [--port 8080] [--password secret]

API (requires Authorization: Bearer <password>):
    POST   /api/updates       — upsert an event (body: JSON object with "id" field)
    DELETE /api/updates/<id>  — remove an event from the live feed by id

Public:
    GET    /schedule-updates.json  — served by the static file handler
"""

import argparse
import json
import threading
import urllib.parse
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

UPDATES_FILE = "schedule-updates.json"
_lock = threading.Lock()
_password = "password"


def _read_updates():
    try:
        return json.loads(Path(UPDATES_FILE).read_text(encoding="utf-8"))
    except Exception:
        return []


def _write_updates(updates):
    Path(UPDATES_FILE).write_text(
        json.dumps(updates, indent=2, ensure_ascii=False), encoding="utf-8"
    )


class Handler(SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self._cors_headers()
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
        self.end_headers()

    def do_POST(self):
        if self.path != "/api/updates":
            self.send_error(404)
            return
        if not self._check_auth():
            return
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)
        try:
            update = json.loads(body)
        except json.JSONDecodeError:
            self.send_error(400, "Invalid JSON")
            return
        if not isinstance(update, dict) or not update.get("id"):
            self.send_error(400, "Missing or empty id field")
            return
        event_id = str(update["id"])
        with _lock:
            updates = _read_updates()
            updates = [u for u in updates if str(u.get("id", "")) != event_id]
            updates.append(update)
            _write_updates(updates)
        self._json_ok()
        print(f"[upsert] id={event_id} action={update.get('action', 'upsert')}")

    def do_DELETE(self):
        prefix = "/api/updates/"
        if not self.path.startswith(prefix):
            self.send_error(404)
            return
        if not self._check_auth():
            return
        event_id = urllib.parse.unquote(self.path[len(prefix):])
        if not event_id:
            self.send_error(400, "Missing id in path")
            return
        with _lock:
            updates = _read_updates()
            updates = [u for u in updates if str(u.get("id", "")) != event_id]
            _write_updates(updates)
        self._json_ok()
        print(f"[delete] id={event_id}")

    def end_headers(self):
        self._cors_headers()
        super().end_headers()

    def _cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")

    def _check_auth(self):
        auth = self.headers.get("Authorization", "")
        if auth != f"Bearer {_password}":
            self.send_response(401)
            self._cors_headers()
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"error":"Unauthorized"}')
            return False
        return True

    def _json_ok(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"ok":true}')

    def log_message(self, fmt, *args):
        # Suppress static-file GET noise; keep POST/DELETE logs above
        if self.command in ("POST", "DELETE", "OPTIONS"):
            super().log_message(fmt, *args)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AfrikaBurn Map Pi server")
    parser.add_argument("--port", type=int, default=8080, help="Port to listen on (default 8080)")
    parser.add_argument("--password", default="password", help="Admin password for write API")
    args = parser.parse_args()
    _password = args.password

    if not Path(UPDATES_FILE).exists():
        _write_updates([])
        print(f"Created empty {UPDATES_FILE}")

    print(f"Serving on http://0.0.0.0:{args.port}")
    print(f"Admin password: {args.password}")
    print(f"Live feed: http://0.0.0.0:{args.port}/schedule-updates.json")
    HTTPServer(("", args.port), Handler).serve_forever()
