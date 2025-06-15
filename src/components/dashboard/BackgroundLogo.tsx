
import React from 'react';

const BackgroundLogo: React.FC = () => {
  return (
    <div 
      className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none"
      style={{
        backgroundImage: 'url(/lovable-uploads/e077b2e2-5bf4-4f3c-b603-29c91f59991e.png)',
        backgroundSize: '600px 600px',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    />
  );
};

export default BackgroundLogo;
