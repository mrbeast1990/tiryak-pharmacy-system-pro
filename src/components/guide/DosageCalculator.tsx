import React, { useState, useEffect } from 'react';
import { Calculator, Baby, AlertTriangle, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface PharmacyGuideItem {
  id: string;
  trade_name: string;
  scientific_name: string;
  concentration: string | null;
}

// Common pediatric dosing formulas
const COMMON_DRUGS = [
  { name: 'Paracetamol (أسيتامينوفين)', dose: 15, unit: 'mg/kg', frequency: 'كل 4-6 ساعات', maxDaily: 60 },
  { name: 'Ibuprofen (أيبوبروفين)', dose: 10, unit: 'mg/kg', frequency: 'كل 6-8 ساعات', maxDaily: 40 },
  { name: 'Amoxicillin (أموكسيسيلين)', dose: 25, unit: 'mg/kg', frequency: 'كل 8 ساعات', maxDaily: 100 },
  { name: 'Azithromycin (أزيثرومايسين)', dose: 10, unit: 'mg/kg', frequency: 'مرة واحدة يومياً', maxDaily: 10 },
  { name: 'Cefixime (سيفيكسيم)', dose: 8, unit: 'mg/kg', frequency: 'مرة واحدة يومياً', maxDaily: 16 },
  { name: 'Cetirizine (سيتيريزين)', dose: 0.25, unit: 'mg/kg', frequency: 'مرة واحدة يومياً', maxDaily: 0.5 },
];

const DosageCalculator: React.FC = () => {
  const [weight, setWeight] = useState('');
  const [selectedDrug, setSelectedDrug] = useState('');
  const [concentration, setConcentration] = useState('');
  const [customDose, setCustomDose] = useState('');
  const [result, setResult] = useState<{
    doseMg: number;
    doseMl: number;
    frequency: string;
    maxDailyMg: number;
  } | null>(null);

  const calculateDose = () => {
    const weightNum = parseFloat(weight);
    const concentrationNum = parseFloat(concentration);
    
    if (!weightNum || weightNum <= 0) return;

    let dosePerKg = parseFloat(customDose);
    let frequency = 'حسب إرشادات الطبيب';
    let maxDaily = 0;

    // If a common drug is selected, use its values
    if (selectedDrug) {
      const drug = COMMON_DRUGS.find(d => d.name === selectedDrug);
      if (drug) {
        dosePerKg = drug.dose;
        frequency = drug.frequency;
        maxDaily = drug.maxDaily;
      }
    }

    if (!dosePerKg || dosePerKg <= 0) return;

    const doseMg = weightNum * dosePerKg;
    const doseMl = concentrationNum > 0 ? (doseMg / concentrationNum) * 5 : 0;
    const maxDailyMg = maxDaily > 0 ? weightNum * maxDaily : 0;

    setResult({
      doseMg: Math.round(doseMg * 10) / 10,
      doseMl: Math.round(doseMl * 10) / 10,
      frequency,
      maxDailyMg: Math.round(maxDailyMg * 10) / 10,
    });
  };

  const resetCalculator = () => {
    setWeight('');
    setSelectedDrug('');
    setConcentration('');
    setCustomDose('');
    setResult(null);
  };

  return (
    <div className="space-y-4">
      {/* Calculator Form */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-sm border-purple-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-purple-700">
            <Baby className="w-5 h-5" />
            حاسبة جرعات الأطفال
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Weight Input */}
          <div className="space-y-2">
            <Label htmlFor="weight" className="text-sm font-medium">
              وزن الطفل (كجم)
            </Label>
            <Input
              id="weight"
              type="number"
              placeholder="مثال: 15"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="border-purple-200 focus:border-purple-400"
            />
          </div>

          {/* Drug Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">اختر الدواء</Label>
            <Select value={selectedDrug} onValueChange={setSelectedDrug}>
              <SelectTrigger className="border-purple-200 focus:border-purple-400">
                <SelectValue placeholder="اختر دواءً شائعاً أو أدخل القيم يدوياً" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">إدخال يدوي</SelectItem>
                {COMMON_DRUGS.map((drug) => (
                  <SelectItem key={drug.name} value={drug.name}>
                    {drug.name} ({drug.dose} {drug.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Dose (if manual) */}
          {selectedDrug === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="customDose" className="text-sm font-medium">
                الجرعة لكل كيلوغرام (mg/kg)
              </Label>
              <Input
                id="customDose"
                type="number"
                placeholder="مثال: 15"
                value={customDose}
                onChange={(e) => setCustomDose(e.target.value)}
                className="border-purple-200 focus:border-purple-400"
              />
            </div>
          )}

          {/* Concentration Input */}
          <div className="space-y-2">
            <Label htmlFor="concentration" className="text-sm font-medium">
              تركيز الشراب (mg/5ml)
            </Label>
            <Input
              id="concentration"
              type="number"
              placeholder="مثال: 125"
              value={concentration}
              onChange={(e) => setConcentration(e.target.value)}
              className="border-purple-200 focus:border-purple-400"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={calculateDose}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              <Calculator className="w-4 h-4 ml-2" />
              احسب الجرعة
            </Button>
            <Button 
              variant="outline" 
              onClick={resetCalculator}
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              إعادة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Result Card */}
      {result && (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-green-700">
              <Calculator className="w-5 h-5" />
              نتيجة الحساب
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/80 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">الجرعة</p>
                <p className="text-2xl font-bold text-green-700">{result.doseMg}</p>
                <p className="text-xs text-muted-foreground">ملغم</p>
              </div>
              {result.doseMl > 0 && (
                <div className="bg-white/80 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">الحجم</p>
                  <p className="text-2xl font-bold text-purple-700">{result.doseMl}</p>
                  <p className="text-xs text-muted-foreground">مل</p>
                </div>
              )}
            </div>
            
            <div className="bg-white/80 rounded-lg p-3 text-sm">
              <p className="font-medium text-foreground">التكرار: {result.frequency}</p>
              {result.maxDailyMg > 0 && (
                <p className="text-muted-foreground mt-1">
                  الحد الأقصى اليومي: {result.maxDailyMg} ملغم
                </p>
              )}
            </div>

            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg text-xs text-amber-700">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>
                هذه الحسابات إرشادية فقط. يجب مراجعة الطبيب أو الصيدلي قبل إعطاء أي دواء للأطفال.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50/80 border-blue-100">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">كيفية الاستخدام:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-600">
                <li>أدخل وزن الطفل بالكيلوغرام</li>
                <li>اختر الدواء من القائمة أو أدخل الجرعة يدوياً</li>
                <li>أدخل تركيز الشراب (مثال: باراسيتامول 125mg/5ml)</li>
                <li>اضغط "احسب الجرعة" للحصول على النتيجة</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DosageCalculator;
