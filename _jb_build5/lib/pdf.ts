// PDF 文本解析（浏览器端）：unpdf 在浏览器内无 worker 兼容问题。
// 注意：不再依赖 node:buffer，直接吃 Uint8Array。
import { extractText, getDocumentProxy } from "unpdf";

/**
 * 从 PDF 文件字节提取文本内容。
 * @param data 由 File.arrayBuffer() 得到的 Uint8Array
 */
export async function extractTextFromPdf(data: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(data);
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

/** 校验字节是否像 PDF（魔数 %PDF） */
export function looksLikePdf(data: Uint8Array): boolean {
  const head = new TextDecoder().decode(data.subarray(0, 5));
  return head === "%PDF-";
}
