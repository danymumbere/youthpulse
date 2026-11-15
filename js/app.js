let swRegistration = null;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        swRegistration = reg;
        // optional: update found
      })
      .catch(err => {
        console.error('Service Worker registration failed:', err);
        showNetworkError('Offline mode may be limited.');
      });
  });
}