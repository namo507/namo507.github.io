from __future__ import annotations

import json
import os
import shlex
import subprocess
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any

from .config import MCP_PROTOCOL_VERSION


class McpClientError(RuntimeError):
    pass


def _rpc_message(payload: dict[str, Any]) -> bytes:
    body = json.dumps(payload).encode("utf-8")
    header = f"Content-Length: {len(body)}\r\n\r\n".encode("ascii")
    return header + body


def _read_stdio_message(stream: Any) -> dict[str, Any]:
    headers: dict[str, str] = {}
    while True:
        line = stream.readline()
        if not line:
            raise McpClientError("Unexpected EOF while reading MCP response")
        if line in (b"\r\n", b"\n"):
            break
        key, _, value = line.decode("utf-8").partition(":")
        headers[key.strip().lower()] = value.strip()
    content_length = int(headers.get("content-length", "0"))
    body = stream.read(content_length)
    if len(body) != content_length:
        raise McpClientError("Incomplete MCP response body")
    return json.loads(body.decode("utf-8"))


@dataclass
class HttpJsonRpcClient:
    url: str
    protocol_version: str = MCP_PROTOCOL_VERSION
    _next_id: int = 0

    def __enter__(self) -> "HttpJsonRpcClient":
        self.initialize()
        return self

    def __exit__(self, exc_type: Any, exc: Any, tb: Any) -> None:
        return None

    def _request(self, method: str, params: dict[str, Any]) -> dict[str, Any]:
        self._next_id += 1
        payload = {
            "jsonrpc": "2.0",
            "id": self._next_id,
            "method": method,
            "params": params,
        }
        request = urllib.request.Request(
            self.url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request) as response:
                result = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            detail = error.read().decode("utf-8", errors="replace")
            raise McpClientError(f"HTTP MCP request failed: {error.code} {detail}") from error
        except urllib.error.URLError as error:
            raise McpClientError(f"HTTP MCP request failed: {error}") from error
        if result.get("error"):
            raise McpClientError(f"MCP error response: {result['error']}")
        return result

    def initialize(self) -> None:
        self._request(
            "initialize",
            {
                "protocolVersion": self.protocol_version,
                "capabilities": {},
                "clientInfo": {"name": "portfolio-sync", "version": "1.0.0"},
            },
        )

    def call_tool(self, name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        response = self._request("tools/call", {"name": name, "arguments": arguments})
        return response.get("result") or {}


class StdioMcpClient:
    def __init__(
        self,
        command: str,
        *,
        protocol_version: str = MCP_PROTOCOL_VERSION,
        extra_env: dict[str, str] | None = None,
    ) -> None:
        self.command = shlex.split(command)
        if not self.command:
            raise McpClientError("MCP command must not be empty")
        self.protocol_version = protocol_version
        self.extra_env = extra_env or {}
        self._next_id = 0
        self.process: subprocess.Popen[bytes] | None = None

    def __enter__(self) -> "StdioMcpClient":
        env = os.environ.copy()
        env.update(self.extra_env)
        self.process = subprocess.Popen(
            self.command,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
        )
        self.initialize()
        return self

    def __exit__(self, exc_type: Any, exc: Any, tb: Any) -> None:
        if self.process is None:
            return None
        try:
            if self.process.stdin:
                self.process.stdin.close()
        finally:
            self.process.terminate()
            self.process.wait(timeout=5)
        return None

    def _send(self, payload: dict[str, Any]) -> None:
        if self.process is None or self.process.stdin is None:
            raise McpClientError("MCP process is not running")
        self.process.stdin.write(_rpc_message(payload))
        self.process.stdin.flush()

    def _request(self, method: str, params: dict[str, Any]) -> dict[str, Any]:
        if self.process is None or self.process.stdout is None:
            raise McpClientError("MCP process is not running")
        self._next_id += 1
        request_id = self._next_id
        self._send({
            "jsonrpc": "2.0",
            "id": request_id,
            "method": method,
            "params": params,
        })
        while True:
            message = _read_stdio_message(self.process.stdout)
            if "id" not in message:
                continue
            if message.get("id") != request_id:
                continue
            if message.get("error"):
                raise McpClientError(f"MCP error response: {message['error']}")
            return message

    def _notify(self, method: str, params: dict[str, Any] | None = None) -> None:
        self._send({
            "jsonrpc": "2.0",
            "method": method,
            "params": params or {},
        })

    def initialize(self) -> None:
        self._request(
            "initialize",
            {
                "protocolVersion": self.protocol_version,
                "capabilities": {},
                "clientInfo": {"name": "portfolio-sync", "version": "1.0.0"},
            },
        )
        self._notify("notifications/initialized")

    def call_tool(self, name: str, arguments: dict[str, Any]) -> dict[str, Any]:
        response = self._request("tools/call", {"name": name, "arguments": arguments})
        return response.get("result") or {}


def build_mcp_client(prefix: str, *, extra_env: dict[str, str] | None = None) -> HttpJsonRpcClient | StdioMcpClient:
    transport = os.getenv(f"{prefix}TRANSPORT", "stdio").strip().lower()
    if transport == "http":
        url = os.getenv(f"{prefix}URL", "").strip()
        if not url:
            raise McpClientError(f"{prefix}URL must be set for HTTP transport")
        return HttpJsonRpcClient(url=url)

    command = os.getenv(f"{prefix}COMMAND", "").strip()
    if not command:
        raise McpClientError(f"{prefix}COMMAND must be set for stdio transport")
    return StdioMcpClient(command, extra_env=extra_env)
