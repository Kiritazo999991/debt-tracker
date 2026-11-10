"""Entry point: local API server + native WebView window."""
from __future__ import annotations

import argparse
import json
import os
import sys
import threading
import traceback
import webbrowser
from datetime import datetime
from http.server import ThreadingHTTPServer

from backend import db, paths
from backend.api import make_handler

_instance_mutex = None


def ensure_single_instance() -> bool:
    """Focus the running window instead of starting a second copy."""
    global _instance_mutex
    try:
        import ctypes
        from ctypes import wintypes

        kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
        kernel32.CreateMutexW.argtypes = [wintypes.LPVOID, wintypes.BOOL, wintypes.LPCWSTR]
        kernel32.CreateMutexW.restype = wintypes.HANDLE
        handle = kernel32.CreateMutexW(None, False, "Local\\DebtControl.SingleInstance")
        if not handle:
            return True
        if ctypes.get_last_error() == 183:  # ERROR_ALREADY_EXISTS
            user32 = ctypes.windll.user32
            hwnd = user32.FindWindowW(None, paths.APP_NAME)
            if hwnd:
                user32.ShowWindow(hwnd, 9)  # SW_RESTORE
                user32.SetForegroundWindow(hwnd)
            else:
                user32.MessageBoxW(
                    None,
                    "Приложение уже запущено. Найдите его окно на панели задач.",
                    paths.APP_NAME,
                    0x40,
                )
            kernel32.CloseHandle(handle)
            return False
        _instance_mutex = handle
    except Exception:
        pass
    return True


class DesktopApi:
    """Native dialogs exposed to the frontend as window.pywebview.api."""

    def __init__(self):
        self._window = None

    def _save_dialog(self, filename):
        import webview

        result = self._window.create_file_dialog(
            webview.FileDialog.SAVE,
            save_filename=filename,
            file_types=("JSON (*.json)", "CSV (*.csv)", "Все файлы (*.*)"),
        )
        if isinstance(result, (list, tuple)):
            result = result[0] if result else None
        return result

    def _open_dialog(self):
        import webview

        result = self._window.create_file_dialog(
            webview.FileDialog.OPEN,
            file_types=("JSON (*.json)", "Все файлы (*.*)"),
        )
        if isinstance(result, (list, tuple)):
            result = result[0] if result else None
        return result

    def save_backup(self):
        try:
            target = self._save_dialog(f"debts-backup-{datetime.now():%Y-%m-%d}.json")
            if not target:
                return {"cancelled": True}
            content = json.dumps(db.export_data(), ensure_ascii=False, indent=2)
            with open(target, "w", encoding="utf-8") as handle:
                handle.write(content)
            return {"path": target}
        except Exception as error:
            return {"error": str(error)}

    def save_csv(self):
        try:
            target = self._save_dialog("payment-schedule.csv")
            if not target:
                return {"cancelled": True}
            with open(target, "wb") as handle:
                handle.write(db.export_schedule_csv())
            return {"path": target}
        except Exception as error:
            return {"error": str(error)}

    def import_backup(self):
        try:
            source = self._open_dialog()
            if not source:
                return {"cancelled": True}
            with open(source, "r", encoding="utf-8-sig") as handle:
                data = json.load(handle)
            db.auto_backup_before_change("before_import")
            counts = db.import_data(data)
            db.auto_backup_after_change()
            return {"counts": counts}
        except Exception as error:
            return {"error": str(error)}

    def open_folder(self):
        try:
            os.startfile(paths.base_dir())
            return {"ok": True}
        except Exception as error:
            return {"error": str(error)}

    def set_titlebar(self, theme: str = "dark"):
        """Match the native Windows title bar to the app theme."""
        try:
            import ctypes

            native = getattr(self._window, "native", None)
            if native is None:
                return {"ok": False}
            hwnd = native.Handle.ToInt64()
            value = ctypes.c_int(1 if theme == "dark" else 0)
            dwmapi = ctypes.windll.dwmapi
            dwmapi.DwmSetWindowAttribute.argtypes = [
                ctypes.c_void_p,
                ctypes.c_uint,
                ctypes.c_void_p,
                ctypes.c_uint,
            ]
            dwmapi.DwmSetWindowAttribute.restype = ctypes.c_long
            result = None
            for attribute in (20, 19):  # DWMWA_USE_IMMERSIVE_DARK_MODE
                result = dwmapi.DwmSetWindowAttribute(
                    ctypes.c_void_p(hwnd), attribute, ctypes.byref(value), ctypes.sizeof(value)
                )
                if result == 0:
                    break
            return {"ok": result == 0}
        except Exception as error:
            return {"error": str(error)}


