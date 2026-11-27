import { NavLink } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';
import styles from './MainNav.module.css';

const MENUS = [
  ['/', '홈'],
  ['/event', '이벤트'],
  ['/post', '게시판'],
  ['/live', '라이브'],
];

const pillClass = ({ isActive }) => `${styles.pill} ${isActive ? styles.pillActive : ''}`;

/* =========================================================
   공통 페이지 이동 바 (홈 · 이벤트 · 게시판 · 라이브 + 관리자)
   - 홈 히어로 아래, PageHero 노란 띠 아래 경계에 같은 모양으로 놓임
   ========================================================= */
export default function MainNav() {
  const role = useAuthStore((state) => state.role);

  return (
    <nav className={styles.pillWrap} aria-label="주요 메뉴">
      {MENUS.map(([to, label]) => (
        <NavLink key={to} to={to} end={to === '/'} className={pillClass}>
          {label}
        </NavLink>
      ))}
      {role === 'ROLE_ADMIN' && (
        <NavLink to="/admin" className={pillClass}>
          관리자
        </NavLink>
      )}
    </nav>
  );
}
