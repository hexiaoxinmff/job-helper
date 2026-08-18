// PDF 文本解析：使用 unpdf（内置 pdf.js，无 worker 兼容问题，适配 serverless 环境）
import { Buffer } from "node:buffer";
import { extractText, getDocumentProxy } from "unpdf";

/**
 * 从 PDF 文件缓冲区提取文本内容。
 * @param fileBuffer PDF 文件的 Buffer
 * @returns 提取的纯文本（可能为空字符串）
 */
export async function extractTextFromPdf(fileBuffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(fileBuffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

/** 校验文件是否像 PDF（魔数 %PDF） */
export function looksLikePdf(fileBuffer: Buffer): boolean {
  const head = fileBuffer.subarray(0, 5).toString("ascii");
  return head === "%PDF-";
}
