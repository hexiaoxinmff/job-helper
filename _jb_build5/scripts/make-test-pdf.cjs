// 生成测试 PDF 简历（含文本层，用于验证解析链路）
const fs = require("fs");

function esc(s) {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

const text = [
  "张三 求职简历",
  "教育背景：本科 数据科学与大数据技术专业",
  "技能：Python SQL 机器学习 数据分析 pandas numpy excel",
  "项目经历：使用 python 和 pandas 对电商订单数据做分析，提升转化率 30%",
  "实习经历：在某公司数据部门实习 3 个月，负责数据报表开发",
  "团队协作：5 人团队中负责数据清洗与可视化",
].join("\n");

const lines = text.split("\n");
let content = "";
let y = 780;
lines.forEach((l) => {
  content += `BT /F1 14 Tf 50 ${y} Td (${esc(l)}) Tj ET\n`;
  y -= 30;
});

const pdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length ${content.length} >> stream
${content}endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
trailer << /Size 6 /Root 1 0 R >>
startxref
0
%%EOF`;

fs.writeFileSync(__dirname + "/test-resume.pdf", pdf);
console.log("test-resume.pdf written, size:", pdf.length);
