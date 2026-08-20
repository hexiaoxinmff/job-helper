# 生成真实中文简历测试 PDF（验证 PDF 解析 + 评分全链路）
import sys
from fpdf import FPDF

RESUME_TEXT = """张三  求职简历

教育背景：本科  数据科学与大数据技术专业

技能：Python SQL 机器学习 数据分析 pandas numpy excel

项目经历：使用 python 和 pandas 对电商订单数据做分析，提升转化率 30%

实习经历：在某公司数据部门实习 3 个月，负责数据报表开发

团队协作：5 人团队中负责数据清洗与可视化
"""


def main():
    pdf = FPDF()
    pdf.add_page()
    # 使用系统中文字体（微软雅黑）
    pdf.add_font("msyh", "", r"C:\Windows\Fonts\msyh.ttc", uni=True)
    pdf.set_font("msyh", size=14)
    for line in RESUME_TEXT.strip().splitlines():
        if line.strip():
            pdf.multi_cell(0, 8, line)
        else:
            pdf.ln(4)
    out = "scripts/test-resume-cn.pdf"
    pdf.output(out)
    print(f"written: {out}, size={__import__('os').path.getsize(out)}")


if __name__ == "__main__":
    sys.exit(main())
