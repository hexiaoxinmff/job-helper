import type { CSSProperties } from "react";
import type { Resume, SectionKey } from "@/lib/types";

/** 板块可见性辅助：visibility 缺省视为显示 */
function visible(resume: Resume, key: SectionKey) {
  return resume.visibility[key] !== false;
}

// ================= 公共组件 =================

/** 头像框：有照片显示图片，无照片显示占位 */
function AvatarFrame({ resume, style }: { resume: Resume; style?: CSSProperties }) {
  const base: CSSProperties = {
    width: 72,
    height: 90,
    border: "1.5px dashed #b0b7c3",
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "repeating-linear-gradient(45deg,#f5f6f8,#f5f6f8 6px,#eef0f3 6px,#eef0f3 12px)",
    color: "#9aa3b2",
    fontSize: 10.5,
    textAlign: "center",
    lineHeight: 1.4,
    flexShrink: 0,
    overflow: "hidden",
    ...style,
  };
  if (resume.avatar) {
    return (
      <div style={{ ...base, border: "1.5px solid #cbd5e1", background: "#fff" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- 本地 dataURL 头像，静态导出不适用 next/image */}
        <img src={resume.avatar} alt="头像" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  return (
    <div style={base}>
      <span>
        头像
        <br />
        （1-2 寸照）
      </span>
    </div>
  );
}

/** 联系方式（带标签，flex 换行） */
function ContactLine({ resume, style }: { resume: Resume; style?: CSSProperties }) {
  const b = resume.basics;
  const items = [
    b.phone && `电话：${b.phone}`,
    b.birth && `出生年月：${b.birth}`,
    b.email && `邮箱：${b.email}`,
    b.sex && `性别：${b.sex}`,
    b.location && `城市：${b.location}`,
    b.website && `GitHub：${b.website}`,
  ].filter(Boolean) as string[];
  if (items.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 16px", fontSize: 11, color: "#4b5563", ...style }}>
      {items.map((it, i) => (
        <span key={i}>{it}</span>
      ))}
    </div>
  );
}

/** 章节标题（带色块）+ 内容 */
function Sec({
  title,
  accent,
  secBg,
  children,
}: {
  title: string;
  accent: string;
  secBg?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginTop: 14, ...(secBg ? { padding: "10px 14px", borderRadius: 8, background: secBg } : {}) }}>
      <h3
        style={{
          fontSize: 14,
          fontWeight: 800,
          color: accent,
          marginBottom: 7,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ width: 4, height: 14, background: accent, borderRadius: 2, display: "inline-block" }} />
        {title}
      </h3>
      {children}
    </div>
  );
}

/** 通用小字条目行 */
function Item({ head, time, children }: { head: string; time?: string; children?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
        <span style={{ fontSize: 12.5, fontWeight: 700 }}>{head}</span>
        {time && <span style={{ fontSize: 10.5, color: "#6b7280", whiteSpace: "nowrap" }}>{time}</span>}
      </div>
      {children}
    </div>
  );
}

function Bullets({ items, bulletColor = "#9aa3b2" }: { items: string[]; bulletColor?: string }) {
  if (items.length === 0) return null;
  return (
    <ul style={{ listStyle: "none", marginTop: 2 }}>
      {items.map((it, i) => (
        <li key={i} style={{ fontSize: 11, color: "#4b5563", lineHeight: 1.5, paddingLeft: 11, position: "relative" }}>
          <span style={{ position: "absolute", left: 0, color: bulletColor }}>•</span>
          {it}
        </li>
      ))}
    </ul>
  );
}

function Desc({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 11, color: "#4b5563", marginTop: 2, lineHeight: 1.5 }}>{children}</p>;
}

function Tags({ children, style }: { children: React.ReactNode; style?: CSSProperties }) {
  return <div style={{ fontSize: 11, color: "#4b5563", lineHeight: 1.7, ...style }}>{children}</div>;
}

// ================= 内容块 =================

function AdvantagesItems({ resume, bulletColor }: { resume: Resume; bulletColor?: string }) {
  if (!visible(resume, "advantages") || resume.advantages.length === 0) return null;
  return <Bullets items={resume.advantages} bulletColor={bulletColor} />;
}

function EduItems({ resume, join = "　" }: { resume: Resume; join?: string }) {
  if (!visible(resume, "education") || resume.education.length === 0) return null;
  return (
    <>
      {resume.education.map((e) => (
        <Item key={e.id} head={`${e.school}${join}${e.major}${join}${e.degree}`} time={`${e.startDate} - ${e.endDate}`}>
          {e.description && <Desc>{e.description}</Desc>}
        </Item>
      ))}
    </>
  );
}

