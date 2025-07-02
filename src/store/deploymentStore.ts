import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DeploymentInfo {
  status: 'building' | 'ready' | 'error' | 'unknown';
  deploy_url?: string;
  claim_url?: string;
  claimed?: boolean;
  build_log?: string;
  created_at?: string;
  updated_at?: string;
  last_checked?: string;
}

interface DeploymentState {
  deploymentInfo: DeploymentInfo | null;
  isLoading: boolean;
  error: string | null;
  lastChecked: string | null;
  
  // Actions
  setDeploymentInfo: (info: DeploymentInfo) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  updateLastChecked: () => void;
  
  // API methods
  fetchDeploymentStatus: () => Promise<void>;
  checkDeploymentReady: () => boolean;
  shouldPoll: () => boolean;
}

export const useDeploymentStore = create<DeploymentState>()(
  persist(
    (set, get) => ({
      deploymentInfo: null,
      isLoading: false,
      error: null,
      lastChecked: null,

      setDeploymentInfo: (info) => {
        set({ 
          deploymentInfo: { 
            ...info, 
            last_checked: new Date().toISOString() 
          } 
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      updateLastChecked: () => set({ lastChecked: new Date().toISOString() }),

      fetchDeploymentStatus: async () => {
        const { setLoading, setError, setDeploymentInfo } = get();
        
        setLoading(true);
        setError(null);

        try {
          // Mock API call - replace with actual deployment provider API
          const mockDeploymentInfo: DeploymentInfo = {
            status: 'ready',
            deploy_url: window.location.origin,
            claim_url: 'https://app.netlify.com/sites/your-site/overview',
            claimed: false,
            created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
            updated_at: new Date().toISOString(),
          };

          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 1000));

          setDeploymentInfo(mockDeploymentInfo);
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to fetch deployment status');
        } finally {
          setLoading(false);
        }
      },

      checkDeploymentReady: () => {
        const { deploymentInfo } = get();
        return deploymentInfo?.status === 'ready';
      },

      shouldPoll: () => {
        const { deploymentInfo } = get();
        return deploymentInfo?.status === 'building';
      },
    }),
    {
      name: 'deployment-storage',
      partialize: (state) => ({
        deploymentInfo: state.deploymentInfo,
        lastChecked: state.lastChecked,
      }),
    }
  )
);