import type { Resume } from "@/lib/types";

function Contacts({ resume }: { resume: Resume }) {
  const b = resume.basics;
  const items = [b.email, b.phone, b.location, b.website].filter(Boolean);
  if (items.length === 0) return null;
  return <p className="text-sm text-slate-500 mt-1">{items.join("  ·  ")}</p>;
}

function Bullets({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="list-disc pl-5 mt-1 space-y-0.5 text-slate-700">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}

function ClassicTemplate({ resume }: { resume: Resume }) {
  const b = resume.basics;
  return (
    <div className="bg-white text-slate-800 p-10 max-w-3xl mx-auto">
      <header className="border-b-2 border-slate-800 pb-3 mb-4">
        <h1 className="text-3xl font-bold">{b.name || "你的名字"}</h1>
        {b.title && <p className="text-lg text-slate-600 mt-1">{b.title}</p>}
        <Contacts resume={resume} />
      </header>

      {b.summary && <p className="text-sm text-slate-700 mb-4">{b.summary}</p>}

      {resume.education.length > 0 && (
        <Section title="教育经历">
          {resume.education.map((e) => (
            <Row key={e.id} left={`${e.school}　${e.major}　${e.degree}`} right={`${e.startDate} - ${e.endDate}`}>
              {e.description && <p className="text-sm text-slate-600 mt-0.5">{e.description}</p>}
            </Row>
          ))}
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
              {p.link && <p className="text-sm text-blue-600 mt-0.5">{p.link}</p>}
              <Bullets items={p.bullets} />
            </Row>
          ))}
        </Section>
      )}

      {resume.skills.length > 0 && (
        <Section title="技能">
          <div className="space-y-1">
            {resume.skills.map((s) => (
              <p key={s.id} className="text-sm">
                <span className="font-medium text-slate-800">{s.category}：</span>
                <span className="text-slate-600">{s.items.join(" / ")}</span>
              </p>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function ModernTemplate({ resume }: { resume: Resume }) {
  const b = resume.basics;
  return (
    <div className="bg-white text-slate-800 max-w-3xl mx-auto">
      <div className="h-2 bg-blue-600" />
      <div className="p-10">
        <header className="mb-5">
          <h1 className="text-3xl font-bold text-blue-700">{b.name || "你的名字"}</h1>
          {b.title && <p className="text-base text-slate-500 mt-1">{b.title}</p>}
          <Contacts resume={resume} />
        </header>

        {b.summary && <p className="text-sm text-slate-700 mb-5">{b.summary}</p>}

        {resume.education.length > 0 && (
          <Section title="教育经历" accent>
            {resume.education.map((e) => (
              <Row key={e.id} left={`${e.school}　${e.major}　${e.degree}`} right={`${e.startDate} - ${e.endDate}`}>
                {e.description && <p className="text-sm text-slate-600 mt-0.5">{e.description}</p>}
              </Row>
            ))}
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
                {p.link && <p className="text-sm text-blue-600 mt-0.5">{p.link}</p>}
                <Bullets items={p.bullets} />
              </Row>
            ))}
          </Section>
        )}

        {resume.skills.length > 0 && (
          <Section title="技能" accent>
            <div className="space-y-1">
              {resume.skills.map((s) => (
                <p key={s.id} className="text-sm">
                  <span className="font-medium text-blue-700">{s.category}：</span>
                  <span className="text-slate-600">{s.items.join(" / ")}</span>
                </p>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function CompactTemplate({ resume }: { resume: Resume }) {
  const b = resume.basics;
  return (
    <div className="bg-white text-slate-800 p-8 max-w-3xl mx-auto text-sm leading-snug">
      <header className="mb-3">
        <h1 className="text-2xl font-bold">{b.name || "你的名字"}</h1>
        {b.title && <p className="text-slate-600">{b.title}</p>}
        <Contacts resume={resume} />
      </header>

      {b.summary && <p className="text-slate-700 mb-3">{b.summary}</p>}

      {resume.education.length > 0 && (
        <Section title="教育经历" compact>
          {resume.education.map((e) => (
            <Row key={e.id} left={`${e.school} ${e.major} ${e.degree}`} right={`${e.startDate}-${e.endDate}`}>
              {e.description && <p className="text-slate-600">{e.description}</p>}
            </Row>
          ))}
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
              {p.link && <p className="text-blue-600">{p.link}</p>}
              <Bullets items={p.bullets} />
            </Row>
          ))}
        </Section>
      )}

      {resume.skills.length > 0 && (
        <Section title="技能" compact>
          <div className="space-y-0.5">
            {resume.skills.map((s) => (
              <p key={s.id}>
                <span className="font-medium">{s.category}：</span>
                <span className="text-slate-600">{s.items.join(" / ")}</span>
              </p>
            ))}
          </div>
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
      ? "border-b border-slate-300 pb-1 text-slate-800"
      : `border-l-4 pl-3 ${
          t === "blue"
            ? "border-blue-500 text-blue-600"
            : t === "indigo"
              ? "border-indigo-500 text-indigo-600"
              : "border-emerald-500 text-emerald-600"
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
        <span className="font-medium text-slate-800">{left}</span>
        {right && <span className="text-xs text-slate-400 whitespace-nowrap">{right}</span>}
      </div>
      {children}
    </div>
  );
}

function SidebarTemplate({ resume }: { resume: Resume }) {
  const b = resume.basics;
  const contacts = [b.email, b.phone, b.location, b.website].filter(Boolean);
  return (
    <div className="bg-white text-slate-800 max-w-3xl mx-auto flex min-h-[900px] print:min-h-0">
      <aside className="w-1/3 bg-slate-900 text-slate-100 p-6 print:bg-slate-900">
        <h1 className="text-xl font-bold leading-tight">{b.name || "你的名字"}</h1>
        {b.title && <p className="mt-1 text-sm text-slate-300">{b.title}</p>}

        {contacts.length > 0 && (
          <div className="mt-4 space-y-1 text-xs text-slate-300">
            {contacts.map((c, i) => (
              <p key={i} className="break-all">
                {c}
              </p>
            ))}
          </div>
        )}

        {b.summary && (
          <p className="mt-4 text-xs leading-relaxed text-slate-300">{b.summary}</p>
        )}

        {resume.skills.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">技能</h2>
            <div className="space-y-2">
              {resume.skills.map((s) => (
                <div key={s.id}>
                  <p className="text-xs font-medium text-white">{s.category}</p>
                  <p className="text-xs text-slate-300">{s.items.join(" · ")}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {resume.education.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">教育</h2>
            <div className="space-y-3">
              {resume.education.map((e) => (
                <div key={e.id} className="text-xs">
                  <p className="font-medium text-white">{e.school}</p>
                  <p className="text-slate-300">
                    {e.major}
                    {e.degree ? ` · ${e.degree}` : ""}
                  </p>
                  <p className="text-slate-400">
                    {e.startDate} - {e.endDate}
                  </p>
                  {e.description && <p className="mt-0.5 text-slate-300">{e.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      <div className="w-2/3 p-8">
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
                {p.link && <p className="text-sm text-blue-600 mt-0.5">{p.link}</p>}
                <Bullets items={p.bullets} />
              </Row>
            ))}
          </Section>
        )}

        {resume.work.length === 0 && resume.projects.length === 0 && (
          <p className="text-sm text-slate-400">在右侧添加「工作经历」或「项目经历」。</p>
        )}
      </div>
    </div>
  );
}

function ElegantTemplate({ resume }: { resume: Resume }) {
  const b = resume.basics;
  const contacts = [b.email, b.phone, b.location, b.website].filter(Boolean);
  return (
    <div className="bg-white text-slate-800 p-10 max-w-3xl mx-auto font-serif">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-semibold tracking-wide">{b.name || "你的名字"}</h1>
        {b.title && (
          <p className="mt-1 text-sm uppercase tracking-[0.2em] text-slate-500">{b.title}</p>
        )}
        {contacts.length > 0 && (
          <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-slate-500">
            {contacts.map((c, i) => (
              <span key={i}>{c}</span>
            ))}
          </div>
        )}
        <div className="mx-auto mt-4 h-px w-16 bg-slate-400" />
      </header>

      {b.summary && <p className="mb-6 text-center text-sm italic text-slate-600">{b.summary}</p>}

      {resume.education.length > 0 && (
        <Section title="教育背景">
          {resume.education.map((e) => (
            <Row key={e.id} left={`${e.school}　${e.major}`} right={`${e.startDate} - ${e.endDate}`}>
              {e.degree && <p className="text-sm text-slate-500">{e.degree}</p>}
              {e.description && <p className="text-sm text-slate-600 mt-0.5">{e.description}</p>}
            </Row>
          ))}
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
              {p.link && <p className="text-sm text-blue-600 mt-0.5">{p.link}</p>}
              <Bullets items={p.bullets} />
            </Row>
          ))}
        </Section>
      )}

      {resume.skills.length > 0 && (
        <Section title="专业技能">
          <div className="space-y-1">
            {resume.skills.map((s) => (
              <p key={s.id} className="text-sm">
                <span className="font-medium text-slate-800">{s.category}：</span>
                <span className="text-slate-600">{s.items.join(" / ")}</span>
              </p>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function CreativeTemplate({ resume }: { resume: Resume }) {
  const b = resume.basics;
  const contacts = [b.email, b.phone, b.location, b.website].filter(Boolean);
  return (
    <div className="bg-white text-slate-800 max-w-3xl mx-auto">
      <header className="bg-indigo-600 p-8 text-white print:bg-indigo-600">
        <h1 className="text-3xl font-bold">{b.name || "你的名字"}</h1>
        {b.title && <p className="mt-1 text-indigo-100">{b.title}</p>}
        {contacts.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-indigo-50">
            {contacts.map((c, i) => (
              <span key={i} className="break-all">
                {c}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="p-8">
        {b.summary && <p className="mb-6 text-sm text-slate-700">{b.summary}</p>}

        {resume.education.length > 0 && (
          <Section title="教育经历" tone="indigo">
            {resume.education.map((e) => (
              <Row key={e.id} left={`${e.school}　${e.major}　${e.degree}`} right={`${e.startDate} - ${e.endDate}`}>
                {e.description && <p className="text-sm text-slate-600 mt-0.5">{e.description}</p>}
              </Row>
            ))}
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

        {resume.skills.length > 0 && (
          <Section title="技能" tone="indigo">
            <div className="space-y-1">
              {resume.skills.map((s) => (
                <p key={s.id} className="text-sm">
                  <span className="font-medium text-indigo-700">{s.category}：</span>
                  <span className="text-slate-600">{s.items.join(" / ")}</span>
                </p>
              ))}
            </div>
          </Section>
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
    default:
      return <ClassicTemplate resume={resume} />;
  }
}
