import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, Save, X, RotateCcw, CheckCircle, Trash2, Package } from 'lucide-react';
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
  onUpdateName: (id: string, name: string, scientificName?: string) => void;
  onUpdatePriority?: (id: string, priority: number) => void;
  onToggleOrdered?: (medicine: Medicine) => void;
  canEdit: boolean;
  canDelete: boolean;
  canMarkOrdered?: boolean;
}

const SwipeableMedicineCard: React.FC<SwipeableMedicineCardProps> = ({
  medicine,
  onMarkAvailable,
  onDelete,
  onUpdateName,
  onUpdatePriority,
  onToggleOrdered,
  canEdit,
  canDelete,
  canMarkOrdered,
}) => {
  const { language } = useLanguageStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(medicine.name);
  const [editedScientificName, setEditedScientificName] = useState(medicine.scientific_name || '');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAvailableDialog, setShowAvailableDialog] = useState(false);
  const [showPriorityPopover, setShowPriorityPopover] = useState(false);

  const isOrdered = !!(medicine as any).is_ordered;

  const handleSave = () => {
    if (editedName.trim() && !/^\s/.test(editedName)) {
      onUpdateName(medicine.id, editedName, editedScientificName.trim() || undefined);
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
    if (isOrdered) return 'bg-sky-500';
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

  const getCardStyle = () => {
    if (isOrdered) return 'bg-sky-50 border-sky-300';
    const count = medicine.repeat_count || 1;
    if (count >= 3) return 'bg-red-50 border-red-200';
    if (count >= 2) return 'bg-amber-50 border-amber-200';
    return 'bg-emerald-50 border-emerald-200';
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

      {/* Compact Card */}
      <div className={`relative shadow-sm rounded-lg overflow-hidden border ${getCardStyle()} ${isOrdered ? 'animate-ordered-pulse' : ''}`}>
        <div className="flex">
          {/* Priority strip */}
          <div className={`w-1 ${getPriorityColor()}`} />
          
          {/* Content */}
          <div className="flex-1 p-2 py-2.5">
            {isEditing ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Input 
                    value={editedName} 
                    onChange={(e) => setEditedName(e.target.value)} 
                    className="h-7 text-sm"
                    placeholder={language === 'ar' ? 'اسم الدواء' : 'Drug name'}
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Input 
                    value={editedScientificName} 
                    onChange={(e) => setEditedScientificName(e.target.value)} 
                    className="h-7 text-sm text-muted-foreground"
                    placeholder={language === 'ar' ? 'الاسم العلمي (اختياري)' : 'Scientific name (optional)'}
                  />
                  <Button size="icon" className="h-7 w-7 shrink-0 bg-emerald-600 hover:bg-emerald-700" onClick={handleSave}>
                    <Save className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-7 w-7 shrink-0" 
                    onClick={() => {
                      setIsEditing(false);
                      setEditedName(medicine.name);
                      setEditedScientificName(medicine.scientific_name || '');
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Top row: Medicine name + Edit button + Priority Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-[15px] text-foreground truncate">
                        {medicine.name}
                      </h3>
                      {canEdit && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 text-muted-foreground hover:text-foreground shrink-0" 
                          onClick={() => setIsEditing(true)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    {medicine.scientific_name && (
                      <p className="text-xs text-muted-foreground/60 italic truncate mt-0.5">
                        {medicine.scientific_name}
                      </p>
                    )}
                  </div>
                  
                  {/* Priority Badge */}
                  <Popover open={showPriorityPopover} onOpenChange={setShowPriorityPopover}>
                    <PopoverTrigger asChild>
                      <button className="focus:outline-none shrink-0">
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] px-1.5 py-0.5 cursor-pointer hover:opacity-80 transition-opacity ${getPriorityBadgeStyle()}`}
                        >
                          {medicine.repeat_count && medicine.repeat_count > 1 && (
                            <span className="flex items-center gap-0.5">
                              <RotateCcw className="w-2 h-2" />
                              <span>{medicine.repeat_count}x</span>
                              <span className="mx-0.5">•</span>
                            </span>
                          )}
                          {getPriorityLabel()}
                        </Badge>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-36 p-1.5" align="end">
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-muted-foreground text-center mb-1">
                          {language === 'ar' ? 'تغيير الأولوية' : 'Change Priority'}
                        </p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full justify-start gap-1.5 h-7 text-xs text-emerald-600 hover:bg-emerald-50"
                          onClick={() => handlePriorityChange(1)}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {language === 'ar' ? 'عادي' : 'Normal'}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full justify-start gap-1.5 h-7 text-xs text-amber-600 hover:bg-amber-50"
                          onClick={() => handlePriorityChange(2)}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          {language === 'ar' ? 'متوسط' : 'Medium'}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full justify-start gap-1.5 h-7 text-xs text-red-600 hover:bg-red-50"
                          onClick={() => handlePriorityChange(3)}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          {language === 'ar' ? 'عالي' : 'High'}
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* Bottom row: Date & Employee (left) + Actions (right) */}
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-muted-foreground/70">
                    {new Date(medicine.last_updated).toLocaleDateString('en-GB')}
                    {medicine.updatedBy && ` • ${medicine.updatedBy}`}
                  </span>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    {/* Toggle Ordered - Admin only */}
                    {canMarkOrdered && onToggleOrdered && (
                      <button
                        onClick={() => onToggleOrdered(medicine)}
                        className={`h-6 px-2 flex items-center gap-1 text-[10px] font-medium border rounded-full transition-colors ${
                          isOrdered 
                            ? 'border-sky-400 text-sky-700 bg-sky-100 hover:bg-sky-200' 
                            : 'border-sky-300 text-sky-600 bg-transparent hover:bg-sky-50'
                        }`}
                      >
                        <Package className="h-2.5 w-2.5" />
                        {language === 'ar' ? 'قيد الطلب' : 'Ordered'}
                      </button>
                    )}

                    {/* Delete Button - icon only */}
                    {canDelete && (
                      <button
                        onClick={() => setShowDeleteDialog(true)}
                        className="h-6 w-6 flex items-center justify-center text-destructive border border-destructive/50 bg-transparent hover:bg-destructive/10 rounded-full transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                    
                    {/* Available Action Chip - smaller */}
                    <button
                      onClick={() => setShowAvailableDialog(true)}
                      className="h-6 px-1.5 flex items-center gap-0.5 text-[10px] font-medium border border-emerald-400 text-emerald-600 bg-transparent hover:bg-emerald-50 rounded-full transition-colors"
                    >
                      <CheckCircle className="h-2.5 w-2.5" />
                      {language === 'ar' ? 'توفير' : 'Available'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SwipeableMedicineCard;
