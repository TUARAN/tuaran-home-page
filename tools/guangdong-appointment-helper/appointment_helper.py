#!/usr/bin/env python3
"""Local appointment reminder for the Guangdong Provincial Hospital of TCM.

This program does not inspect or control WeChat. It does not send patient data.
"""

from __future__ import annotations

import json
import platform
import socket
import struct
import subprocess
import sys
import textwrap
import threading
import time
import tkinter as tk
from datetime import datetime, timedelta, timezone
from pathlib import Path
from tkinter import messagebox


TZ = timezone(timedelta(hours=8), "Asia/Shanghai")
HOSPITAL = "广东省中医院"
DEPARTMENT = "乳腺科"
DOCTOR = "刘晓雁"
PREWARM = (20, 59, 50)
RELEASE = (21, 0, 0)
NTP_SERVERS = ("time.windows.com", "time.apple.com", "pool.ntp.org")
LOG_PATH = Path(__file__).with_name("appointment-results.jsonl")


def ntp_offset(server: str, timeout: float = 1.5) -> float:
    """Return estimated server-minus-local-clock seconds using one NTP exchange."""
    request = b"\x1b" + 47 * b"\0"
    addresses = socket.getaddrinfo(server, 123, type=socket.SOCK_DGRAM)
    last_error = None
    for family, socktype, protocol, _, address in addresses:
        try:
            with socket.socket(family, socktype, protocol) as sock:
                sock.settimeout(timeout)
                t0 = time.time()
                sock.sendto(request, address)
                data, _ = sock.recvfrom(512)
                t3 = time.time()
            if len(data) < 48 or data[0] & 7 not in (4, 5):
                raise ValueError("NTP 响应无效")
            received, = struct.unpack("!Q", data[32:40])
            transmitted, = struct.unpack("!Q", data[40:48])
            if not received or not transmitted:
                raise ValueError("NTP 响应缺少时间戳")
            def unix_timestamp(value: int) -> float:
                return (value >> 32) - 2208988800 + (value & 0xFFFFFFFF) / 2**32
            t1 = unix_timestamp(received)
            t2 = unix_timestamp(transmitted)
            return ((t1 - t0) + (t2 - t3)) / 2
        except (OSError, ValueError) as error:
            last_error = error
    raise OSError(f"{server}: {last_error}")


def local_now(offset: float = 0) -> datetime:
    return datetime.fromtimestamp(time.time() + offset, TZ)


def target_date(now: datetime) -> str:
    return (now.date() + timedelta(days=8)).isoformat()


def next_release(now: datetime) -> datetime:
    release = now.replace(hour=RELEASE[0], minute=RELEASE[1], second=RELEASE[2], microsecond=0)
    return release if now < release else release + timedelta(days=1)


def write_result(status: str, date: str) -> None:
    # Never persist identity, account, screenshots, or WeChat content.
    record = {"time": local_now().isoformat(timespec="seconds"), "target_date": date, "status": status}
    with LOG_PATH.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record, ensure_ascii=False) + "\n")


