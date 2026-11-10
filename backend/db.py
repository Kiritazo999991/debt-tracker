"""SQLite storage and debt/payment business logic."""
from __future__ import annotations

import calendar
import csv
import io
import os
import re
import sqlite3
import threading
import traceback
from contextlib import contextmanager
from datetime import date, datetime, timedelta
from typing import Any, Iterable

from . import paths

DEBT_TYPES = {
    "credit": "Кредит",
    "mortgage": "Ипотека",
    "installment": "Рассрочка",
    "card": "Кредитная карта",
    "loan": "Займ",
    "other": "Другое",
}

COLORS = ["#7c5cff", "#22d3ee", "#f59e0b", "#f472b6", "#34d399", "#60a5fa", "#fb7185"]

DEFAULT_SETTINGS = {"currency": "₽", "theme": "dark"}

INCOME_KINDS = {
    "salary": "Зарплата",
    "advance": "Аванс",
    "other": "Другой доход",
}
INCOME_COLORS = {"salary": "#34d399", "advance": "#22d3ee", "other": "#a78bfa"}
INCOME_HORIZON_DAYS = 30
MANDATORY_MODES = {
    "proportional": "Пропорционально всем платежам",
    "priority": "Сначала ближайшие по сроку",
}
DEFAULT_MANDATORY_MODE = "proportional"
BACKUP_KEEP = 5
BACKUP_REASONS = {
    "before_import": "Перед импортом",
    "before_reset": "Перед очисткой",
    "before_restore": "Перед восстановлением",
    "before_delete": "Перед удалением",
}
_backup_lock = threading.RLock()

SCHEMA = """
CREATE TABLE IF NOT EXISTS debts (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    title          TEXT NOT NULL,
    creditor       TEXT NOT NULL DEFAULT '',
    type           TEXT NOT NULL DEFAULT 'credit',
    principal      REAL NOT NULL,
    rate           REAL NOT NULL DEFAULT 0,
    term_months    INTEGER NOT NULL,
    start_date     TEXT NOT NULL,
    monthly_payment REAL,
    color          TEXT NOT NULL DEFAULT '#7c5cff',
    notes          TEXT NOT NULL DEFAULT '',
    status         TEXT NOT NULL DEFAULT 'active',
    created_at     TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS payments (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    debt_id        INTEGER NOT NULL,
    due_date       TEXT NOT NULL,
    paid_date      TEXT,
    amount         REAL NOT NULL,
    paid_amount    REAL,
    principal_part REAL NOT NULL DEFAULT 0,
    interest_part  REAL NOT NULL DEFAULT 0,
    balance_after  REAL NOT NULL DEFAULT 0,
    status         TEXT NOT NULL DEFAULT 'pending',
    note           TEXT NOT NULL DEFAULT '',
    created_at     TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payments_debt ON payments(debt_id);
CREATE INDEX IF NOT EXISTS idx_payments_due ON payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE TABLE IF NOT EXISTS income_sources (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    kind            TEXT NOT NULL DEFAULT 'salary',
    days            TEXT NOT NULL DEFAULT '',
    expected_amount REAL,
    color           TEXT NOT NULL DEFAULT '#34d399',
    active          INTEGER NOT NULL DEFAULT 1,
    notes           TEXT NOT NULL DEFAULT '',
    created_at      TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS income_receipts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id       INTEGER,
    source_name     TEXT NOT NULL DEFAULT '',
    received_date   TEXT NOT NULL,
    amount          REAL NOT NULL,
    note            TEXT NOT NULL DEFAULT '',
    created_at      TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (source_id) REFERENCES income_sources(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS income_allocations (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    receipt_id  INTEGER NOT NULL,
    kind        TEXT NOT NULL DEFAULT 'payment',
    debt_id     INTEGER,
    due_date    TEXT,
    label       TEXT NOT NULL DEFAULT '',
    amount      REAL NOT NULL,
    status      TEXT NOT NULL DEFAULT 'planned',
    created_at  TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (receipt_id) REFERENCES income_receipts(id) ON DELETE CASCADE,
    FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_income_receipts_date ON income_receipts(received_date);
CREATE INDEX IF NOT EXISTS idx_income_receipts_source ON income_receipts(source_id);
CREATE INDEX IF NOT EXISTS idx_income_allocations_receipt ON income_allocations(receipt_id);
CREATE INDEX IF NOT EXISTS idx_income_allocations_payment ON income_allocations(debt_id, due_date);

CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT
);
"""


# ---------------------------------------------------------------- utilities

def money(value: float) -> float:
    return round(float(value) + 1e-9, 2)


def add_months(source: date, months: int) -> date:
    year = source.year + (source.month - 1 + months) // 12
    month = (source.month - 1 + months) % 12 + 1
    day = min(source.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def parse_date(value: Any, field: str = "Дата") -> date:
    if isinstance(value, date):
        return value
    try:
        return datetime.strptime(str(value), "%Y-%m-%d").date()
    except (TypeError, ValueError):
        raise ValueError(f"{field}: ожидается дата в формате ГГГГ-ММ-ДД")


def month_end(year: int, month: int) -> date:
    return date(year, month, calendar.monthrange(year, month)[1])


def month_key(value: date | str) -> str:
    if isinstance(value, str):
        return value[:7]
    return value.strftime("%Y-%m")


def iso(value: date | None) -> str | None:
    return value.isoformat() if value else None


def annuity_payment(principal: float, rate: float, months: int) -> float:
    if months <= 0:
        return 0.0
    monthly_rate = max(rate, 0.0) / 1200.0
    if monthly_rate == 0:
        return money(principal / months)
    return money(principal * monthly_rate / (1 - (1 + monthly_rate) ** (-months)))


def build_schedule(
    principal: float,
    rate: float,
    term_months: int,
    first_payment: date,
    monthly_payment: float | None = None,
) -> list[dict[str, Any]]:
    """Generate a month-by-month payout schedule (annuity or equal installments)."""
    principal = float(principal)
    rate = float(rate or 0)
    monthly_rate = rate / 1200.0

    if monthly_payment:
        payment = money(monthly_payment)
    else:
        payment = annuity_payment(principal, rate, term_months)

    balance = principal
    rows: list[dict[str, Any]] = []

    for index in range(term_months):
        due = add_months(first_payment, index)
        interest = money(balance * monthly_rate)
        is_last = index == term_months - 1
        pays_off = payment >= balance + interest - 0.005

        if is_last or pays_off:
            principal_part = money(balance)
            amount = money(principal_part + interest)
        else:
            principal_part = money(payment - interest)
            amount = payment

        if principal_part <= 0:
            raise ValueError(
                "Ежемесячный платёж слишком мал: он не покрывает начисленные проценты"
            )

        balance = money(balance - principal_part)
        if balance < 0.005:
            balance = 0.0

        rows.append(
            {
                "due_date": iso(due),
                "amount": amount,
                "principal_part": principal_part,
                "interest_part": interest,
                "balance_after": balance,
            }
        )
        if balance <= 0:
            break

    return rows


# ---------------------------------------------------------------- database

@contextmanager
def get_conn():
    paths.ensure_dirs()
    conn = sqlite3.connect(paths.DB_PATH, timeout=15)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    paths.ensure_dirs()
    with get_conn() as conn:
        conn.executescript(SCHEMA)
        for key, value in DEFAULT_SETTINGS.items():
            conn.execute(
                "INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO NOTHING",
                (key, value),
            )


def get_settings() -> dict[str, Any]:
    with get_conn() as conn:
        stored = {row["key"]: row["value"] for row in conn.execute("SELECT * FROM settings")}
    merged = {**DEFAULT_SETTINGS, **stored}
    merged["db_path"] = paths.DB_PATH
    merged["version"] = paths.VERSION
    return merged


def update_settings(data: dict[str, Any]) -> dict[str, Any]:
    allowed_currency = {"₽", "$", "€", "₸", "₴", "£"}
    allowed_theme = {"dark", "light"}
    with get_conn() as conn:
        if "currency" in data:
            currency = str(data["currency"])
            if currency not in allowed_currency:
                raise ValueError("Неподдерживаемая валюта")
            conn.execute(
                "INSERT INTO settings(key, value) VALUES('currency', ?) "
                "ON CONFLICT(key) DO UPDATE SET value=excluded.value",
                (currency,),
            )
        if "theme" in data:
            theme = str(data["theme"])
            if theme not in allowed_theme:
                raise ValueError("Неподдерживаемая тема")
            conn.execute(
                "INSERT INTO settings(key, value) VALUES('theme', ?) "
                "ON CONFLICT(key) DO UPDATE SET value=excluded.value",
                (theme,),
            )
    return get_settings()


# ---------------------------------------------------------------- validation

def clean_debt_payload(data: dict[str, Any], existing: dict[str, Any] | None = None) -> dict[str, Any]:
    base = existing or {}

    def pick(key: str) -> Any:
        return data[key] if key in data else base.get(key)

    title = str(pick("title") or "").strip()
    if not title:
        raise ValueError("Укажите название долга")
    if len(title) > 120:
        raise ValueError("Название слишком длинное (максимум 120 символов)")

    creditor = str(pick("creditor") or "").strip()[:120]
    debt_type = str(pick("type") or "credit")
    if debt_type not in DEBT_TYPES:
        raise ValueError("Неизвестный тип долга")

    try:
        principal = money(float(pick("principal")))
    except (TypeError, ValueError):
        raise ValueError("Сумма долга должна быть числом")
    if principal <= 0:
        raise ValueError("Сумма долга должна быть больше нуля")

    try:
        rate = float(pick("rate") or 0)
    except (TypeError, ValueError):
        raise ValueError("Ставка должна быть числом")
    if rate < 0 or rate > 1000:
        raise ValueError("Ставка должна быть в пределах 0–1000%")

    try:
        term_months = int(pick("term_months"))
    except (TypeError, ValueError):
        raise ValueError("Срок должен быть числом месяцев")
    if term_months < 1 or term_months > 600:
        raise ValueError("Срок должен быть от 1 до 600 месяцев")

    start_date = parse_date(pick("start_date"), "Дата первого платежа")

    raw_payment = pick("monthly_payment")
    monthly_payment = None
    if raw_payment not in (None, "", 0, "0"):
        try:
            monthly_payment = money(float(raw_payment))
        except (TypeError, ValueError):
            raise ValueError("Ежемесячный платёж должен быть числом")
        if monthly_payment <= 0:
            raise ValueError("Ежемесячный платёж должен быть больше нуля")
        if monthly_payment <= principal * rate / 1200.0:
            raise ValueError("Ежемесячный платёж должен быть больше начисляемых процентов")

    color = str(pick("color") or COLORS[0])
    if not (color.startswith("#") and len(color) in (4, 7)):
        color = COLORS[0]

    notes = str(pick("notes") or "").strip()[:2000]

    return {
        "title": title,
        "creditor": creditor,
        "type": debt_type,
        "principal": principal,
        "rate": round(rate, 2),
        "term_months": term_months,
        "start_date": iso(start_date),
        "monthly_payment": monthly_payment,
        "color": color,
        "notes": notes,
    }


# ---------------------------------------------------------------- debts

def _insert_schedule(conn: sqlite3.Connection, debt_id: int, rows: Iterable[dict[str, Any]]) -> None:
    conn.executemany(
        "INSERT INTO payments(debt_id, due_date, amount, principal_part, interest_part, balance_after) "
        "VALUES(?, ?, ?, ?, ?, ?)",
        [
            (
                debt_id,
                row["due_date"],
                row["amount"],
                row["principal_part"],
                row["interest_part"],
                row["balance_after"],
            )
            for row in rows
        ],
    )


def create_debt(data: dict[str, Any]) -> int:
    payload = clean_debt_payload(data)
    schedule = build_schedule(
        payload["principal"],
        payload["rate"],
        payload["term_months"],
        parse_date(payload["start_date"]),
        payload["monthly_payment"],
    )
    with get_conn() as conn:
        cursor = conn.execute(
            "INSERT INTO debts(title, creditor, type, principal, rate, term_months, start_date, "
            "monthly_payment, color, notes) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                payload["title"],
                payload["creditor"],
                payload["type"],
                payload["principal"],
                payload["rate"],
                payload["term_months"],
                payload["start_date"],
                payload["monthly_payment"],
                payload["color"],
                payload["notes"],
            ),
        )
        debt_id = int(cursor.lastrowid)
        _insert_schedule(conn, debt_id, schedule)
    return debt_id


