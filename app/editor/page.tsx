import EditorClient from "./EditorClient";

export const metadata = {
  title: "简历编辑器 - 求职在线助手",
  description: "6 套模板在线编辑简历，自动保存本地浏览器，一键预览导出 PDF。免费、隐私安全。",
};

export default function Page() {
  return <EditorClient />;
}