function ProjectItems({ resume, join = "　" }: { resume: Resume; join?: string }) {
  if (!visible(resume, "projects") || resume.projects.length === 0) return null;
  return (
    <>
      {resume.projects.map((p) => (
        <Item key={p.id} head={`${p.name}${join}${p.role}`} time={`${p.startDate} - ${p.endDate}`}>
          {p.link && <Desc>{p.link}</Desc>}
          <Bullets items={p.bullets} />
        </Item>
      ))}
    </>
  );
}

function ActivityItems({ resume, join = "　" }: { resume: Resume; join?: string }) {
  if (!visible(resume, "activities") || resume.activities.length === 0) return null;
  return (
    <>
      {resume.activities.map((a) => (
        <Item key={a.id} head={`${a.org}${join}${a.role}`} time={`${a.startDate} - ${a.endDate}`}>
          {a.description && <Desc>{a.description}</Desc>}
        </Item>
      ))}
    </>
  );
}

function SkillsBlock({ resume }: { resume: Resume }) {
  const has =
    (visible(resume, "skills") && resume.skills.length > 0) ||
    (visible(resume, "languages") && resume.languages.length > 0) ||
    (visible(resume, "awards") && resume.awards.length > 0);
  if (!has) return null;
  return (
    <Tags>
      {visible(resume, "skills") &&
        resume.skills.map((s) => (
          <div key={s.id}>
            <b>{s.category}：</b>
            {s.items.join(" / ")}
          </div>
        ))}
      {visible(resume, "languages") && resume.languages.length > 0 && (
        <div>
          <b>语言：</b>
          {resume.languages.map((l) => `${l.language}（${l.level || "熟练"}）`).join(" / ")}
        </div>
      )}
      {visible(resume, "awards") && resume.awards.length > 0 && (
        <div>
          <b>荣誉：</b>
          {resume.awards.map((a) => `${a.name}${a.date ? `（${a.date}）` : ""}`).join(" / ")}
        </div>
      )}
    </Tags>
  );
}

function PortfolioItems({ resume, join = "　" }: { resume: Resume; join?: string }) {
  if (!visible(resume, "portfolio") || resume.portfolio.length === 0) return null;
  return (
    <>
      {resume.portfolio.map((p) => (
        <Item key={p.id} head={`${p.name}${join}${p.link}`}>
          {p.description && <Desc>{p.description}</Desc>}
        </Item>
      ))}
    </>
  );
}

// ================= 单栏工厂 =================

interface SingleOpts {
  accent: string;
  titleColor: string;
  topStyle: CSSProperties;
  avatarStyle?: CSSProperties;
  secBg?: string;
  roleColor?: string;
  contactColor?: string;
  bodyPad?: CSSProperties;
  baseFont?: number;
  bulletColor?: string;
}

/** 标准单栏模板（头部 + 简介/优势/教育/项目/校园/技能/作品集） */
function makeSingle({ accent, titleColor, topStyle, avatarStyle, secBg, roleColor, contactColor, bodyPad, baseFont, bulletColor }: SingleOpts) {
  return function SingleTemplate({ resume }: { resume: Resume }) {
    const b = resume.basics;
    const scale = baseFont ? baseFont / 16 : 1;
    const fs = (n: number) => n * scale;
    return (
      <div style={{ padding: "32px 44px 26px", minHeight: "100%", fontSize: baseFont ?? 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 18, ...topStyle }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: fs(26), fontWeight: 800, color: titleColor }}>{b.name || "你的名字"}</div>
            {b.title && (
              <div style={{ fontSize: fs(12.5), color: roleColor ?? accent, fontWeight: 600, marginTop: 2 }}>
                求职意向：{b.title}
              </div>
            )}
            <ContactLine resume={resume} style={{ marginTop: 6, color: contactColor, fontSize: fs(11) }} />
          </div>
          <AvatarFrame resume={resume} style={avatarStyle} />
        </div>
        <div style={bodyPad}>
          {b.summary && <Sec title="个人简介" accent={accent} secBg={secBg}><Desc>{b.summary}</Desc></Sec>}
          <Sec title="个人优势" accent={accent} secBg={secBg}>
            <AdvantagesItems resume={resume} bulletColor={bulletColor} />
          </Sec>
          <Sec title="教育背景" accent={accent} secBg={secBg}>
            <EduItems resume={resume} />
          </Sec>
          <Sec title="项目经历" accent={accent} secBg={secBg}>
            <ProjectItems resume={resume} />
          </Sec>
          <Sec title="校园经历" accent={accent} secBg={secBg}>
            <ActivityItems resume={resume} />
          </Sec>
          <Sec title="技能证书" accent={accent} secBg={secBg}>
            <SkillsBlock resume={resume} />
            <PortfolioItems resume={resume} />
          </Sec>
        </div>
      </div>
    );
  };
}

// ================= 独立模板 =================