def update_debt(debt_id: int, data: dict[str, Any]) -> dict[str, Any]:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM debts WHERE id=?", (debt_id,)).fetchone()
        if not row:
            raise LookupError("Долг не найден")
        existing = dict(row)

        payload = clean_debt_payload(data, existing)
        financial_fields = ("principal", "rate", "term_months", "start_date", "monthly_payment")
        changed = False
        for field in financial_fields:
            old_value = existing.get(field)
            new_value = payload[field]
            if isinstance(new_value, (int, float)) and isinstance(old_value, (int, float)):
                if abs(float(old_value) - float(new_value)) > 0.001:
                    changed = True
                    break
            elif old_value != new_value:
                changed = True
                break

        conn.execute(
            "UPDATE debts SET title=?, creditor=?, type=?, principal=?, rate=?, term_months=?, "
            "start_date=?, monthly_payment=?, color=?, notes=? WHERE id=?",
            (
                payload["title"],
                payload["creditor"],
                payload["type"],
                payload["principal"],
                payload["rate"],
                payload["term_months"],
                payload["start_date"],
                payload["monthly_payment"],
                payload["color"],
                payload["notes"],
                debt_id,
            ),
        )

        if changed:
            paid = conn.execute(
                "SELECT COALESCE(SUM(paid_amount), 0) AS amount, "
                "COALESCE(SUM(principal_part), 0) AS principal, "
                "COUNT(*) AS count, MAX(due_date) AS last_due "
                "FROM payments WHERE debt_id=? AND status='paid'",
                (debt_id,),
            ).fetchone()

            conn.execute("DELETE FROM payments WHERE debt_id=? AND status='pending'", (debt_id,))

            remaining_principal = money(payload["principal"] - paid["principal"])
            remaining_months = payload["term_months"] - int(paid["count"])

            if remaining_principal > 0.005 and remaining_months > 0:
                if paid["last_due"]:
                    start = add_months(parse_date(paid["last_due"]), 1)
                else:
                    start = parse_date(payload["start_date"])
                schedule = build_schedule(
                    remaining_principal,
                    payload["rate"],
                    remaining_months,
                    start,
                    payload["monthly_payment"],
                )
                _insert_schedule(conn, debt_id, schedule)

    return get_debt(debt_id)


def delete_debt(debt_id: int) -> None:
    with get_conn() as conn:
        cursor = conn.execute("DELETE FROM debts WHERE id=?", (debt_id,))
        if cursor.rowcount == 0:
            raise LookupError("Долг не найден")


def set_debt_status(debt_id: int, status: str) -> dict[str, Any]:
    if status not in ("active", "closed"):
        raise ValueError("Неизвестный статус")
    with get_conn() as conn:
        cursor = conn.execute("UPDATE debts SET status=? WHERE id=?", (status, debt_id))
        if cursor.rowcount == 0:
            raise LookupError("Долг не найден")
    return get_debt(debt_id)


# ---------------------------------------------------------------- read model

def _load_debts_with_rows():
    with get_conn() as conn:
        debts = [dict(row) for row in conn.execute("SELECT * FROM debts ORDER BY created_at DESC, id DESC")]
        payments = [
            dict(row)
            for row in conn.execute(
                "SELECT id, debt_id, due_date, paid_date, amount, paid_amount, principal_part, "
                "interest_part, balance_after, status, note FROM payments ORDER BY due_date, id"
            )
        ]
    grouped: dict[int, list[dict[str, Any]]] = {}
    for payment in payments:
        grouped.setdefault(payment["debt_id"], []).append(payment)
    return debts, grouped


def _decorate_debt(debt: dict[str, Any], rows: list[dict[str, Any]], today: date) -> dict[str, Any]:
    paid_rows = [row for row in rows if row["status"] == "paid"]
    pending_rows = [row for row in rows if row["status"] == "pending"]

    paid_amount = money(sum(row["paid_amount"] or 0 for row in paid_rows))
    paid_principal = money(sum(row["principal_part"] or 0 for row in paid_rows))
    pending_amount = money(sum(row["amount"] or 0 for row in pending_rows))
    interest_planned = money(sum(row["interest_part"] or 0 for row in rows))

    total_scheduled = money(paid_amount + pending_amount)
    progress = 0.0 if total_scheduled <= 0 else paid_amount / total_scheduled * 100

    is_active = debt["status"] == "active"
    next_payment = None
    payoff_date = None

    if is_active and pending_rows:
        upcoming = pending_rows[0]
        due = parse_date(upcoming["due_date"])
        next_payment = {
            "payment_id": upcoming["id"],
            "due_date": upcoming["due_date"],
            "amount": money(upcoming["amount"]),
            "days_left": (due - today).days,
            "overdue": due < today,
        }
        payoff_date = max(row["due_date"] for row in pending_rows)

    monthly = 0.0
    if pending_rows:
        monthly = money(sum(row["amount"] for row in pending_rows) / len(pending_rows))

    return {
        **debt,
        "paid_amount": paid_amount,
        "paid_principal": paid_principal,
        "paid_count": len(paid_rows),
        "pending_amount": pending_amount if is_active else 0.0,
        "pending_count": len(pending_rows) if is_active else 0,
        "total_scheduled": total_scheduled,
        "remaining_principal": money(max(debt["principal"] - paid_principal, 0)),
        "remaining_total": pending_amount if is_active else 0.0,
        "progress": round(min(max(progress, 0.0), 100.0), 1),
        "interest_planned": interest_planned,
        "monthly_payment_avg": monthly,
        "next_payment": next_payment,
        "payoff_date": payoff_date,
        "last_paid_date": max((row["paid_date"] for row in paid_rows if row["paid_date"]), default=None),
        "type_label": DEBT_TYPES.get(debt["type"], "Другое"),
    }


