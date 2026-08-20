-- 完整云同步：为 jh_sync 增加 resumes 列（加密简历 jsonb，服务端不可读）
ALTER TABLE public.jh_sync ADD COLUMN IF NOT EXISTS resumes jsonb NOT NULL DEFAULT '[]'::jsonb;
