import ProfileClient from "./ProfileClient";

export const metadata = {
  title: "求职在线助手 - 私人职业档案",
  description: "跨平台私人职业档案：诊断快照沉淀、能力成长轨迹对比、目标线设定，数据仅存本地、可导出可清除。",
};

export default function Page() {
  return <ProfileClient />;
}
