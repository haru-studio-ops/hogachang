import type { Metadata } from "next";
import BackupControls from "@/components/settings/BackupControls";

export const metadata: Metadata = {
  title: "설정 | 호가창",
  description: "학습 기록 백업 내보내기·불러오기",
};

export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-[720px]">
      <h1 className="text-3xl font-extrabold tracking-[-0.035em]">설정</h1>
      <p className="mt-2 text-muted">
        학습 기록은 서버가 아니라 이 브라우저의 저장소에만 남는다. 기기를
        바꾸거나 브라우저 데이터를 지우기 전에 반드시 백업한다.
      </p>
      <div className="mt-8">
        <BackupControls />
      </div>
    </div>
  );
}
