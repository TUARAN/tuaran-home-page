#!/usr/bin/env python3

import argparse
import datetime as dt
import json
import os
import sqlite3
import sys
from pathlib import Path


def database_path():
    data_home = os.environ.get("XDG_DATA_HOME")
    root = Path(data_home) if data_home else Path.home() / ".local" / "share"
    return root / "tuaran-ollama" / "calls.sqlite3"


def connect_db(read_only=False):
    path = database_path()
    if read_only:
        if not path.exists():
            return None, path
        connection = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
        connection.row_factory = sqlite3.Row
        return connection, path

    path.parent.mkdir(parents=True, exist_ok=True)
    path.parent.chmod(0o700)
    connection = sqlite3.connect(str(path))
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA journal_mode = WAL")
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS calls (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          started_at_ms INTEGER NOT NULL,
          finished_at_ms INTEGER NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed')),
          endpoint TEXT NOT NULL,
          model TEXT NOT NULL,
          prompt TEXT NOT NULL,
          response TEXT NOT NULL DEFAULT '',
          prompt_tokens INTEGER NOT NULL DEFAULT 0,
          completion_tokens INTEGER NOT NULL DEFAULT 0,
          total_tokens INTEGER NOT NULL DEFAULT 0,
          total_duration_ms REAL NOT NULL DEFAULT 0,
          load_duration_ms REAL NOT NULL DEFAULT 0,
          error TEXT NOT NULL DEFAULT '',
          sync_status TEXT NOT NULL DEFAULT 'pending',
          synced_at_ms INTEGER,
          remote_task_id TEXT NOT NULL DEFAULT '',
          sync_error TEXT NOT NULL DEFAULT ''
        )
        """
    )
    columns = {row[1] for row in connection.execute("PRAGMA table_info(calls)").fetchall()}
    additions = {
        "sync_status": "TEXT NOT NULL DEFAULT 'pending'",
        "synced_at_ms": "INTEGER",
        "remote_task_id": "TEXT NOT NULL DEFAULT ''",
        "sync_error": "TEXT NOT NULL DEFAULT ''",
    }
    for name, definition in additions.items():
        if name not in columns:
            connection.execute(f"ALTER TABLE calls ADD COLUMN {name} {definition}")
    connection.commit()
    path.chmod(0o600)
    return connection, path


def now_ms():
    return int(dt.datetime.now(tz=dt.timezone.utc).timestamp() * 1000)


def format_time(value):
    moment = dt.datetime.fromtimestamp(value / 1000, tz=dt.timezone.utc).astimezone()
    return moment.strftime("%Y-%m-%d %H:%M:%S")


def shorten(value, width):
    clean = " ".join(str(value or "").split())
    return clean if len(clean) <= width else clean[: width - 1] + "…"


def read_response(path):
    if not path:
        return {}, ""
    raw = Path(path).read_text(encoding="utf-8", errors="replace")
    try:
        return json.loads(raw), raw
    except json.JSONDecodeError:
        return {}, raw


def command_record(args):
    payload, raw_response = read_response(args.response_file)
    message = payload.get("message") if isinstance(payload, dict) else None
    response_text = message.get("content", "") if isinstance(message, dict) else ""
    response_model = payload.get("model", "") if isinstance(payload, dict) else ""
    prompt_tokens = int(payload.get("prompt_eval_count", 0) or 0) if isinstance(payload, dict) else 0
    completion_tokens = int(payload.get("eval_count", 0) or 0) if isinstance(payload, dict) else 0
    total_duration_ms = float(payload.get("total_duration", 0) or 0) / 1_000_000 if isinstance(payload, dict) else 0
    load_duration_ms = float(payload.get("load_duration", 0) or 0) / 1_000_000 if isinstance(payload, dict) else 0
    error = os.environ.get("OLLAMA_LOG_ERROR", "")
    if args.status == "failed" and not error:
        error = shorten(raw_response, 2000)

    connection, _ = connect_db()
    cursor = connection.execute(
        """
        INSERT INTO calls (
          started_at_ms, finished_at_ms, status, endpoint, model, prompt, response,
          prompt_tokens, completion_tokens, total_tokens, total_duration_ms,
          load_duration_ms, error
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            args.started_at_ms,
            now_ms(),
            args.status,
            args.endpoint,
            response_model or args.model,
            os.environ.get("OLLAMA_LOG_PROMPT", ""),
            response_text,
            prompt_tokens,
            completion_tokens,
            prompt_tokens + completion_tokens,
            total_duration_ms,
            load_duration_ms,
            error,
        ),
    )
    connection.commit()
    print(cursor.lastrowid)


