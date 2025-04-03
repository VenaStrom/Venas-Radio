
export function getDateFromString(dateString: string): Date | null {
  const onlyDigits = parseInt(dateString.replace(/\D/g, ""));
  const date = new Date(onlyDigits);
  return isNaN(date.getTime()) ? null : date;
}