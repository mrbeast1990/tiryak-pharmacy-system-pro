import React from 'react';
import { Building2, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useOrderBuilderStore } from '@/store/orderBuilderStore';

const SupplierSelector: React.FC = () => {
  const { supplierName, setSupplierName, supplierPhone, setSupplierPhone } = useOrderBuilderStore();

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground block mb-1">
              اسم الشركة الموردة
            </label>
            <Input
              placeholder="أدخل اسم المورد..."
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              className="text-right"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <Phone className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground block mb-1">
              رقم هاتف الشركة
            </label>
            <Input
              placeholder="أدخل رقم الهاتف..."
              value={supplierPhone}
              onChange={(e) => setSupplierPhone(e.target.value)}
              className="text-right"
              type="tel"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupplierSelector;