def list_debts() -> list[dict[str, Any]]:
    debts, grouped = _load_debts_with_rows()
    today = date.today()
    result = [_decorate_debt(debt, grouped.get(debt["id"], []), today) for debt in debts]

    def sort_key(item: dict[str, Any]):
        active = 0 if item["status"] == "active" else 1
        next_due = item["next_payment"]["due_date"] if item["next_payment"] else "9999-12-31"
        return (active, next_due, item["title"].lower())

    return sorted(result, key=sort_key)


def get_debt(debt_id: int) -> dict[str, Any]:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM debts WHERE id=?", (debt_id,)).fetchone()
        if not row:
            raise LookupError("Долг не найден")
        debts = [dict(row)]
        rows = [
            dict(item)
            for item in conn.execute(
                "SELECT * FROM payments WHERE debt_id=? ORDER BY due_date, id", (debt_id,)
            )
        ]
    debt = _decorate_debt(debts[0], rows, date.today())
    debt["payments"] = rows
    return debt


def get_summary() -> dict[str, Any]:
    debts = list_debts()
    today = date.today()
    active = [debt for debt in debts if debt["status"] == "active"]
    current_month = today.strftime("%Y-%m")

    with get_conn() as conn:
        month_rows = [
            dict(row)
            for row in conn.execute(
                "SELECT p.id, p.due_date, p.amount, p.paid_amount, p.status, d.title, d.color "
                "FROM payments p JOIN debts d ON d.id = p.debt_id "
                "WHERE substr(p.due_date, 1, 7) = ? AND d.status = 'active' "
                "ORDER BY p.due_date, p.id",
                (current_month,),
            )
        ]
        overdue_rows = [
            dict(row)
            for row in conn.execute(
                "SELECT p.id, p.due_date, p.amount, d.id AS debt_id, d.title, d.color "
                "FROM payments p JOIN debts d ON d.id = p.debt_id "
                "WHERE p.status = 'pending' AND p.due_date < ? AND d.status = 'active' "
                "ORDER BY p.due_date, p.id",
                (today.isoformat(),),
            )
        ]
        upcoming_rows = [
            dict(row)
            for row in conn.execute(
                "SELECT p.id, p.due_date, p.amount, d.id AS debt_id, d.title, d.color "
                "FROM payments p JOIN debts d ON d.id = p.debt_id "
                "WHERE p.status = 'pending' AND p.due_date >= ? AND d.status = 'active' "
                "ORDER BY p.due_date, p.id LIMIT 8",
                (today.isoformat(),),
            )
        ]

    for row in overdue_rows:
        row["days_overdue"] = (today - parse_date(row["due_date"])).days
    for row in upcoming_rows:
        row["days_left"] = (parse_date(row["due_date"]) - today).days

    month_due = money(sum(row["amount"] for row in month_rows))
    month_paid = money(sum(row["paid_amount"] or 0 for row in month_rows if row["status"] == "paid"))
    month_paid_count = sum(1 for row in month_rows if row["status"] == "paid")

    next_payment = None
    if overdue_rows:
        first = overdue_rows[0]
        next_payment = {
            "debt_id": first["debt_id"],
            "title": first["title"],
            "due_date": first["due_date"],
            "amount": first["amount"],
            "overdue": True,
            "days_left": (parse_date(first["due_date"]) - today).days,
        }
    elif upcoming_rows:
        first = upcoming_rows[0]
        next_payment = {
            "debt_id": first["debt_id"],
            "title": first["title"],
            "due_date": first["due_date"],
            "amount": first["amount"],
            "overdue": False,
            "days_left": first["days_left"],
        }

    total_paid = money(sum(debt["paid_amount"] for debt in debts))
    paid_count = sum(debt["paid_count"] for debt in debts)
    total_scheduled_active = money(sum(debt["total_scheduled"] for debt in active))
    total_pending = money(sum(debt["pending_amount"] for debt in active))
    progress = 0.0
    if total_scheduled_active > 0:
        progress = (total_scheduled_active - total_pending) / total_scheduled_active * 100

    payoff_date = max((debt["payoff_date"] for debt in active if debt["payoff_date"]), default=None)

    return {
        "active_count": len(active),
        "closed_count": len(debts) - len(active),
        "total_principal": money(sum(debt["principal"] for debt in active)),
        "total_remaining": money(sum(debt["remaining_principal"] for debt in active)),
        "total_pending": total_pending,
        "total_paid": total_paid,
        "paid_count": paid_count,
        "progress": round(progress, 1),
        "monthly_load": money(sum(debt["monthly_payment_avg"] for debt in active)),
        "month_due": month_due,
        "month_paid": month_paid,
        "month_paid_count": month_paid_count,
        "month_count": len(month_rows),
        "month_key": current_month,
        "next_payment": next_payment,
        "overdue_count": len(overdue_rows),
        "overdue_amount": money(sum(row["amount"] for row in overdue_rows)),
        "payoff_date": payoff_date,
        "upcoming": upcoming_rows[:6],
        "currency": get_settings()["currency"],
        "income": get_income_summary(),
    }


def get_schedule_month(month: str) -> dict[str, Any]:
    if not month:
        month = date.today().strftime("%Y-%m")
    try:
        datetime.strptime(month, "%Y-%m")
    except ValueError:
        raise ValueError("Месяц должен быть в формате ГГГГ-ММ")

    with get_conn() as conn:
        rows = [
            dict(row)
            for row in conn.execute(
                "SELECT p.id, p.debt_id, p.due_date, p.paid_date, p.amount, p.paid_amount, "
                "p.status, p.note, d.title, d.creditor, d.color, d.type "
                "FROM payments p JOIN debts d ON d.id = p.debt_id "
                "WHERE substr(p.due_date, 1, 7) = ? AND d.status = 'active' "
                "ORDER BY p.due_date, d.title",
                (month,),
            )
        ]

    today = date.today()
    for row in rows:
        row["overdue"] = row["status"] == "pending" and row["due_date"] < today.isoformat()
        row["type_label"] = DEBT_TYPES.get(row["type"], "Другое")

    planned = money(sum(row["amount"] for row in rows))
    paid = money(sum(row["paid_amount"] or 0 for row in rows if row["status"] == "paid"))

    return {
        "month": month,
        "items": rows,
        "totals": {
            "planned": planned,
            "paid": paid,
            "count": len(rows),
            "paid_count": sum(1 for row in rows if row["status"] == "paid"),
        },
    }


def get_overdue() -> list[dict[str, Any]]:
    today = date.today()
    with get_conn() as conn:
        rows = [
            dict(row)
            for row in conn.execute(
                "SELECT p.id, p.debt_id, p.due_date, p.amount, p.status, d.title, d.creditor, d.color "
                "FROM payments p JOIN debts d ON d.id = p.debt_id "
                "WHERE p.status = 'pending' AND p.due_date < ? AND d.status = 'active' "
                "ORDER BY p.due_date",
                (today.isoformat(),),
            )
        ]
    for row in rows:
        row["days_overdue"] = (today - parse_date(row["due_date"])).days
    return rows


def get_history(debt_id: int | None = None, query: str | None = None, year: int | None = None) -> dict[str, Any]:
    sql = (
        "SELECT p.id, p.debt_id, p.due_date, p.paid_date, p.amount, p.paid_amount, p.status, p.note, "
        "d.title, d.creditor, d.color, d.type "
        "FROM payments p JOIN debts d ON d.id = p.debt_id WHERE p.status = 'paid'"
    )
    params: list[Any] = []
    if debt_id:
        sql += " AND p.debt_id = ?"
        params.append(debt_id)
    if query:
        sql += " AND (d.title LIKE ? OR d.creditor LIKE ?)"
        like = f"%{query.strip()}%"
        params.extend([like, like])
    if year:
        sql += " AND substr(COALESCE(p.paid_date, p.due_date), 1, 4) = ?"
        params.append(str(year))
    sql += " ORDER BY COALESCE(p.paid_date, p.due_date) DESC, p.id DESC"

    with get_conn() as conn:
        rows = [dict(row) for row in conn.execute(sql, params)]
        years = [
            row[0][:4]
            for row in conn.execute(
                "SELECT DISTINCT substr(COALESCE(paid_date, due_date), 1, 4) FROM payments "
                "WHERE status='paid' ORDER BY 1 DESC"
            )
            if row[0]
        ]

    for row in rows:
        row["type_label"] = DEBT_TYPES.get(row["type"], "Другое")

    return {
        "items": rows,
        "total": money(sum(row["paid_amount"] or 0 for row in rows)),
        "count": len(rows),
        "years": years,
    }


