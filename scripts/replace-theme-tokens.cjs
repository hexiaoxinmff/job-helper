// 主题 token 全量替换脚本：把 Tailwind 内置色板类名替换为语义变量类名。
// 仅改 className 字符串里的 token，不动任何逻辑/结构。
const fs = require("fs");
const path = require("path");

const ROOT = "F:/WorkBuddyData/全栈式开发 web/job-helper";
const TARGETS = ["app", "components"];

// 色板替换：旧前缀 -> 新前缀（档位值不变，视觉零变化）
const PALETTE = [
  ["slate", "neutral"],
  ["blue", "primary"],
  ["red", "danger"],
  ["emerald", "success"],
  ["amber", "warning"],
  ["sky", "info"],
  ["purple", "accent"],
];

// 间距替换：数字 -> 语义命名（仅当数字后不跟 . / 数字，避免 p-2.5、p-20 被误伤）
const SPACE = {
  "2": "xs",
  "3": "sm",
  "4": "md",
  "6": "lg",
  "8": "xl",
  "10": "2xl",
  "12": "3xl",
  "16": "4xl",
};
const SPACE_PREFIXES = [
  "p", "m", "px", "py", "ps", "pe", "pt", "pr", "pb", "pl",
  "mt", "mr", "mb", "ml", "mx", "my",
  "gap-x", "gap-y", "gap",
  "space-x", "space-y",
];

function replacePalette(text) {
  let out = text;
  for (const [from, to] of PALETTE) {
    // \b{from}-(?=\d)：色板名后必须紧跟数字档位（避免误伤 white/black 等）
    out = out.replace(new RegExp(`\\b${from}-(?=[0-9])`, "g"), `${to}-`);
  }
  return out;
}

function replaceSpace(text) {
  let out = text;
  for (const prefix of SPACE_PREFIXES) {
    for (const [num, name] of Object.entries(SPACE)) {
      // 边界：(前缀)-(数字) 且数字后不是 . 或数字
      const re = new RegExp(`\\b${prefix}-${num}(?![0-9.])`, "g");
      out = out.replace(re, `${prefix}-${name}`);
    }
  }
  return out;
}

let changedFiles = 0;
let changedCount = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === "out") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
      const before = fs.readFileSync(full, "utf8");
      const afterPalette = replacePalette(before);
      const after = replaceSpace(afterPalette);
      if (after !== before) {
        fs.writeFileSync(full, after, "utf8");
        changedFiles++;
        // 统计变更行数
        const bLines = before.split("\n");
        const aLines = after.split("\n");
        for (let i = 0; i < aLines.length; i++) {
          if (bLines[i] !== aLines[i]) changedCount++;
        }
        console.log("changed:", path.relative(ROOT, full));
      }
    }
  }
}

for (const t of TARGETS) walk(path.join(ROOT, t));
console.log(`\nDONE: ${changedFiles} files, ${changedCount} lines changed`);
