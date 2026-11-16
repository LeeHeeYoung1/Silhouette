import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom';
import Home from './pages/home/home';
import Login from './pages/login/login';
import Signup from './pages/signup/signup';
import MyPage from './pages/home/mypage/mypage';
import Post from './pages/post/post';
import Live from './pages/live/live';
import styles from './App.module.css';

function App() {
  const navigate = useNavigate();

  // 테마 모드: 'light' | 'dark'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('silhouette_theme') || 'light';
  });

  // 테마 변경 시 body 클래스 동기화 및 로컬스토리지 저장
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.remove('theme-light');
    }
    localStorage.setItem('silhouette_theme', theme);
  }, [theme]);

  // 테마 토글 핸들러
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className={styles.appContainer}>
      {/* 상단 헤더 & 바로가기 네비게이션 & 테마 스위치 */}
      <header className={styles.header}>
        <div className={styles.brandLogo} onClick={() => navigate('/')}>
          <div className={styles.brandIcon}>🌙</div>
          <span className={styles.brandTitle}>실루엣 (Silhouette)</span>
        </div>

        <div className={styles.headerRight}>
          <nav className={styles.navLinks}>
            <NavLink
              to="/"
              className={({ isActive }) =>
                `${styles.navBtn} ${isActive ? styles.navBtnActive : ''}`
              }
            >
              홈
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
            <NavLink
              to="/live"
              className={({ isActive }) =>
                `${styles.navBtn} ${isActive ? styles.navBtnActive : ''}`
              }
            >
              라이브
            </NavLink>
              마이페이지
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

          {/* 테마 토글 버튼 */}
          <button
            type="button"
            className={styles.themeToggleBtn}
            onClick={toggleTheme}
            title="화면 모드 전환 (밝은 테마 / 어두운 테마)"
          >
            {theme === 'light' ? '☀️ 라이트 모드' : '🌙 다크 모드'}
          </button>
        </div>
      </header>

      {/* 라우터 뷰 렌더링 */}
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/post" element={<Post />} />
          <Route path="/board" element={<Post />} />
          <Route path="/live" element={<Live />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
