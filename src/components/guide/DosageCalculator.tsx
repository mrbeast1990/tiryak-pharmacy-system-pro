import React, { useState } from 'react';
import { Calculator, Baby, AlertTriangle, Info, Scale, Ruler } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Common pediatric dosing formulas
const COMMON_DRUGS = [
  { name: 'Paracetamol (أسيتامينوفين)', dose: 15, unit: 'mg/kg', frequency: 'كل 4-6 ساعات', maxDaily: 60 },
  { name: 'Ibuprofen (أيبوبروفين)', dose: 10, unit: 'mg/kg', frequency: 'كل 6-8 ساعات', maxDaily: 40 },
  { name: 'Amoxicillin (أموكسيسيلين)', dose: 25, unit: 'mg/kg', frequency: 'كل 8 ساعات', maxDaily: 100 },
  { name: 'Azithromycin (أزيثرومايسين)', dose: 10, unit: 'mg/kg', frequency: 'مرة واحدة يومياً', maxDaily: 10 },
  { name: 'Cefixime (سيفيكسيم)', dose: 8, unit: 'mg/kg', frequency: 'مرة واحدة يومياً', maxDaily: 16 },
  { name: 'Cetirizine (سيتيريزين)', dose: 0.25, unit: 'mg/kg', frequency: 'مرة واحدة يومياً', maxDaily: 0.5 },
];

// Standard weight chart for children (WHO percentile 50)
const WEIGHT_CHART = [
  { age: 'حديث الولادة', months: 0, weight: 3.5, range: '2.5 - 4.5' },
  { age: '3 أشهر', months: 3, weight: 6.0, range: '5.0 - 7.0' },
  { age: '6 أشهر', months: 6, weight: 7.5, range: '6.5 - 9.0' },
  { age: '9 أشهر', months: 9, weight: 8.5, range: '7.5 - 10.0' },
  { age: '12 شهر (سنة)', months: 12, weight: 10.0, range: '8.5 - 11.5' },
  { age: '18 شهر', months: 18, weight: 11.0, range: '9.5 - 13.0' },
  { age: '2 سنة', months: 24, weight: 12.5, range: '10.5 - 14.5' },
  { age: '3 سنوات', months: 36, weight: 14.5, range: '12.0 - 17.0' },
  { age: '4 سنوات', months: 48, weight: 16.5, range: '13.5 - 19.5' },
  { age: '5 سنوات', months: 60, weight: 18.5, range: '15.0 - 22.0' },
  { age: '6 سنوات', months: 72, weight: 21.0, range: '17.0 - 25.0' },
  { age: '7 سنوات', months: 84, weight: 23.5, range: '19.0 - 28.0' },
  { age: '8 سنوات', months: 96, weight: 26.0, range: '21.0 - 32.0' },
  { age: '9 سنوات', months: 108, weight: 29.0, range: '23.0 - 36.0' },
  { age: '10 سنوات', months: 120, weight: 32.0, range: '25.5 - 40.0' },
  { age: '11 سنة', months: 132, weight: 36.0, range: '28.0 - 45.0' },
  { age: '12 سنة', months: 144, weight: 40.0, range: '31.0 - 50.0' },
];

// APLS Weight Estimation Formulas
const calculateWeightFromAge = (ageYears: number, ageMonths: number): { weight: number; formula: string } => {
  const totalMonths = ageYears * 12 + ageMonths;
  
  // Infant < 12 months
  if (totalMonths < 12) {
    // Weight (kg) = (age in months + 9) / 2
    const weight = (totalMonths + 9) / 2;
    return { weight: Math.round(weight * 10) / 10, formula: 'APLS: (العمر بالأشهر + 9) ÷ 2' };
  }
  
  // Age 1-5 years
  if (totalMonths >= 12 && totalMonths < 60) {
    // Weight (kg) = (age in years × 2) + 8
    const ageInYears = totalMonths / 12;
    const weight = (ageInYears * 2) + 8;
    return { weight: Math.round(weight * 10) / 10, formula: 'APLS: (العمر بالسنوات × 2) + 8' };
  }
  
  // Age 6-12 years
  if (totalMonths >= 60 && totalMonths <= 144) {
    // Weight (kg) = (age in years × 3) + 7
    const ageInYears = totalMonths / 12;
    const weight = (ageInYears * 3) + 7;
    return { weight: Math.round(weight * 10) / 10, formula: 'APLS: (العمر بالسنوات × 3) + 7' };
  }
  
  // Above 12 years - use adult estimation or last known formula
  const ageInYears = totalMonths / 12;
  const weight = (ageInYears * 3) + 7;
  return { weight: Math.round(weight * 10) / 10, formula: 'تقدير تقريبي' };
};

