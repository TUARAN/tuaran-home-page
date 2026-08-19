#!/usr/bin/env python3

import argparse
import importlib.util
import json
import os
import secrets
import sqlite3
import subprocess
import sys
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse


SCRIPT_ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_ROOT.parent
SHELL_TOOL = SCRIPT_ROOT / "ollama-nas.sh"
STORE_PATH = SCRIPT_ROOT / "ollama-nas-store.py"

store_spec = importlib.util.spec_from_file_location("ollama_nas_store", STORE_PATH)
store = importlib.util.module_from_spec(store_spec)
store_spec.loader.exec_module(store)


INDEX_HTML = r'''<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="local-token" content="__LOCAL_TOKEN__">
  <title>NAS Qwen 本地控制台</title>
  <style>
    :root{color-scheme:dark;--bg:#090b0a;--panel:#111411;--panel2:#171b17;--line:#293029;--text:#f0f5ee;--muted:#8e998d;--green:#75e68a;--green2:#163b20;--red:#ff8585;--amber:#f2cc73}
    *{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 18% -10%,#193621 0,transparent 35%),var(--bg);color:var(--text);font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;min-height:100vh}
    button,input,textarea,select{font:inherit}.shell{width:min(1440px,calc(100% - 32px));margin:0 auto;padding:26px 0 48px}
    header{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:22px}.brand{display:flex;align-items:center;gap:13px}.mark{width:38px;height:38px;border:1px solid #35633c;border-radius:12px;background:linear-gradient(145deg,#1c4226,#0f1f13);display:grid;place-items:center;color:var(--green);font-weight:800}.brand h1{font-size:18px;margin:0;letter-spacing:.01em}.brand p{margin:2px 0 0;color:var(--muted);font-size:12px}
    .live{display:flex;align-items:center;gap:8px;color:#b7c2b6;font-size:12px}.dot{width:8px;height:8px;border-radius:50%;background:var(--green);box-shadow:0 0 14px var(--green)}
    .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:12px}.card,.panel{border:1px solid var(--line);background:rgba(17,20,17,.92);border-radius:16px;box-shadow:0 16px 40px rgba(0,0,0,.16)}.stat{padding:17px 18px}.stat-label{color:var(--muted);font-size:12px}.stat-value{font-size:25px;font-weight:720;margin-top:7px;letter-spacing:-.02em}.stat-foot{font-size:11px;color:#697568;margin-top:4px}
    .grid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(390px,.9fr);gap:12px}.panel{overflow:hidden}.panel-head{display:flex;align-items:center;justify-content:space-between;padding:15px 17px;border-bottom:1px solid var(--line)}.panel-title{font-weight:650}.panel-sub{font-size:11px;color:var(--muted);margin-top:2px}
    .chat-body{padding:18px}.model-line{display:flex;align-items:center;justify-content:space-between;padding:12px 13px;background:var(--panel2);border:1px solid var(--line);border-radius:12px;margin-bottom:14px}.model-name{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--green)}.secure{font-size:11px;color:var(--muted)}
    textarea{display:block;width:100%;min-height:128px;resize:vertical;border:1px solid var(--line);border-radius:13px;background:#0b0e0b;color:var(--text);padding:13px 14px;outline:none}.textarea:focus,textarea:focus{border-color:#47764f;box-shadow:0 0 0 3px rgba(117,230,138,.08)}
    .actions{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:12px}.hint{color:var(--muted);font-size:11px}.send{border:0;border-radius:11px;background:var(--green);color:#071109;font-weight:720;padding:10px 18px;cursor:pointer}.send:hover{filter:brightness(1.06)}.send:disabled{opacity:.45;cursor:wait}
    .answer{margin-top:16px;border:1px solid var(--line);background:#0c100d;border-radius:13px;padding:14px;min-height:90px;white-space:pre-wrap}.answer.empty{color:#667165}.answer-meta{display:flex;gap:12px;flex-wrap:wrap;color:var(--muted);font-size:11px;margin-top:9px}
    .filters{display:flex;gap:8px;align-items:center}select{background:#0d100d;color:var(--text);border:1px solid var(--line);border-radius:9px;padding:6px 9px}.refresh{border:1px solid var(--line);background:#181d18;color:#c8d1c7;border-radius:9px;padding:6px 10px;cursor:pointer}
    .calls{max-height:577px;overflow:auto}.call{display:grid;grid-template-columns:46px 1fr auto;gap:10px;padding:13px 16px;border-bottom:1px solid #202620;cursor:pointer}.call:hover{background:#151a15}.call-id{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#647064}.call-prompt{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:560}.call-meta{color:var(--muted);font-size:11px;margin-top:3px}.call-side{text-align:right}.token{font-size:12px}.duration{font-size:11px;color:var(--muted);margin-top:3px}.ok{color:var(--green)}.bad{color:var(--red)}
    .empty-list{padding:48px 20px;text-align:center;color:var(--muted)}
    .drawer{position:fixed;inset:0;background:rgba(0,0,0,.58);display:none;align-items:stretch;justify-content:flex-end;z-index:10}.drawer.open{display:flex}.drawer-card{width:min(620px,92vw);background:#0d100e;border-left:1px solid var(--line);padding:22px;overflow:auto}.drawer-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}.close{border:1px solid var(--line);background:transparent;color:var(--text);border-radius:9px;padding:6px 10px;cursor:pointer}.detail-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px;margin-bottom:18px}.detail-box{background:var(--panel2);border:1px solid var(--line);padding:10px;border-radius:10px}.detail-box span{display:block;color:var(--muted);font-size:11px}.detail-box strong{display:block;margin-top:3px}.block{margin-top:14px}.block label{display:block;color:var(--muted);font-size:11px;margin-bottom:6px}.block pre{margin:0;white-space:pre-wrap;word-break:break-word;background:#090b0a;border:1px solid var(--line);border-radius:11px;padding:13px;font:13px/1.65 ui-monospace,SFMono-Regular,Menlo,monospace}
    .toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#202620;border:1px solid #3d483d;border-radius:10px;padding:9px 14px;display:none;z-index:20}.toast.show{display:block}
    @media(max-width:900px){.stats{grid-template-columns:repeat(2,1fr)}.grid{grid-template-columns:1fr}.calls{max-height:none}}@media(max-width:540px){.shell{width:min(100% - 20px,1440px);padding-top:16px}.stats{grid-template-columns:1fr 1fr}.stat{padding:14px}.stat-value{font-size:21px}.live{display:none}}
  </style>
</head>
<body>
  <main class="shell">
    <header><div class="brand"><div class="mark">Q</div><div><h1>NAS Qwen 本地控制台</h1><p>Mac → Cloudflare Tunnel → 家中 NAS</p></div></div><div class="live"><span class="dot"></span><span>仅本机访问 · 127.0.0.1</span></div></header>
    <section class="stats">
      <div class="card stat"><div class="stat-label">调用次数</div><div class="stat-value" id="calls">—</div><div class="stat-foot" id="successRate">最近 30 天</div></div>
      <div class="card stat"><div class="stat-label">累计 Token</div><div class="stat-value" id="tokens">—</div><div class="stat-foot" id="tokenSplit">输入 / 输出</div></div>
      <div class="card stat"><div class="stat-label">平均耗时</div><div class="stat-value" id="avgDuration">—</div><div class="stat-foot">成功调用</div></div>
      <div class="card stat"><div class="stat-label">模型状态</div><div class="stat-value ok" style="font-size:18px" id="modelState">可调用</div><div class="stat-foot">qwen3.5:9b</div></div>
    </section>
    <section class="grid">
      <article class="panel">
        <div class="panel-head"><div><div class="panel-title">发起调用</div><div class="panel-sub">请求由本机后端发送，Access Secret 不进入浏览器</div></div></div>
        <div class="chat-body">
          <div class="model-line"><span class="model-name">qwen3.5:9b</span><span class="secure">● Cloudflare Access 已配置</span></div>
          <textarea id="prompt" maxlength="20000" placeholder="输入要发送给家中 Qwen 的消息…"></textarea>
          <div class="actions"><span class="hint">⌘ + Enter 发送</span><button class="send" id="send">发送到 NAS</button></div>
          <div class="answer empty" id="answer">模型回复会显示在这里。</div>
          <div class="answer-meta" id="answerMeta"></div>
        </div>
      </article>
      <article class="panel">
        <div class="panel-head"><div><div class="panel-title">调用记录</div><div class="panel-sub">点击记录查看完整 Prompt、回复和耗时</div></div><div class="filters"><select id="limit"><option>20</option><option>50</option><option>100</option></select><button class="refresh" id="refresh">刷新</button></div></div>
        <div class="calls" id="callList"><div class="empty-list">正在读取本地记录…</div></div>
      </article>
    </section>
  </main>
  <aside class="drawer" id="drawer"><div class="drawer-card"><div class="drawer-top"><div><div class="panel-title" id="detailTitle">调用详情</div><div class="panel-sub" id="detailTime"></div></div><button class="close" id="close">关闭</button></div><div class="detail-grid" id="detailGrid"></div><div class="block"><label>Prompt</label><pre id="detailPrompt"></pre></div><div class="block"><label>模型回复</label><pre id="detailResponse"></pre></div><div class="block" id="errorBlock" hidden><label>错误</label><pre id="detailError"></pre></div></div></aside>
  <div class="toast" id="toast"></div>
  <script>
    const token=document.querySelector('meta[name="local-token"]').content;
    const $=id=>document.getElementById(id); const fmt=n=>new Intl.NumberFormat('zh-CN').format(n||0);
    async function api(path,options={}){const r=await fetch(path,{...options,headers:{'Content-Type':'application/json','X-Local-Token':token,...options.headers}});const data=await r.json();if(!r.ok)throw new Error(data.error||`HTTP ${r.status}`);return data}
    function toast(message){$('toast').textContent=message;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2200)}
    async function loadSummary(){const s=await api('/api/summary?days=30');$('calls').textContent=fmt(s.calls);$('tokens').textContent=fmt(s.total_tokens);$('tokenSplit').textContent=`输入 ${fmt(s.prompt_tokens)} / 输出 ${fmt(s.completion_tokens)}`;$('avgDuration').textContent=`${(s.avg_duration_ms/1000).toFixed(2)}s`;$('successRate').textContent=s.calls?`成功率 ${Math.round(s.succeeded/s.calls*100)}%`:'最近 30 天暂无调用'}
    async function loadCalls(){const list=$('callList');list.innerHTML='<div class="empty-list">正在读取本地记录…</div>';const data=await api(`/api/calls?limit=${$('limit').value}`);if(!data.calls.length){list.innerHTML='<div class="empty-list">暂无调用，先向 Qwen 发一条消息。</div>';return}list.innerHTML='';for(const c of data.calls){const el=document.createElement('div');const syncLabel=c.sync_status==='synced'?'已同步':c.sync_status==='failed'?'同步失败':'待同步';const syncClass=c.sync_status==='synced'?'ok':c.sync_status==='failed'?'bad':'';el.className='call';el.innerHTML=`<div class="call-id">#${c.id}</div><div><div class="call-prompt"></div><div class="call-meta">${c.started_at} · <span class="${c.status==='succeeded'?'ok':'bad'}">${c.status==='succeeded'?'成功':'失败'}</span> · <span class="${syncClass}">${syncLabel}</span> · ${c.model}</div></div><div class="call-side"><div class="token">${fmt(c.total_tokens)} tok</div><div class="duration">${c.total_duration_ms?(c.total_duration_ms/1000).toFixed(1)+'s':'—'}</div></div>`;el.querySelector('.call-prompt').textContent=c.prompt||'（空）';el.onclick=()=>showCall(c.id);list.appendChild(el)}}
    function box(label,value){const el=document.createElement('div');el.className='detail-box';const s=document.createElement('span');s.textContent=label;const b=document.createElement('strong');b.textContent=value;el.append(s,b);return el}
    async function showCall(id){const c=await api(`/api/calls/${id}`);$('detailTitle').textContent=`调用 #${c.id}`;$('detailTime').textContent=c.started_at;const syncLabel=c.sync_status==='synced'?'已同步':c.sync_status==='failed'?'同步失败':'待同步';const g=$('detailGrid');g.innerHTML='';g.append(box('状态',c.status==='succeeded'?'成功':'失败'),box('线上同步',syncLabel),box('模型',c.model),box('Token',`${fmt(c.prompt_tokens)} + ${fmt(c.completion_tokens)} = ${fmt(c.total_tokens)}`),box('总耗时',c.total_duration_ms?`${(c.total_duration_ms/1000).toFixed(2)} 秒`:'—'),box('模型加载',c.load_duration_ms?`${(c.load_duration_ms/1000).toFixed(2)} 秒`:'—'),box('端点',c.endpoint));$('detailPrompt').textContent=c.prompt||'';$('detailResponse').textContent=c.response||'';$('errorBlock').hidden=!c.error;$('detailError').textContent=c.error||'';$('drawer').classList.add('open')}
    async function send(){const prompt=$('prompt').value.trim();if(!prompt)return toast('请先输入消息');const button=$('send');button.disabled=true;button.textContent='NAS 推理中…';$('answer').classList.remove('empty');$('answer').textContent='正在等待家中模型返回，冷启动可能需要几十秒…';$('answerMeta').textContent='';try{const result=await api('/api/chat',{method:'POST',body:JSON.stringify({prompt})});$('answer').textContent=result.message?.content||'模型返回了空回复';const total=(result.prompt_eval_count||0)+(result.eval_count||0);$('answerMeta').textContent=`${total} tokens · ${((result.total_duration||0)/1e9).toFixed(2)} 秒 · ${result.model||'qwen3.5:9b'}`;await Promise.all([loadSummary(),loadCalls()]);toast('调用成功，已写入本地记录')}catch(e){$('answer').textContent=`调用失败：${e.message}`;await loadCalls();toast('调用失败，错误已记录')}finally{button.disabled=false;button.textContent='发送到 NAS'}}
    $('send').onclick=send;$('prompt').addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='Enter')send()});$('refresh').onclick=()=>Promise.all([loadSummary(),loadCalls()]);$('limit').onchange=loadCalls;$('close').onclick=()=>$('drawer').classList.remove('open');$('drawer').onclick=e=>{if(e.target===$('drawer'))$('drawer').classList.remove('open')};
    Promise.all([loadSummary(),loadCalls()]).catch(e=>toast(e.message));
  </script>
</body>
</html>'''


