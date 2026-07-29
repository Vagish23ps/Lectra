export function isTimeToNotify(targetTime: string): boolean {
  if (!targetTime) return false;

  const now = new Date();

  const [hour, minute] = targetTime
    .split(":")
    .map(Number);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute)
  ) {
    return false;
  }

  return (
    now.getHours() === hour &&
    now.getMinutes() === minute
  );
}