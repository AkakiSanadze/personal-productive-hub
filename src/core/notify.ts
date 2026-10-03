/** Desktop notification helpers. Permission is requested lazily on the first user-started timer. */

export function requestNotificationPermission(): void {
  if ('Notification' in window && Notification.permission === 'default') {
    void Notification.requestPermission();
  }
}

export function notify(title: string): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title);
    } catch {
      /* some platforms only allow notifications from a service worker */
    }
  }
}