def iso_local(value_ms):
    return datetime.fromtimestamp(value_ms / 1000, tz=timezone.utc).astimezone().strftime("%Y-%m-%d %H:%M:%S")


def row_dict(row):
    item = dict(row)
    item["started_at"] = iso_local(item["started_at_ms"])
    item["finished_at"] = iso_local(item["finished_at_ms"])
    return item


def readonly_db():
    connection, _ = store.connect_db(read_only=True)
    return connection


class Handler(BaseHTTPRequestHandler):
    server_version = "OllamaNasLocal/1.0"

    def log_message(self, fmt, *args):
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), fmt % args))

    def secure_host(self):
        host = self.headers.get("Host", "").split(":", 1)[0]
        return host in {"127.0.0.1", "localhost", "[::1]"}

    def send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if not self.secure_host():
            return self.send_json(403, {"error": "仅允许本机访问"})
        parsed = urlparse(self.path)
        if parsed.path == "/":
            body = INDEX_HTML.replace("__LOCAL_TOKEN__", self.server.local_token).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Security-Policy", "default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'")
            self.send_header("X-Frame-Options", "DENY")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.end_headers()
            return self.wfile.write(body)
        if parsed.path == "/api/summary":
            return self.summary(parsed)
        if parsed.path == "/api/calls":
            return self.calls(parsed)
        if parsed.path.startswith("/api/calls/"):
            return self.call_detail(parsed.path.rsplit("/", 1)[-1])
        self.send_json(404, {"error": "Not found"})

    def do_POST(self):
        if not self.secure_host():
            return self.send_json(403, {"error": "仅允许本机访问"})
        if self.headers.get("X-Local-Token") != self.server.local_token:
            return self.send_json(403, {"error": "本机会话校验失败"})
        if self.path != "/api/chat":
            return self.send_json(404, {"error": "Not found"})
        try:
            length = min(int(self.headers.get("Content-Length", "0")), 100_000)
            payload = json.loads(self.rfile.read(length))
            prompt = str(payload.get("prompt", "")).strip()
        except (ValueError, TypeError, json.JSONDecodeError):
            return self.send_json(400, {"error": "请求格式无效"})
        if not prompt:
            return self.send_json(400, {"error": "消息不能为空"})
        if len(prompt) > 20_000:
            return self.send_json(400, {"error": "消息不能超过 20,000 字符"})
        try:
            result = subprocess.run(
                [str(SHELL_TOOL), "chat"],
                input=prompt + "\n",
                text=True,
                cwd=str(PROJECT_ROOT),
                env={**dict(os.environ), "OLLAMA_NONINTERACTIVE": "1"},
                capture_output=True,
                timeout=210,
                check=False,
            )
        except subprocess.TimeoutExpired:
            return self.send_json(504, {"error": "NAS 调用超过 210 秒"})
        if result.returncode != 0:
            return self.send_json(502, {"error": (result.stderr or "NAS 调用失败")[-2000:]})
        try:
            return self.send_json(200, json.loads(result.stdout))
        except json.JSONDecodeError:
            return self.send_json(502, {"error": "NAS 返回内容无法解析"})

    def summary(self, parsed):
        try:
            days = max(1, min(3650, int(parse_qs(parsed.query).get("days", ["30"])[0])))
        except ValueError:
            days = 30
        connection = readonly_db()
        if connection is None:
            return self.send_json(200, {"calls": 0, "succeeded": 0, "failed": 0, "prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0, "avg_duration_ms": 0})
        cutoff = store.now_ms() - days * 86_400_000
        row = connection.execute("""SELECT COUNT(*) calls, SUM(CASE WHEN status='succeeded' THEN 1 ELSE 0 END) succeeded, SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) failed, COALESCE(SUM(prompt_tokens),0) prompt_tokens, COALESCE(SUM(completion_tokens),0) completion_tokens, COALESCE(SUM(total_tokens),0) total_tokens, COALESCE(AVG(CASE WHEN status='succeeded' THEN total_duration_ms END),0) avg_duration_ms FROM calls WHERE started_at_ms>=?""", (cutoff,)).fetchone()
        self.send_json(200, dict(row))

    def calls(self, parsed):
        try:
            limit = max(1, min(200, int(parse_qs(parsed.query).get("limit", ["20"])[0])))
        except ValueError:
            limit = 20
        connection = readonly_db()
        rows = [] if connection is None else connection.execute("SELECT * FROM calls ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
        self.send_json(200, {"calls": [row_dict(row) for row in rows]})

    def call_detail(self, call_id):
        try:
            call_id = int(call_id)
        except ValueError:
            return self.send_json(400, {"error": "调用 ID 无效"})
        connection = readonly_db()
        row = None if connection is None else connection.execute("SELECT * FROM calls WHERE id=?", (call_id,)).fetchone()
        if row is None:
            return self.send_json(404, {"error": "找不到调用记录"})
        self.send_json(200, row_dict(row))


def main():
    parser = argparse.ArgumentParser(description="NAS Qwen 本地可视化控制台")
    parser.add_argument("--port", type=int, default=8788)
    args = parser.parse_args()
    if not 1 <= args.port <= 65535:
        parser.error("端口必须在 1-65535 之间")
    server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    server.local_token = secrets.token_urlsafe(32)
    print(f"NAS Qwen 本地控制台：http://127.0.0.1:{args.port}", flush=True)
    print("按 Control+C 停止。", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
