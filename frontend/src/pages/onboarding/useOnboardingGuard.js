import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';
import Client from '../../api/client';

// 온보딩 확인을 건너뛸 화면 (로그인 전 화면)
const SKIP_PATHS = ['/login', '/signup'];

/* 로그인했는데 온보딩을 안 했으면 /onboarding으로 보내는 훅
   - Layout에서 한 줄로 호출: useOnboardingGuard(); */
export default function useOnboardingGuard() {
    const { id: loginId, token } = useAuthStore();
    const navigate = useNavigate();
    const { pathname } = useLocation();

    useEffect(() => {
        if (!token || !loginId) return;            // 로그인 전이면 확인 안 함
        if (SKIP_PATHS.includes(pathname)) return; // 로그인·회원가입 화면은 건너뜀

        let cancelled = false;   // 화면을 벗어난 뒤 늦게 온 응답은 무시

        Client.get('/api/profile/status', { params: { loginId } })
            .then((res) => {
                if (!cancelled && !res.data.completed) {
                    navigate('/onboarding', { replace: true });
                }
            })
            .catch((err) => console.error(err));

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, loginId]);
}