def command_history(args):
    connection, path = connect_db(read_only=True)
    if connection is None:
        print(f"本地调用记录：{path}")
        print("暂无记录。")
        return
    rows = connection.execute(
        "SELECT * FROM calls ORDER BY id DESC LIMIT ?", (args.limit,)
    ).fetchall()
    print(f"本地调用记录：{path}")
    if not rows:
        print("暂无记录。")
        return
    print("ID   时间                 状态  同步    模型          Token   耗时     Prompt")
    print("-" * 104)
    for row in rows:
        status = "成功" if row["status"] == "succeeded" else "失败"
        stored_sync_status = row["sync_status"] if "sync_status" in row.keys() else "pending"
        sync_status = {"synced": "已同步", "failed": "失败", "pending": "待同步"}.get(stored_sync_status, "待同步")
        duration = f'{row["total_duration_ms"] / 1000:.1f}s' if row["total_duration_ms"] else "—"
        print(
            f'{row["id"]:<4} {format_time(row["started_at_ms"]):<19} '
            f'{status:<4} {sync_status:<5} {shorten(row["model"], 13):<13} '
            f'{row["total_tokens"]:<7} {duration:<8} {shorten(row["prompt"], 32)}'
        )


def command_show(args):
    connection, _ = connect_db(read_only=True)
    if connection is None:
        print(f"找不到调用记录：{args.id}", file=sys.stderr)
        raise SystemExit(1)
    row = connection.execute("SELECT * FROM calls WHERE id = ?", (args.id,)).fetchone()
    if row is None:
        print(f"找不到调用记录：{args.id}", file=sys.stderr)
        raise SystemExit(1)
    result = dict(row)
    result["started_at"] = format_time(row["started_at_ms"])
    result["finished_at"] = format_time(row["finished_at_ms"])
    print(json.dumps(result, ensure_ascii=False, indent=2))


def command_stats(args):
    connection, path = connect_db(read_only=True)
    if connection is None:
        print(f"本地用量统计（最近 {args.days} 天）")
        print(f"数据库：{path}")
        print("调用：0 次（成功 0，失败 0）")
        print("输入 Token：0")
        print("输出 Token：0")
        print("总 Token：0")
        print("平均耗时：0.00 秒")
        print("最长耗时：0.00 秒")
        return
    cutoff = now_ms() - args.days * 24 * 60 * 60 * 1000
    row = connection.execute(
        """
        SELECT
          COUNT(*) AS calls,
          SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END) AS succeeded,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
          COALESCE(SUM(prompt_tokens), 0) AS prompt_tokens,
          COALESCE(SUM(completion_tokens), 0) AS completion_tokens,
          COALESCE(SUM(total_tokens), 0) AS total_tokens,
          COALESCE(AVG(CASE WHEN status = 'succeeded' THEN total_duration_ms END), 0) AS avg_duration_ms,
          COALESCE(MAX(total_duration_ms), 0) AS max_duration_ms
        FROM calls
        WHERE started_at_ms >= ?
        """,
        (cutoff,),
    ).fetchone()
    print(f"本地用量统计（最近 {args.days} 天）")
    print(f"数据库：{path}")
    print(f'调用：{row["calls"]} 次（成功 {row["succeeded"] or 0}，失败 {row["failed"] or 0}）')
    print(f'输入 Token：{row["prompt_tokens"]:,}')
    print(f'输出 Token：{row["completion_tokens"]:,}')
    print(f'总 Token：{row["total_tokens"]:,}')
    print(f'平均耗时：{row["avg_duration_ms"] / 1000:.2f} 秒')
    print(f'最长耗时：{row["max_duration_ms"] / 1000:.2f} 秒')