const DosageCalculator: React.FC = () => {
  const [inputMethod, setInputMethod] = useState<'weight' | 'age'>('weight');
  const [weight, setWeight] = useState('');
  const [ageYears, setAgeYears] = useState('');
  const [ageMonths, setAgeMonths] = useState('');
  const [estimatedWeight, setEstimatedWeight] = useState<{ weight: number; formula: string } | null>(null);
  const [selectedDrug, setSelectedDrug] = useState('');
  const [concentration, setConcentration] = useState('');
  const [customDose, setCustomDose] = useState('');
  const [result, setResult] = useState<{
    doseMg: number;
    doseMl: number;
    frequency: string;
    maxDailyMg: number;
    isEstimated: boolean;
  } | null>(null);

  const handleAgeChange = (years: string, months: string) => {
    setAgeYears(years);
    setAgeMonths(months);
    
    const y = parseInt(years) || 0;
    const m = parseInt(months) || 0;
    
    if (y > 0 || m > 0) {
      const estimated = calculateWeightFromAge(y, m);
      setEstimatedWeight(estimated);
      setWeight(estimated.weight.toString());
    } else {
      setEstimatedWeight(null);
      setWeight('');
    }
  };

  const calculateDose = () => {
    const weightNum = parseFloat(weight);
    const concentrationNum = parseFloat(concentration);
    
    if (!weightNum || weightNum <= 0) return;

    let dosePerKg = parseFloat(customDose);
    let frequency = 'حسب إرشادات الطبيب';
    let maxDaily = 0;

    // If a common drug is selected, use its values
    if (selectedDrug && selectedDrug !== 'custom') {
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
      isEstimated: inputMethod === 'age',
    });
  };

  const resetCalculator = () => {
    setWeight('');
    setAgeYears('');
    setAgeMonths('');
    setEstimatedWeight(null);
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2 text-purple-700">
              <Baby className="w-5 h-5" />
              حاسبة جرعات الأطفال
            </CardTitle>
            
            {/* Weight Chart Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs border-purple-200 text-purple-600 hover:bg-purple-50">
                  <Ruler className="w-3 h-3 ml-1" />
                  جدول الأوزان
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-center text-purple-700">
                    جدول أوزان الأطفال القياسي (WHO)
                  </DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                  <div className="bg-amber-50 p-3 rounded-lg mb-4 text-sm text-amber-700">
                    <AlertTriangle className="w-4 h-4 inline-block ml-1" />
                    هذا الجدول للمرجعية فقط. قد يختلف وزن الطفل حسب العوامل الوراثية والتغذية.
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-purple-100">
                          <th className="p-2 text-right text-purple-700">العمر</th>
                          <th className="p-2 text-center text-purple-700">الوزن المتوسط (كجم)</th>
                          <th className="p-2 text-center text-purple-700">المدى الطبيعي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {WEIGHT_CHART.map((row, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-purple-50/50'}>
                            <td className="p-2 text-right font-medium">{row.age}</td>
                            <td className="p-2 text-center text-purple-600 font-bold">{row.weight}</td>
                            <td className="p-2 text-center text-muted-foreground">{row.range}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input Method Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">طريقة الإدخال</Label>
            <RadioGroup 
              value={inputMethod} 
              onValueChange={(value: 'weight' | 'age') => {
                setInputMethod(value);
                setWeight('');
                setAgeYears('');
                setAgeMonths('');
                setEstimatedWeight(null);
                setResult(null);
              }}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="weight" id="weight-method" />
                <Label htmlFor="weight-method" className="flex items-center gap-1 cursor-pointer">
                  <Scale className="w-4 h-4" />
                  الوزن المعروف
                </Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value="age" id="age-method" />
                <Label htmlFor="age-method" className="flex items-center gap-1 cursor-pointer">
                  <Baby className="w-4 h-4" />
                  تقدير من العمر
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Weight Input (Direct) */}
          {inputMethod === 'weight' && (
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
          )}

          {/* Age Input (for estimation) */}
          {inputMethod === 'age' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">عمر الطفل</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="ageYears" className="text-xs text-muted-foreground">السنوات</Label>
                  <Input
                    id="ageYears"
                    type="number"
                    placeholder="0"
                    min="0"
                    max="12"
                    value={ageYears}
                    onChange={(e) => handleAgeChange(e.target.value, ageMonths)}
                    className="border-purple-200 focus:border-purple-400"
                  />
                </div>
                <div>
                  <Label htmlFor="ageMonths" className="text-xs text-muted-foreground">الأشهر</Label>
                  <Input
                    id="ageMonths"
                    type="number"
                    placeholder="0"
                    min="0"
                    max="11"
                    value={ageMonths}
                    onChange={(e) => handleAgeChange(ageYears, e.target.value)}
                    className="border-purple-200 focus:border-purple-400"
                  />
                </div>
              </div>
              
              {/* Estimated Weight Display */}
              {estimatedWeight && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-700">الوزن المقدر:</span>
                    <span className="text-xl font-bold text-purple-600">{estimatedWeight.weight} كجم</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    المعادلة: {estimatedWeight.formula}
                  </p>
                </div>
              )}
              
              {/* Age Warning */}
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg text-xs text-amber-700 border border-amber-200">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>تنبيه:</strong> الوزن المقدر من العمر تقريبي ويعتمد على معادلات APLS. 
                  للدقة، يُفضل استخدام الوزن الفعلي للطفل خاصة في حالات السمنة أو النحافة.
                </p>
              </div>
            </div>
          )}

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
              disabled={!weight || parseFloat(weight) <= 0}
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
              {result.isEstimated && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full mr-2">
                  وزن تقديري
                </span>
              )}
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

            {/* Enhanced warning for estimated weight */}
            {result.isEstimated && (
              <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg text-xs text-orange-700 border border-orange-200">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">⚠️ نتائج تقريبية</p>
                  <p>
                    تم حساب الجرعة بناءً على وزن مقدر من العمر باستخدام معادلات APLS.
                    للأطفال ذوي الأوزان غير الطبيعية، يُنصح بوزن الطفل فعلياً.
                  </p>
                </div>
              </div>
            )}

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
              <p className="font-medium mb-2">معادلات APLS لتقدير الوزن:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-600 text-xs">
                <li><strong>أقل من سنة:</strong> الوزن = (العمر بالأشهر + 9) ÷ 2</li>
                <li><strong>1-5 سنوات:</strong> الوزن = (العمر × 2) + 8</li>
                <li><strong>6-12 سنة:</strong> الوزن = (العمر × 3) + 7</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DosageCalculator;
