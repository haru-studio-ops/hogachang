import { CURRICULUM } from "@/lib/curriculum";
import { getLessonsForLevel } from "@/lib/content";
import Dashboard from "@/components/dashboard/Dashboard";

export default function DashboardPage() {
  const lessonOrder = CURRICULUM.flatMap((cur) =>
    getLessonsForLevel(cur.level).map((l) => ({
      id: l.id,
      title: l.title,
      level: cur.level,
    }))
  );

  return (
    <div className="mx-auto w-full max-w-[900px]">
      <h1 className="text-3xl font-extrabold tracking-[-0.035em]">대시보드</h1>
      <p className="mt-2 mb-6 text-muted">
        오늘 할 일과 학습 이력을 한눈에 본다.
      </p>
      <Dashboard lessonOrder={lessonOrder} />
    </div>
  );
}