def get_analytics() -> dict[str, Any]:
    debts = list_debts()
    active = [debt for debt in debts if debt["status"] == "active"]
    active_ids = {debt["id"] for debt in active}

    debts_rows, grouped = _load_debts_with_rows()
    today = date.today()
    current_first = date(today.year, today.month, 1)

    # --- planned vs actual for the last 6 and next 7 months
    flow_months = [add_months(current_first, offset) for offset in range(-5, 8)]
    flow_keys = [month.strftime("%Y-%m") for month in flow_months]
    flow_map = {
        key: {"month": key, "planned": 0.0, "paid": 0.0, "count": 0, "paid_count": 0}
        for key in flow_keys
    }

    # --- balance forecast across the whole schedule
    all_due_dates: list[date] = []
    scheduled: dict[int, list[dict[str, Any]]] = {}

    for debt in debts_rows:
        if debt["id"] not in active_ids:
            continue
        rows = sorted(grouped.get(debt["id"], []), key=lambda row: row["due_date"])
        scheduled[debt["id"]] = rows
        for row in rows:
            due = parse_date(row["due_date"])
            all_due_dates.append(due)
            key = due.strftime("%Y-%m")
            if key in flow_map:
                flow_map[key]["planned"] += row["amount"]
                flow_map[key]["count"] += 1
                if row["status"] == "paid":
                    flow_map[key]["paid"] += row["paid_amount"] or 0
                    flow_map[key]["paid_count"] += 1

    for item in flow_map.values():
        item["planned"] = money(item["planned"])
        item["paid"] = money(item["paid"])

    balance_series: list[dict[str, Any]] = []
    if all_due_dates:
        first_due = min(all_due_dates)
        last_due = max(all_due_dates)
        start = min(add_months(current_first, -6), date(first_due.year, first_due.month, 1))
        if start < add_months(current_first, -6):
            start = add_months(current_first, -6)
        end = date(last_due.year, last_due.month, 1)

        months: list[date] = []
        cursor = start
        while cursor <= end and len(months) < 600:
            months.append(cursor)
            cursor = add_months(cursor, 1)

        if len(months) > 42:
            step = (len(months) - 1) / 41.0
            indexes = sorted({int(round(i * step)) for i in range(42)} | {len(months) - 1})
            months = [months[index] for index in indexes]

        for month in months:
            cutoff = month_end(month.year, month.month).isoformat()
            total = 0.0
            for debt_id, rows in scheduled.items():
                past = [row for row in rows if row["due_date"] <= cutoff]
                if past:
                    total += past[-1]["balance_after"]
                elif rows:
                    total += rows[0]["balance_after"] + rows[0]["principal_part"]
            balance_series.append(
                {
                    "month": month.strftime("%Y-%m"),
                    "label": month.strftime("%m.%Y"),
                    "total": money(total),
                }
            )

    # --- structure
    by_debt = [
        {
            "id": debt["id"],
            "title": debt["title"],
            "color": debt["color"],
            "remaining": debt["remaining_principal"],
            "paid": debt["paid_amount"],
            "principal": debt["principal"],
        }
        for debt in active
    ]
    by_debt.sort(key=lambda item: item["remaining"], reverse=True)
    by_type_map: dict[str, dict[str, Any]] = {}
    for debt in active:
        entry = by_type_map.setdefault(
            debt["type"],
            {"type": debt["type"], "label": DEBT_TYPES.get(debt["type"], "Другое"), "remaining": 0.0},
        )
        entry["remaining"] += debt["remaining_principal"]
    by_type = sorted(by_type_map.values(), key=lambda item: item["remaining"], reverse=True)
    for item in by_type:
        item["remaining"] = money(item["remaining"])

    # --- totals
    all_rows = [row for debt_id in active_ids for row in grouped.get(debt_id, [])]
    interest_planned = money(sum(row["interest_part"] for row in all_rows))
    interest_paid = money(
        sum(row["interest_part"] for row in all_rows if row["status"] == "paid")
    )
    principal_paid = money(
        sum(row["principal_part"] for row in all_rows if row["status"] == "paid")
    )

    debt_table = [
        {
            "id": debt["id"],
            "title": debt["title"],
            "creditor": debt["creditor"],
            "color": debt["color"],
            "type_label": debt["type_label"],
            "principal": debt["principal"],
            "rate": debt["rate"],
            "monthly": debt["monthly_payment_avg"],
            "paid": debt["paid_amount"],
            "remaining": debt["remaining_principal"],
            "interest": debt["interest_planned"],
            "payoff_date": debt["payoff_date"],
            "status": debt["status"],
        }
        for debt in debts
    ]

    return {
        "flow": [flow_map[key] for key in flow_keys],
        "balance_series": balance_series,
        "by_debt": by_debt,
        "by_type": by_type,
        "totals": {
            "principal": money(sum(debt["principal"] for debt in active)),
            "remaining": money(sum(debt["remaining_principal"] for debt in active)),
            "paid": money(sum(debt["paid_amount"] for debt in active)),
            "interest_planned": interest_planned,
            "interest_paid": interest_paid,
            "principal_paid": principal_paid,
            "pending": money(sum(debt["pending_amount"] for debt in active)),
        },
        "debt_table": debt_table,
        "currency": get_settings()["currency"],
    }


# ---------------------------------------------------------------- payments

def pay_payment(payment_id: int, paid_date: str | None = None, amount: float | None = None,
                note: str | None = None) -> dict[str, Any]:
    when = parse_date(paid_date, "Дата оплаты") if paid_date else date.today()

    with get_conn() as conn:
        row = conn.execute("SELECT * FROM payments WHERE id=?", (payment_id,)).fetchone()
        if not row:
            raise LookupError("Платёж не найден")
        if row["status"] == "paid":
            raise ValueError("Платёж уже отмечен как оплаченный")

        planned = money(row["amount"])
        actual = money(amount) if amount not in (None, "") else planned
        if actual <= 0:
            raise ValueError("Сумма платежа должна быть больше нуля")

        conn.execute(
            "UPDATE payments SET status='paid', paid_date=?, paid_amount=?, note=? WHERE id=?",
            (when.isoformat(), actual, (note or "").strip()[:500], payment_id),
        )

    return {"id": payment_id, "status": "paid", "paid_date": when.isoformat(), "paid_amount": actual}


def undo_payment(payment_id: int) -> dict[str, Any]:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM payments WHERE id=?", (payment_id,)).fetchone()
        if not row:
            raise LookupError("Платёж не найден")
        if row["status"] != "paid":
            raise ValueError("Платёж ещё не оплачен")
        conn.execute(
            "UPDATE payments SET status='pending', paid_date=NULL, paid_amount=NULL, note='' WHERE id=?",
            (payment_id,),
        )
    return {"id": payment_id, "status": "pending"}


# ---------------------------------------------------------------- incomes

def _source_days(value: Any) -> list[int]:
    if isinstance(value, (list, tuple, set)):
        raw = list(value)
    else:
        raw = re.split(r"[\s,;]+", str(value or ""))
    days: set[int] = set()
    for item in raw:
        text = str(item).strip()
        if not text:
            continue
        try:
            day = int(text)
        except (TypeError, ValueError):
            raise ValueError("Дни выплат должны быть числами от 1 до 31")
        if day < 1 or day > 31:
            raise ValueError("День выплаты должен быть от 1 до 31")
        days.add(day)
    if not days:
        raise ValueError("Укажите хотя бы один день выплаты")
    return sorted(days)


def _days_label(days: Iterable[int]) -> str:
    return ", ".join(str(day) for day in days)


def _days_in_month(days: Iterable[int], year: int, month: int) -> list[int]:
    last_day = calendar.monthrange(year, month)[1]
    return sorted({min(day, last_day) for day in days})


def _next_source_date(days: list[int], after: date) -> date | None:
    cursor = date(after.year, after.month, 1)
    for _ in range(24):
        for day in _days_in_month(days, cursor.year, cursor.month):
            candidate = cursor.replace(day=day)
            if candidate > after:
                return candidate
        cursor = add_months(cursor, 1)
    return None


def _decorate_income_source(row: sqlite3.Row | dict[str, Any], today: date) -> dict[str, Any]:
    source = dict(row)
    days = _source_days(source.get("days"))
    source["days"] = days
    source["days_label"] = _days_label(days)
    source["kind_label"] = INCOME_KINDS.get(source.get("kind"), "Доход")
    source["active"] = bool(source.get("active"))
    next_date = _next_source_date(days, today) if source["active"] else None
    source["next_date"] = iso(next_date)
    return source


def _clean_income_source_payload(
    data: dict[str, Any], existing: dict[str, Any] | None = None
) -> dict[str, Any]:
    base = existing or {}

    def pick(key: str) -> Any:
        return data[key] if key in data else base.get(key)

    name = str(pick("name") or "").strip()
    if not name:
        raise ValueError("Укажите название дохода")
    if len(name) > 120:
        raise ValueError("Название слишком длинное (максимум 120 символов)")

    kind = str(pick("kind") or "salary")
    if kind not in INCOME_KINDS:
        raise ValueError("Неизвестный тип дохода")

    days = _source_days(pick("days"))

    raw_expected = pick("expected_amount")
    expected_amount = None
    if raw_expected not in (None, "", 0, "0"):
        try:
            expected_amount = money(float(raw_expected))
        except (TypeError, ValueError):
            raise ValueError("Ожидаемая сумма должна быть числом")
        if expected_amount < 0:
            raise ValueError("Ожидаемая сумма не может быть отрицательной")

    active_raw = pick("active")
    active = True if active_raw is None else str(active_raw).lower() not in ("0", "false", "off", "no")
    color = str(pick("color") or INCOME_COLORS.get(kind, "#34d399"))
    if not (color.startswith("#") and len(color) in (4, 7)):
        color = INCOME_COLORS.get(kind, "#34d399")
    notes = str(pick("notes") or "").strip()[:2000]

    return {
        "name": name,
        "kind": kind,
        "days": ",".join(str(day) for day in days),
        "expected_amount": expected_amount,
        "color": color,
        "active": 1 if active else 0,
        "notes": notes,
    }


