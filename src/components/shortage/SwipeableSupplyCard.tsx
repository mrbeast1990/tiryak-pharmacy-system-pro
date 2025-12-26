import React, { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, Save, X, RotateCcw } from 'lucide-react';
import { Supply } from '@/store/pharmacyStore';
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

interface SwipeableSupplyCardProps {
  supply: Supply;
  onMarkAvailable: (supply: Supply) => void;
  onDelete: (supply: Supply) => void;
  onUpdateName: (id: string, name: string) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const SwipeableSupplyCard: React.FC<SwipeableSupplyCardProps> = ({
  supply,
  onMarkAvailable,
  onDelete,
  onUpdateName,
  canEdit,
  canDelete,
}) => {
  const { language } = useLanguageStore();
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(supply.name);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAvailableDialog, setShowAvailableDialog] = useState(false);

  const handlers = useSwipeable({
    onSwiping: (e) => {
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
      onUpdateName(supply.id, editedName);
      setIsEditing(false);
    }
  };

  const getPriorityColor = () => {
    const count = supply.repeat_count || 1;
    if (count >= 3) return 'bg-destructive';
    if (count >= 2) return 'bg-warning';
    return 'bg-blue-500';
  };

  const getPriorityLabel = () => {
    const count = supply.repeat_count || 1;
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
                ? `هل ترغب في حذف "${supply.name}"؟`
                : `Do you want to delete "${supply.name}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction 
              onClick={() => onDelete(supply)}
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
                ? `هل تم توفير "${supply.name}"؟`
                : `Has "${supply.name}" been provided?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction 
              onClick={() => onMarkAvailable(supply)}
              className="bg-blue-500 hover:bg-blue-600"
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
          className="absolute inset-y-0 right-0 w-20 bg-blue-500/20 flex items-center justify-center transition-opacity"
          style={{ opacity: swipeOffset > 20 ? 1 : 0 }}
        >
          <span className="text-blue-600 font-medium text-xs">
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

        {/* Card content - LTR Layout */}
        <div 
          {...handlers}
          className="relative bg-card shadow-md rounded-lg transition-transform touch-pan-y"
          style={{ transform: `translateX(${swipeOffset}px)` }}
          dir="ltr"
        >
          <div className="flex">
            {/* Priority strip - LEFT side - Blue/Purple theme */}
            <div className={`w-1.5 rounded-l-lg ${getPriorityColor()}`} />
            
            {/* Content */}
            <div className="flex-1 p-3">
              <div className="flex items-start justify-between gap-2">
                {/* Left side - Supply name and meta */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Input 
                        value={editedName} 
                        onChange={(e) => setEditedName(e.target.value)} 
                        className="h-7 text-sm"
                        autoFocus
                      />
                      <Button size="icon" className="h-7 w-7 shrink-0 bg-blue-500 hover:bg-blue-600" onClick={handleSave}>
                        <Save className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-7 w-7 shrink-0" 
                        onClick={() => {
                          setIsEditing(false);
                          setEditedName(supply.name);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-base text-foreground truncate">
                          {supply.name}
                        </h3>
                      </div>
                      {/* Meta info - Date (English numerals) */}
                      <p className="text-xs text-muted-foreground mt-1">
                        <span>{new Date(supply.last_updated).toLocaleDateString('en-GB')}</span>
                        {supply.updatedBy && (
                          <span> • {supply.updatedBy}</span>
                        )}
                      </p>
                    </>
                  )}
                </div>

                {/* Right side - Badges and Edit button */}
                <div className="flex items-center gap-2 shrink-0">
                  {canEdit && !isEditing && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <div className="flex flex-col items-end gap-1">
                    {supply.repeat_count && supply.repeat_count > 1 && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5 flex items-center gap-1">
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>{supply.repeat_count}x</span>
                      </Badge>
                    )}
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-1.5 py-0.5 ${
                        supply.repeat_count && supply.repeat_count >= 3 
                          ? 'border-destructive text-destructive' 
                          : supply.repeat_count && supply.repeat_count >= 2 
                            ? 'border-warning text-warning'
                            : 'border-blue-500 text-blue-500'
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
      </div>
    </>
  );
};

export default SwipeableSupplyCard;
