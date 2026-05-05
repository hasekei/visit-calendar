"use client";

import dynamic from "next/dynamic";

const MainTabs = dynamic(
  () => import("@/components/layout/MainTabs").then((m) => m.MainTabs),
  { ssr: false, loading: () => null }
);

export default function Home() {
  return <MainTabs />;
}
