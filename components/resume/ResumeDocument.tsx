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
}: {
  title: string;
  children: React.ReactNode;
  accent?: boolean;
  compact?: boolean;
}) {
  return (
    <section className={compact ? "mb-3" : "mb-5"}>
      <h2
        className={`${
          compact ? "text-base" : "text-lg"
        } font-semibold mb-2 ${accent ? "text-blue-600 uppercase tracking-wide" : "border-b border-slate-300 pb-1"}`}
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

export function ResumeDocument({ resume }: { resume: Resume }) {
  switch (resume.template) {
    case "modern":
      return <ModernTemplate resume={resume} />;
    case "compact":
      return <CompactTemplate resume={resume} />;
    default:
      return <ClassicTemplate resume={resume} />;
  }
}
