
import { useState, useEffect } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import styles from './layout.module.css';
import useOnboardingGuard from '../onboarding/useOnboardingGuard';
function Layout() {
  const navigate = useNavigate();

  
  useOnboardingGuard(); 

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('silhouette_theme') || 'light';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.remove('theme-light');
    }

    localStorage.setItem('silhouette_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className={styles.appContainer}>
      <header className={styles.header}>
        <div
          className={styles.brandLogo}
          onClick={() => navigate('/')}
        >
          <div className={styles.brandIcon}>🌙</div>
          <span className={styles.brandTitle}>
            실루엣 (Silhouette)
          </span>
        </div>

        <div className={styles.headerRight}>
          <nav className={styles.navLinks}>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `${styles.navBtn} ${isActive ? styles.navBtnActive : ''}`
              }
            >
              홈
            </NavLink>

              {/* ↓ 추가 */}
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `${styles.navBtn} ${isActive ? styles.navBtnActive : ''}`
              }
            >
              프로필
            </NavLink>
            

             <NavLink
              to="/chattingRoomList"
              className={({ isActive }) =>
                `${styles.navBtn} ${isActive ? styles.navBtnActive : ''}`
              }
            >
              채팅방 Test
            </NavLink>

            <NavLink
              to="/event"
              end
              className={({ isActive }) =>
                `${styles.navBtn} ${isActive ? styles.navBtnActive : ''}`
              }
            >
              이벤트
            </NavLink>

            <NavLink
              to="/post"
              className={({ isActive }) =>
                `${styles.navBtn} ${isActive ? styles.navBtnActive : ''}`
              }
            >
              게시판
            </NavLink>

            <NavLink
              to="/mypage"
              className={({ isActive }) =>
                `${styles.navBtn} ${isActive ? styles.navBtnActive : ''}`
              }
            >
              마이페이지
            </NavLink>

            <NavLink
              to="/live"
              className={({ isActive }) =>
                `${styles.navBtn} ${isActive ? styles.navBtnActive : ''}`
              }
            >
              라이브
            </NavLink>

            <NavLink
              to="/login"
              className={({ isActive }) =>
                `${styles.navBtn} ${isActive ? styles.navBtnActive : ''}`
              }
            >
              로그인
            </NavLink>

            <NavLink
              to="/signup"
              className={({ isActive }) =>
                `${styles.navBtn} ${isActive ? styles.navBtnActive : ''}`
              }
            >
              회원가입
            </NavLink>
          </nav>

          <button
            type="button"
            className={styles.themeToggleBtn}
            onClick={toggleTheme}
            title="화면 모드 전환 (풋풋한 라이트 / 설레는 다크)"
          >
            {theme === 'light' ? '🌸 라이트 모드' : '🌙 다크 모드'}
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
