"""Small JSON API + static file server (stdlib only)."""
from __future__ import annotations

import json
import mimetypes
import os
import posixpath
import sys
import traceback
import urllib.parse
from datetime import datetime
from http.server import BaseHTTPRequestHandler
from typing import Any

from . import db, paths

MAX_BODY = 25 * 1024 * 1024

MIME_OVERRIDES = {
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".svg": "image/svg+xml",
    ".json": "application/json; charset=utf-8",
    ".ico": "image/x-icon",
    ".woff2": "font/woff2",
    ".png": "image/png",
}


class RawResponse:
    def __init__(self, body: bytes, content_type: str, filename: str):
        self.body = body
        self.content_type = content_type
        self.filename = filename


def make_handler():
    web_dir = os.path.abspath(paths.WEB_DIR)

    class ApiHandler(BaseHTTPRequestHandler):
        server_version = f"DebtTracker/{paths.VERSION}"

        # ------------------------------------------------------------ helpers
        def log_message(self, fmt: str, *args: Any) -> None:
            if os.environ.get("DEBT_TRACKER_LOG"):
                sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

        def _send_json(self, payload: Any, status: int = 200) -> None:
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self._send_bytes(body, "application/json; charset=utf-8", None, status)

        def _send_bytes(self, body: bytes, content_type: str, filename: str | None = None,
                        status: int = 200) -> None:
            self.send_response(status)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            if filename:
                self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
            self.end_headers()
            self.wfile.write(body)

        def _read_json(self) -> dict[str, Any]:
            try:
                length = int(self.headers.get("Content-Length") or 0)
            except ValueError:
                length = 0
            if length > MAX_BODY:
                raise ValueError("Файл слишком большой")
            raw = self.rfile.read(length) if length else b""
            if not raw:
                return {}
            try:
                data = json.loads(raw.decode("utf-8-sig"))
            except (UnicodeDecodeError, json.JSONDecodeError):
                raise ValueError("Некорректный JSON в запросе")
            if not isinstance(data, dict):
                raise ValueError("Ожидается JSON-объект")
            return data

        def _serve_static(self, path: str) -> None:
            relative = posixpath.normpath(urllib.parse.unquote(path)).lstrip("/")
            if relative in ("", "."):
                relative = "index.html"
            candidate = os.path.abspath(os.path.join(web_dir, relative))
            if not candidate.startswith(web_dir) or not os.path.isfile(candidate):
                self._send_json({"error": "Файл не найден"}, 404)
                return

            extension = os.path.splitext(candidate)[1].lower()
            content_type = (
                MIME_OVERRIDES.get(extension)
                or mimetypes.guess_type(candidate)[0]
                or "application/octet-stream"
            )
            with open(candidate, "rb") as handle:
                body = handle.read()
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store, must-revalidate")
            self.end_headers()
            self.wfile.write(body)

        def _auto_backup(self, method: str, parts: list[str]) -> None:
            if method == "GET" or len(parts) < 2:
                return
            resource = parts[1]
            rest = parts[2:]
            if resource in ("backup", "backups", "settings", "export", "reset"):
                return
            if resource == "incomes" and rest == ["plan"]:
                return
            db.auto_backup_after_change()

        # ------------------------------------------------------------ dispatch
        def do_GET(self) -> None:
            self._dispatch("GET")

        def do_POST(self) -> None:
            self._dispatch("POST")

        def do_PUT(self) -> None:
            self._dispatch("PUT")

        def do_DELETE(self) -> None:
            self._dispatch("DELETE")

        def _dispatch(self, method: str) -> None:
            parsed = urllib.parse.urlparse(self.path)
            path = parsed.path
            query = urllib.parse.parse_qs(parsed.query)

            try:
                if not path.startswith("/api/"):
                    if method == "GET":
                        self._serve_static(path)
                    else:
                        self._send_json({"error": "Метод не поддерживается"}, 405)
                    return

                parts = [part for part in path.split("/") if part]
                result = self._route_api(method, parts, query)
                self._auto_backup(method, parts)
                if isinstance(result, RawResponse):
                    self._send_bytes(result.body, result.content_type, result.filename)
                elif isinstance(result, tuple):
                    status, payload = result
                    self._send_json(payload, status)
                else:
                    self._send_json(result)
            except ValueError as exc:
                self._send_json({"error": str(exc)}, 400)
            except LookupError as exc:
                self._send_json({"error": str(exc)}, 404)
            except (BrokenPipeError, ConnectionResetError):
                return
            except Exception:
                traceback.print_exc()
                self._send_json({"error": "Внутренняя ошибка сервера"}, 500)

        def _route_api(self, method: str, parts: list[str], query: dict[str, list[str]]):
            if len(parts) < 2 or parts[0] != "api":
                raise LookupError("Неизвестный метод API")

            resource = parts[1]
            rest = parts[2:]

            def q(name: str) -> str | None:
                values = query.get(name)
                return values[0] if values else None

            def int_part(index: int) -> int:
                try:
                    return int(rest[index])
                except (IndexError, ValueError):
                    raise LookupError("Некорректный идентификатор")

            if method == "GET":
                if resource == "health":
                    return {"ok": True, "time": datetime.now().isoformat(timespec="seconds")}
                if resource == "info":
                    settings = db.get_settings()
                    try:
                        db_size = os.path.getsize(paths.DB_PATH)
                    except OSError:
                        db_size = 0
                    return {
                        **settings,
                        "app_name": paths.APP_NAME,
                        "base_dir": paths.base_dir(),
                        "db_path": paths.DB_PATH,
                        "backup_dir": paths.BACKUP_DIR,
                        "db_size": db_size,
                        "platform": sys.platform,
                    }
                if resource == "settings":
                    return db.get_settings()
                if resource == "summary":
                    return db.get_summary()
                if resource == "overdue":
                    return {"items": db.get_overdue()}
                if resource == "debts":
                    if not rest:
                        return {"items": db.list_debts()}
                    if len(rest) == 1:
                        return db.get_debt(int_part(0))
                if resource == "schedule":
                    return db.get_schedule_month(q("month") or "")
                if resource == "history":
                    debt_id = int(q("debt_id")) if q("debt_id") else None
                    year = int(q("year")) if q("year") else None
                    return db.get_history(debt_id=debt_id, query=q("q"), year=year)
                if resource == "analytics":
                    return db.get_analytics()
                if resource == "incomes":
                    if not rest:
                        return db.get_incomes_page()
                    if rest == ["summary"]:
                        return db.get_income_summary()
                    if rest == ["reminders"]:
                        return db.get_income_reminders()
                    if rest == ["sources"]:
                        return {"items": db.list_income_sources()}
                    if len(rest) == 2 and rest[0] == "receipts":
                        return db.get_income_receipt(int_part(1))
                if resource == "backups":
                    return {
                        "items": db.list_backups(),
                        "dir": paths.BACKUP_DIR,
                        "keep": db.BACKUP_KEEP,
                    }
                if resource == "export":
                    if rest == ["schedule.csv"]:
                        return RawResponse(
                            db.export_schedule_csv(), "text/csv; charset=utf-8", "payment-schedule.csv"
                        )
                    body = json.dumps(db.export_data(), ensure_ascii=False, indent=2).encode("utf-8")
                    return RawResponse(body, "application/json; charset=utf-8", "debts-backup.json")

            if method == "POST":
                payload = self._read_json()
                if resource == "debts" and not rest:
                    debt_id = db.create_debt(payload)
                    return 201, db.get_debt(debt_id)
                if resource == "debts" and len(rest) == 2 and rest[1] in ("close", "reopen"):
                    status = "closed" if rest[1] == "close" else "active"
                    return db.set_debt_status(int_part(0), status)
                if resource == "payments" and len(rest) == 2:
                    if rest[1] == "pay":
                        return db.pay_payment(
                            int_part(0),
                            paid_date=payload.get("paid_date"),
                            amount=payload.get("amount"),
                            note=payload.get("note"),
                        )
                    if rest[1] == "undo":
                        return db.undo_payment(int_part(0))
                if resource == "settings":
                    return db.update_settings(payload)
                if resource == "backup":
                    return {"path": db.backup_database()}
                if resource == "backups" and rest == ["restore"]:
                    return db.restore_backup(str(payload.get("name") or ""))
                if resource == "import":
                    db.auto_backup_before_change("before_import")
                    return db.import_data(payload)
                if resource == "demo":
                    return db.seed_demo()
                if resource == "reset":
                    db.auto_backup_before_change("before_reset")
                    db.reset_all()
                    return {"ok": True}
                if resource == "incomes":
                    if not rest:
                        return 201, db.create_income_receipt(payload)
                    if rest == ["plan"]:
                        return db.plan_income(payload)
                    if rest == ["sources"]:
                        return 201, db.create_income_source(payload)

            if method == "PUT" and resource == "debts" and len(rest) == 1:
                return db.update_debt(int_part(0), self._read_json())

            if method == "PUT" and resource == "settings":
                return db.update_settings(self._read_json())

            if method == "PUT" and resource == "incomes" and len(rest) == 2 and rest[0] == "sources":
                return db.update_income_source(int_part(1), self._read_json())

            if method == "DELETE" and resource == "debts" and len(rest) == 1:
                db.auto_backup_before_change("before_delete")
                db.delete_debt(int_part(0))
                return {"ok": True}

            if method == "DELETE" and resource == "incomes" and len(rest) == 1:
                db.auto_backup_before_change("before_delete")
                db.delete_income_receipt(int_part(0))
                return {"ok": True}

            if method == "DELETE" and resource == "incomes" and len(rest) == 2 and rest[0] == "sources":
                db.auto_backup_before_change("before_delete")
                db.delete_income_source(int_part(1))
                return {"ok": True}

            if method == "DELETE" and resource == "backups" and len(rest) == 1:
                db.delete_backup(urllib.parse.unquote(rest[0]))
                return {"ok": True}

            raise LookupError("Неизвестный метод API")

    return ApiHandler