/** ① 时间轴（蓝点时间轴，何钊新 PDF 版式） */
function TimelineTemplate({ resume }: { resume: Resume }) {
  const b = resume.basics;
  return (
    <div style={{ display: "flex", minHeight: "100%", color: "#1f2937" }}>
      <div style={{ width: 9, background: "#4f81bd" }} />
      <div style={{ flex: 1, padding: "0 34px 26px", position: "relative" }}>
        <div style={{ position: "absolute", left: 20, top: 0, bottom: 0, width: 2, background: "#4f81bd" }} />
        {/* 顶部双条 */}
        <div style={{ display: "flex", margin: "14px 0 0 -34px" }}>
          <div style={{ background: "#4f81bd", color: "#fff", fontWeight: 700, fontSize: 13, padding: "5px 16px 5px 40px" }}>
            个人简历
          </div>
          <div
            style={{
              flex: 1,
              background: "#eee",
              color: "#4f81bd",
              fontSize: 9,
              letterSpacing: "0.4em",
              padding: "7px 12px",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            PERSONAL RESUME
          </div>
        </div>
        {/* 头部：姓名 + 头像右侧 */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 18, marginTop: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{b.name || "你的名字"}</div>
            {b.title && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>求职意向：{b.title}</div>}
            <ContactLine resume={resume} style={{ marginTop: 7, fontSize: 11.5 }} />
          </div>
          <AvatarFrame resume={resume} />
        </div>
        {/* 章节 */}
        <TimelineSec title="个人优势">
          <AdvantagesItems resume={resume} />
        </TimelineSec>
        <TimelineSec title="教育背景">
          <EduItems resume={resume} />
        </TimelineSec>
        <TimelineSec title="项目经历">
          <ProjectItems resume={resume} />
        </TimelineSec>
        <TimelineSec title="校园经历">
          <ActivityItems resume={resume} />
        </TimelineSec>
        <TimelineSec title="技能及证书">
          <SkillsBlock resume={resume} />
          <PortfolioItems resume={resume} />
        </TimelineSec>
      </div>
    </div>
  );
}

function TimelineSec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ position: "relative", marginTop: 12, paddingLeft: 34 }}>
      <div
        style={{
          position: "absolute",
          left: 13,
          top: 3,
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: "#4f81bd",
          border: "2.5px solid #fff",
          boxShadow: "0 0 0 1px #4f81bd",
        }}
      />
      <h3
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 16.5,
          fontWeight: 700,
          marginBottom: 7,
        }}
      >
        {title}
        <span style={{ flex: 1, height: 1, background: "#d9d9d9" }} />
      </h3>
      {children}
    </section>
  );
}

/** ⑨ 极简 IT（等宽字体 + 终端感） */
function ItMinimalTemplate({ resume }: { resume: Resume }) {
  const b = resume.basics;
  const tags = resume.skills.flatMap((s) => s.items);
  return (
    <div
      style={{
        padding: "34px 42px 26px",
        minHeight: "100%",
        fontFamily: "'SF Mono',Consolas,'Courier New',monospace",
        color: "#111",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 18, borderBottom: "2px solid #111", paddingBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 26, fontWeight: 800 }}>{b.name || "你的名字"}</div>
          {b.title && <div style={{ fontSize: 12, color: "#1a73e8", fontWeight: 600, marginTop: 2 }}>{'// 求职意向：'}{b.title}</div>}
          <ContactLine resume={resume} style={{ marginTop: 6, fontSize: 10.5, color: "#333" }} />
        </div>
        <AvatarFrame resume={resume} style={{ borderColor: "#999", borderRadius: 2 }} />
      </div>
      {b.summary && <ItSec title="个人简介"><Desc>{b.summary}</Desc></ItSec>}
      <ItSec title="个人优势"><AdvantagesItems resume={resume} /></ItSec>
      <ItSec title="教育背景"><EduItems resume={resume} /></ItSec>
      <ItSec title="项目经历"><ProjectItems resume={resume} /></ItSec>
      <ItSec title="校园经历"><ActivityItems resume={resume} /></ItSec>
      <ItSec title="技能栈">
        {tags.length > 0 && (
          <div>
            {tags.map((t, i) => (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  fontSize: 10,
                  color: "#1a73e8",
                  border: "1px solid #cfe0fb",
                  background: "#f2f7ff",
                  padding: "1px 7px",
                  borderRadius: 3,
                  margin: "2px 3px 0 0",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </ItSec>
      <ItSec title="语言与荣誉">
        <SkillsBlock resume={resume} />
      </ItSec>
    </div>
  );
}

function ItSec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 14 }}>
      <h3 style={{ fontSize: 12, fontWeight: 700, color: "#1a73e8", marginBottom: 7, letterSpacing: "0.1em" }}>
        <span style={{ color: "#111" }}>&gt; </span>
        {title}
      </h3>
      {children}
    </section>
  );
}

/** ⑤ 紧凑单页（高密度小字号） */
function DenseTemplate({ resume }: { resume: Resume }) {
  const b = resume.basics;
  return (
    <div style={{ padding: "22px 30px 18px", minHeight: "100%", fontSize: 11 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, borderBottom: "2px solid #333", paddingBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{b.name || "你的名字"}</div>
          {b.title && <div style={{ fontSize: 11.5, color: "#555", marginTop: 2 }}>求职意向：{b.title}</div>}
          <ContactLine resume={resume} style={{ marginTop: 5, fontSize: 10.5 }} />
        </div>
        <AvatarFrame resume={resume} style={{ width: 60, height: 74 }} />
      </div>
      {b.summary && <DenseSec title="个人简介"><p style={{ fontSize: 10.5, color: "#4b5563", lineHeight: 1.45 }}>{b.summary}</p></DenseSec>}
      <DenseSec title="个人优势"><AdvantagesItems resume={resume} /></DenseSec>
      <DenseSec title="教育经历"><EduItems resume={resume} /></DenseSec>
      <DenseSec title="项目经历"><ProjectItems resume={resume} /></DenseSec>
      <DenseSec title="校园经历"><ActivityItems resume={resume} /></DenseSec>
      <DenseSec title="技能证书"><SkillsBlock resume={resume} /><PortfolioItems resume={resume} /></DenseSec>
    </div>
  );
}

function DenseSec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 9 }}>
      <h3
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: "#222",
          marginBottom: 4,
          background: "#f0f0f0",
          padding: "2px 8px",
          borderLeft: "3px solid #555",
        }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

