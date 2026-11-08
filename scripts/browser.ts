import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

// Owner smoke opens the real collapsed editor before exercising its session-protected actions.
export async function openBrowser(base: string, cookie: string) {
  const chrome = [process.env.CHROME_PATH, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "/usr/bin/google-chrome", "/usr/bin/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find(value => value && existsSync(value));
  if (!chrome) throw new Error("Owner UI smoke needs Chrome/Edge; set CHROME_PATH if necessary.");
  const profile = resolve(".taste-skill/owner-smoke-browser");
  await mkdir(profile, { recursive: true });
  const child = spawn(chrome, ["--headless=new", "--remote-debugging-port=0", "--no-first-run", `--user-data-dir=${profile}`, "about:blank"], { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
  const deadline = setTimeout(() => child.kill(), 60000);
  try {
    const endpoint = await new Promise<string>((resolveEndpoint, reject) => {
      let output = "";
      child.stderr?.on("data", chunk => { output += chunk; const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/); if (match) resolveEndpoint(match[1]); });
      child.on("error", reject);
      child.on("exit", () => reject(new Error("Browser exited before its debugger was ready.")));
    });
    const target = await (await fetch(`http://${new URL(endpoint).host}/json/new?about:blank`, { method: "PUT" })).json();
    const socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise<void>((ready, reject) => { socket.addEventListener("open", () => ready(), { once: true }); socket.addEventListener("error", reject, { once: true }); });
    let next = 0;
    const pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();
    socket.addEventListener("message", event => {
      const message = JSON.parse(String(event.data));
      const callback = pending.get(message.id);
      if (!callback) return;
      pending.delete(message.id);
      if (message.error) callback.reject(new Error(message.error.message)); else callback.resolve(message.result);
    });
    socket.addEventListener("close", () => { for (const callback of pending.values()) callback.reject(new Error("Browser closed.")); pending.clear(); });
    const send = <T = unknown>(method: string, params: object = {}) => new Promise<T>((success, reject) => {
      const id = ++next;
      pending.set(id, { resolve: value => success(value as T), reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async <T = unknown>(expression: string): Promise<T> => {
      const result = await send<{ result: { value: T }; exceptionDetails?: { exception?: { description?: string } } }>("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description?.split("\n")[0] ?? "Browser evaluation failed.");
      return result.result.value;
    };
    const wait = async (expression: string) => {
      const end = Date.now() + 15000;
      while (!await evaluate(`Boolean(${expression})`)) {
        if (Date.now() > end) throw new Error(`Timed out waiting for ${expression}`);
        await new Promise(ready => setTimeout(ready, 100));
      }
    };
    await send("Runtime.enable");
    const separator = cookie.indexOf("=");
    await send("Network.setCookie", { name: cookie.slice(0, separator), value: cookie.slice(separator + 1), url: base, httpOnly: true, sameSite: "Lax" });
    await send("Page.navigate", { url: `${base}/dashboard` });
    const onEvent = (method: string, listener: (params: Record<string, unknown>) => void) => {
      const handle = (event: MessageEvent) => { const message = JSON.parse(String(event.data)); if (message.method === method) listener(message.params); };
      socket.addEventListener("message", handle);
      return () => socket.removeEventListener("message", handle);
    };
    return { send, evaluate, wait, onEvent, close: async () => { await send("Browser.close").catch(() => {}); socket.close(); clearTimeout(deadline); child.kill(); } };
  } catch (error) { clearTimeout(deadline); child.kill(); throw error; }
}
