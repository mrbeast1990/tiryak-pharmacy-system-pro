import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);

// تأجيل تسجيل Service Worker حتى بعد تحميل التطبيق
if ('serviceWorker' in navigator) {
  // تأجيل التسجيل لمدة 3 ثوانٍ بعد تحميل الصفحة
  setTimeout(() => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // التحقق من التحديثات
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // يوجد تحديث جديد
                if (confirm('يوجد تحديث جديد للتطبيق. هل تريد إعادة التحميل؟')) {
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  }, 3000);

  // الاستماع لرسائل Service Worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SYNC_OFFLINE_DATA') {
      // تنفيذ المزامنة من خلال الواجهة
      window.dispatchEvent(new CustomEvent('syncOfflineData'));
    }
  });
}

