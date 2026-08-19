import StarGenerator from "@/components/StarGenerator";

export const metadata = {
  title: "STAR 描述生成器 - 求职在线助手",
  description:
    "输入一句经历，AI 扩写为「情境-任务-行动-结果」的简历亮点句式。免费、隐私安全。",
};

export default function StarPage() {
  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-md py-2xl">
      <header className="text-center mb-2xl">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">STAR 描述生成器</h1>
        <p className="mt-sm text-neutral-600 dark:text-neutral-300">
          一段经历 → 一句能写进简历的亮点。AI 帮你按 STAR 法则扩写
        </p>
      </header>
      <StarGenerator />
    </main>
  );
}
