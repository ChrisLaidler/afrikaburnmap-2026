#!/usr/bin/env python3
"""
AfrikaBurn Map - Pi schedule-update server.

Serves all static files from the current directory plus a tiny write API so
power users can push live schedule additions/edits/deletions to connected clients.

Usage:
    python3 pi_server.py [--port 8080] [--password secret]

API — all via POST /api/updates, password in JSON body (no auth header needed):
    { "auth": "<password>", "action": "upsert", "id": "...", ...eventFields }
        — add or replace an event in the live feed
    { "auth": "<password>", "action": "delete", "id": "..." }
        — add a tombstone that suppresses that ID on all clients
    { "auth": "<password>", "action": "remove", "id": "..." }
        — remove an entry from the live feed entirely (undo upsert or delete)

Public:
    GET /schedule-updates.json  — served by the static file handler
"""

import argparse
import json
import threading
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
        if data.get("auth") != _password:
            self._json_response(401, b'{"error":"Unauthorized"}')
            return
        event_id = str(data.get("id", "")).strip()
        if not event_id:
            self.send_error(400, "Missing or empty id field")
            return
        action = str(data.get("action", "upsert"))
        if action == "ping":
            self._json_response(200, b'{"ok":true}')
            return
        # Strip the auth field before storing
        entry = {k: v for k, v in data.items() if k != "auth"}
        with _lock:
            updates = _read_updates()
            # Always remove existing entry with same id first
            updates = [u for u in updates if str(u.get("id", "")) != event_id]
            if action == "remove":
                # "remove" just deletes from the file — don't append anything
                pass
            else:
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
