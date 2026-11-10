"""Filesystem paths that work both from source and from a PyInstaller build."""
import os
import sys

APP_NAME = "Долги — график платежей"
VERSION = "1.4.1"


def base_dir() -> str:
    if getattr(sys, "frozen", False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def resource_dir() -> str:
    return getattr(sys, "_MEIPASS", base_dir())


DATA_DIR = os.path.join(base_dir(), "data")
DB_PATH = os.path.join(DATA_DIR, "debts.db")
BACKUP_DIR = os.path.join(base_dir(), "backups")
WEB_DIR = os.path.join(resource_dir(), "web")


def ensure_dirs() -> None:
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(BACKUP_DIR, exist_ok=True)
