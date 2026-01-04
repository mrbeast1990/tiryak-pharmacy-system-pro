import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('🚀 بدء تحميل التطبيق...');

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error('لم يتم العثور على عنصر الجذر #root');
  }

  console.log('✅ تم العثور على عنصر الجذر');
  const root = createRoot(rootElement);
  
  console.log('✅ إنشاء React root بنجاح');
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log('✅ تم تشغيل التطبيق بنجاح');
} catch (error) {
  console.error('❌ خطأ فادح في تشغيل التطبيق:', error);
  
  // عرض رسالة خطأ مبسطة للمستخدم
  document.body.innerHTML = `
    <div style="
      min-height: 100vh; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      background: linear-gradient(135deg, #fef7f0 0%, #fed7aa 100%);
      font-family: 'Cairo', sans-serif;
      direction: rtl;
    ">
      <div style="
        text-align: center; 
        padding: 2rem; 
        background: white; 
        border-radius: 0.75rem; 
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        max-width: 400px;
      ">
        <h2 style="color: #dc2626; font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">
          خطأ في تشغيل التطبيق
        </h2>
        <p style="color: #6b7280; margin-bottom: 1.5rem;">
          حدث خطأ فني أثناء تحميل النظام
        </p>
        <button 
          onclick="window.location.reload()" 
          style="
            background: #dc2626; 
            color: white; 
            padding: 0.75rem 1.5rem; 
            border: none; 
            border-radius: 0.5rem; 
            cursor: pointer;
            font-weight: 500;
          "
        >
          إعادة تحميل الصفحة
        </button>
      </div>
    </div>
  `;
}

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
