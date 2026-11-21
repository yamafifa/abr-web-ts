/**
 * 検索用に文字をそろえる（Elasticsearch に入れる値と、AP が検索する文字の両方に同じ処理をする）
 *
 * MySQL のテーブルは utf8mb4_unicode_ci なので、LIKE や = は次の違いを同じ文字として扱う。
 * Elasticsearch の wildcard 型は文字をそのまま比べるので、両方の側でそろえてから比べる。
 * - 全角と半角（「3」で「３丁目」が見つかる）、大文字と小文字 → NFKC ＋ 小文字
 * - 濁点・半濁点（「は」と「パ」）→ NFD に分けて、濁点・半濁点の記号を消す
 * - カタカナとひらがな（「あ」と「ア」）→ ひらがなにする
 * - 小さい仮名（「ヶ」と「ケ」）→ 大きい仮名にする
 *
 * CJK 互換漢字（例：U+FA10 の「塚」）は、そのまま残す。NFKC・NFD は U+585A の「塚」に変えてしまうが、
 * MySQL はこの 2 つを別の文字として扱うため
 *
 * abr-batch の src/lib/fold.ts（Elasticsearch に入れる側）と同じ処理。Rails・Laravel・Symfony・Java の各版にもある。直すときはすべてを直す
 */
const SMALL_TO_LARGE: Record<string, string> = {
  "ぁ": "あ", "ぃ": "い", "ぅ": "う", "ぇ": "え", "ぉ": "お", "っ": "つ",
  "ゃ": "や", "ゅ": "ゆ", "ょ": "よ", "ゎ": "わ", "ゕ": "か", "ゖ": "け",
};

/** CJK 互換漢字（U+F900〜U+FAFF、U+2F800〜U+2FA1F）以外の並び */
const NOT_CJK_COMPAT = /[^\uF900-\uFAFF\u{2F800}-\u{2FA1F}]+/gu;

export function fold(s: string): string {
  return s.replace(NOT_CJK_COMPAT, foldPart);
}

function foldPart(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u3099\u309A]/g, "")
    .replace(/[\u30A1-\u30F6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/[ぁぃぅぇぉっゃゅょゎゕゖ]/g, (c) => SMALL_TO_LARGE[c] ?? c);
}