/** ⑩ 简约商务分栏 */
function BizSplitTemplate({ resume }: { resume: Resume }) {
  const b = resume.basics;
  return (
    <div style={{ display: "flex", minHeight: "100%" }}>
      <div style={{ width: "31%", background: "#f2f3f5", padding: "28px 20px 24px", borderRight: "3px solid #1d3557" }}>
        <AvatarFrame resume={resume} />
        <SideHead title="基本信息" />
        <div style={{ fontSize: 11, color: "#333", lineHeight: 1.7, wordBreak: "break-all" }}>
          姓名：{b.name}
          <br />
          求职意向：{b.title}
          <br />📞 {b.phone}
          <br />✉ {b.email}
          <br />📍 {b.location}
          <br />🎂 {b.birth} · {b.sex}
          <br />🔗 {b.website}
        </div>
        <SideHead title="技能特长" />
        {resume.skills.map((s) => (
          <div key={s.id} style={{ marginBottom: 6 }}>
            <b style={{ display: "block", fontSize: 10.5, color: "#111" }}>{s.category}</b>
            <span style={{ fontSize: 10.5, color: "#4b5563" }}>{s.items.join(" / ")}</span>
          </div>
        ))}
        <SideHead title="语言能力" />
        <div style={{ fontSize: 11, color: "#333", lineHeight: 1.7 }}>{resume.languages.map((l) => `${l.language}（${l.level || "熟练"}）`).join("<br />")}</div>
        <SideHead title="荣誉奖项" />
        <div style={{ fontSize: 11, color: "#333", lineHeight: 1.7 }}>{resume.awards.map((a) => `${a.name} · ${a.date}`).join("<br />")}</div>
      </div>
      <div style={{ flex: 1, padding: "28px 26px 24px" }}>
        <MainHead title="个人简介" />
        <Desc>{b.summary}</Desc>
        <MainHead title="个人优势" />
        <AdvantagesItems resume={resume} bulletColor="#457b9d" />
        <MainHead title="教育背景" />
        <EduItems resume={resume} join=" · " />
        <MainHead title="项目经历" />
        <ProjectItems resume={resume} join=" · " />
        <MainHead title="校园经历" />
        <ActivityItems resume={resume} join=" · " />
      </div>
    </div>
  );
}

function SideHead({ title }: { title: string }) {
  return (
    <h2
      style={{
        fontSize: 13,
        fontWeight: 800,
        color: "#1d3557",
        letterSpacing: "0.08em",
        margin: "16px 0 8px",
        borderBottom: "2px solid #cbd2dd",
        paddingBottom: 5,
      }}
    >
      {title}
    </h2>
  );
}
function MainHead({ title }: { title: string }) {
  return (
    <h2
      style={{
        fontSize: 14,
        fontWeight: 800,
        color: "#1d3557",
        letterSpacing: "0.06em",
        margin: "0 0 8px",
        borderBottom: "2px solid #cbd2dd",
        paddingBottom: 5,
      }}
    >
      {title}
    </h2>
  );
}

