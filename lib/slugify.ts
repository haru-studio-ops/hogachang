/** 제목 텍스트를 앵커 id로 변환한다. 한글을 그대로 유지한다. */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");
}
