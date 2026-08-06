type Props = {
  params: Promise<{ level: string }>;
};

export default async function LevelPage({ params }: Props) {
  const { level } = await params;

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-[-0.035em]">
        Level {level}
      </h1>
      <p className="mt-2 text-muted">레벨 개요와 모듈 목록.</p>
    </div>
  );
}
