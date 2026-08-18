import { NextRequest, NextResponse } from "next/server";
import { generateStarDescription } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/star
 * 接收 JSON：{ experience: string }
 * 将一段经历描述扩写为 STAR 句式，返回 { star, parts, tips }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const experience = (body?.experience as string | undefined)?.trim() ?? "";

    if (!experience) {
      return NextResponse.json({ error: "请先输入一段经历描述" }, { status: 400 });
    }
    if (experience.length < 5) {
      return NextResponse.json(
        { error: "经历描述过短，请至少写一句话（如「负责电商订单数据分析」）" },
        { status: 400 }
      );
    }

    const starResult = await generateStarDescription(experience);
    if (!starResult) {
      return NextResponse.json(
        { error: "STAR 生成暂不可用：未配置 DeepSeek API Key 或服务调用失败" },
        { status: 503 }
      );
    }

    return NextResponse.json(starResult);
  } catch (err) {
    console.error("[star] unexpected error:", err);
    return NextResponse.json({ error: "服务器处理失败，请稍后重试" }, { status: 500 });
  }
}
