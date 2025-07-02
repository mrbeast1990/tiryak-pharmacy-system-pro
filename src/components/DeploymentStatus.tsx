import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import { useLanguageStore } from '@/store/languageStore';
import { useAuthStore } from '@/store/authStore';

interface DeploymentStatusProps {
  onClose: () => void;
}

interface DeploymentInfo {
  status: 'building' | 'ready' | 'error' | 'unknown';
  deploy_url?: string;
  claim_url?: string;
  claimed?: boolean;
  build_log?: string;
  created_at?: string;
  updated_at?: string;
}

const DeploymentStatus: React.FC<DeploymentStatusProps> = ({ onClose }) => {
  const [deploymentInfo, setDeploymentInfo] = useState<DeploymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguageStore();
  const { checkPermission } = useAuthStore();

  // Check if user has permission to view deployment status
  const canViewDeployment = checkPermission('manage_users') || checkPermission('view_all');

  useEffect(() => {
    if (!canViewDeployment) {
      setError(language === 'ar' ? 'ليس لديك صلاحية لعرض حالة النشر' : 'You do not have permission to view deployment status');
      setLoading(false);
      return;
    }

    fetchDeploymentStatus();
    
    // Poll for updates every 10 seconds if deployment is in progress
    const interval = setInterval(() => {
      if (deploymentInfo?.status === 'building') {
        fetchDeploymentStatus();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [canViewDeployment, deploymentInfo?.status]);

  const fetchDeploymentStatus = async () => {
    try {
      setLoading(true);
      
      // Simulate API call to get deployment status
      // In a real implementation, this would call your deployment provider's API
      const response = await new Promise<DeploymentInfo>((resolve) => {
        setTimeout(() => {
          // Mock deployment status - replace with actual API call
          resolve({
            status: 'ready',
            deploy_url: 'https://your-app.netlify.app',
            claim_url: 'https://app.netlify.com/sites/your-site/overview',
            claimed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }, 1000);
      });

      setDeploymentInfo(response);
      setError(null);
    } catch (err) {
      setError(language === 'ar' ? 'فشل في جلب حالة النشر' : 'Failed to fetch deployment status');
      console.error('Error fetching deployment status:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'building':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'ready':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    if (language === 'ar') {
      switch (status) {
        case 'building': return 'جاري البناء';
        case 'ready': return 'جاهز';
        case 'error': return 'خطأ';
        default: return 'غير معروف';
      }
    } else {
      switch (status) {
        case 'building': return 'Building';
        case 'ready': return 'Ready';
        case 'error': return 'Error';
        default: return 'Unknown';
      }
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case 'ready': return 'default';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  if (!canViewDeployment) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-center">
              {language === 'ar' ? 'غير مصرح' : 'Unauthorized'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              {error}
            </p>
            <Button onClick={onClose} className="w-full">
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3 space-x-reverse">
            <span>{language === 'ar' ? 'حالة النشر' : 'Deployment Status'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading && !deploymentInfo ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">{error}</p>
              <Button onClick={fetchDeploymentStatus} className="mt-4">
                {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
              </Button>
            </div>
          ) : deploymentInfo ? (
            <div className="space-y-6">
              {/* Status Overview */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3 space-x-reverse">
                  {getStatusIcon(deploymentInfo.status)}
                  <div>
                    <h3 className="font-medium">
                      {language === 'ar' ? 'حالة التطبيق' : 'Application Status'}
                    </h3>
                    <Badge variant={getStatusVariant(deploymentInfo.status)}>
                      {getStatusText(deploymentInfo.status)}
                    </Badge>
                  </div>
                </div>
                {deploymentInfo.status === 'building' && (
                  <Button onClick={fetchDeploymentStatus} variant="outline" size="sm">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {language === 'ar' ? 'تحديث' : 'Refresh'}
                  </Button>
                )}
              </div>

              {/* Deployment URL */}
              {deploymentInfo.deploy_url && deploymentInfo.status === 'ready' && (
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">
                    {language === 'ar' ? 'رابط التطبيق' : 'Application URL'}
                  </h4>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <code className="flex-1 p-2 bg-gray-100 rounded text-sm">
                      {deploymentInfo.deploy_url}
                    </code>
                    <Button
                      onClick={() => window.open(deploymentInfo.deploy_url, '_blank')}
                      size="sm"
                      variant="outline"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Claim URL */}
              {deploymentInfo.claim_url && !deploymentInfo.claimed && (
                <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2 text-blue-800">
                    {language === 'ar' ? 'نقل ملكية الموقع' : 'Transfer Site Ownership'}
                  </h4>
                  <p className="text-sm text-blue-700 mb-3">
                    {language === 'ar' 
                      ? 'يمكنك نقل ملكية هذا الموقع إلى حسابك الشخصي على Netlify'
                      : 'You can transfer ownership of this site to your personal Netlify account'
                    }
                  </p>
                  <Button
                    onClick={() => window.open(deploymentInfo.claim_url, '_blank')}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'نقل الملكية' : 'Transfer Ownership'}
                  </Button>
                </div>
              )}

              {/* Deployment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deploymentInfo.created_at && (
                  <div className="p-3 bg-gray-50 rounded">
                    <h5 className="font-medium text-sm text-gray-700">
                      {language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}
                    </h5>
                    <p className="text-sm">
                      {new Date(deploymentInfo.created_at).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                    </p>
                  </div>
                )}
                {deploymentInfo.updated_at && (
                  <div className="p-3 bg-gray-50 rounded">
                    <h5 className="font-medium text-sm text-gray-700">
                      {language === 'ar' ? 'آخر تحديث' : 'Last Updated'}
                    </h5>
                    <p className="text-sm">
                      {new Date(deploymentInfo.updated_at).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                    </p>
                  </div>
                )}
              </div>

              {/* Build Status Message */}
              {deploymentInfo.status === 'building' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    <p className="text-blue-800">
                      {language === 'ar' 
                        ? 'جاري بناء ونشر التطبيق. سيتم تحديث الحالة تلقائياً...'
                        : 'Building and deploying the application. Status will update automatically...'
                      }
                    </p>
                  </div>
                </div>
              )}

              {deploymentInfo.status === 'error' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <p className="text-red-800">
                      {language === 'ar' 
                        ? 'حدث خطأ أثناء النشر. يرجى المحاولة مرة أخرى.'
                        : 'An error occurred during deployment. Please try again.'
                      }
                    </p>
                  </div>
                </div>
              )}

              {deploymentInfo.claimed && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <p className="text-green-800">
                      {language === 'ar' 
                        ? 'تم نقل ملكية الموقع بنجاح إلى حسابك.'
                        : 'Site ownership has been successfully transferred to your account.'
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 space-x-reverse pt-4 border-t">
            <Button onClick={onClose} variant="outline">
              {language === 'ar' ? 'إغلاق' : 'Close'}
            </Button>
            {deploymentInfo && (
              <Button onClick={fetchDeploymentStatus} variant="default">
                <Loader2 className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {language === 'ar' ? 'تحديث الحالة' : 'Refresh Status'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeploymentStatus;