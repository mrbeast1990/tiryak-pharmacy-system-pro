import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, Save, X, RotateCcw, CheckCircle } from 'lucide-react';
import { Medicine } from '@/store/pharmacyStore';
import { useLanguageStore } from '@/store/languageStore';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SwipeableMedicineCardProps {
  medicine: Medicine;
  onMarkAvailable: (medicine: Medicine) => void;
  onDelete: (medicine: Medicine) => void;
  onUpdateName: (id: string, name: string) => void;
  onUpdatePriority?: (id: string, priority: number) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const SwipeableMedicineCard: React.FC<SwipeableMedicineCardProps> = ({
  medicine,
  onMarkAvailable,
  onDelete,
  onUpdateName,
  onUpdatePriority,
  canEdit,
  canDelete,
}) => {
  const { language } = useLanguageStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(medicine.name);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAvailableDialog, setShowAvailableDialog] = useState(false);
  const [showPriorityPopover, setShowPriorityPopover] = useState(false);

  const handleSave = () => {
    if (editedName.trim() && !/^\s/.test(editedName)) {
      onUpdateName(medicine.id, editedName);
      setIsEditing(false);
    }
  };

  const handlePriorityChange = (newPriority: number) => {
    if (onUpdatePriority) {
      onUpdatePriority(medicine.id, newPriority);
    }
    setShowPriorityPopover(false);
  };

  const getPriorityColor = () => {
    const count = medicine.repeat_count || 1;
    if (count >= 3) return 'bg-red-500';
    if (count >= 2) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getPriorityLabel = () => {
    const count = medicine.repeat_count || 1;
    if (count >= 3) return language === 'ar' ? 'عالي' : 'High';
    if (count >= 2) return language === 'ar' ? 'متوسط' : 'Medium';
    return language === 'ar' ? 'عادي' : 'Normal';
  };

  const getPriorityBadgeStyle = () => {
    const count = medicine.repeat_count || 1;
    if (count >= 3) return 'border-red-500 text-red-600 bg-red-50';
    if (count >= 2) return 'border-amber-500 text-amber-600 bg-amber-50';
    return 'border-emerald-500 text-emerald-600 bg-emerald-50';
  };

  return (
    <>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">
              {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              {language === 'ar' 
                ? `هل ترغب في حذف "${medicine.name}"؟`
                : `Do you want to delete "${medicine.name}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction 
              onClick={() => onDelete(medicine)}
              className="bg-destructive hover:bg-destructive/90"
            >
              {language === 'ar' ? 'حذف' : 'Delete'}
            </AlertDialogAction>
            <AlertDialogCancel>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showAvailableDialog} onOpenChange={setShowAvailableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">
              {language === 'ar' ? 'تأكيد التوفير' : 'Confirm Available'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              {language === 'ar' 
                ? `هل تم توفير صنف "${medicine.name}"؟`
                : `Has "${medicine.name}" been provided?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction 
              onClick={() => onMarkAvailable(medicine)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {language === 'ar' ? 'نعم، تم توفيره' : 'Yes, provided'}
            </AlertDialogAction>
            <AlertDialogCancel>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Card without swipe */}
      <div className="relative bg-card shadow-md rounded-xl overflow-hidden border border-border/50">
        <div className="flex">
          {/* Priority strip - RIGHT side for RTL */}
          <div className={`w-1.5 ${getPriorityColor()}`} />
          
          {/* Content */}
          <div className="flex-1 p-3">
            <div className="flex items-start justify-between gap-3">
              {/* Right side - Medicine name and meta (RTL) */}
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <Input 
                      value={editedName} 
                      onChange={(e) => setEditedName(e.target.value)} 
                      className="h-8 text-sm"
                      autoFocus
                    />
                    <Button size="icon" className="h-8 w-8 shrink-0 bg-emerald-600 hover:bg-emerald-700" onClick={handleSave}>
                      <Save className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 shrink-0" 
                      onClick={() => {
                        setIsEditing(false);
                        setEditedName(medicine.name);
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base text-foreground leading-tight">
                        {medicine.name}
                      </h3>
                      {canEdit && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-muted-foreground hover:text-foreground" 
                          onClick={() => setIsEditing(true)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    {/* Meta info */}
                    <p className="text-xs text-muted-foreground mt-1">
                      <span>{new Date(medicine.last_updated).toLocaleDateString('en-GB')}</span>
                      {medicine.updatedBy && (
                        <span> • {medicine.updatedBy}</span>
                      )}
                    </p>
                  </>
                )}
              </div>

              {/* Left side - Priority badge and Available button */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                {/* Priority Badge - Clickable */}
                <Popover open={showPriorityPopover} onOpenChange={setShowPriorityPopover}>
                  <PopoverTrigger asChild>
                    <button className="focus:outline-none">
                      <Badge 
                        variant="outline" 
                        className={`text-xs px-2 py-1 cursor-pointer hover:opacity-80 transition-opacity ${getPriorityBadgeStyle()}`}
                      >
                        {medicine.repeat_count && medicine.repeat_count > 1 && (
                          <span className="flex items-center gap-1">
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>{medicine.repeat_count}x</span>
                            <span className="mx-1">•</span>
                          </span>
                        )}
                        {getPriorityLabel()}
                      </Badge>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-40 p-2" align="end">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground text-center mb-2">
                        {language === 'ar' ? 'تغيير الأولوية' : 'Change Priority'}
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start gap-2 text-emerald-600 hover:bg-emerald-50"
                        onClick={() => handlePriorityChange(1)}
                      >
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        {language === 'ar' ? 'عادي' : 'Normal'}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start gap-2 text-amber-600 hover:bg-amber-50"
                        onClick={() => handlePriorityChange(2)}
                      >
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        {language === 'ar' ? 'متوسط' : 'Medium'}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start gap-2 text-red-600 hover:bg-red-50"
                        onClick={() => handlePriorityChange(3)}
                      >
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        {language === 'ar' ? 'عالي' : 'High'}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Available Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 transition-colors"
                  onClick={() => setShowAvailableDialog(true)}
                >
                  <CheckCircle className="h-3.5 w-3.5 ml-1.5" />
                  <span className="text-xs font-medium">
                    {language === 'ar' ? 'تم التوفير' : 'Available'}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SwipeableMedicineCard;