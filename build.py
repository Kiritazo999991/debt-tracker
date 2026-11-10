"""Сборка одностраничного Windows-приложения в один .exe через PyInstaller."""
from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
APP_NAME = "ДолгКонтроль"
ENTRY = ROOT / "app.py"
WEB_DIR = ROOT / "web"
ICON = ROOT / "icon.ico"


def main() -> None:
    os.chdir(ROOT)

    if not ENTRY.is_file():
        sys.exit(f"Не найден файл приложения: {ENTRY}")
    if not WEB_DIR.is_dir():
        sys.exit(f"Не найдена папка интерфейса: {WEB_DIR}")
    if not ICON.is_file():
        sys.exit(f"Не найдена иконка: {ICON}")

    try:
        import PyInstaller  # noqa: F401
    except ImportError:
        sys.exit("PyInstaller не установлен. Выполните: py -m pip install -r requirements-build.txt")

    build_dir = ROOT / "build"
    command = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--noconfirm",
        "--clean",
        "--onefile",
        "--windowed",
        "--name",
        APP_NAME,
        "--icon",
        str(ICON),
        "--add-data",
        f"{WEB_DIR}{os.pathsep}web",
        "--distpath",
        str(ROOT),
        "--workpath",
        str(build_dir),
        "--specpath",
        str(build_dir),
        str(ENTRY),
    ]

    print("Сборка:", subprocess.list2cmdline(command))
    subprocess.run(command, check=True)

    executable = ROOT / f"{APP_NAME}.exe"
    if not executable.is_file():
        sys.exit("Сборка завершилась, но .exe не найден.")

    shutil.rmtree(build_dir, ignore_errors=True)
    size_mb = executable.stat().st_size / (1024 * 1024)
    print(f"\nГотово: {executable} ({size_mb:.1f} МБ)")


if __name__ == "__main__":
    main()
