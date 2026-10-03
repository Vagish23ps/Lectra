export function getNotificationNativeId(
  notificationId: string
): number {
  let hash = 0;

  for (let i = 0; i < notificationId.length; i++) {
    hash = (hash << 5) - hash + notificationId.charCodeAt(i);
    hash |= 0;
  }

  const abs = Math.abs(hash);
  return abs === 2147483648 ? 2147483647 : abs;
}