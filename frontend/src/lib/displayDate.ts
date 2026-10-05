const DATE_PATTERN = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;

export function isoToDisplay(iso: string) {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return "";
  return `${month}/${day}/${year}`;
}

export function displayToIso(display: string) {
  if (!DATE_PATTERN.test(display)) return "";
  const [month, day, year] = display.split("/");
  return `${year}-${month}-${day}`;
}

export function isValidDisplayDate(value: string) {
  if (!DATE_PATTERN.test(value)) return false;
  const [month, day, year] = value.split("/").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/** Compare mm/dd/yyyy display dates via ISO (yyyy-mm-dd) lexicographic order. */
export function isDisplayDateBefore(a: string, b: string) {
  if (!isValidDisplayDate(a) || !isValidDisplayDate(b)) return false;
  return displayToIso(a) < displayToIso(b);
}
