// 给 @theme 块中所有 var(--jh-XXX) 引用加 hex fallback（防变量解析失效样式丢失）
// 从 :root 块提取 --jh-* : hex 映射；@theme 中 var(--jh-X) → var(--jh-X, #hex)
const fs = require("fs");
const file = "F:/WorkBuddyData/全栈式开发 web/job-helper/app/globals.css";
let css = fs.readFileSync(file, "utf8");

// 提取 :root 块中的 --jh-* : hex 映射
const rootMatch = css.match(/:root\s*\{([\s\S]*?)\}/);
if (!rootMatch) { console.log("no :root"); process.exit(1); }
const rootBody = rootMatch[1];
const jhMap = {};
for (const m of rootBody.matchAll(/--jh-([a-z0-9-]+):\s*([^;]+);/g)) {
  const name = "--jh-" + m[1];
  let v = m[2].trim();
  // 跳过引用其他 var 的复杂值（fallback 用最后一级 hex 即可，但复杂链难追）
  // 对非复合值（rgb()/hex）才设 fallback
  if (/^#[0-9a-fA-F]{3,8}$/.test(v) || /^rgb\(|^rgba\(|^hsl\(|^hsla\(/.test(v)) {
    jhMap[name] = v;
  }
}
console.log("mapped jh vars (hex values):", Object.keys(jhMap).length);

// 定位 @theme 块（普通模式，非 inline）；可能有多个
function addFallback(block) {
  let out = block;
  // 对每个 jh var 找到所有 var(--jh-X) 引用加 fallback
  for (const [name, hex] of Object.entries(jhMap)) {
    // 形如 var(--jh-primary-600) 未带 fallback；var(--jh-primary-600, anything) 已带，跳过
    const re = new RegExp("var\\(" + name.replace(/[-]/g, "\\-") + "\\)(?!\\s*,)", "g");
    out = out.replace(re, `var(${name}, ${hex})`);
  }
  return out;
}
css = css.replace(/@theme\s*\{([\s\S]*?)\n\}/g, (m, body) => "@theme {" + addFallback(body) + "\n}");

// 写回（保留 .dark 不变；只 @theme 改）
fs.writeFileSync(file, css, "utf8");
console.log("done. file:", file);
