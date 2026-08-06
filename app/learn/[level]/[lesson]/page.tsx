type Props = {
  params: Promise<{ level: string; lesson: string }>;
};

export default async function LessonPage({ params }: Props) {
  const { level, lesson } = await params;

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-[-0.035em]">
        Level {level} — {lesson}
      </h1>
      <p className="mt-2 text-muted">레슨 본문이 여기에 렌더링된다.</p>
    </div>
  );
}
