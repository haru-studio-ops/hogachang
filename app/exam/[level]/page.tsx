type Props = {
  params: Promise<{ level: string }>;
};

export default async function ExamPage({ params }: Props) {
  const { level } = await params;

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-[-0.035em]">
        Level {level} 졸업시험
      </h1>
      <p className="mt-2 text-muted">25문항, 80% 이상 통과해야 다음 레벨로.</p>
    </div>
  );
}
