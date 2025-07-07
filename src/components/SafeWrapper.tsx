import React, { ReactNode, ErrorInfo, Component } from 'react';

interface SafeWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface SafeWrapperState {
  hasError: boolean;
  error?: Error;
}

class SafeWrapper extends Component<SafeWrapperProps, SafeWrapperState> {
  constructor(props: SafeWrapperProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): SafeWrapperState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`خطأ في ${this.props.name || 'Component'}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
          <div className="text-center p-6 bg-white rounded-lg shadow-lg max-w-md">
            <h2 className="text-xl font-bold text-red-600 mb-2">خطأ في تحميل المكون</h2>
            <p className="text-gray-600 mb-4">حدث خطأ في {this.props.name || 'Component'}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
            >
              إعادة تحميل الصفحة
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">تفاصيل الخطأ</summary>
                <pre className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SafeWrapper;