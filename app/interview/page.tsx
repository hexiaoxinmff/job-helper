import InterviewClient from "./InterviewClient";

export const metadata = {
  title: "求职在线助手 - AI 模拟面试",
  description:
    "基于你的简历、目标岗位 JD 与诊断出的差距，AI 生成针对性追问，作答后即时点评并给参考回答。免费、隐私安全。",
};

export default function InterviewPage() {
  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-10">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">AI 模拟面试</h1>
        <p className="mt-3 text-neutral-600 dark:text-neutral-300">
          针对你的简历与诊断缺口生成追问，作答后 AI 点评 + 参考回答——先练后战
        </p>
      </header>
      <InterviewClient />
    </main>
  );
}
