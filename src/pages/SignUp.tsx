
import React from 'react';
import { useLanguageStore } from '@/store/languageStore';
import SignUpHeader from '@/components/SignUpHeader';
import SignUpForm from '@/components/SignUpForm';
import SignUpFooter from '@/components/SignUpFooter';

const SignUp: React.FC = () => {
  const { language } = useLanguageStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 relative" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Background Logo */}
      <div 
        className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'url(/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png)',
          backgroundSize: '400px 400px',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      <SignUpHeader />

      <div className="flex items-center justify-center py-8 px-4 relative z-10">
        <div className="w-full max-w-md space-y-6">
          <SignUpForm />
          <SignUpFooter />
        </div>
      </div>
    </div>
  );
};

export default SignUp;
