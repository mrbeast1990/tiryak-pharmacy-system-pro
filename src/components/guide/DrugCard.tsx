import React from 'react';
import { AlertTriangle, CheckCircle, Pill, FileText, MapPin, DollarSign, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DrugCardProps {
  tradeName: string;
  scientificName?: string | null;
  concentration?: string | null;
  origin?: string | null;
  pharmacistNotes?: string | null;
  price?: number | null;
  quantity?: number | null;
  isShortage?: boolean;
}

const DrugCard: React.FC<DrugCardProps> = ({
  tradeName,
  scientificName,
  concentration,
  origin,
  pharmacistNotes,
  price,
  quantity,
  isShortage = false,
}) => {
  // تحديد حالة المخزون
  const isLowStock = quantity !== null && quantity !== undefined && quantity <= 5 && quantity > 0;
  const isOutOfStock = quantity === 0;

  return (
    <Card className={`overflow-hidden transition-all hover:shadow-md ${
      isShortage || isOutOfStock ? 'border-red-200 bg-red-50/50' : 
      isLowStock ? 'border-amber-200 bg-amber-50/50' :
      'border-green-200 bg-green-50/50'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Pill className={`w-4 h-4 flex-shrink-0 ${
                isShortage || isOutOfStock ? 'text-red-500' : 
                isLowStock ? 'text-amber-500' :
                'text-green-600'
              }`} />
              <h3 className="font-bold text-foreground truncate">{tradeName}</h3>
            </div>
            
            {scientificName && (
              <p className="text-sm text-muted-foreground mb-2">{scientificName}</p>
            )}
            
            <div className="flex flex-wrap gap-2 text-xs">
              {concentration && (
                <span className="flex items-center gap-1 text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                  <span className="font-medium">التركيز:</span> {concentration}
                </span>
              )}
              {origin && (
                <span className="flex items-center gap-1 text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                  <MapPin className="w-3 h-3" />
                  {origin}
                </span>
              )}
              {price !== null && price !== undefined && (
                <span className="flex items-center gap-1 text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <DollarSign className="w-3 h-3" />
                  {price} د.ل
                </span>
              )}
              {quantity !== null && quantity !== undefined && (
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
                  isOutOfStock ? 'text-red-600 bg-red-100' :
                  isLowStock ? 'text-amber-600 bg-amber-100' :
                  'text-green-600 bg-green-100'
                }`}>
                  <Package className="w-3 h-3" />
                  {quantity} {isLowStock ? '⚠️' : ''}
                </span>
              )}
            </div>
            
            {pharmacistNotes && (
              <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>{pharmacistNotes}</span>
              </div>
            )}
          </div>
          
          <Badge 
            variant={isShortage || isOutOfStock ? "destructive" : isLowStock ? "outline" : "default"}
            className={`flex-shrink-0 ${
              isShortage || isOutOfStock
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : isLowStock
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {isShortage || isOutOfStock ? (
              <>
                <AlertTriangle className="w-3 h-3 ml-1" />
                غير متوفر
              </>
            ) : isLowStock ? (
              <>
                <AlertTriangle className="w-3 h-3 ml-1" />
                مخزون قليل
              </>
            ) : (
              <>
                <CheckCircle className="w-3 h-3 ml-1" />
                متوفر
              </>
            )}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default DrugCard;