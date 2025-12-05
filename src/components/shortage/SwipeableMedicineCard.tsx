import React, { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, Save, X, RotateCcw, Building2 } from 'lucide-react';
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

interface SwipeableMedicineCardProps {
  medicine: Medicine;
  onMarkAvailable: (medicine: Medicine) => void;
  onDelete: (medicine: Medicine) => void;
  onUpdateName: (id: string, name: string) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const SwipeableMedicineCard: React.FC<SwipeableMedicineCardProps> = ({
  medicine,
  onMarkAvailable,
  onDelete,
  onUpdateName,
  canEdit,
  canDelete,
}) => {
  const { language } = useLanguageStore();
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(medicine.name);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAvailableDialog, setShowAvailableDialog] = useState(false);

  const handlers = useSwipeable({
    onSwiping: (e) => {
      // Only track horizontal swipes - ignore if vertical movement is dominant
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        return;
      }
      const maxSwipe = 80;
      const offset = Math.max(-maxSwipe, Math.min(maxSwipe, e.deltaX));
      setSwipeOffset(offset);
    },
    onSwipedLeft: () => {
      if (swipeOffset < -40 && canDelete) {
        setShowDeleteDialog(true);
      }
      setSwipeOffset(0);
    },
    onSwipedRight: () => {
      if (swipeOffset > 40) {
        setShowAvailableDialog(true);
      }
      setSwipeOffset(0);
    },
    onTouchEndOrOnMouseUp: () => {
      setSwipeOffset(0);
    },
    trackMouse: false,
    trackTouch: true,
    delta: 15,
    preventScrollOnSwipe: false,
    swipeDuration: 250,
  });

  const handleSave = () => {
    if (editedName.trim() && !/^\s/.test(editedName)) {
      onUpdateName(medicine.id, editedName);
      setIsEditing(false);
    }
  };

  const getPriorityColor = () => {
    const count = medicine.repeat_count || 1;
    if (count >= 3) return 'bg-destructive';
    if (count >= 2) return 'bg-warning';
    return 'bg-primary';
  };

  const getPriorityLabel = () => {
    const count = medicine.repeat_count || 1;
    if (count >= 3) return language === 'ar' ? 'عالي' : 'High';
    if (count >= 2) return language === 'ar' ? 'متوسط' : 'Medium';
    return language === 'ar' ? 'عادي' : 'Normal';
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
              className="bg-success hover:bg-success/90"
            >
              {language === 'ar' ? 'نعم، تم توفيره' : 'Yes, provided'}
            </AlertDialogAction>
            <AlertDialogCancel>
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="relative overflow-hidden rounded-lg">
        {/* Swipe indicators */}
        <div 
          className="absolute inset-y-0 right-0 w-20 bg-success/20 flex items-center justify-center transition-opacity"
          style={{ opacity: swipeOffset > 20 ? 1 : 0 }}
        >
          <span className="text-success font-medium text-xs">
            {language === 'ar' ? 'تم توفيره' : 'Available'}
          </span>
        </div>
        <div 
          className="absolute inset-y-0 left-0 w-20 bg-destructive/20 flex items-center justify-center transition-opacity"
          style={{ opacity: swipeOffset < -20 ? 1 : 0 }}
        >
          <span className="text-destructive font-medium text-xs">
            {language === 'ar' ? 'حذف' : 'Delete'}
          </span>
        </div>

        {/* Card content */}
        <div 
          {...handlers}
          className="relative bg-card shadow-md rounded-lg transition-transform touch-pan-y"
          style={{ transform: `translateX(${swipeOffset}px)` }}
        >
          <div className="flex">
            {/* Priority strip */}
            <div className={`w-1.5 rounded-r-lg ${getPriorityColor()}`} />
            
            {/* Content */}
            <div className="flex-1 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Input 
                        value={editedName} 
                        onChange={(e) => setEditedName(e.target.value)} 
                        className="h-7 text-sm"
                        autoFocus
                      />
                      <Button size="icon" className="h-7 w-7 shrink-0" onClick={handleSave}>
                        <Save className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7 shrink-0" 
                        onClick={() => {
                          setIsEditing(false);
                          setEditedName(medicine.name);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm text-foreground truncate">
                        {medicine.name}
                      </h3>
                      {canEdit && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 shrink-0" 
                          onClick={() => setIsEditing(true)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {/* Company */}
                  {(medicine as any).company && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      <span>{(medicine as any).company}</span>
                    </div>
                  )}
                  
                  {/* Meta info */}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(medicine.last_updated).toLocaleDateString('ar-EG')}
                    {medicine.updatedBy && ` • ${medicine.updatedBy}`}
                  </p>
                </div>

                {/* Badges */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {medicine.repeat_count && medicine.repeat_count > 1 && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0.5 flex items-center gap-1">
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>{medicine.repeat_count}x</span>
                    </Badge>
                  )}
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-1.5 py-0.5 ${
                      medicine.repeat_count && medicine.repeat_count >= 3 
                        ? 'border-destructive text-destructive' 
                        : medicine.repeat_count && medicine.repeat_count >= 2 
                          ? 'border-warning text-warning'
                          : 'border-primary text-primary'
                    }`}
                  >
                    {getPriorityLabel()}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SwipeableMedicineCard;
