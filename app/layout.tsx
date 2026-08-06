import type { Metadata } from "next";
import { ibmPlexMono, notoSerifKR } from "./fonts";
import Sidebar from "@/components/ui/Sidebar";
import BackupBanner from "@/components/ui/BackupBanner";
import { CURRICULUM } from "@/lib/curriculum";
import { getLessonsForLevel } from "@/lib/content";
import "./globals.css";

export const metadata: Metadata = {
  title: "호가창 — 트레이딩 학습",
  description:
    "완전 초보부터 스스로 판단하는 트레이더가 되기까지, 순서대로 쌓아 올리는 학습 사이트",
  openGraph: {
    title: "호가창 — 트레이딩 학습",
    description:
      "완전 초보부터 스스로 판단하는 트레이더가 되기까지, 순서대로 쌓아 올리는 학습 사이트",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const levelTree = CURRICULUM.map((cur) => ({
    level: cur.level,
    title: cur.title,
    lessons: getLessonsForLevel(cur.level).map((l) => ({
      id: l.id,
      title: l.title,
    })),
  }));

  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body
        className={`${ibmPlexMono.variable} ${notoSerifKR.variable} font-[Pretendard_Variable,Pretendard,-apple-system,BlinkMacSystemFont,sans-serif] antialiased`}
      >
        <div className="flex min-h-dvh">
          <Sidebar levelTree={levelTree} />
          <main className="min-w-0 flex-1 px-4 pt-16 pb-12 xl:pt-8">
            <BackupBanner />
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
