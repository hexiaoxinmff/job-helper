// 反向回退：命名间距类 → 数字间距类
// max-w-* 与 --spacing-* 在 Tailwind v4 共享 namespace，命名 spacing 会污染 max-w 档位
// 间距仍由 Tailwind 默认 --spacing 基础 CSS 变量驱动（数字类 = calc(var(--spacing)*N)）
const fs = require("fs");
const path = require("path");

const ROOT = "F:/WorkBuddyData/全栈式开发 web/job-helper";
const TARGETS = ["app", "components"];

const REV = {
  "xs": "2", "sm": "3", "md": "4", "lg": "6", "xl": "8",
  "2xl": "10", "3xl": "12", "4xl": "16",
};
const PREFIXES = [
  "p", "m", "px", "py", "ps", "pe", "pt", "pr", "pb", "pl",
  "mt", "mr", "mb", "ml", "mx", "my",
  "gap-x", "gap-y", "gap",
  "space-x", "space-y",
];

let files = 0, lines = 0;
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === ".next" || e.name === "out" || e.name === ".build-tmp") continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f);
    else if (e.name.endsWith(".tsx") || e.name.endsWith(".ts")) {
      const before = fs.readFileSync(f, "utf8");
      let after = before;
      for (const p of PREFIXES) {
        for (const [name, num] of Object.entries(REV)) {
          const re = new RegExp(`\\b${p}-${name}(?![a-z0-9-])`, "g");
          after = after.replace(re, `${p}-${num}`);
        }
      }
      if (after !== before) {
        fs.writeFileSync(f, after, "utf8");
        files++;
        const b = before.split("\n"), a = after.split("\n");
        for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) lines++;
        console.log("rev:", path.relative(ROOT, f));
      }
    }
  }
}
for (const t of TARGETS) walk(path.join(ROOT, t));
console.log(`\nDONE: ${files} files, ${lines} lines`);
