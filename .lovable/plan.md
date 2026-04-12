

## Problem

The login form's `handleSubmit` function does not wrap the `login()` call in a `try/catch` block. If `login()` throws an unhandled exception (network error, Supabase timeout, etc.), `setIsLoading(false)` is never called, leaving the spinner spinning forever.

## Fix

**File: `src/components/LoginForm.tsx`** (lines 28-49)

Wrap the login logic in a `try/catch/finally` block so `setIsLoading(false)` always runs:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      setAuthRememberMe(rememberMe);
      const success = await login(email, password);
      
      if (success) {
        toast({
          title: language === 'ar' ? "تم تسجيل الدخول بنجاح" : "Login Successful",
          description: language === 'ar' ? "مرحباً بك في نظام صيدلية الترياق الشافي" : "Welcome to Al-Tiryak Al-Shafi System",
        });
      } else {
        toast({
          title: language === 'ar' ? "خطأ في تسجيل الدخول" : "Login Error",
          description: language === 'ar' ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" : "Invalid email or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: language === 'ar' ? "خطأ في الاتصال" : "Connection Error",
        description: language === 'ar' ? "تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى." : "Could not connect to the server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
};
```

Also add similar `try/catch` to the `login` function in **`src/store/authStore.ts`** around the profile query to prevent unhandled promise rejections from propagating.

## Technical Details

- The root cause is a missing error boundary in the async login handler
- `setIsLoading(false)` in a `finally` block guarantees the spinner always stops
- The `login()` function in the store already handles most errors, but network-level failures (DNS, timeout) can still throw uncaught exceptions

