import remarkCjkFriendly from "remark-cjk-friendly";

/**
 * MDXRemote 공통 옵션.
 * - remark-cjk-friendly: CommonMark 규칙상 `**강조**다`처럼 닫는 **에 한글이
 *   바로 붙으면 강조가 풀리는 문제를 CJK 친화 규칙으로 고친다.
 * - blockJS: false — next-mdx-remote v6 기본값(true)은 JSX 배열 props를
 *   제거하므로 반드시 끈다 (콘텐츠는 로컬 신뢰 소스).
 */
export const mdxRemoteOptions = {
  mdxOptions: { remarkPlugins: [remarkCjkFriendly] },
  blockJS: false,
};