def list_income_sources() -> list[dict[str, Any]]:
    with get_conn() as conn:
        rows = [
            dict(row)
            for row in conn.execute(
                "SELECT * FROM income_sources ORDER BY active DESC, name COLLATE NOCASE, id"
            )
        ]
    today = date.today()
    return [_decorate_income_source(row, today) for row in rows]


def create_income_source(data: dict[str, Any]) -> dict[str, Any]:
    payload = _clean_income_source_payload(data)
    with get_conn() as conn:
        cursor = conn.execute(
            "INSERT INTO income_sources(name, kind, days, expected_amount, color, active, notes) "
            "VALUES(?, ?, ?, ?, ?, ?, ?)",
            (
                payload["name"],
                payload["kind"],
                payload["days"],
                payload["expected_amount"],
                payload["color"],
                payload["active"],
                payload["notes"],
            ),
        )
        source_id = int(cursor.lastrowid)
    return get_income_source(source_id)


def update_income_source(source_id: int, data: dict[str, Any]) -> dict[str, Any]:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM income_sources WHERE id=?", (source_id,)).fetchone()
        if not row:
            raise LookupError("Источник дохода не найден")
        payload = _clean_income_source_payload(data, dict(row))
        conn.execute(
            "UPDATE income_sources SET name=?, kind=?, days=?, expected_amount=?, color=?, "
            "active=?, notes=? WHERE id=?",
            (
                payload["name"],
                payload["kind"],
                payload["days"],
                payload["expected_amount"],
                payload["color"],
                payload["active"],
                payload["notes"],
                source_id,
            ),
        )
    return get_income_source(source_id)


def get_income_source(source_id: int) -> dict[str, Any]:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM income_sources WHERE id=?", (source_id,)).fetchone()
    if not row:
        raise LookupError("Источник дохода не найден")
    return _decorate_income_source(row, date.today())


def delete_income_source(source_id: int) -> None:
    with get_conn() as conn:
        cursor = conn.execute("DELETE FROM income_sources WHERE id=?", (source_id,))
        if cursor.rowcount == 0:
            raise LookupError("Источник дохода не найден")


def _reminder_item(source: dict[str, Any], when: date, today: date) -> dict[str, Any]:
    return {
        "source_id": source["id"],
        "name": source["name"],
        "kind": source.get("kind", "other"),
        "kind_label": INCOME_KINDS.get(source.get("kind"), "Доход"),
        "color": source.get("color", INCOME_COLORS["other"]),
        "expected_amount": source.get("expected_amount"),
        "date": iso(when),
        "day": when.day,
        "days_ago": (today - when).days,
    }


def get_income_reminders() -> dict[str, Any]:
    today = date.today()
    with get_conn() as conn:
        sources = [
            dict(row)
            for row in conn.execute("SELECT * FROM income_sources WHERE active=1 ORDER BY name")
        ]
        receipts = [
            (int(row["source_id"]), row["received_date"])
            for row in conn.execute(
                "SELECT source_id, received_date FROM income_receipts WHERE source_id IS NOT NULL"
            )
        ]
        received = set(receipts)
        latest_receipt: dict[int, str] = {}
        for source_id, received_date in receipts:
            if received_date <= today.isoformat():
                latest_receipt[source_id] = max(latest_receipt.get(source_id, ""), received_date)

    today_items: list[dict[str, Any]] = []
    missed: list[dict[str, Any]] = []
    next_candidates: list[tuple[date, dict[str, Any]]] = []
    seen_today: set[int] = set()

    for source in sources:
        days = _source_days(source.get("days"))
        if today.day in _days_in_month(days, today.year, today.month):
            if source["id"] not in seen_today and (source["id"], today.isoformat()) not in received:
                today_items.append(_reminder_item(source, today, today))
                seen_today.add(source["id"])

        for offset in range(1, 8):
            when = today - timedelta(days=offset)
            if when.day not in _days_in_month(days, when.year, when.month):
                continue
            if (source["id"], when.isoformat()) in received:
                continue
            if latest_receipt.get(source["id"], "") >= when.isoformat():
                continue
            missed.append(_reminder_item(source, when, today))

        next_date = _next_source_date(days, today)
        if next_date:
            next_candidates.append((next_date, source))

    missed.sort(key=lambda item: item["date"], reverse=True)
    missed = missed[:6]

    next_payload = None
    if next_candidates:
        nearest = min(item[0] for item in next_candidates)
        next_sources = [
            {
                "source_id": source["id"],
                "name": source["name"],
                "kind": source.get("kind", "other"),
                "kind_label": INCOME_KINDS.get(source.get("kind"), "Доход"),
                "color": source.get("color", INCOME_COLORS["other"]),
                "expected_amount": source.get("expected_amount"),
            }
            for when, source in next_candidates
            if when == nearest
        ]
        next_payload = {"date": nearest.isoformat(), "sources": next_sources}

    return {"today": today_items, "missed": missed, "next": next_payload}


def get_income_summary() -> dict[str, Any]:
    today = date.today()
    current_month = today.strftime("%Y-%m")
    with get_conn() as conn:
        total = conn.execute(
            "SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS amount FROM income_receipts"
        ).fetchone()
        month = conn.execute(
            "SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS amount "
            "FROM income_receipts WHERE substr(received_date, 1, 7)=?",
            (current_month,),
        ).fetchone()
        allocations = [
            dict(row)
            for row in conn.execute(
                "SELECT kind, status, COALESCE(SUM(amount), 0) AS amount "
                "FROM income_allocations GROUP BY kind, status"
            )
        ]
        month_allocated = conn.execute(
            "SELECT COALESCE(SUM(a.amount), 0) AS amount FROM income_allocations a "
            "JOIN income_receipts r ON r.id=a.receipt_id "
            "WHERE substr(r.received_date, 1, 7)=?",
            (current_month,),
        ).fetchone()["amount"]
        source_count = conn.execute(
            "SELECT COUNT(*) AS total, COALESCE(SUM(active), 0) AS active FROM income_sources"
        ).fetchone()

    total_received = money(total["amount"])
    total_allocated = money(sum(row["amount"] for row in allocations))
    planned_payments = money(
        sum(row["amount"] for row in allocations if row["kind"] == "payment" and row["status"] == "planned")
    )
    planned_early = money(
        sum(row["amount"] for row in allocations if row["kind"] == "early" and row["status"] == "planned")
    )
    month_received = money(month["amount"])
    month_allocated = money(month_allocated)
    reminders = get_income_reminders()

    return {
        "month_received": month_received,
        "month_count": int(month["count"]),
        "month_allocated": month_allocated,
        "month_free": money(month_received - month_allocated),
        "total_received": total_received,
        "total_allocated": total_allocated,
        "free": money(total_received - total_allocated),
        "reserved_payments": planned_payments,
        "planned_early": planned_early,
        "source_count": int(source_count["total"]),
        "active_sources": int(source_count["active"]),
        "reminders": reminders,
        "next_income": reminders.get("next"),
        "currency": get_settings()["currency"],
    }


def _income_amount(value: Any) -> float:
    try:
        amount = money(float(value))
    except (TypeError, ValueError):
        raise ValueError("Сумма поступления должна быть числом")
    if amount <= 0:
        raise ValueError("Сумма поступления должна быть больше нуля")
    return amount


def _allocate_mandatory_priority(
    needs: list[dict[str, Any]], budget: float
) -> list[dict[str, Any]]:
    allocations: list[dict[str, Any]] = []
    left = money(budget)
    for item in needs:
        if left <= 0.005:
            break
        take = money(min(item["need"], left))
        if take <= 0:
            continue
        allocations.append({**item, "amount": take})
        left = money(left - take)
    return allocations


def _spread_proportional(
    needs: list[dict[str, Any]], budget: float
) -> list[dict[str, Any]]:
    """Spread the budget across payments so each gets the same percentage of its need."""
    if not needs or budget <= 0.005:
        return []
    total_need = money(sum(item["need"] for item in needs))
    if total_need <= 0.005:
        return []
    if budget >= total_need - 0.005:
        return [{**item, "amount": item["need"]} for item in needs]

    budget_cents = int(round(money(budget) * 100))
    need_cents = [int(round(item["need"] * 100)) for item in needs]
    total_cents = sum(need_cents)
    shares: list[int] = []
    remainders: list[tuple[int, int]] = []
    allocated = 0
    for index, cents in enumerate(need_cents):
        numerator = budget_cents * cents
        share = numerator // total_cents
        shares.append(share)
        remainders.append((numerator % total_cents, index))
        allocated += share

    leftover = budget_cents - allocated
    for _, index in sorted(remainders, key=lambda pair: (-pair[0], pair[1])):
        if leftover <= 0:
            break
        if shares[index] < need_cents[index]:
            shares[index] += 1
            leftover -= 1
    if leftover > 0:
        for index, cents in enumerate(need_cents):
            if leftover <= 0:
                break
            add = min(cents - shares[index], leftover)
            shares[index] += add
            leftover -= add

    return [
        {**item, "amount": shares[index] / 100.0}
        for index, item in enumerate(needs)
        if shares[index] > 0
    ]


