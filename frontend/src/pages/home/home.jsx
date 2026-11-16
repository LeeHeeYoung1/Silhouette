
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';
import styles from './home.module.css';

function Home() {
  const navigate = useNavigate();
  const { token, id, logout } = useAuthStore();

  // 로그인되지 않은 사용자는 로그인 페이지로 이동
  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.badge}>✨ SILHOUETTE DATING</div>
        <h1 className={styles.title}>실루엣 (Silhouette)</h1>
      </div>

      <div className={styles.contentWrapper}>
        <div className={styles.avatarIcon}>🌙</div>

        <h2 className={styles.welcomeTitle}>
          {id || '회원'}님
        </h2>

        <p className={styles.subtitle}>
          현재 실루엣에 로그인된 상태입니다.
        </p>

        <button
          type="button"
          className={styles.btnPrimary}
          onClick={() => alert('✨ 마이페이지 기능이 곧 업데이트됩니다!')}
        >
          마이페이지 바로가기 💖
        </button>

        <button
          type="button"
          className={styles.btnLogout}
          onClick={handleLogout}
        >
          로그아웃
        </button>
      </div>
    </div>
  );
}

export default Home;
