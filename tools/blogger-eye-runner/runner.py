import hmac
import ipaddress
import json
import os
import re
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.error import HTTPError
from urllib.parse import urljoin, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener, urlopen


DEFAULT_ALLOWED_HOSTS = ("2aran.com", "*.2aran.com")
HOST_PATTERN = re.compile(r"^(?:\*\.)?[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$")
MAX_BODY_BYTES = 8 * 1024


def allowed_hosts(value=None):
    configured = []
    for raw in (value if value is not None else os.getenv("BLOGGER_EYE_ALLOWED_HOSTS", "")).split(","):
        item = raw.strip().lower().rstrip(".")
        if item and item not in {"*", "localhost"} and HOST_PATTERN.fullmatch(item) and ".." not in item:
            configured.append(item)
    return tuple(dict.fromkeys((*DEFAULT_ALLOWED_HOSTS, *configured)))


def host_matches(hostname, pattern):
    if pattern.startswith("*."):
        base = pattern[2:]
        return hostname != base and hostname.endswith(f".{base}")
    return hostname == pattern


def validate_target(value, patterns=None):
    parsed = urlsplit(str(value or "").strip())
    if parsed.scheme != "https" or not parsed.hostname:
        raise ValueError("target must be a complete HTTPS URL")
    if parsed.username or parsed.password:
        raise ValueError("target credentials are not allowed")
    if parsed.port not in (None, 443):
        raise ValueError("custom target ports are not allowed")
    hostname = parsed.hostname.lower().rstrip(".")
    if hostname == "localhost" or hostname.endswith((".localhost", ".local")):
        raise ValueError("local targets are not allowed")
    try:
        ipaddress.ip_address(hostname)
    except ValueError:
        pass
    else:
        raise ValueError("IP targets are not allowed")
    if not any(host_matches(hostname, pattern) for pattern in (patterns or allowed_hosts())):
        raise ValueError(f"target host {hostname} is not authorized")
    return parsed._replace(fragment="").geturl()


class SafeRedirectHandler(HTTPRedirectHandler):
    def __init__(self, patterns):
        super().__init__()
        self.patterns = patterns

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        validated = validate_target(urljoin(req.full_url, newurl), self.patterns)
        return super().redirect_request(req, fp, code, msg, headers, validated)


def detect_ip(timeout=10):
    request = Request(
        "https://api.ipify.org?format=json",
        headers={"Accept": "application/json", "User-Agent": "blogger-eye-runner/1.0"},
    )
    with urlopen(request, timeout=timeout) as response:
        payload = json.loads(response.read(2048))
    return str(payload.get("ip") or "")


def check_target(target_url, timeout=15):
    patterns = allowed_hosts()
    target = validate_target(target_url, patterns)
    opener = build_opener(SafeRedirectHandler(patterns))
    request = Request(
        target,
        headers={
            "Accept": "text/html,application/xhtml+xml,application/json,text/plain;q=0.9,*/*;q=0.1",
            "User-Agent": "blogger-eye-runner/1.0",
        },
    )
    started_at = time.monotonic()
    try:
        response = opener.open(request, timeout=timeout)
    except HTTPError as error:
        response = error
    with response:
        status = int(response.status)
        effective_url = validate_target(response.geturl(), patterns)
        response.read(1024)
    duration_ms = round((time.monotonic() - started_at) * 1000)
    return {
        "ok": True,
        "ip": detect_ip(),
        "status": status,
        "durationMs": duration_ms,
        "effectiveUrl": effective_url,
        "region": os.getenv("BLOGGER_EYE_REGION", "unknown"),
    }


class RunnerHandler(BaseHTTPRequestHandler):
    server_version = "blogger-eye-runner/1.0"

    def write_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path != "/health":
            self.write_json(404, {"ok": False, "error": "not found"})
            return
        self.write_json(200, {
            "ok": True,
            "service": "blogger-eye-runner",
            "region": os.getenv("BLOGGER_EYE_REGION", "unknown"),
        })

    def do_POST(self):
        if self.path != "/api/check":
            self.write_json(404, {"ok": False, "error": "not found"})
            return
        expected = os.getenv("BLOGGER_EYE_RUNNER_SECRET", "")
        supplied = self.headers.get("Authorization", "").removeprefix("Bearer ")
        if not expected or not hmac.compare_digest(supplied, expected):
            self.write_json(401, {"ok": False, "error": "unauthorized"})
            return
        content_length = int(self.headers.get("Content-Length", "0") or 0)
        if content_length <= 0 or content_length > MAX_BODY_BYTES:
            self.write_json(413, {"ok": False, "error": "invalid body size"})
            return
        try:
            body = json.loads(self.rfile.read(content_length))
            result = check_target(body.get("url"))
            self.write_json(200, result)
        except ValueError as error:
            self.write_json(400, {"ok": False, "error": str(error)})
        except Exception as error:
            self.write_json(502, {"ok": False, "error": str(error)[:300]})

    def log_message(self, format_string, *args):
        print(f"{self.log_date_time_string()} {format_string % args}")


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8080"))
    server = ThreadingHTTPServer(("0.0.0.0", port), RunnerHandler)
    print(f"blogger-eye-runner listening on :{port} ({os.getenv('BLOGGER_EYE_REGION', 'unknown')})")
    server.serve_forever()