/** ⑰ 侧栏深蓝 */
function SidebarNavyTemplate({ resume }: { resume: Resume }) {
  const b = resume.basics;
  return (
    <div style={{ display: "flex", minHeight: "100%" }}>
      <div style={{ width: "32%", background: "#1d3557", color: "#dfe7ee", padding: "28px 20px 24px" }}>
        <AvatarFrame
          resume={resume}
          style={{ borderColor: "#5b7a99", background: "repeating-linear-gradient(45deg,#2a4668,#2a4668 6px,#25405f 6px,#25405f 12px)", color: "#8fa9c2" }}
        />
        <NavyHead title="基本信息" />
        <div style={{ fontSize: 11, color: "#c3ced9", lineHeight: 1.7, wordBreak: "break-all" }}>
          姓名：{b.name}
          <br />
          求职意向：{b.title}
          <br />📞 {b.phone}
          <br />✉ {b.email}
          <br />📍 {b.location}
          <br />🎂 {b.birth} · {b.sex}
          <br />🔗 {b.website}
        </div>
        <NavyHead title="技能特长" />
        {resume.skills.map((s) => (
          <div key={s.id} style={{ marginBottom: 6 }}>
            <b style={{ display: "block", fontSize: 10.5, color: "#fff" }}>{s.category}</b>
            <span style={{ fontSize: 10.5, color: "#b9c6d2" }}>{s.items.join(" / ")}</span>
          </div>
        ))}
        <NavyHead title="语言能力" />
        <div style={{ fontSize: 11, color: "#c3ced9", lineHeight: 1.7 }}>{resume.languages.map((l) => `${l.language}（${l.level || "熟练"}）`).join("<br />")}</div>
        <NavyHead title="荣誉奖项" />
        <div style={{ fontSize: 11, color: "#c3ced9", lineHeight: 1.7 }}>{resume.awards.map((a) => `${a.name} · ${a.date}`).join("<br />")}</div>
      </div>
      <div style={{ flex: 1, padding: "28px 26px 24px" }}>
        <MainHead title="个人简介" />
        <Desc>{b.summary}</Desc>
        <MainHead title="个人优势" />
        <AdvantagesItems resume={resume} bulletColor="#457b9d" />
        <MainHead title="教育背景" />
        <EduItems resume={resume} join=" · " />
        <MainHead title="项目经历" />
        <ProjectItems resume={resume} join=" · " />
        <MainHead title="校园经历" />
        <ActivityItems resume={resume} join=" · " />
      </div>
    </div>
  );
}

function NavyHead({ title }: { title: string }) {
  return (
    <h2
      style={{
        fontSize: 13,
        fontWeight: 800,
        letterSpacing: "0.08em",
        color: "#fff",
        margin: "16px 0 8px",
        borderBottom: "1px solid #4a6480",
        paddingBottom: 5,
      }}
    >
      {title}
    </h2>
  );
}

