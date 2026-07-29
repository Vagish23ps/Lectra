export function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function isToday(date: Date) {
  const today = startOfDay(new Date());

  return startOfDay(date).getTime() === today.getTime();
}

export function isTomorrow(date: Date) {
  const tomorrow = startOfDay(new Date());
  tomorrow.setDate(tomorrow.getDate() + 1);

  return startOfDay(date).getTime() === tomorrow.getTime();
}

export function isOverdue(date: Date) {
  return startOfDay(date) < startOfDay(new Date());
}

export function daysBetween(date1: Date, date2: Date) {
  const diff =
    startOfDay(date2).getTime() - startOfDay(date1).getTime();

  return Math.floor(diff / (1000 * 60 * 60 * 24));
}