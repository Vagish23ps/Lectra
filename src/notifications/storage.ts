const STORAGE_KEY = "lectra_shown_notifications";

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

export function getShownNotifications(): string[] {
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(STORAGE_KEY);

  return data ? JSON.parse(data) : [];
}

export function markNotificationShown(id: string) {
  const notifications = getShownNotifications();

  const key = `${id}-${getTodayKey()}`;

  if (!notifications.includes(key)) {
    notifications.push(key);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(notifications)
    );
  }
}

export function wasNotificationShown(id: string) {
  const key = `${id}-${getTodayKey()}`;

  return getShownNotifications().includes(key);
}

export function resetNotification(id: string) {
  if (typeof window === "undefined") return;

  const key = `${id}-${getTodayKey()}`;

  const notifications = getShownNotifications().filter(
    (item) => item !== key
  );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(notifications)
  );
}