def _allocate_mandatory_proportional(
    needs: list[dict[str, Any]], budget: float
) -> list[dict[str, Any]]:
    """Fund already-started payments first, then spread the rest proportionally."""
    carryover = [item for item in needs if money(item.get("reserved", 0)) > 0.005]
    fresh = [item for item in needs if money(item.get("reserved", 0)) <= 0.005]
    allocations = _spread_proportional(carryover, budget)
    used = money(sum(item["amount"] for item in allocations))
    allocations += _spread_proportional(fresh, money(budget - used))
    return sorted(allocations, key=lambda item: (item["due_date"], item["payment_id"]))


def _build_income_plan(
    conn: sqlite3.Connection,
    amount: float,
    on_date: date,
    early_amount: Any = None,
    mandatory_amount: Any = None,
    mandatory_mode: Any = None,
) -> dict[str, Any]:
    mode = str(mandatory_mode or DEFAULT_MANDATORY_MODE).strip().lower()
    if mode not in MANDATORY_MODES:
        raise ValueError("Неизвестный способ распределения обязательных платежей")

    horizon = on_date + timedelta(days=INCOME_HORIZON_DAYS)
    reserved: dict[tuple[int, str], float] = {}
    for row in conn.execute(
        "SELECT debt_id, due_date, COALESCE(SUM(amount), 0) AS amount "
        "FROM income_allocations WHERE kind='payment' GROUP BY debt_id, due_date"
    ):
        if row["debt_id"] is None or not row["due_date"]:
            continue
        reserved[(int(row["debt_id"]), row["due_date"])] = money(row["amount"])

    payments = [
        dict(row)
        for row in conn.execute(
            "SELECT p.id, p.debt_id, p.due_date, p.amount, d.title, d.color, d.rate "
            "FROM payments p JOIN debts d ON d.id=p.debt_id "
            "WHERE p.status='pending' AND d.status='active' AND p.due_date <= ? "
            "ORDER BY p.due_date, p.id",
            (horizon.isoformat(),),
        )
    ]

    needs: list[dict[str, Any]] = []
    for payment in payments:
        already = min(money(reserved.get((payment["debt_id"], payment["due_date"]), 0)), money(payment["amount"]))
        need = money(max(0, payment["amount"] - already))
        if need <= 0.005:
            continue
        needs.append(
            {
                "payment_id": payment["id"],
                "debt_id": payment["debt_id"],
                "title": payment["title"],
                "color": payment["color"],
                "rate": payment["rate"],
                "due_date": payment["due_date"],
                "need": need,
                "reserved": already,
                "overdue": payment["due_date"] < on_date.isoformat(),
                "days_left": (parse_date(payment["due_date"]) - on_date).days,
            }
        )
    mandatory_need_total = money(sum(item["need"] for item in needs))
    carryover_need_total = money(
        sum(item["need"] for item in needs if money(item.get("reserved", 0)) > 0.005)
    )
    recommended_mandatory = (
        carryover_need_total if carryover_need_total > 0.005 else mandatory_need_total
    )

    requested_mandatory = recommended_mandatory
    if mandatory_amount not in (None, ""):
        try:
            requested_mandatory = money(float(mandatory_amount))
        except (TypeError, ValueError):
            raise ValueError("Сумма на обязательные платежи должна быть числом")
        if requested_mandatory < 0:
            raise ValueError("Сумма на обязательные платежи не может быть отрицательной")
        requested_mandatory = money(min(requested_mandatory, mandatory_need_total))

    budget = money(min(requested_mandatory, amount, mandatory_need_total))
    if mode == "priority":
        mandatory = _allocate_mandatory_priority(needs, budget)
    else:
        mandatory = _allocate_mandatory_proportional(needs, budget)
    mandatory_total = money(sum(item["amount"] for item in mandatory))
    available = money(amount - mandatory_total)

    covered = {item["payment_id"]: item["amount"] for item in mandatory}
    deferred: list[dict[str, Any]] = []
    for item in needs:
        left = money(max(0, item["need"] - covered.get(item["payment_id"], 0)))
        if left <= 0.005:
            continue
        deferred.append({**item, "amount": left})
    deferred_total = money(sum(item["amount"] for item in deferred))

    debts = [
        dict(row)
        for row in conn.execute(
            "SELECT d.id, d.title, d.rate, d.color, d.principal, "
            "COALESCE((SELECT SUM(p.principal_part) FROM payments p "
            "WHERE p.debt_id=d.id AND p.status='paid'), 0) AS paid_principal "
            "FROM debts d WHERE d.status='active'"
        )
    ]
    debt_targets = []
    for debt in debts:
        remaining_principal = money(debt["principal"] - debt["paid_principal"])
        if remaining_principal > 0.005:
            debt_targets.append({**debt, "remaining": remaining_principal})
    debt_targets.sort(key=lambda item: (-item["rate"], item["remaining"], item["id"]))
    total_debt_remaining = money(sum(item["remaining"] for item in debt_targets))
    recommended_early = money(min(available, total_debt_remaining))

    requested = recommended_early
    if early_amount not in (None, ""):
        try:
            requested = money(float(early_amount))
        except (TypeError, ValueError):
            raise ValueError("Сумма досрочного погашения должна быть числом")
        if requested < 0:
            raise ValueError("Сумма досрочного погашения не может быть отрицательной")
        if requested > available + 0.005:
            raise ValueError("Досрочное погашение больше свободного остатка после обязательных платежей")
        requested = money(min(requested, available))

    early: list[dict[str, Any]] = []
    left = requested
    for debt in debt_targets:
        if left <= 0.005:
            break
        take = money(min(left, debt["remaining"]))
        if take <= 0:
            continue
        early.append(
            {
                "debt_id": debt["id"],
                "title": debt["title"],
                "rate": debt["rate"],
                "color": debt["color"],
                "remaining": debt["remaining"],
                "amount": take,
                "full_payoff": take >= debt["remaining"] - 0.005,
            }
        )
        left = money(left - take)

    early_total = money(requested - left)
    free = money(available - early_total)

    return {
        "on_date": on_date.isoformat(),
        "horizon_date": horizon.isoformat(),
        "amount": amount,
        "mandatory": mandatory,
        "mandatory_total": mandatory_total,
        "mandatory_need_total": mandatory_need_total,
        "mandatory_recommended": recommended_mandatory,
        "mandatory_requested": requested_mandatory,
        "mandatory_mode": mode,
        "mandatory_mode_label": MANDATORY_MODES[mode],
        "deferred": deferred,
        "deferred_total": deferred_total,
        "shortfall": money(max(0, recommended_mandatory - amount)),
        "available": available,
        "recommended_early": recommended_early,
        "early_requested": requested,
        "early": early,
        "early_total": early_total,
        "free": free,
        "total_debt_remaining": total_debt_remaining,
    }


def plan_income(data: dict[str, Any]) -> dict[str, Any]:
    amount = _income_amount(data.get("amount"))
    on_date = parse_date(data.get("received_date") or date.today(), "Дата поступления")
    with get_conn() as conn:
        return _build_income_plan(
            conn,
            amount,
            on_date,
            data.get("early_amount"),
            data.get("mandatory_amount"),
            data.get("mandatory_mode"),
        )


def create_income_receipt(data: dict[str, Any]) -> dict[str, Any]:
    amount = _income_amount(data.get("amount"))
    on_date = parse_date(data.get("received_date") or date.today(), "Дата поступления")
    note = str(data.get("note") or "").strip()[:500]
    raw_source = data.get("source_id")
    source_id = None
    if raw_source not in (None, "", "none", "null", 0, "0"):
        try:
            source_id = int(raw_source)
        except (TypeError, ValueError):
            raise ValueError("Некорректный источник дохода")

    with get_conn() as conn:
        source = None
        if source_id is not None:
            source = conn.execute("SELECT * FROM income_sources WHERE id=?", (source_id,)).fetchone()
            if not source:
                raise LookupError("Источник дохода не найден")
            duplicate = conn.execute(
                "SELECT 1 FROM income_receipts WHERE source_id=? AND received_date=?",
                (source_id, on_date.isoformat()),
            ).fetchone()
            if duplicate:
                raise ValueError("Поступление от этого источника уже добавлено на эту дату")

        source_name = (
            source["name"] if source else str(data.get("source_name") or "Разовое поступление").strip()[:120]
        )
        plan = _build_income_plan(
            conn,
            amount,
            on_date,
            data.get("early_amount"),
            data.get("mandatory_amount"),
            data.get("mandatory_mode"),
        )
        cursor = conn.execute(
            "INSERT INTO income_receipts(source_id, source_name, received_date, amount, note) "
            "VALUES(?, ?, ?, ?, ?)",
            (source_id, source_name, on_date.isoformat(), amount, note),
        )
        receipt_id = int(cursor.lastrowid)

        for item in plan["mandatory"]:
            conn.execute(
                "INSERT INTO income_allocations(receipt_id, kind, debt_id, due_date, label, amount) "
                "VALUES(?, 'payment', ?, ?, ?, ?)",
                (receipt_id, item["debt_id"], item["due_date"], item["title"], item["amount"]),
            )
        for item in plan["early"]:
            conn.execute(
                "INSERT INTO income_allocations(receipt_id, kind, debt_id, due_date, label, amount) "
                "VALUES(?, 'early', ?, NULL, ?, ?)",
                (receipt_id, item["debt_id"], item["title"], item["amount"]),
            )

    return get_income_receipt(receipt_id)