/** ⑪ 时尚蓝教育（圆角渐变头图） */
function EduBlueTemplate({ resume }: { resume: Resume }) {
  const b = resume.basics;
  const tags = resume.skills.flatMap((s) => s.items);
  return (
    <div style={{ padding: "34px 44px 24px", minHeight: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          background: "linear-gradient(120deg,#1e88e5,#42a5f5)",
          color: "#fff",
          borderRadius: 14,
          padding: "20px 24px",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 25, fontWeight: 800 }}>{b.name || "你的名字"}</div>
          {b.title && <div style={{ fontSize: 12.5, color: "#e3f2fd", fontWeight: 600, marginTop: 2 }}>求职意向：{b.title}</div>}
          <ContactLine resume={resume} style={{ marginTop: 6, fontSize: 11, color: "#e3f2fd" }} />
        </div>
        <AvatarFrame
          resume={resume}
          style={{
            borderRadius: "50%",
            width: 70,
            height: 88,
            borderColor: "#b3d9f8",
            background: "repeating-linear-gradient(45deg,#2f9ff0,#2f9ff0 6px,#2a94e0 6px,#2a94e0 12px)",
            color: "#dbeafe",
          }}
        />
      </div>
      {b.summary && <Sec title="个人简介" accent="#1565c0"><Desc>{b.summary}</Desc></Sec>}
      <Sec title="个人优势" accent="#1565c0"><AdvantagesItems resume={resume} bulletColor="#42a5f5" /></Sec>
      <Sec title="教育背景" accent="#1565c0"><EduItems resume={resume} /></Sec>
      <Sec title="项目经历" accent="#1565c0"><ProjectItems resume={resume} /></Sec>
      <Sec title="校园经历" accent="#1565c0"><ActivityItems resume={resume} /></Sec>
      <Sec title="技能证书" accent="#1565c0">
        {tags.length > 0 && (
          <div style={{ marginBottom: 4 }}>
            {tags.map((t, i) => (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  fontSize: 10,
                  color: "#1565c0",
                  background: "#e8f2fd",
                  border: "1px solid #c4e0fb",
                  padding: "2px 9px",
                  borderRadius: 12,
                  margin: "2px 4px 0 0",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}
        <SkillsBlock resume={resume} />
        <PortfolioItems resume={resume} />
      </Sec>
    </div>
  );
}

/** ⑫ 深色经典商务 */
function DarkBizTemplate({ resume }: { resume: Resume }) {
  const b = resume.basics;
  return (
    <div style={{ minHeight: "100%" }}>
      <div style={{ background: "#14181d", color: "#fff", padding: "26px 42px 22px", display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 25, fontWeight: 800, letterSpacing: "0.06em" }}>{b.name || "你的名字"}</div>
          {b.title && <div style={{ fontSize: 12.5, color: "#c3c9cf", fontWeight: 600, marginTop: 2 }}>求职意向：{b.title}</div>}
          <ContactLine resume={resume} style={{ marginTop: 6, fontSize: 11, color: "#aeb5bd" }} />
        </div>
        <AvatarFrame
          resume={resume}
          style={{ borderRadius: 2, borderColor: "#5c6773", background: "repeating-linear-gradient(45deg,#262c33,#262c33 6px,#20252b 6px,#20252b 12px)", color: "#8a94a0" }}
        />
      </div>
      <div style={{ padding: "24px 42px 26px" }}>
        {b.summary && <BizSec title="个人简介"><Desc>{b.summary}</Desc></BizSec>}
        <BizSec title="个人优势"><AdvantagesItems resume={resume} bulletColor="#8a94a0" /></BizSec>
        <BizSec title="教育背景"><EduItems resume={resume} /></BizSec>
        <BizSec title="项目经历"><ProjectItems resume={resume} /></BizSec>
        <BizSec title="校园经历"><ActivityItems resume={resume} /></BizSec>
        <BizSec title="技能证书"><SkillsBlock resume={resume} /><PortfolioItems resume={resume} /></BizSec>
      </div>
    </div>
  );
}

function BizSec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 16 }}>
      <h3
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: "#14181d",
          letterSpacing: "0.12em",
          marginBottom: 8,
          borderBottom: "2px solid #d8dde2",
          paddingBottom: 6,
        }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

/** ④ 留白文艺 */
function ArtisticTemplate({ resume }: { resume: Resume }) {
  const b = resume.basics;
  return (
    <div style={{ padding: "44px 52px 30px", minHeight: "100%", position: "relative" }}>
      <AvatarFrame
        resume={resume}
        style={{ position: "absolute", top: 36, right: 52, borderColor: "#c9c2b4", background: "repeating-linear-gradient(45deg,#faf8f4,#faf8f4 6px,#f5f2ea 6px,#f5f2ea 12px)", color: "#b3ab9a" }}
      />
      <div style={{ textAlign: "center", borderBottom: "1px solid #d8d2c8", paddingBottom: 16, marginBottom: 18 }}>
        <div style={{ fontSize: 28, color: "#3a342c", letterSpacing: "0.14em", fontWeight: 700 }}>{b.name || "你的名字"}</div>
        {b.title && <div style={{ fontSize: 12, color: "#8a8272", letterSpacing: "0.3em", textTransform: "uppercase", marginTop: 5 }}>求职意向 · {b.title}</div>}
        <ContactLine resume={resume} style={{ fontSize: 11, color: "#6f6758", justifyContent: "center", marginTop: 8 }} />
      </div>
      {b.summary && <ArtSec title="个人简介"><p style={{ textAlign: "center", fontSize: 11.5, color: "#5f584c" }}>{b.summary}</p></ArtSec>}
      <ArtSec title="个人优势">
        {resume.advantages.map((a, i) => (
          <p key={i} style={{ textAlign: "center", fontSize: 11.5, color: "#5f584c", marginBottom: 4 }}>{a}</p>
        ))}
      </ArtSec>
      <ArtSec title="教育背景"><EduItems resume={resume} /></ArtSec>
      <ArtSec title="项目经历"><ProjectItems resume={resume} /></ArtSec>
      <ArtSec title="校园经历"><ActivityItems resume={resume} /></ArtSec>
      <ArtSec title="技能证书"><SkillsBlock resume={resume} /><PortfolioItems resume={resume} /></ArtSec>
    </div>
  );
}

function ArtSec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 12, fontWeight: 700, color: "#8a8272", letterSpacing: "0.4em", textAlign: "center", marginBottom: 10 }}>
        <span style={{ display: "inline-block", width: 26, height: 1, background: "#d8d2c8", verticalAlign: "middle", marginRight: 10 }} />
        {title}
        <span style={{ display: "inline-block", width: 26, height: 1, background: "#d8d2c8", verticalAlign: "middle", marginLeft: 10 }} />
      </h3>
      {children}
    </section>
  );
}

