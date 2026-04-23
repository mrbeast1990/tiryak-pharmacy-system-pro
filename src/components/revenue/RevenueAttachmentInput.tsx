import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, Square, Camera, Image as ImageIcon, X, Play, Pause, Paperclip } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AttachmentState {
  notes: string;
  attachmentUrl: string | null;
  voiceNoteUrl: string | null;
}

interface RevenueAttachmentInputProps {
  value: AttachmentState;
  onChange: (value: AttachmentState) => void;
  disabled?: boolean;
}

const BUCKET = 'revenue-attachments';

const uploadToBucket = async (file: Blob, ext: string): Promise<string | null> => {
  try {
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
    const { data, error } = await supabase.storage.from(BUCKET).upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    });
    if (error) throw error;
    const { data: urlData } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(data.path, 60 * 60 * 24 * 365);
    return urlData?.signedUrl || null;
  } catch (e) {
    console.error('Upload error:', e);
    toast.error('فشل رفع الملف');
    return null;
  }
};

const RevenueAttachmentInput: React.FC<RevenueAttachmentInputProps> = ({ value, onChange, disabled }) => {
  const [recording, setRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setUploading(true);
        const url = await uploadToBucket(blob, 'webm');
        setUploading(false);
        if (url) {
          onChange({ ...value, voiceNoteUrl: url });
          toast.success('تم تسجيل الملاحظة الصوتية');
        }
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
      setRecordingDuration(0);
      timerRef.current = window.setInterval(() => setRecordingDuration(d => d + 1), 1000);
    } catch (e) {
      console.error(e);
      toast.error('لا يمكن الوصول إلى الميكروفون');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleImageSelect = async (fromCamera: boolean) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (fromCamera) input.capture = 'environment';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploading(true);
      const ext = file.name.split('.').pop() || 'jpg';
      const url = await uploadToBucket(file, ext);
      setUploading(false);
      if (url) {
        onChange({ ...value, attachmentUrl: url });
        toast.success('تم رفع الصورة');
      }
    };
    input.click();
  };

  const togglePlay = () => {
    if (!value.voiceNoteUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(value.voiceNoteUrl);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const removeVoice = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlaying(false);
    onChange({ ...value, voiceNoteUrl: null });
  };

  const removeImage = () => onChange({ ...value, attachmentUrl: null });

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="space-y-2 bg-muted/30 rounded-xl p-3 border border-border/50">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <Paperclip className="w-3.5 h-3.5" />
        <span>ملاحظات ومرفقات (تُرفق مع العملية التالية)</span>
      </div>

      {/* Text notes */}
      <Input
        value={value.notes}
        onChange={(e) => onChange({ ...value, notes: e.target.value })}
        placeholder="اكتب ملاحظة..."
        disabled={disabled}
        className="text-sm text-right h-9 bg-card rounded-lg"
      />

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {!recording ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={startRecording}
            disabled={disabled || uploading || !!value.voiceNoteUrl}
            className="h-9 flex-1 gap-1.5 text-xs"
          >
            <Mic className="w-3.5 h-3.5 text-rose-600" />
            تسجيل صوتي
          </Button>
        ) : (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={stopRecording}
            className="h-9 flex-1 gap-1.5 text-xs animate-pulse"
          >
            <Square className="w-3.5 h-3.5" />
            إيقاف ({formatTime(recordingDuration)})
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleImageSelect(true)}
          disabled={disabled || uploading || recording || !!value.attachmentUrl}
          className="h-9 gap-1.5 text-xs"
        >
          <Camera className="w-3.5 h-3.5 text-blue-600" />
          كاميرا
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handleImageSelect(false)}
          disabled={disabled || uploading || recording || !!value.attachmentUrl}
          className="h-9 gap-1.5 text-xs"
        >
          <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
          صورة
        </Button>
      </div>

      {uploading && <p className="text-[10px] text-muted-foreground text-center animate-pulse">جاري الرفع...</p>}

      {/* Voice preview */}
      {value.voiceNoteUrl && (
        <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={togglePlay}>
            {playing ? <Pause className="w-4 h-4 text-rose-600" /> : <Play className="w-4 h-4 text-rose-600" />}
          </Button>
          <span className="text-xs text-rose-700 flex-1">ملاحظة صوتية</span>
          <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={removeVoice}>
            <X className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      )}

      {/* Image preview */}
      {value.attachmentUrl && (
        <div className="relative inline-block">
          <img src={value.attachmentUrl} alt="مرفق" className="max-h-24 rounded-lg border border-border" />
          <button
            type="button"
            onClick={removeImage}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default RevenueAttachmentInput;
