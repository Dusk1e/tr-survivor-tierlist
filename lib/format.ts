/**
 * Display formatter — capitalises the first letter of every word-part
 * (split on space / _ / - / . / +), preserving the rest as typed.
 * Used only for display; stored nicknames & logins keep their original value.
 */
export function formatName(s: string): string {
  if (!s) return s;
  return s.replace(
    /(^|[\s_.+\-])([a-zA-ZçğıöşüÇĞİÖŞÜ])/g,
    (_m, sep: string, ch: string) => sep + ch.toLocaleUpperCase("tr")
  );
}
