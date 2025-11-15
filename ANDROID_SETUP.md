# إعداد الإشعارات على Android

## خطوات مهمة لإصلاح crash الإشعارات على Android 13+

### 1. إضافة الصلاحيات المطلوبة

يجب إضافة الصلاحيات التالية في ملف `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- صلاحيات الإشعارات - مطلوبة لـ Android 13+ (API 33+) -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    
    <!-- صلاحيات الإنترنت -->
    <uses-permission android:name="android.permission.INTERNET" />
    
    <!-- صلاحيات الإشعارات المحلية -->
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.VIBRATE" />
    
    <!-- صلاحيات FCM (Firebase Cloud Messaging) -->
    <uses-permission android:name="com.google.android.c2dm.permission.RECEIVE" />
    
    <application
        android:name=".MainApplication"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">
        
        <!-- باقي محتوى الـ application -->
        
    </application>
</manifest>
```

### 2. إنشاء أيقونة الإشعارات

يجب إنشاء أيقونة للإشعارات في المسار التالي:

`android/app/src/main/res/drawable/ic_stat_notification.xml`

```xml
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FFFFFF"
        android:pathData="M12,22c1.1,0 2,-0.9 2,-2h-4c0,1.1 0.89,2 2,2zM18,16v-5c0,-3.07 -1.64,-5.64 -4.5,-6.32V4c0,-0.83 -0.67,-1.5 -1.5,-1.5s-1.5,0.67 -1.5,1.5v0.68C7.63,5.36 6,7.92 6,11v5l-2,2v1h16v-1l-2,-2z"/>
</vector>
```

### 3. التحقق من إعدادات build.gradle

تأكد من أن `targetSdkVersion` و `compileSdkVersion` في ملف `android/app/build.gradle` هما 33 أو أعلى:

```gradle
android {
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "app.lovable.9b52e30f59b9496085ca74c59e504753"
        minSdkVersion 22
        targetSdkVersion 34
        versionCode 1
        versionName "1.0"
    }
}
```

### 4. إعادة بناء التطبيق

بعد إجراء التعديلات:

```bash
# 1. تنظيف المشروع
cd android
./gradlew clean

# 2. العودة للمجلد الرئيسي
cd ..

# 3. مزامنة Capacitor
npx cap sync android

# 4. إعادة البناء
npm run build
npx cap sync android

# 5. فتح Android Studio
npx cap open android
```

### 5. اختبار التطبيق

1. قم ببناء APK من Android Studio
2. قم بتثبيته على جهاز Android 13 أو أحدث
3. عند فتح التطبيق لأول مرة، ستظهر نافذة طلب الإذن
4. اضغط على "سماح" (Allow)
5. يجب أن يستمر التطبيق في العمل بدون crash (قد يستغرق 2-3 ثواني للمعالجة)
6. جرب إرسال إشعار اختباري من لوحة التحكم

**إذا استمرت المشكلة:**
- قم بإلغاء تثبيت التطبيق تماماً من الهاتف
- أعد تثبيته من جديد (لمسح جميع البيانات المحفوظة)
- حاول مرة أخرى

### ملاحظات مهمة

- ⚠️ **Android 13+ (API 33)**: صلاحية `POST_NOTIFICATIONS` مطلوبة وجديدة
- ⚠️ **Crash عند الإذن**: إذا حدث crash، تأكد من وجود جميع الصلاحيات المذكورة أعلاه
- ⚠️ **الأيقونة**: يجب أن تكون أيقونة الإشعار بيضاء وشفافة (transparent PNG or Vector)
- ✅ **التأخيرات الطويلة**: الكود يحتوي على تأخيرات ممتدة (1.5-2 ثانية) لمنع crash بعد منح الإذن
- ✅ **منع Crash Loop**: يستخدم Preferences لحفظ حالة الإذن وتجنب إعادة الطلب
- ✅ **Error Handling**: جميع العمليات محمية بعدة طبقات من try-catch
- ✅ **SafeWrapper**: Dashboard محمي بـ SafeWrapper لمنع أي crash من إغلاق التطبيق

### حل المشاكل الشائعة

#### المشكلة: التطبيق يغلق عند الضغط على "سماح" أو يدخل في crash loop
**الحل**: 
- تأكد من وجود صلاحية `POST_NOTIFICATIONS` في AndroidManifest.xml
- تأكد من أن التطبيق يستخدم targetSdkVersion 33 أو أعلى
- الكود الجديد يحتوي على تأخيرات ممتدة (1.5-2 ثانية) لمنع crash
- يستخدم Capacitor Preferences لحفظ حالة الإذن ومنع إعادة الطلب
- محمي بعدة طبقات من error handling لمنع crash loop
- إذا استمرت المشكلة، قم بإلغاء تثبيت التطبيق تماماً ثم أعد تثبيته لمسح جميع البيانات المحفوظة

#### المشكلة: الإشعارات لا تظهر
**الحل**:
- تأكد من أن أيقونة `ic_stat_notification` موجودة
- تحقق من إعدادات الجهاز (Settings > Apps > Your App > Notifications)
- راجع console logs للتأكد من عدم وجود أخطاء

#### المشكلة: FCM token لا يتم حفظه
**الحل**:
- تحقق من اتصال الإنترنت
- تأكد من أن المستخدم مسجل دخول
- راجع console logs لمعرفة سبب فشل حفظ token