/** ⑳ 杂志风（衬线 + 居中 + 竖线） */
function MagazineTemplate({ resume }: { resume: Resume }) {
  const b = resume.basics;
  const sec = (t: string, inner: React.ReactNode) => (
    <section style={{ marginTop: 16, paddingLeft: 14, borderLeft: "3px solid #c9b458" }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, color: "#3a342c", letterSpacing: "0.18em", marginBottom: 8 }}>{t}</h3>
      {inner}
    </section>
  );
  return (
    <div style={{ padding: "40px 48px 28px", minHeight: "100%", fontFamily: "Georgia,'Times New Roman',serif" }}>
      <div style={{ textAlign: "center", borderBottom: "2px double #c9b458", paddingBottom: 16, marginBottom: 18, position: "relative" }}>
        <AvatarFrame
          resume={resume}
          style={{ position: "absolute", top: 0, right: 0, borderColor: "#d8cd9e", background: "repeating-linear-gradient(45deg,#faf8f0,#faf8f0 6px,#f5f2e6 6px,#f5f2e6 12px)", color: "#c9bd8f" }}
        />
        <div style={{ fontSize: 29, fontWeight: 700, color: "#3a342c", letterSpacing: "0.2em" }}>{b.name || "你的名字"}</div>
        {b.title && <div style={{ fontSize: 12, color: "#8a8272", letterSpacing: "0.3em", marginTop: 6 }}>求职意向 · {b.title}</div>}
        <ContactLine resume={resume} style={{ fontSize: 10.5, color: "#6f6758", justifyContent: "center", marginTop: 8 }} />
      </div>
      {b.summary && sec("个人简介", <p style={{ textAlign: "center", fontSize: 11.5, color: "#5f584c" }}>{b.summary}</p>)}
      {sec("个人优势", resume.advantages.map((a, i) => <p key={i} style={{ textAlign: "center", fontSize: 11.5, color: "#5f584c", marginBottom: 4 }}>{a}</p>))}
      {sec("教育背景", <EduItems resume={resume} />)}
      {sec("项目经历", <ProjectItems resume={resume} />)}
      {sec("校园经历", <ActivityItems resume={resume} />)}
      {sec("技能证书", <SkillsBlock resume={resume} />)}
      {sec("作品集", <PortfolioItems resume={resume} />)}
    </div>
  );
}

