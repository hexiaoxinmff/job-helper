-- 轻量云同步（P3）：脱敏数据（投递台账/诊断历史/档案快照），简历正文永不上云。
-- 单用户单行：owner_id = auth.uid()（匿名登录用户 id），RLS 仅本人可读写。

CREATE TABLE public.jh_sync (
  owner_id varchar(64) PRIMARY KEY DEFAULT auth.uid(),
  tracker jsonb NOT NULL DEFAULT '[]'::jsonb,
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  profile jsonb,
  updated_at bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.jh_sync TO authenticated;

ALTER TABLE public.jh_sync ENABLE ROW LEVEL SECURITY;
CREATE POLICY jh_sync_select ON public.jh_sync FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY jh_sync_insert ON public.jh_sync FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY jh_sync_update ON public.jh_sync FOR UPDATE USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY jh_sync_delete ON public.jh_sync FOR DELETE USING (owner_id = auth.uid());
