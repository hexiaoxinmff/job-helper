import PreviewClient from "./PreviewClient";

export const metadata = {
  title: "简历预览与导出 - 求职在线助手",
  description: "白底简历预览，浏览器打印导出 PDF。支持 6 套模板。",
};

export default function Page() {
  return <PreviewClient />;
}