/** ⑲ 顶部色条现代 */
function TopbarModernTemplate({ resume }: { resume: Resume }) {
  const b = resume.basics;
  return (
    <div style={{ paddingBottom: 26, minHeight: "100%" }}>
      <div
        style={{
          background: "linear-gradient(120deg,#4f46e5,#6366f1,#818cf8)",
          padding: "24px 44px 20px",
          display: "flex",
          alignItems: "center",
          gap: 18,
          borderBottom: "4px solid #4338ca",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#fff" }}>{b.name || "你的名字"}</div>
          {b.title && <div style={{ fontSize: 12.5, color: "#e0e7ff", fontWeight: 600, marginTop: 2 }}>求职意向：{b.title}</div>}
          <ContactLine resume={resume} style={{ marginTop: 7, fontSize: 11, color: "#eef2ff" }} />
        </div>
        <AvatarFrame
          resume={resume}
          style={{ borderColor: "#c7d2fe", background: "repeating-linear-gradient(45deg,#6366f1,#6366f1 6px,#5b55e8 6px,#5b55e8 12px)", color: "#dde2fd" }}
        />
      </div>
      <div style={{ padding: "0 44px" }}>
        {b.summary && <Sec title="个人简介" accent="#4338ca"><Desc>{b.summary}</Desc></Sec>}
        <Sec title="个人优势" accent="#4338ca"><AdvantagesItems resume={resume} bulletColor="#6366f1" /></Sec>
        <Sec title="教育背景" accent="#4338ca"><EduItems resume={resume} /></Sec>
        <Sec title="项目经历" accent="#4338ca"><ProjectItems resume={resume} /></Sec>
        <Sec title="校园经历" accent="#4338ca"><ActivityItems resume={resume} /></Sec>
        <Sec title="技能证书" accent="#4338ca"><SkillsBlock resume={resume} /><PortfolioItems resume={resume} /></Sec>
      </div>
    </div>
  );
}

// ================= 色系单栏（工厂） =================

const colorSingle = {
  "minimal-blue": makeSingle({
    accent: "#4f81bd",
    titleColor: "#1d3a5f",
    topStyle: { borderBottom: "3px solid #4f81bd", paddingBottom: 12 },
    bulletColor: "#4f81bd",
  }),
  "bw-minimal": makeSingle({
    accent: "#111111",
    titleColor: "#111111",
    topStyle: { borderBottom: "2.5px solid #111", paddingBottom: 12 },
    bulletColor: "#666666",
  }),
  "fresh-green": makeSingle({
    accent: "#3f9d6b",
    titleColor: "#1e5631",
    topStyle: { borderBottom: "3px solid #3f9d6b", paddingBottom: 12 },
    avatarStyle: { borderColor: "#b8dcc6", background: "repeating-linear-gradient(45deg,#f3faf5,#f3faf5 6px,#eaf5ee 6px,#eaf5ee 12px)", color: "#8fc3a2" },
    bulletColor: "#3f9d6b",
  }),
  "gradient-purple": makeSingle({
    accent: "#7c5cd6",
    titleColor: "#4a2f8f",
    topStyle: {
      borderBottom: "3px solid #7c5cd6",
      paddingBottom: 12,
      background: "linear-gradient(90deg,#f6f2fd,#fdfbff)",
      borderRadius: "0 0 12px 12px",
      paddingTop: 14,
      paddingLeft: 16,
      paddingRight: 16,
    },
    avatarStyle: { borderColor: "#cfc2ee", background: "repeating-linear-gradient(45deg,#f7f4fd,#f7f4fd 6px,#f0ebfa 6px,#f0ebfa 12px)", color: "#b5a6dd" },
    bulletColor: "#7c5cd6",
  }),
  "vibrant-orange": makeSingle({
    accent: "#e8833a",
    titleColor: "#9a4a10",
    topStyle: { borderBottom: "3px solid #e8833a", paddingBottom: 12 },
    avatarStyle: { borderColor: "#f0c39a", background: "repeating-linear-gradient(45deg,#fdf7f0,#fdf7f0 6px,#faf0e2 6px,#faf0e2 12px)", color: "#e0ab77" },
    bulletColor: "#e8833a",
  }),
  "space-grey": makeSingle({
    accent: "#6b7280",
    titleColor: "#1f2937",
    topStyle: { borderBottom: "3px solid #6b7280", paddingBottom: 12 },
    bulletColor: "#6b7280",
  }),
  "rose-gold": makeSingle({
    accent: "#c98585",
    titleColor: "#8a4a4a",
    topStyle: {
      borderBottom: "3px solid #c98585",
      paddingBottom: 12,
      background: "linear-gradient(90deg,#fdf3f4,#fbe9ea)",
      borderRadius: "0 0 12px 12px",
      paddingTop: 14,
      paddingLeft: 16,
      paddingRight: 16,
    },
    avatarStyle: { borderColor: "#e0b9b9", background: "repeating-linear-gradient(45deg,#fdf6f6,#fdf6f6 6px,#faf0f0 6px,#faf0f0 12px)", color: "#d9a8a8" },
    bulletColor: "#c98585",
  }),
  "classic-red": makeSingle({
    accent: "#b03a3a",
    titleColor: "#111111",
    topStyle: { borderBottom: "3px solid #b03a3a", paddingBottom: 12 },
    avatarStyle: { borderColor: "#d9a8a8", background: "repeating-linear-gradient(45deg,#fbf3f3,#fbf3f3 6px,#f8ecec 6px,#f8ecec 12px)", color: "#cc9a9a" },
    bulletColor: "#b03a3a",
  }),
  "light-blue": makeSingle({
    accent: "#4a90d9",
    titleColor: "#1d4e89",
    topStyle: { borderBottom: "3px solid #4a90d9", paddingBottom: 12 },
    avatarStyle: { borderColor: "#a9cdf0", background: "repeating-linear-gradient(45deg,#f2f8fd,#f2f8fd 6px,#eaf4fc 6px,#eaf4fc 12px)", color: "#9fc3e4" },
    secBg: "#f0f7fd",
    bulletColor: "#4a90d9",
  }),
  "military-green": makeSingle({
    accent: "#7d9470",
    titleColor: "#e8efe4",
    topStyle: {
      background: "#3a4a34",
      borderRadius: "0 0 12px 12px",
      padding: "20px 18px 14px",
      borderBottom: "3px solid #5c7351",
    },
    avatarStyle: { borderColor: "#9db394", background: "repeating-linear-gradient(45deg,#45543e,#45543e 6px,#3e4d38 6px,#3e4d38 12px)", color: "#b6c9ac" },
    roleColor: "#c9d6c0",
    contactColor: "#d8e2d0",
    bulletColor: "#7d9470",
  }),
};

// ================= 出口 =================

export function ResumeDocument({ resume }: { resume: Resume }) {
  const t = resume.template;
  if (t === "timeline") return <TimelineTemplate resume={resume} />;
  if (t === "it-minimal") return <ItMinimalTemplate resume={resume} />;
  if (t === "dense") return <DenseTemplate resume={resume} />;
  if (t === "biz-split") return <BizSplitTemplate resume={resume} />;
  if (t === "sidebar-navy") return <SidebarNavyTemplate resume={resume} />;
  if (t === "edu-blue") return <EduBlueTemplate resume={resume} />;
  if (t === "dark-biz") return <DarkBizTemplate resume={resume} />;
  if (t === "artistic") return <ArtisticTemplate resume={resume} />;
  if (t === "magazine") return <MagazineTemplate resume={resume} />;
  if (t === "topbar-modern") return <TopbarModernTemplate resume={resume} />;
  const factory = colorSingle[t as keyof typeof colorSingle];
  if (factory) return factory({ resume });
  return <TimelineTemplate resume={resume} />;
}