class AppointmentHelper:
    def __init__(self) -> None:
        self.root = tk.Tk()
        self.root.title("广东省中医院复诊提醒")
        self.root.geometry("540x340")
        self.root.resizable(False, False)
        self.offset = 0.0
        self.clock_status = "未校时"
        self.prewarmed_for = None
        self.alerted_for = None
        self.current_target = ""
        # macOS' bundled Tk 8.5 can render blank Label/Text widgets; Button text works.
        self.title = tk.Button(self.root, text=f"{HOSPITAL} · {DEPARTMENT} · {DOCTOR}", takefocus=0)
        self.title.pack(pady=(17, 8))
        self.release_label = tk.Button(self.root, takefocus=0)
        self.release_label.pack(pady=2)
        self.target_label = tk.Button(self.root, takefocus=0)
        self.target_label.pack(pady=2)
        self.countdown_label = tk.Button(self.root, takefocus=0)
        self.countdown_label.pack(pady=2)
        self.clock = tk.Button(self.root, wraplength=500, takefocus=0)
        self.clock.pack(pady=4)
        tk.Button(self.root, text="请提前在官方微信服务号登录并打开医生预约页。", takefocus=0).pack(pady=2)
        tk.Button(self.root, text="此工具仅负责校时和提醒，不操作微信。", takefocus=0).pack(pady=2)
        buttons = tk.Frame(self.root)
        buttons.pack(pady=10)
        tk.Button(buttons, text="重新校时", command=self.sync_clock).pack(side="left", padx=6)
        tk.Button(buttons, text="登记成功", command=lambda: self.mark("success")).pack(side="left", padx=6)
        tk.Button(buttons, text="登记未挂到", command=lambda: self.mark("missed")).pack(side="left", padx=6)
        self.sync_clock()
        self.tick()

    def sync_clock(self) -> None:
        self.clock_status = "校时中…"
        def work() -> None:
            offsets = []
            for server in NTP_SERVERS:
                try:
                    offsets.append(ntp_offset(server))
                except (OSError, ValueError):
                    continue
            if offsets:
                offsets.sort()
                offset = offsets[len(offsets) // 2]
                self.root.after(0, lambda: self.set_clock(offset, "NTP 校时成功"))
            else:
                self.root.after(0, lambda: self.set_clock(0.0, "NTP 不可用，使用系统时钟"))
        threading.Thread(target=work, daemon=True).start()

    def set_clock(self, offset: float, status: str) -> None:
        self.offset = offset
        self.clock_status = status

    def alert(self, text: str) -> None:
        self.root.bell()
        self.root.lift()
        self.root.attributes("-topmost", True)
        self.root.after(1500, lambda: self.root.attributes("-topmost", False))
        popup = tk.Toplevel(self.root)
        popup.title("复诊挂号提醒")
        popup.geometry("440x180")
        popup.attributes("-topmost", True)
        for line in textwrap.wrap(text, width=23):
            tk.Button(popup, text=line, takefocus=0).pack(pady=2)
        tk.Button(popup, text="知道了", command=popup.destroy).pack()
        threading.Thread(target=self.speak, args=(text,), daemon=True).start()

    @staticmethod
    def speak(text: str) -> None:
        try:
            if platform.system() == "Darwin":
                subprocess.run(["say", text], timeout=15, check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            elif platform.system() == "Windows":
                script = "Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.Speak($args[0])"
                subprocess.run(["powershell", "-NoProfile", "-Command", script, text], timeout=15, check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except (OSError, subprocess.TimeoutExpired):
            pass

    def mark(self, status: str) -> None:
        write_result(status, self.current_target or target_date(local_now(self.offset)))
        messagebox.showinfo("已记录", "结果已保存在本机 appointment-results.jsonl。", parent=self.root)

    def tick(self) -> None:
        now = local_now(self.offset)
        release = next_release(now)
        today_release = now.replace(hour=21, minute=0, second=0, microsecond=0)
        key = today_release.date().isoformat()
        self.current_target = target_date(now)
        seconds = max(0.0, (release - now).total_seconds())
        self.release_label.configure(text=f"下次放号提醒：{release:%Y-%m-%d %H:%M:%S}")
        self.target_label.configure(text=f"目标就诊日：{target_date(release)}（按提前 8 天计算）")
        self.countdown_label.configure(text=f"倒计时：{seconds:.1f} 秒")
        self.clock.configure(text=f"北京时间 {now:%H:%M:%S.%f}"[:-3] + f"  ·  {self.clock_status}  ·  偏差 {self.offset:+.3f} 秒")
        prewarm = today_release - timedelta(seconds=10)
        if prewarm <= now < today_release and self.prewarmed_for != key:
            self.prewarmed_for = key
            self.alert(f"10 秒后预计放号。请在微信服务号打开 {DOCTOR} 医生预约页，核对 {target_date(today_release)} 的号源。")
        if today_release <= now < today_release + timedelta(seconds=30) and self.alerted_for != key:
            self.alerted_for = key
            self.alert(f"现在是 21:00。请在官方页面查询并确认 {target_date(today_release)} 的号源。")
        self.root.after(100, self.tick)

    def run(self) -> None:
        self.root.mainloop()


if __name__ == "__main__":
    try:
        AppointmentHelper().run()
    except KeyboardInterrupt:
        sys.exit(0)