def command_sync_payload(args):
    connection, _ = connect_db(read_only=True)
    row = None if connection is None else connection.execute("SELECT * FROM calls WHERE id = ?", (args.id,)).fetchone()
    if row is None:
        print(f"找不到调用记录：{args.id}", file=sys.stderr)
        raise SystemExit(1)
    payload = {
        "deviceId": args.device_id,
        "deviceName": args.device_name,
        "localCallId": str(row["id"]),
        "status": row["status"],
        "model": row["model"],
        "endpoint": row["endpoint"],
        "inputSummary": str(row["prompt"] or "").strip()[:1200],
        "resultSummary": str(row["response"] or "").strip()[:1200],
        "promptTokens": row["prompt_tokens"],
        "completionTokens": row["completion_tokens"],
        "totalTokens": row["total_tokens"],
        "durationMs": row["total_duration_ms"],
        "loadDurationMs": row["load_duration_ms"],
        "error": str(row["error"] or "")[:1600],
        "startedAt": row["started_at_ms"],
        "finishedAt": row["finished_at_ms"],
    }
    print(json.dumps(payload, ensure_ascii=False))


def command_mark_sync(args):
    connection, _ = connect_db()
    connection.execute(
        "UPDATE calls SET sync_status = ?, synced_at_ms = ?, remote_task_id = ?, sync_error = ? WHERE id = ?",
        (
            args.status,
            now_ms() if args.status == "synced" else None,
            args.task_id if args.status == "synced" else "",
            "" if args.status == "synced" else os.environ.get("OLLAMA_SYNC_ERROR", "")[:2000],
            args.id,
        ),
    )
    connection.commit()


def command_pending(args):
    connection, _ = connect_db(read_only=True)
    if connection is None:
        return
    columns = {row[1] for row in connection.execute("PRAGMA table_info(calls)").fetchall()}
    if "sync_status" in columns:
        rows = connection.execute(
            "SELECT id FROM calls WHERE sync_status != 'synced' ORDER BY id LIMIT ?", (args.limit,)
        ).fetchall()
    else:
        rows = connection.execute("SELECT id FROM calls ORDER BY id LIMIT ?", (args.limit,)).fetchall()
    for row in rows:
        print(row["id"])


def command_init(_args):
    connection, path = connect_db()
    connection.close()
    print(path)


def positive_int(value):
    parsed = int(value)
    if parsed < 1:
        raise argparse.ArgumentTypeError("必须大于 0")
    return parsed


def build_parser():
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)

    record = subparsers.add_parser("record")
    record.add_argument("--status", choices=("succeeded", "failed"), required=True)
    record.add_argument("--started-at-ms", type=int, required=True)
    record.add_argument("--endpoint", required=True)
    record.add_argument("--model", required=True)
    record.add_argument("--response-file")
    record.set_defaults(handler=command_record)

    history = subparsers.add_parser("history")
    history.add_argument("--limit", type=positive_int, default=20)
    history.set_defaults(handler=command_history)

    show = subparsers.add_parser("show")
    show.add_argument("id", type=positive_int)
    show.set_defaults(handler=command_show)

    stats = subparsers.add_parser("stats")
    stats.add_argument("--days", type=positive_int, default=30)
    stats.set_defaults(handler=command_stats)

    sync_payload = subparsers.add_parser("sync-payload")
    sync_payload.add_argument("id", type=positive_int)
    sync_payload.add_argument("--device-id", required=True)
    sync_payload.add_argument("--device-name", required=True)
    sync_payload.set_defaults(handler=command_sync_payload)

    mark_sync = subparsers.add_parser("mark-sync")
    mark_sync.add_argument("id", type=positive_int)
    mark_sync.add_argument("--status", choices=("synced", "failed"), required=True)
    mark_sync.add_argument("--task-id", default="")
    mark_sync.set_defaults(handler=command_mark_sync)

    pending = subparsers.add_parser("pending")
    pending.add_argument("--limit", type=positive_int, default=200)
    pending.set_defaults(handler=command_pending)

    init = subparsers.add_parser("init")
    init.set_defaults(handler=command_init)
    return parser


def main():
    args = build_parser().parse_args()
    args.handler(args)


if __name__ == "__main__":
    main()