def get_income_receipt(receipt_id: int) -> dict[str, Any]:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT r.*, s.kind AS source_kind FROM income_receipts r "
            "LEFT JOIN income_sources s ON s.id=r.source_id WHERE r.id=?",
            (receipt_id,),
        ).fetchone()
        if not row:
            raise LookupError("Поступление не найдено")
        allocations = [
            dict(item)
            for item in conn.execute(
                "SELECT * FROM income_allocations WHERE receipt_id=? ORDER BY id",
                (receipt_id,),
            )
        ]

    receipt = dict(row)
    payment_total = money(sum(item["amount"] for item in allocations if item["kind"] == "payment"))
    early_total = money(sum(item["amount"] for item in allocations if item["kind"] == "early"))
    receipt.update(
        {
            "source_kind_label": INCOME_KINDS.get(row["source_kind"], "Доход"),
            "allocations": allocations,
            "payment_total": payment_total,
            "early_total": early_total,
            "free": money(receipt["amount"] - payment_total - early_total),
        }
    )
    return receipt


def list_income_receipts(limit: int = 60) -> list[dict[str, Any]]:
    with get_conn() as conn:
        receipts = [
            dict(row)
            for row in conn.execute(
                "SELECT r.*, s.kind AS source_kind FROM income_receipts r "
                "LEFT JOIN income_sources s ON s.id=r.source_id "
                "ORDER BY r.received_date DESC, r.id DESC LIMIT ?",
                (limit,),
            )
        ]
        allocations = [
            dict(item)
            for item in conn.execute(
                "SELECT * FROM income_allocations ORDER BY id"
            )
        ]

    grouped: dict[int, list[dict[str, Any]]] = {}
    for item in allocations:
        grouped.setdefault(item["receipt_id"], []).append(item)

    for receipt in receipts:
        items = grouped.get(receipt["id"], [])
        payment_total = money(sum(item["amount"] for item in items if item["kind"] == "payment"))
        early_total = money(sum(item["amount"] for item in items if item["kind"] == "early"))
        receipt.update(
            {
                "source_kind_label": INCOME_KINDS.get(receipt.get("source_kind"), "Доход"),
                "payment_total": payment_total,
                "early_total": early_total,
                "free": money(receipt["amount"] - payment_total - early_total),
                "allocation_count": len(items),
            }
        )
    return receipts


def delete_income_receipt(receipt_id: int) -> None:
    with get_conn() as conn:
        cursor = conn.execute("DELETE FROM income_receipts WHERE id=?", (receipt_id,))
        if cursor.rowcount == 0:
            raise LookupError("Поступление не найдено")


def get_incomes_page() -> dict[str, Any]:
    return {
        "sources": list_income_sources(),
        "receipts": list_income_receipts(),
        "summary": get_income_summary(),
        "reminders": get_income_reminders(),
        "kinds": INCOME_KINDS,
    }


# ---------------------------------------------------------------- data tools

def export_data() -> dict[str, Any]:
    with get_conn() as conn:
        debts = [dict(row) for row in conn.execute("SELECT * FROM debts ORDER BY id")]
        payments = [dict(row) for row in conn.execute("SELECT * FROM payments ORDER BY id")]
        settings = {row["key"]: row["value"] for row in conn.execute("SELECT * FROM settings")}
        income_sources = [dict(row) for row in conn.execute("SELECT * FROM income_sources ORDER BY id")]
        income_receipts = [dict(row) for row in conn.execute("SELECT * FROM income_receipts ORDER BY id")]
        income_allocations = [
            dict(row) for row in conn.execute("SELECT * FROM income_allocations ORDER BY id")
        ]
    return {
        "app": "debt-tracker",
        "version": 2,
        "exported_at": datetime.now().isoformat(timespec="seconds"),
        "debts": debts,
        "payments": payments,
        "income_sources": income_sources,
        "income_receipts": income_receipts,
        "income_allocations": income_allocations,
        "settings": settings,
    }


