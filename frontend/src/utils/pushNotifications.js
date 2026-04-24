let serviceWorkerRegistrationPromise = null;

export const registerNotificationServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  if (!serviceWorkerRegistrationPromise) {
    serviceWorkerRegistrationPromise = navigator.serviceWorker
      .register('/sw.js')
      .catch((error) => {
        console.error('Service worker registration failed', error);
        serviceWorkerRegistrationPromise = null;
        return null;
      });
  }

  return serviceWorkerRegistrationPromise;
};

export const getReadyServiceWorkerRegistration = async () => {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  await registerNotificationServiceWorker();
  return navigator.serviceWorker.ready;
};

export const urlBase64ToUint8Array = (base64String = '') => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const normalizedBase64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(normalizedBase64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
};
