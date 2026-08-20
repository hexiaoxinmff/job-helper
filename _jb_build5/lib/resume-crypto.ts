// 简历加密（完整云同步）：简历全文在浏览器端用 AES-256-GCM 加密后上云。
// 密钥随机生成、仅存本地（可导出携带、可导入恢复）；云端与任何人拿到密文也无法解密。
// 仅浏览器可用（依赖 crypto.subtle），Node/SSR 不调用。
//
// 密文格式：base64( iv(12B) || ciphertext )，密钥格式：base64( 32B raw key )

const IV_LEN = 12;
const KEY_LEN = 32; // AES-256

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i] ?? 0);
  return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    const code = bin.charCodeAt(i);
    out[i] = code;
  }
  return out;
}

/** 复制到独立 ArrayBuffer（规避 TS 对 Uint8Array<ArrayBufferLike> 与 BufferSource 的类型摩擦） */
function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  return u8.slice().buffer as ArrayBuffer;
}

/** 生成随机 32 字节密钥（base64） */
export async function generateResumeKey(): Promise<string> {
  const key = crypto.getRandomValues(new Uint8Array(KEY_LEN));
  return bytesToBase64(key);
}

/** 校验密钥格式是否合法（base64 且 32 字节） */
export function isResumeKeyValid(key: string): boolean {
  if (!key || typeof key !== "string") return false;
  try {
    const bytes = base64ToBytes(key.trim());
    return bytes.length === KEY_LEN;
  } catch {
    return false;
  }
}

async function importKey(b64key: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    toArrayBuffer(base64ToBytes(b64key.trim())),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

/** 加密 JSON 字符串 → base64(iv+ciphertext) */
export async function encryptJson(key: string, json: string): Promise<string> {
  const cryptoKey = await importKey(key);
  const ivBytes = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const iv = toArrayBuffer(ivBytes);
  const data = toArrayBuffer(new TextEncoder().encode(json));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, data);
  const out = new Uint8Array(IV_LEN + cipher.byteLength);
  out.set(new Uint8Array(iv), 0);
  out.set(new Uint8Array(cipher), IV_LEN);
  return bytesToBase64(out);
}

/** 解密 base64(iv+ciphertext) → JSON 字符串；密钥错误或数据损坏抛错 */
export async function decryptJson(key: string, payload: string): Promise<string> {
  const bytes = base64ToBytes(payload.trim());
  if (bytes.length < IV_LEN + 16) throw new Error("密文格式不正确");
  const cryptoKey = await importKey(key);
  const iv = toArrayBuffer(bytes.slice(0, IV_LEN));
  const cipher = toArrayBuffer(bytes.slice(IV_LEN));
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptoKey, cipher);
  return new TextDecoder().decode(plain);
}