def start_server(port: int = 0) -> tuple[ThreadingHTTPServer, int]:
    server = ThreadingHTTPServer(("127.0.0.1", port), make_handler())
    server.daemon_threads = True
    thread = threading.Thread(target=server.serve_forever, name="api-server", daemon=True)
    thread.start()
    return server, server.server_address[1]


def stop_server(server: ThreadingHTTPServer) -> None:
    try:
        server.shutdown()
    finally:
        server.server_close()


def log_crash(exc: BaseException) -> None:
    try:
        paths.ensure_dirs()
        with open(os.path.join(paths.DATA_DIR, "error.log"), "a", encoding="utf-8") as handle:
            handle.write(f"\n[{datetime.now():%Y-%m-%d %H:%M:%S}]\n")
            handle.write("".join(traceback.format_exception(exc)))
    except OSError:
        pass


def window_geometry() -> tuple[int, int, tuple[int, int]]:
    """Fit the default window into the available desktop area."""
    width, height = 1460, 940
    min_width, min_height = 1120, 720
    try:
        import ctypes
        from ctypes import wintypes

        rect = wintypes.RECT()
        spi_getworkarea = 0x0030
        if ctypes.windll.user32.SystemParametersInfoW(
            spi_getworkarea, 0, ctypes.byref(rect), 0
        ):
            available_width = rect.right - rect.left
            available_height = rect.bottom - rect.top
            width = min(width, max(1024, int(available_width * 0.92)))
            height = min(height, max(640, int(available_height * 0.92)))
            min_width = min(min_width, width)
            min_height = min(min_height, height)
    except Exception:
        pass
    return width, height, (min_width, min_height)


def main() -> None:
    parser = argparse.ArgumentParser(description=paths.APP_NAME)
    parser.add_argument("--port", type=int, default=0, help="порт локального сервера (0 — свободный)")
    parser.add_argument("--no-window", action="store_true", help="не открывать окно (только сервер)")
    parser.add_argument("--browser", action="store_true", help="открыть в браузере вместо WebView")
    parser.add_argument("--debug", action="store_true", help="режим отладки WebView")
    args = parser.parse_args()

    if not args.no_window and not args.browser and not ensure_single_instance():
        return

    db.init_db()
    server, port = start_server(args.port)
    url = f"http://127.0.0.1:{port}/"

    if args.no_window:
        print(f"{paths.APP_NAME} запущен: {url}")
        print("Остановите процесс Ctrl+C.")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
        return

    if args.browser:
        webbrowser.open(url)
        print(f"Приложение открыто в браузере: {url}")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
        return

    try:
        import webview

        width, height, minimum = window_geometry()
        api = DesktopApi()
        window = webview.create_window(
            paths.APP_NAME,
            url,
            width=width,
            height=height,
            min_size=minimum,
            background_color="#0a0c12",
            confirm_close=False,
            text_select=True,
            js_api=api,
        )
        api._window = window

        def apply_titlebar() -> None:
            try:
                api.set_titlebar(db.get_settings().get("theme", "dark"))
            except Exception:
                pass

        webview.start(apply_titlebar, debug=args.debug)
    except Exception as exc:  # WebView2 unavailable → fall back to the browser
        log_crash(exc)
        print(f"Не удалось открыть WebView, запускаю в браузере: {exc}")
        webbrowser.open(url)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
    else:
        # После закрытия окна pywebview может оставить служебные потоки WebView2.
        # Завершаем процесс явно, чтобы он не висел в диспетчере задач.
        try:
            stop_server(server)
        finally:
            os._exit(0)


if __name__ == "__main__":
    try:
        main()
    except BaseException as error:
        log_crash(error)
        raise
