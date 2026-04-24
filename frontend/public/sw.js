self.addEventListener('push', (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    data = {};
  }

  const title = data.title || 'Jira notification';
  const options = {
    body: data.body || 'You have a new update.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: {
      url: data.url || '/admin/issues',
    },
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'notification-received' });
        });
      }),
    ])
  );
});

self.addEventListener('notificationclick', (event) => {
  const targetUrl = new URL(event.notification?.data?.url || '/admin/issues', self.location.origin).href;

  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const matchingClient = clients.find((client) => client.url === targetUrl);

      if (matchingClient) {
        matchingClient.focus();
        matchingClient.postMessage({ type: 'notification-received' });
        return null;
      }

      return self.clients.openWindow(targetUrl);
    })
  );
});
