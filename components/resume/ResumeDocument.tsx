import type { Resume, SectionKey } from "@/lib/types";

/** 板块可见性辅助：visibility 缺省视为显示 */
function visible(resume: Resume, key: SectionKey) {
  return resume.visibility[key] !== false;
}

function Contacts({ resume }: { resume: Resume }) {
  const b = resume.basics;
  const items = [
    { label: "电话", value: b.phone },
    { label: "邮箱", value: b.email },
    { label: "城市", value: b.location },
    { label: "GitHub", value: b.website },
  ].filter((it) => it.value);
  if (items.length === 0) return null;
  return (
    <p className="text-sm text-neutral-500 mt-1">
      {items.map((it, i) => (
        <span key={it.label}>
          {i > 0 && "  ·  "}
          {it.label}：{it.value}
        </span>
      ))}
    </p>
  );
}

function Bullets({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="list-disc pl-5 mt-1 space-y-0.5 text-neutral-700">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}

/** 个人优势：多条 bullet */
function AdvantagesBlock({ resume }: { resume: Resume }) {
  if (!visible(resume, "advantages") || resume.advantages.length === 0) return null;
  return <Bullets items={resume.advantages} />;
}

/** 实习经历（与工作经历同构） */
function InternshipsBlock({ resume }: { resume: Resume }) {
  if (!visible(resume, "internships") || resume.internships.length === 0) return null;
  return (
    <>
      {resume.internships.map((w) => (
        <Row key={w.id} left={`${w.company}　${w.role}`} right={`${w.startDate} - ${w.endDate}`}>
          <Bullets items={w.bullets} />
        </Row>
      ))}
    </>
  );
}

/** 校园经历 */
function ActivitiesBlock({ resume }: { resume: Resume }) {
  if (!visible(resume, "activities") || resume.activities.length === 0) return null;
  return (
    <>
      {resume.activities.map((a) => (
        <Row key={a.id} left={`${a.org}　${a.role}`} right={`${a.startDate} - ${a.endDate}`}>
          {a.description && <p className="text-sm text-neutral-600 mt-0.5">{a.description}</p>}
        </Row>
      ))}
    </>
  );
}

/** 荣誉奖项 */
function AwardsBlock({ resume }: { resume: Resume }) {
  if (!visible(resume, "awards") || resume.awards.length === 0) return null;
  return (
    <>
      {resume.awards.map((a) => (
        <Row key={a.id} left={a.name} right={a.date}>
          {a.description && <p className="text-sm text-neutral-600 mt-0.5">{a.description}</p>}
        </Row>
      ))}
    </>
  );
}

/** 语言能力 */
function LanguagesBlock({ resume }: { resume: Resume }) {
  if (!visible(resume, "languages") || resume.languages.length === 0) return null;
  return (
    <p className="text-sm text-neutral-700">
      {resume.languages.map((l) => `${l.language}（${l.level || "熟练"}）`).join("　·　")}
    </p>
  );
}

/** 作品集 */
function PortfolioBlock({ resume }: { resume: Resume }) {
  if (!visible(resume, "portfolio") || resume.portfolio.length === 0) return null;
  return (
    <>
      {resume.portfolio.map((p) => (
        <Row key={p.id} left={p.name} right={p.link}>
          {p.description && <p className="text-sm text-neutral-600 mt-0.5">{p.description}</p>}
        </Row>
      ))}
    </>
  );
}

function ClassicTemplate({ resume }: { resume: Resume }) {
  const b = resume.basics;
  return (
    <div className="bg-white text-neutral-800 p-10 max-w-3xl mx-auto">
      <header className="border-b-2 border-neutral-800 pb-3 mb-4">
        <h1 className="text-3xl font-bold">{b.name || "你的名字"}</h1>
        {b.title && <p className="text-lg text-neutral-600 mt-1">求职意向：{b.title}</p>}
        <Contacts resume={resume} />
      </header>

      {b.summary && <p className="text-sm text-neutral-700 mb-4">{b.summary}</p>}

      {visible(resume, "advantages") && resume.advantages.length > 0 && (
        <Section title="个人优势">
          <AdvantagesBlock resume={resume} />
        </Section>
      )}

      {resume.education.length > 0 && (
        <Section title="教育经历">
          {resume.education.map((e) => (
            <Row key={e.id} left={`${e.school}　${e.major}　${e.degree}`} right={`${e.startDate} - ${e.endDate}`}>
              {e.description && <p className="text-sm text-neutral-600 mt-0.5">{e.description}</p>}
            </Row>
          ))}
        </Section>
      )}

      {visible(resume, "internships") && resume.internships.length > 0 && (
        <Section title="实习经历">
          <InternshipsBlock resume={resume} />
        </Section>
      )}

      {resume.work.length > 0 && (
        <Section title="工作经历">
          {resume.work.map((w) => (
            <Row key={w.id} left={`${w.company}　${w.role}`} right={`${w.startDate} - ${w.endDate}`}>
              <Bullets items={w.bullets} />
            </Row>
          ))}
        </Section>
      )}

      {resume.projects.length > 0 && (
        <Section title="项目经历">
          {resume.projects.map((p) => (
            <Row key={p.id} left={`${p.name}　${p.role}`} right={`${p.startDate} - ${p.endDate}`}>
              {p.link && <p className="text-sm text-primary-600 mt-0.5">{p.link}</p>}
              <Bullets items={p.bullets} />
            </Row>
          ))}
        </Section>
      )}

      {visible(resume, "activities") && resume.activities.length > 0 && (
        <Section title="校园经历">
          <ActivitiesBlock resume={resume} />
        </Section>
      )}

      {resume.skills.length > 0 && (
        <Section title="技能">
          <div className="space-y-1">
            {resume.skills.map((s) => (
              <p key={s.id} className="text-sm">
                <span className="font-medium text-neutral-800">{s.category}：</span>
                <span className="text-neutral-600">{s.items.join(" / ")}</span>
              </p>
            ))}
          </div>
        </Section>
      )}

      {visible(resume, "languages") && resume.languages.length > 0 && (
        <Section title="语言能力">
          <LanguagesBlock resume={resume} />
        </Section>
      )}

      {visible(resume, "awards") && resume.awards.length > 0 && (
        <Section title="荣誉奖项">
          <AwardsBlock resume={resume} />
        </Section>
      )}

      {visible(resume, "portfolio") && resume.portfolio.length > 0 && (
        <Section title="作品集">
          <PortfolioBlock resume={resume} />
        </Section>
      )}
    </div>
  );
}

function ModernTemplate({ resume }: { resume: Resume }) {
  const b = resume.basics;
  return (
    <div className="bg-white text-neutral-800 max-w-3xl mx-auto">
      <div className="h-2 bg-primary-600" />
      <div className="p-10">
        <header className="mb-5">
          <h1 className="text-3xl font-bold text-primary-700">{b.name || "你的名字"}</h1>
          {b.title && <p className="text-base text-neutral-500 mt-1">求职意向：{b.title}</p>}
          <Contacts resume={resume} />
        </header>

        {b.summary && <p className="text-sm text-neutral-700 mb-5">{b.summary}</p>}

        {visible(resume, "advantages") && resume.advantages.length > 0 && (
          <Section title="个人优势" accent>
            <AdvantagesBlock resume={resume} />
          </Section>
        )}

        {resume.education.length > 0 && (
          <Section title="教育经历" accent>
            {resume.education.map((e) => (
              <Row key={e.id} left={`${e.school}　${e.major}　${e.degree}`} right={`${e.startDate} - ${e.endDate}`}>
                {e.description && <p className="text-sm text-neutral-600 mt-0.5">{e.description}</p>}
              </Row>
            ))}
          </Section>
        )}

        {visible(resume, "internships") && resume.internships.length > 0 && (
          <Section title="实习经历" accent>
            <InternshipsBlock resume={resume} />
          </Section>
        )}

        {resume.work.length > 0 && (
          <Section title="工作经历" accent>
            {resume.work.map((w) => (
              <Row key={w.id} left={`${w.company}　${w.role}`} right={`${w.startDate} - ${w.endDate}`}>
                <Bullets items={w.bullets} />
              </Row>
            ))}
          </Section>
        )}

        {resume.projects.length > 0 && (
          <Section title="项目经历" accent>
            {resume.projects.map((p) => (
              <Row key={p.id} left={`${p.name}　${p.role}`} right={`${p.startDate} - ${p.endDate}`}>
                {p.link && <p className="text-sm text-primary-600 mt-0.5">{p.link}</p>}
                <Bullets items={p.bullets} />
              </Row>
            ))}
          </Section>
        )}

        {visible(resume, "activities") && resume.activities.length > 0 && (
          <Section title="校园经历" accent>
            <ActivitiesBlock resume={resume} />
          </Section>
        )}

        {resume.skills.length > 0 && (
          <Section title="技能" accent>
            <div className="space-y-1">
              {resume.skills.map((s) => (
                <p key={s.id} className="text-sm">
                  <span className="font-medium text-primary-700">{s.category}：</span>
                  <span className="text-neutral-600">{s.items.join(" / ")}</span>
                </p>
              ))}
            </div>
          </Section>
        )}

        {visible(resume, "languages") && resume.languages.length > 0 && (
          <Section title="语言能力" accent>
            <LanguagesBlock resume={resume} />
          </Section>
        )}

        {visible(resume, "awards") && resume.awards.length > 0 && (
          <Section title="荣誉奖项" accent>
            <AwardsBlock resume={resume} />
          </Section>
        )}

        {visible(resume, "portfolio") && resume.portfolio.length > 0 && (
          <Section title="作品集" accent>
            <PortfolioBlock resume={resume} />
          </Section>
        )}
      </div>
    </div>
  );
}

function CompactTemplate({ resume }: { resume: Resume }) {
  const b = resume.basics;
  return (
    <div className="bg-white text-neutral-800 p-8 max-w-3xl mx-auto text-sm leading-snug">
      <header className="mb-3">
        <h1 className="text-2xl font-bold">{b.name || "你的名字"}</h1>
        {b.title && <p className="text-neutral-600">求职意向：{b.title}</p>}
        <Contacts resume={resume} />
      </header>

      {b.summary && <p className="text-neutral-700 mb-3">{b.summary}</p>}

      {visible(resume, "advantages") && resume.advantages.length > 0 && (
        <Section title="个人优势" compact>
          <AdvantagesBlock resume={resume} />
        </Section>
      )}

      {resume.education.length > 0 && (
        <Section title="教育经历" compact>
          {resume.education.map((e) => (
            <Row key={e.id} left={`${e.school} ${e.major} ${e.degree}`} right={`${e.startDate}-${e.endDate}`}>
              {e.description && <p className="text-neutral-600">{e.description}</p>}
            </Row>
          ))}
        </Section>
      )}

      {visible(resume, "internships") && resume.internships.length > 0 && (
        <Section title="实习经历" compact>
          <InternshipsBlock resume={resume} />
        </Section>
      )}

      {resume.work.length > 0 && (
        <Section title="工作经历" compact>
          {resume.work.map((w) => (
            <Row key={w.id} left={`${w.company} ${w.role}`} right={`${w.startDate}-${w.endDate}`}>
              <Bullets items={w.bullets} />
            </Row>
          ))}
        </Section>
      )}

      {resume.projects.length > 0 && (
        <Section title="项目经历" compact>
          {resume.projects.map((p) => (
            <Row key={p.id} left={`${p.name} ${p.role}`} right={`${p.startDate}-${p.endDate}`}>
              {p.link && <p className="text-primary-600">{p.link}</p>}
              <Bullets items={p.bullets} />
            </Row>
          ))}
        </Section>
      )}

      {visible(resume, "activities") && resume.activities.length > 0 && (
        <Section title="校园经历" compact>
          <ActivitiesBlock resume={resume} />
        </Section>
      )}

      {resume.skills.length > 0 && (
        <Section title="技能" compact>
          <div className="space-y-0.5">
            {resume.skills.map((s) => (
              <p key={s.id}>
                <span className="font-medium">{s.category}：</span>
                <span className="text-neutral-600">{s.items.join(" / ")}</span>
              </p>
            ))}
          </div>
        </Section>
      )}

      {visible(resume, "languages") && resume.languages.length > 0 && (
        <Section title="语言能力" compact>
          <LanguagesBlock resume={resume} />
        </Section>
      )}

      {visible(resume, "awards") && resume.awards.length > 0 && (
        <Section title="荣誉奖项" compact>
          <AwardsBlock resume={resume} />
        </Section>
      )}

      {visible(resume, "portfolio") && resume.portfolio.length > 0 && (
        <Section title="作品集" compact>
          <PortfolioBlock resume={resume} />
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
  accent,
  compact,
  tone,
}: {
  title: string;
  children: React.ReactNode;
  accent?: boolean;
  compact?: boolean;
  /** 标题色条风格：slate=默认下划线；blue/indigo/emerald=左侧色条（accent 等价于 blue） */
  tone?: "slate" | "blue" | "indigo" | "emerald";
}) {
  const t = tone ?? (accent ? "blue" : "slate");
  const bar =
    t === "slate"
      ? "border-b border-neutral-300 pb-1 text-neutral-800"
      : `border-l-4 pl-3 ${
          t === "blue"
            ? "border-primary-500 text-primary-600"
            : t === "indigo"
              ? "border-indigo-500 text-indigo-600"
              : "border-success-500 text-success-600"
        }`;
  return (
    <section className={compact ? "mb-3" : "mb-5"}>
      <h2
        className={`${compact ? "text-base" : "text-lg"} font-semibold mb-2 uppercase tracking-wide ${bar}`}
      >
        {title}
      </h2>
      <div className={compact ? "space-y-2" : "space-y-3"}>{children}</div>
    </section>
  );
}

function Row({
  left,
  right,
  children,
}: {
  left: string;
  right?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-medium text-neutral-800">{left}</span>
        {right && <span className="text-xs text-neutral-400 whitespace-nowrap">{right}</span>}
      </div>
      {children}
    </div>
  );
}

function SidebarTemplate({ resume }: { resume: Resume }) {
  const b = resume.basics;
  const contacts = [b.email, b.phone, b.location, b.website].filter(Boolean);
  return (
    <div className="bg-white text-neutral-800 max-w-3xl mx-auto flex min-h-[900px] print:min-h-0">
      <aside className="w-1/3 bg-neutral-900 text-neutral-100 p-6 print:bg-neutral-900">
        <h1 className="text-xl font-bold leading-tight">{b.name || "你的名字"}</h1>
        {b.title && <p className="mt-1 text-sm text-neutral-300">求职意向：{b.title}</p>}

        {contacts.length > 0 && (
          <div className="mt-4 space-y-1 text-xs text-neutral-300">
            {contacts.map((c, i) => (
              <p key={i} className="break-all">
                {c}
              </p>
            ))}
          </div>
        )}

        {b.summary && (
          <p className="mt-4 text-xs leading-relaxed text-neutral-300">{b.summary}</p>
        )}

        {visible(resume, "advantages") && resume.advantages.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">个人优势</h2>
            <ul className="space-y-1 text-xs text-neutral-300">
              {resume.advantages.map((a, i) => (
                <li key={i}>• {a}</li>
              ))}
            </ul>
          </div>
        )}

        {resume.skills.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">技能</h2>
            <div className="space-y-2">
              {resume.skills.map((s) => (
                <div key={s.id}>
                  <p className="text-xs font-medium text-white">{s.category}</p>
                  <p className="text-xs text-neutral-300">{s.items.join(" · ")}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {visible(resume, "languages") && resume.languages.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">语言能力</h2>
            <p className="text-xs text-neutral-300">
              {resume.languages.map((l) => `${l.language}（${l.level || "熟练"}）`).join(" · ")}
            </p>
          </div>
        )}

        {visible(resume, "awards") && resume.awards.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">荣誉奖项</h2>
            <ul className="space-y-1 text-xs text-neutral-300">
              {resume.awards.map((a) => (
                <li key={a.id}>
                  {a.name}
                  {a.date ? `（${a.date}）` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}

        {visible(resume, "portfolio") && resume.portfolio.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">作品集</h2>
            <ul className="space-y-1 text-xs text-neutral-300">
              {resume.portfolio.map((p) => (
                <li key={p.id} className="break-all">
                  {p.name}: {p.link}
                </li>
              ))}
            </ul>
          </div>
        )}

        {resume.education.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">教育</h2>
            <div className="space-y-3">
              {resume.education.map((e) => (
                <div key={e.id} className="text-xs">
                  <p className="font-medium text-white">{e.school}</p>
                  <p className="text-neutral-300">
                    {e.major}
                    {e.degree ? ` · ${e.degree}` : ""}
                  </p>
                  <p className="text-neutral-400">
                    {e.startDate} - {e.endDate}
                  </p>
                  {e.description && <p className="mt-0.5 text-neutral-300">{e.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      <div className="w-2/3 p-8">
        {visible(resume, "internships") && resume.internships.length > 0 && (
          <Section title="实习经历">
            <InternshipsBlock resume={resume} />
          </Section>
        )}

        {resume.work.length > 0 && (
          <Section title="工作经历">
            {resume.work.map((w) => (
              <Row key={w.id} left={`${w.company}　${w.role}`} right={`${w.startDate} - ${w.endDate}`}>
                <Bullets items={w.bullets} />
              </Row>
            ))}
          </Section>
        )}

        {resume.projects.length > 0 && (
          <Section title="项目经历">
            {resume.projects.map((p) => (
              <Row key={p.id} left={`${p.name}　${p.role}`} right={`${p.startDate} - ${p.endDate}`}>
                {p.link && <p className="text-sm text-primary-600 mt-0.5">{p.link}</p>}
                <Bullets items={p.bullets} />
              </Row>
            ))}
          </Section>
        )}

        {visible(resume, "activities") && resume.activities.length > 0 && (
          <Section title="校园经历">
            <ActivitiesBlock resume={resume} />
          </Section>
        )}

        {resume.work.length === 0 && resume.projects.length === 0 && resume.internships.length === 0 && (
          <p className="text-sm text-neutral-400">在右侧添加「实习 / 工作 / 项目」经历。</p>
        )}
      </div>
    </div>
  );
}

function ElegantTemplate({ resume }: { resume: Resume }) {
  const b = resume.basics;
  const contacts = [b.email, b.phone, b.location, b.website].filter(Boolean);
  return (
    <div className="bg-white text-neutral-800 p-10 max-w-3xl mx-auto font-serif">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-semibold tracking-wide">{b.name || "你的名字"}</h1>
        {b.title && (
          <p className="mt-1 text-sm uppercase tracking-[0.2em] text-neutral-500">求职意向：{b.title}</p>
        )}
        {contacts.length > 0 && (
          <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-neutral-500">
            {contacts.map((c, i) => (
              <span key={i}>{c}</span>
            ))}
          </div>
        )}
        <div className="mx-auto mt-4 h-px w-16 bg-neutral-400" />
      </header>

      {b.summary && <p className="mb-6 text-center text-sm italic text-neutral-600">{b.summary}</p>}

      {visible(resume, "advantages") && resume.advantages.length > 0 && (
        <Section title="个人优势">
          <div className="space-y-1 text-center">
            {resume.advantages.map((a, i) => (
              <p key={i} className="text-sm italic text-neutral-700">
                {a}
              </p>
            ))}
          </div>
        </Section>
      )}

      {resume.education.length > 0 && (
        <Section title="教育背景">
          {resume.education.map((e) => (
            <Row key={e.id} left={`${e.school}　${e.major}`} right={`${e.startDate} - ${e.endDate}`}>
              {e.degree && <p className="text-sm text-neutral-500">{e.degree}</p>}
              {e.description && <p className="text-sm text-neutral-600 mt-0.5">{e.description}</p>}
            </Row>
          ))}
        </Section>
      )}

      {visible(resume, "internships") && resume.internships.length > 0 && (
        <Section title="实习经历">
          <InternshipsBlock resume={resume} />
        </Section>
      )}

      {resume.work.length > 0 && (
        <Section title="工作经历">
          {resume.work.map((w) => (
            <Row key={w.id} left={`${w.company}　${w.role}`} right={`${w.startDate} - ${w.endDate}`}>
              <Bullets items={w.bullets} />
            </Row>
          ))}
        </Section>
      )}

      {resume.projects.length > 0 && (
        <Section title="项目经历">
          {resume.projects.map((p) => (
            <Row key={p.id} left={`${p.name}　${p.role}`} right={`${p.startDate} - ${p.endDate}`}>
              {p.link && <p className="text-sm text-primary-600 mt-0.5">{p.link}</p>}
              <Bullets items={p.bullets} />
            </Row>
          ))}
        </Section>
      )}

      {visible(resume, "activities") && resume.activities.length > 0 && (
        <Section title="校园经历">
          <ActivitiesBlock resume={resume} />
        </Section>
      )}

      {resume.skills.length > 0 && (
        <Section title="专业技能">
          <div className="space-y-1">
            {resume.skills.map((s) => (
              <p key={s.id} className="text-sm">
                <span className="font-medium text-neutral-800">{s.category}：</span>
                <span className="text-neutral-600">{s.items.join(" / ")}</span>
              </p>
            ))}
          </div>
        </Section>
      )}

      {(visible(resume, "languages") && resume.languages.length > 0) ||
      (visible(resume, "awards") && resume.awards.length > 0) ||
      (visible(resume, "portfolio") && resume.portfolio.length > 0) ? (
        <Section title="附加信息">
          <div className="space-y-2">
            {visible(resume, "languages") && resume.languages.length > 0 && (
              <p className="text-sm">
                <span className="font-medium text-neutral-800">语言：</span>
                <span className="text-neutral-600">
                  {resume.languages.map((l) => `${l.language}（${l.level || "熟练"}）`).join(" / ")}
                </span>
              </p>
            )}
            {visible(resume, "awards") && resume.awards.length > 0 && (
              <p className="text-sm">
                <span className="font-medium text-neutral-800">荣誉：</span>
                <span className="text-neutral-600">
                  {resume.awards.map((a) => `${a.name}${a.date ? `（${a.date}）` : ""}`).join(" / ")}
                </span>
              </p>
            )}
            {visible(resume, "portfolio") && resume.portfolio.length > 0 && (
              <p className="text-sm">
                <span className="font-medium text-neutral-800">作品：</span>
                <span className="text-neutral-600">
                  {resume.portfolio.map((p) => `${p.name}（${p.link}）`).join(" / ")}
                </span>
              </p>
            )}
          </div>
        </Section>
      ) : null}
    </div>
  );
}

function CreativeTemplate({ resume }: { resume: Resume }) {
  const b = resume.basics;
  const contacts = [b.email, b.phone, b.location, b.website].filter(Boolean);
  return (
    <div className="bg-white text-neutral-800 max-w-3xl mx-auto">
      <header className="bg-indigo-600 p-8 text-white print:bg-indigo-600">
        <h1 className="text-3xl font-bold">{b.name || "你的名字"}</h1>
        {b.title && <p className="mt-1 text-indigo-100">求职意向：{b.title}</p>}
        {contacts.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-indigo-50">
            {contacts.map((c, i) => (
              <span key={i} className="break-all">
                {c}
              </span>
            ))}
          </div>
        )}
        {visible(resume, "advantages") && resume.advantages.length > 0 && (
          <ul className="mt-4 space-y-1 text-sm text-indigo-50">
            {resume.advantages.map((a, i) => (
              <li key={i}>• {a}</li>
            ))}
          </ul>
        )}
      </header>

      <div className="p-8">
        {b.summary && <p className="mb-6 text-sm text-neutral-700">{b.summary}</p>}

        {resume.education.length > 0 && (
          <Section title="教育经历" tone="indigo">
            {resume.education.map((e) => (
              <Row key={e.id} left={`${e.school}　${e.major}　${e.degree}`} right={`${e.startDate} - ${e.endDate}`}>
                {e.description && <p className="text-sm text-neutral-600 mt-0.5">{e.description}</p>}
              </Row>
            ))}
          </Section>
        )}

        {visible(resume, "internships") && resume.internships.length > 0 && (
          <Section title="实习经历" tone="indigo">
            <InternshipsBlock resume={resume} />
          </Section>
        )}

        {resume.work.length > 0 && (
          <Section title="工作经历" tone="indigo">
            {resume.work.map((w) => (
              <Row key={w.id} left={`${w.company}　${w.role}`} right={`${w.startDate} - ${w.endDate}`}>
                <Bullets items={w.bullets} />
              </Row>
            ))}
          </Section>
        )}

        {resume.projects.length > 0 && (
          <Section title="项目经历" tone="indigo">
            {resume.projects.map((p) => (
              <Row key={p.id} left={`${p.name}　${p.role}`} right={`${p.startDate} - ${p.endDate}`}>
                {p.link && <p className="text-sm text-indigo-600 mt-0.5">{p.link}</p>}
                <Bullets items={p.bullets} />
              </Row>
            ))}
          </Section>
        )}

        {visible(resume, "activities") && resume.activities.length > 0 && (
          <Section title="校园经历" tone="indigo">
            <ActivitiesBlock resume={resume} />
          </Section>
        )}

        {resume.skills.length > 0 && (
          <Section title="技能" tone="indigo">
            <div className="space-y-1">
              {resume.skills.map((s) => (
                <p key={s.id} className="text-sm">
                  <span className="font-medium text-indigo-700">{s.category}：</span>
                  <span className="text-neutral-600">{s.items.join(" / ")}</span>
                </p>
              ))}
            </div>
          </Section>
        )}

        {visible(resume, "languages") && resume.languages.length > 0 && (
          <Section title="语言能力" tone="indigo">
            <LanguagesBlock resume={resume} />
          </Section>
        )}

        {visible(resume, "awards") && resume.awards.length > 0 && (
          <Section title="荣誉奖项" tone="indigo">
            <AwardsBlock resume={resume} />
          </Section>
        )}

        {visible(resume, "portfolio") && resume.portfolio.length > 0 && (
          <Section title="作品集" tone="indigo">
            <PortfolioBlock resume={resume} />
          </Section>
        )}
      </div>
    </div>
  );
}

/**
 * 蓝点时间轴模板（参照校园简历经典版式）：
 * 顶部「个人简历」蓝条 + PERSONAL RESUME 灰条、左侧蓝条 + 中间时间线、
 * 章节蓝点 + 灰线标题、条目蓝色小方块 + 右侧时间。
 */
function TimelineSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="relative">
      {/* 蓝点：盖住中间时间线 */}
      <div className="absolute -left-[18px] top-0.5 size-3.5 rounded-full border-2 border-white bg-primary-600" />
      <div className="flex items-center gap-3">
        <h2 className="shrink-0 text-lg font-bold text-neutral-900">{title}</h2>
        <div className="h-px flex-1 bg-neutral-200" />
      </div>
      <div className="mt-2.5 space-y-3">{children}</div>
    </section>
  );
}

function TimelineItem({
  head,
  time,
  children,
}: {
  head: string;
  time?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-medium text-neutral-800">
          <span className="mr-1.5 inline-block size-[4px] translate-y-[-2px] rounded-[1px] bg-primary-600" />
          {head}
        </span>
        {time && <span className="shrink-0 text-xs whitespace-nowrap text-neutral-400">{time}</span>}
      </div>
      {children}
    </div>
  );
}

function TimelineTemplate({ resume }: { resume: Resume }) {
  const b = resume.basics;
  return (
    <div className="relative mx-auto max-w-3xl bg-white text-neutral-800">
      {/* 左侧蓝色细边条 */}
      <div className="absolute inset-y-0 left-0 w-3 bg-primary-600" />
      {/* 中间纵向时间线 */}
      <div className="absolute inset-y-0 left-7 w-[2.5px] bg-primary-600" />

      {/* 顶部双条：蓝色「个人简历」+ 灰色 PERSONAL RESUME */}
      <div className="relative flex">
        <div className="bg-primary-600 py-2 pl-12 pr-6 text-white print:bg-primary-600">
          <span className="text-sm font-bold tracking-wide">个人简历</span>
        </div>
        <div className="flex flex-1 items-center bg-neutral-200 px-4 py-2 print:bg-neutral-200">
          <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-primary-600">
            PERSONAL RESUME
          </span>
        </div>
      </div>

      {/* 头部：姓名 / 求职意向 / 联系方式（带标签，对齐何钊新 PDF）/ 简介 */}
      <div className="relative px-10 pb-2 pt-6">
        <h1 className="text-3xl font-bold text-neutral-900">{b.name || "你的名字"}</h1>
        {b.title && <p className="mt-1 text-sm text-neutral-500">求职意向：{b.title}</p>}
        {(b.phone || b.email || b.birth || b.sex || b.location || b.website) && (
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-0.5 text-xs text-neutral-600">
            {b.phone && <span>电话：{b.phone}</span>}
            {b.birth && <span>出生年月：{b.birth}</span>}
            {b.email && <span>邮箱：{b.email}</span>}
            {b.sex && <span>性别：{b.sex}</span>}
            {b.location && <span>城市：{b.location}</span>}
            {b.website && <span>GitHub：{b.website}</span>}
          </div>
        )}
        {b.summary && <p className="mt-3 text-sm leading-relaxed text-neutral-700">{b.summary}</p>}
      </div>

      {/* 章节区（对齐何钊新简历 PDF 顺序：个人优势 → 教育背景 → 经历 → 校园经历 → 技能及证书） */}
      <div className="relative space-y-5 px-10 pb-8 pt-4">
        {/* 1. 个人优势 */}
        {visible(resume, "advantages") && resume.advantages.length > 0 && (
          <TimelineSection title="个人优势">
            <ul className="space-y-1 text-sm text-neutral-700">
              {resume.advantages.map((a, i) => (
                <li key={i} className="flex">
                  <span className="mr-2 text-neutral-400">•</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </TimelineSection>
        )}

        {/* 2. 教育背景 */}
        {visible(resume, "education") && resume.education.length > 0 && (
          <TimelineSection title="教育背景">
            {resume.education.map((e) => (
              <TimelineItem
                key={e.id}
                head={`${e.school}　${e.major}　${e.degree}`}
                time={`${e.startDate} - ${e.endDate}`}
              >
                {e.description && <p className="mt-0.5 text-sm text-neutral-600">{e.description}</p>}
              </TimelineItem>
            ))}
          </TimelineSection>
        )}

        {/* 3. 实习 / 工作 / 项目经历（沿时间线） */}
        {visible(resume, "internships") && resume.internships.length > 0 && (
          <TimelineSection title="实习经历">
            {resume.internships.map((w) => (
              <TimelineItem
                key={w.id}
                head={`${w.company}　${w.role}`}
                time={`${w.startDate} - ${w.endDate}`}
              >
                <Bullets items={w.bullets} />
              </TimelineItem>
            ))}
          </TimelineSection>
        )}

        {visible(resume, "work") && resume.work.length > 0 && (
          <TimelineSection title="工作经历">
            {resume.work.map((w) => (
              <TimelineItem
                key={w.id}
                head={`${w.company}　${w.role}`}
                time={`${w.startDate} - ${w.endDate}`}
              >
                <Bullets items={w.bullets} />
              </TimelineItem>
            ))}
          </TimelineSection>
        )}

        {visible(resume, "projects") && resume.projects.length > 0 && (
          <TimelineSection title="项目经历">
            {resume.projects.map((p) => (
              <TimelineItem
                key={p.id}
                head={`${p.name}　${p.role}`}
                time={`${p.startDate} - ${p.endDate}`}
              >
                {p.link && <p className="mt-0.5 text-sm text-primary-600">{p.link}</p>}
                <Bullets items={p.bullets} />
              </TimelineItem>
            ))}
          </TimelineSection>
        )}

        {/* 4. 校园经历 */}
        {visible(resume, "activities") && resume.activities.length > 0 && (
          <TimelineSection title="校园经历">
            {resume.activities.map((a) => (
              <TimelineItem
                key={a.id}
                head={`${a.org}　${a.role}`}
                time={`${a.startDate} - ${a.endDate}`}
              >
                {a.description && <p className="mt-0.5 text-sm text-neutral-600">{a.description}</p>}
              </TimelineItem>
            ))}
          </TimelineSection>
        )}

        {/* 5. 技能及证书（技能 + 荣誉 + 语言合并区） */}
        {(visible(resume, "skills") && resume.skills.length > 0) ||
        (visible(resume, "awards") && resume.awards.length > 0) ||
        (visible(resume, "languages") && resume.languages.length > 0) ? (
          <TimelineSection title="技能及证书">
            <div className="space-y-1">
              {visible(resume, "skills") &&
                resume.skills.map((s) => (
                  <p key={s.id} className="text-sm">
                    <span className="font-medium text-neutral-800">{s.category}：</span>
                    <span className="text-neutral-600">{s.items.join(" / ")}</span>
                  </p>
                ))}
              {visible(resume, "languages") && resume.languages.length > 0 && (
                <p className="text-sm">
                  <span className="font-medium text-neutral-800">语言：</span>
                  <span className="text-neutral-600">
                    {resume.languages.map((l) => `${l.language}（${l.level || "熟练"}）`).join(" / ")}
                  </span>
                </p>
              )}
              {visible(resume, "awards") && resume.awards.length > 0 && (
                <p className="text-sm">
                  <span className="font-medium text-neutral-800">荣誉：</span>
                  <span className="text-neutral-600">
                    {resume.awards.map((a) => `${a.name}${a.date ? `（${a.date}）` : ""}`).join(" / ")}
                  </span>
                </p>
              )}
            </div>
          </TimelineSection>
        ) : null}

        {/* 作品集 */}
        {visible(resume, "portfolio") && resume.portfolio.length > 0 && (
          <TimelineSection title="作品集">
            {resume.portfolio.map((p) => (
              <TimelineItem key={p.id} head={p.name} time={p.link}>
                {p.description && <p className="mt-0.5 text-sm text-neutral-600">{p.description}</p>}
              </TimelineItem>
            ))}
          </TimelineSection>
        )}
      </div>
    </div>
  );
}

export function ResumeDocument({ resume }: { resume: Resume }) {
  switch (resume.template) {
    case "modern":
      return <ModernTemplate resume={resume} />;
    case "compact":
      return <CompactTemplate resume={resume} />;
    case "sidebar":
      return <SidebarTemplate resume={resume} />;
    case "elegant":
      return <ElegantTemplate resume={resume} />;
    case "creative":
      return <CreativeTemplate resume={resume} />;
    case "timeline":
      return <TimelineTemplate resume={resume} />;
    default:
      return <ClassicTemplate resume={resume} />;
  }
}
