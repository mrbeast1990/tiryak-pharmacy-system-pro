import React, { useState, useEffect, useMemo } from 'react';
import { Search, Loader2, AlertCircle, Pill } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { usePharmacyStore } from '@/store/pharmacyStore';
import DrugCard from './DrugCard';

interface PharmacyGuideItem {
  id: string;
  trade_name: string;
  scientific_name: string;
  concentration: string | null;
  origin: string | null;
  pharmacist_notes: string | null;
  keywords: string[] | null;
}

const DrugSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [guideItems, setGuideItems] = useState<PharmacyGuideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { medicines } = usePharmacyStore();

  // Get shortage medicine names for quick lookup
  const shortageNames = useMemo(() => {
    return new Set(
      medicines
        .filter(m => m.status === 'shortage')
        .map(m => m.name.toLowerCase())
    );
  }, [medicines]);

  useEffect(() => {
    fetchGuideItems();
  }, []);

  const fetchGuideItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pharmacy_guide')
      .select('*')
      .order('trade_name');

    if (error) {
      console.error('Error fetching pharmacy guide:', error);
    } else {
      setGuideItems(data || []);
    }
    setLoading(false);
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return guideItems;

    const query = searchQuery.toLowerCase();
    return guideItems.filter(item => 
      item.trade_name.toLowerCase().includes(query) ||
      item.scientific_name.toLowerCase().includes(query) ||
      item.keywords?.some(k => k.toLowerCase().includes(query))
    );
  }, [searchQuery, guideItems]);

  // Group by scientific name for alternatives view
  const groupedByScientific = useMemo(() => {
    const groups: Record<string, PharmacyGuideItem[]> = {};
    filteredItems.forEach(item => {
      const key = item.scientific_name.toLowerCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [filteredItems]);

  const isShortage = (tradeName: string) => {
    return shortageNames.has(tradeName.toLowerCase());
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-sm border-purple-100">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="ابحث بالاسم التجاري أو العلمي..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 bg-white border-purple-200 focus:border-purple-400 focus:ring-purple-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : guideItems.length === 0 ? (
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <Pill className="w-12 h-12 mx-auto mb-4 text-purple-300" />
            <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد بيانات</h3>
            <p className="text-muted-foreground text-sm">
              يرجى رفع ملف Excel يحتوي على بيانات الأدوية من تبويب "التحديث"
            </p>
          </CardContent>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-amber-400" />
            <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد نتائج</h3>
            <p className="text-muted-foreground text-sm">
              لم يتم العثور على أدوية تطابق "{searchQuery}"
            </p>
          </CardContent>
        </Card>
      ) : searchQuery.trim() ? (
        // Grouped view when searching
        <div className="space-y-4">
          {Object.entries(groupedByScientific).map(([scientificName, items]) => (
            <Card key={scientificName} className="bg-white/90 backdrop-blur-sm overflow-hidden">
              <CardHeader className="py-3 px-4 bg-purple-50 border-b border-purple-100">
                <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
                  <Pill className="w-4 h-4" />
                  {items[0].scientific_name}
                  <span className="text-purple-400 font-normal">
                    ({items.length} {items.length === 1 ? 'منتج' : 'منتجات'})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                {items.map(item => (
                  <DrugCard
                    key={item.id}
                    tradeName={item.trade_name}
                    scientificName={item.scientific_name}
                    concentration={item.concentration}
                    origin={item.origin}
                    pharmacistNotes={item.pharmacist_notes}
                    isShortage={isShortage(item.trade_name)}
                  />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // List view when not searching
        <div className="space-y-2">
          {filteredItems.slice(0, 50).map(item => (
            <DrugCard
              key={item.id}
              tradeName={item.trade_name}
              scientificName={item.scientific_name}
              concentration={item.concentration}
              origin={item.origin}
              pharmacistNotes={item.pharmacist_notes}
              isShortage={isShortage(item.trade_name)}
            />
          ))}
          {filteredItems.length > 50 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              يتم عرض أول 50 نتيجة. استخدم البحث لتضييق النتائج.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default DrugSearch;
