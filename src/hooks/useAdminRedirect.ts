
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export const useAdminRedirect = () => {
    const { user, isAuthenticated } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const canManage = user?.role === 'admin' || user?.role === 'ahmad_rajili';
        if (isAuthenticated && canManage && location.pathname === '/') {
            navigate('/admin/requests', { replace: true });
        }
    }, [isAuthenticated, user, navigate, location.pathname]);
};