def import_data(data: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(data, dict) or data.get("app") != "debt-tracker":
        raise ValueError("Это не файл резервной копии приложения")
    debts = data.get("debts")
    payments = data.get("payments")
    if not isinstance(debts, list) or not isinstance(payments, list):
        raise ValueError("Повреждённый файл резервной копии")
    income_sources = data.get("income_sources", [])
    income_receipts = data.get("income_receipts", [])
    income_allocations = data.get("income_allocations", [])
    if not all(
        isinstance(items, list)
        for items in (income_sources, income_receipts, income_allocations)
    ):
        raise ValueError("Повреждённые данные о доходах в резервной копии")

    debt_fields = (
        "id", "title", "creditor", "type", "principal", "rate", "term_months", "start_date",
        "monthly_payment", "color", "notes", "status", "created_at",
    )
    payment_fields = (
        "id", "debt_id", "due_date", "paid_date", "amount", "paid_amount", "principal_part",
        "interest_part", "balance_after", "status", "note", "created_at",
    )
    source_fields = (
        "id", "name", "kind", "days", "expected_amount", "color", "active", "notes", "created_at",
    )
    receipt_fields = (
        "id", "source_id", "source_name", "received_date", "amount", "note", "created_at",
    )
    allocation_fields = (
        "id", "receipt_id", "kind", "debt_id", "due_date", "label", "amount", "status", "created_at",
    )

    with get_conn() as conn:
        conn.execute("DELETE FROM income_allocations")
        conn.execute("DELETE FROM income_receipts")
        conn.execute("DELETE FROM income_sources")
        conn.execute("DELETE FROM payments")
        conn.execute("DELETE FROM debts")
        for debt in debts:
            if not isinstance(debt, dict) or not debt.get("id"):
                raise ValueError("Повреждённая запись долга")
            values = [debt.get(field) for field in debt_fields]
            conn.execute(
                f"INSERT INTO debts({', '.join(debt_fields)}) VALUES({', '.join('?' * len(debt_fields))})",
                values,
            )
        for payment in payments:
            if not isinstance(payment, dict) or not payment.get("id") or not payment.get("debt_id"):
                raise ValueError("Повреждённая запись платежа")
            values = [payment.get(field) for field in payment_fields]
            conn.execute(
                f"INSERT INTO payments({', '.join(payment_fields)}) "
                f"VALUES({', '.join('?' * len(payment_fields))})",
                values,
            )
        for source in income_sources:
            if not isinstance(source, dict) or not source.get("id") or not source.get("name"):
                raise ValueError("Повреждённая запись источника дохода")
            values = [source.get(field) for field in source_fields]
            conn.execute(
                f"INSERT INTO income_sources({', '.join(source_fields)}) "
                f"VALUES({', '.join('?' * len(source_fields))})",
                values,
            )
        for receipt in income_receipts:
            if not isinstance(receipt, dict) or not receipt.get("id") or not receipt.get("received_date"):
                raise ValueError("Повреждённая запись поступления")
            values = [receipt.get(field) for field in receipt_fields]
            conn.execute(
                f"INSERT INTO income_receipts({', '.join(receipt_fields)}) "
                f"VALUES({', '.join('?' * len(receipt_fields))})",
                values,
            )
        for allocation in income_allocations:
            if not isinstance(allocation, dict) or not allocation.get("id") or not allocation.get("receipt_id"):
                raise ValueError("Повреждённая запись распределения дохода")
            values = [allocation.get(field) for field in allocation_fields]
            conn.execute(
                f"INSERT INTO income_allocations({', '.join(allocation_fields)}) "
                f"VALUES({', '.join('?' * len(allocation_fields))})",
                values,
            )

    return {
        "debts": len(debts),
        "payments": len(payments),
        "income_sources": len(income_sources),
        "income_receipts": len(income_receipts),
        "income_allocations": len(income_allocations),
    }


def _log_backup_error() -> None:
    try:
        paths.ensure_dirs()
        with open(os.path.join(paths.DATA_DIR, "backup-errors.log"), "a", encoding="utf-8") as handle:
            handle.write(f"\n[{datetime.now():%Y-%m-%d %H:%M:%S}]\n")
            handle.write(traceback.format_exc())
    except OSError:
        pass


def _has_data() -> bool:
    with get_conn() as conn:
        for table in ("debts", "payments", "income_sources", "income_receipts"):
            if conn.execute(f"SELECT 1 FROM {table} LIMIT 1").fetchone():
                return True
    return False


def _next_backup_path(kind: str, reason: str | None = None) -> str:
    paths.ensure_dirs()
    stamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S_%f")[:-3]
    prefix = kind if not reason else f"{kind}_{reason}"
    base = os.path.join(paths.BACKUP_DIR, f"{prefix}_{stamp}")
    target = f"{base}.db"
    counter = 2
    while os.path.exists(target):
        target = f"{base}_{counter}.db"
        counter += 1
    return target


def _prune_backups() -> None:
    try:
        names = [
            name for name in os.listdir(paths.BACKUP_DIR)
            if name.endswith(".db")
        ]
    except OSError:
        return
    if len(names) <= BACKUP_KEEP:
        return
    files = [os.path.join(paths.BACKUP_DIR, name) for name in names]
    files.sort(key=lambda path: (os.path.getmtime(path), path), reverse=True)
    for old in files[BACKUP_KEEP:]:
        try:
            os.remove(old)
        except OSError:
            pass


def _create_backup(kind: str, reason: str | None = None, prune: bool = True) -> str:
    with _backup_lock:
        target = _next_backup_path(kind, reason)
        try:
            with get_conn() as source:
                destination = sqlite3.connect(target)
                try:
                    source.backup(destination)
                finally:
                    destination.close()
            if prune:
                _prune_backups()
        except Exception:
            try:
                os.remove(target)
            except OSError:
                pass
            raise
    return target


def backup_database() -> str:
    return _create_backup("manual")


def auto_backup_after_change() -> str | None:
    """Snapshot the database after a successful data change."""
    try:
        if not _has_data():
            return None
        return _create_backup("auto")
    except Exception:
        _log_backup_error()
        return None


def auto_backup_before_change(reason: str) -> str | None:
    """Snapshot the current state before a destructive operation."""
    try:
        if reason not in BACKUP_REASONS or not _has_data():
            return None
        return _create_backup("auto", reason)
    except Exception:
        _log_backup_error()
        return None


def list_backups(limit: int = 100) -> list[dict[str, Any]]:
    paths.ensure_dirs()
    items: list[dict[str, Any]] = []
    try:
        names = os.listdir(paths.BACKUP_DIR)
    except OSError:
        return items
    for name in names:
        if not name.endswith(".db"):
            continue
        path = os.path.join(paths.BACKUP_DIR, name)
        try:
            stat = os.stat(path)
        except OSError:
            continue
        kind = "auto" if name.startswith("auto_") else "manual"
        reason = None
        if kind == "auto":
            match = re.match(r"^auto_(before_(?:import|reset|restore|delete))_", name)
            if match:
                reason = match.group(1)
        items.append(
            {
                "name": name,
                "kind": kind,
                "kind_label": "Авто" if kind == "auto" else "Вручную",
                "reason": reason,
                "reason_label": BACKUP_REASONS.get(reason or "", ""),
                "size": stat.st_size,
                "created_at": datetime.fromtimestamp(stat.st_mtime).isoformat(timespec="seconds"),
            }
        )
    items.sort(key=lambda item: (item["created_at"], item["name"]), reverse=True)
    return items[:limit]


def _backup_file(name: str) -> str:
    raw = str(name or "")
    safe = os.path.basename(raw)
    if safe != raw or "/" in raw or "\\" in raw or not safe.endswith(".db"):
        raise ValueError("Некорректное имя резервной копии")
    path = os.path.join(paths.BACKUP_DIR, safe)
    if not os.path.isfile(path):
        raise LookupError("Резервная копия не найдена")
    return path


def delete_backup(name: str) -> None:
    path = _backup_file(name)
    with _backup_lock:
        try:
            os.remove(path)
        except OSError:
            raise ValueError("Не удалось удалить резервную копию")


def restore_backup(name: str) -> dict[str, Any]:
    path = _backup_file(name)
    with _backup_lock:
        source = sqlite3.connect(path)
        try:
            integrity = source.execute("PRAGMA integrity_check").fetchone()
            if not integrity or integrity[0] != "ok":
                raise ValueError("Резервная копия повреждена")
            tables = {
                row[0]
                for row in source.execute("SELECT name FROM sqlite_master WHERE type='table'")
            }
            if not {"debts", "payments"} <= tables:
                raise ValueError("В резервной копии нет данных приложения")
        finally:
            source.close()

        safety = None
        if _has_data():
            # Не удаляем выбранную копию до того, как она будет прочитана.
            safety = _create_backup("auto", "before_restore", prune=False)

        try:
            source = sqlite3.connect(path)
            destination = sqlite3.connect(paths.DB_PATH, timeout=15)
            try:
                source.backup(destination)
                destination.execute("PRAGMA wal_checkpoint(TRUNCATE)")
            finally:
                destination.close()
                source.close()
        finally:
            _prune_backups()

    init_db()
    with get_conn() as conn:
        counts = {
            "debts": conn.execute("SELECT COUNT(*) FROM debts").fetchone()[0],
            "payments": conn.execute("SELECT COUNT(*) FROM payments").fetchone()[0],
            "income_receipts": conn.execute("SELECT COUNT(*) FROM income_receipts").fetchone()[0],
        }
    return {
        "ok": True,
        "name": name,
        "safety_backup": os.path.basename(safety) if safety else None,
        "counts": counts,
    }


def export_schedule_csv() -> bytes:
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT d.title, d.creditor, p.due_date, p.amount, p.principal_part, p.interest_part, "
            "p.balance_after, p.status, p.paid_date, p.paid_amount "
            "FROM payments p JOIN debts d ON d.id = p.debt_id "
            "ORDER BY p.due_date, d.title"
        ).fetchall()

    buffer = io.StringIO()
    buffer.write("\ufeff")
    writer = csv.writer(buffer, delimiter=";")
    writer.writerow(
        [
            "Долг", "Кредитор", "Дата платежа", "Сумма", "Основной долг", "Проценты",
            "Остаток после платежа", "Статус", "Дата оплаты", "Оплачено",
        ]
    )
    for row in rows:
        writer.writerow(
            [
                row["title"],
                row["creditor"],
                row["due_date"],
                f"{row['amount']:.2f}",
                f"{row['principal_part']:.2f}",
                f"{row['interest_part']:.2f}",
                f"{row['balance_after']:.2f}",
                "Оплачен" if row["status"] == "paid" else "Ожидает",
                row["paid_date"] or "",
                f"{row['paid_amount']:.2f}" if row["paid_amount"] is not None else "",
            ]
        )
    return buffer.getvalue().encode("utf-8")


def seed_demo() -> dict[str, Any]:
    with get_conn() as conn:
        debts_count = conn.execute("SELECT COUNT(*) FROM debts").fetchone()[0]
        incomes_count = conn.execute("SELECT COUNT(*) FROM income_sources").fetchone()[0]
    if debts_count or incomes_count:
        raise ValueError("Демо-данные можно загрузить только в пустую базу")

    today = date.today()

    def months_ago(count_months: int, day: int) -> str:
        target = add_months(today, -count_months)
        day = min(day, calendar.monthrange(target.year, target.month)[1])
        return target.replace(day=day).isoformat()

    demo = [
        {
            "title": "Ипотека на квартиру",
            "creditor": "Сбербанк",
            "type": "mortgage",
            "principal": 3200000,
            "rate": 9.5,
            "term_months": 180,
            "start_date": months_ago(14, 15),
            "color": "#7c5cff",
            "notes": "Ежемесячный платёж списывается 15-го числа.",
        },
        {
            "title": "Автокредит",
            "creditor": "Т-Банк",
            "type": "credit",
            "principal": 850000,
            "rate": 14.9,
            "term_months": 60,
            "start_date": months_ago(8, 5),
            "color": "#22d3ee",
            "notes": "",
        },
        {
            "title": "Рассрочка на технику",
            "creditor": "М.Видео",
            "type": "installment",
            "principal": 120000,
            "rate": 0,
            "term_months": 12,
            "start_date": months_ago(4, 20),
            "color": "#f59e0b",
            "notes": "Без переплаты, 12 равных платежей.",
        },
        {
            "title": "Кредитная карта",
            "creditor": "Альфа-Банк",
            "type": "card",
            "principal": 75000,
            "rate": 24,
            "term_months": 24,
            "start_date": months_ago(2, 10),
            "color": "#f472b6",
            "notes": "Минимальный платёж, стараюсь гасить больше.",
        },
    ]

    created = 0
    for item in demo:
        debt_id = create_debt(item)
        created += 1
        with get_conn() as conn:
            pending = conn.execute(
                "SELECT id, due_date FROM payments WHERE debt_id=? AND due_date < ? AND status='pending'",
                (debt_id, today.isoformat()),
            ).fetchall()
        for row in pending:
            pay_payment(row["id"], paid_date=row["due_date"])

    demo_incomes = [
        {
            "name": "Зарплата",
            "kind": "salary",
            "days": "7,10,12",
            "expected_amount": 65000,
            "color": "#34d399",
            "notes": "Три выплаты в месяц: 7, 10 и 12 числа.",
        },
        {
            "name": "Аванс",
            "kind": "advance",
            "days": "23,25,27",
            "expected_amount": 25000,
            "color": "#22d3ee",
            "notes": "Авансовые выплаты во второй половине месяца.",
        },
    ]
    for item in demo_incomes:
        create_income_source(item)

    return {"debts": created, "income_sources": len(demo_incomes)}


def reset_all() -> None:
    with get_conn() as conn:
        conn.execute("DELETE FROM income_allocations")
        conn.execute("DELETE FROM income_receipts")
        conn.execute("DELETE FROM income_sources")
        conn.execute("DELETE FROM payments")
        conn.execute("DELETE FROM debts")
        conn.execute(
            "DELETE FROM sqlite_sequence WHERE name IN "
            "('debts', 'payments', 'income_sources', 'income_receipts', 'income_allocations')"
        )
