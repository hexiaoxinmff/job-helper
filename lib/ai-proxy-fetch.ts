import { getTurnstileToken } from "@/components/TurnstileWidget";

/** Shared transport for AI actions and sync actions on /api/ai-proxy. */
export async function fetchAiProxy(url: string, init: RequestInit): Promise<Response> {
  let token = await getTurnstileToken().catch((error) => {
    console.warn("[turnstile] 获取 token 失败", error);
    return "";
  });

  for (let attempt = 0; attempt < 2; attempt++) {
    const headers = new Headers(init.headers);
    headers.set("cf-turnstile-token", token);
    const response = await fetch(url, { ...init, headers });
    if (response.status !== 403 || attempt === 1) return response;

    const data = await response.clone().json().catch(() => null);
    if (data?.error !== "turnstile_required" && data?.error !== "turnstile_failed") return response;
    try {
      token = await getTurnstileToken(true);
    } catch (error) {
      console.warn("[turnstile] 重新验证失败", error);
      return response;
    }
  }
  throw new Error("Turnstile 请求重试异常");
}
