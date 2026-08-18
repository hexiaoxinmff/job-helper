// egress-test: 验证 CloudBase 体验版云函数能否访问公网（出网能力）
// Nodejs18.15 内置全局 fetch
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";

exports.main = async (event, context) => {
  const out = { runtime: process.version, steps: {} };

  // 1) 纯出网探测：访问一个不依赖 key 的公网 HTTPS 站点
  try {
    const t0 = Date.now();
    const r = await fetch("https://www.baidu.com", { method: "GET" });
    const txt = await r.text();
    out.steps.baidu = { status: r.status, bytes: txt.length, elapsed: Date.now() - t0, ok: true };
  } catch (e) {
    out.steps.baidu = { ok: false, error: String(e).slice(0, 300) };
  }

  // 2) IP 直连探测（绕过 DNS，确认是否为 DNS 问题）
  try {
    const t0 = Date.now();
    const r = await fetch("https://1.1.1.1", { method: "GET" });
    out.steps.cloudflareIp = { status: r.status, elapsed: Date.now() - t0, ok: true };
  } catch (e) {
    out.steps.cloudflareIp = { ok: false, error: String(e).slice(0, 300) };
  }

  // 3) DeepSeek API 调用（验证真实 AI 链路，需 key）
  if (!DEEPSEEK_API_KEY) {
    out.steps.deepseek = { ok: false, error: "DEEPSEEK_API_KEY 未设置" };
  } else {
    try {
      const t0 = Date.now();
      const r = await fetch(`${BASE_URL}/models`, {
        method: "GET",
        headers: { Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
      });
      const body = await r.text();
      out.steps.deepseek = {
        status: r.status,
        bytes: body.length,
        elapsed: Date.now() - t0,
        ok: r.status === 200,
      };
    } catch (e) {
      out.steps.deepseek = { ok: false, error: String(e).slice(0, 300) };
    }
  }

  out.egressOverall = out.steps.baidu.ok ? "OK" : "FAIL";
  return out;
};
