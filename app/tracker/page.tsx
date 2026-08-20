import TrackerClient from "./TrackerClient";

export const metadata = {
  title: "求职在线助手 - 投递追踪工作台",
  description:
    "跨平台记录投递的公司、岗位与进度状态（已投递→笔试→面试→Offer），数据仅存本地浏览器，可导出可清除。",
};

export default function TrackerPage() {
  return <TrackerClient />;
}
