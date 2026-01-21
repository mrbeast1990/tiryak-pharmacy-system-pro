import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const usePaymentAttachment = () => {
  const [uploading, setUploading] = useState(false);

  const uploadAttachment = async (file: File | Blob): Promise<string | null> => {
    setUploading(true);
    
    try {
      const fileExt = file instanceof File ? file.name.split('.').pop() : 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('payment-receipts')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        toast.error('فشل رفع الملف');
        return null;
      }

      // Get signed URL for private bucket
      const { data: urlData } = await supabase.storage
        .from('payment-receipts')
        .createSignedUrl(data.path, 60 * 60 * 24 * 365); // 1 year

      return urlData?.signedUrl || null;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('حدث خطأ أثناء رفع الملف');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const captureFromCamera = (): Promise<File | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0] || null;
        resolve(file);
      };
      
      input.oncancel = () => {
        resolve(null);
      };
      
      input.click();
    });
  };

  const selectFile = (): Promise<File | null> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,.pdf';
      
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0] || null;
        resolve(file);
      };
      
      input.oncancel = () => {
        resolve(null);
      };
      
      input.click();
    });
  };

  return {
    uploadAttachment,
    captureFromCamera,
    selectFile,
    uploading,
  };
};
