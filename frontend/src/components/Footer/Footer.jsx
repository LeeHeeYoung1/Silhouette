import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {/* 정책 및 약관 링크 */}
        <div className={styles.policyRow}>
          <a href="#terms" onClick={(e) => { e.preventDefault(); alert('이용약관 준비 중입니다.'); }}>이용약관</a>
          <span className={styles.divider}>·</span>
          <a href="#privacy" onClick={(e) => { e.preventDefault(); alert('개인정보처리방침 준비 중입니다.'); }} className={styles.privacyLink}>
            개인정보처리방침
          </a>
          <span className={styles.divider}>·</span>
          <a href="#location" onClick={(e) => { e.preventDefault(); alert('위치기반서비스 이용약관 준비 중입니다.'); }}>위치기반서비스 이용약관</a>
          <span className={styles.divider}>·</span>
          <a href="#youth" onClick={(e) => { e.preventDefault(); alert('청소년보호정책 준비 중입니다.'); }}>청소년보호정책</a>
          <span className={styles.divider}>·</span>
          <a href="#safety" onClick={(e) => { e.preventDefault(); alert('안전 수칙 가이드라인 준비 중입니다.'); }}>안전 가이드</a>
        </div>

        {/* 간결한 사업자 정보 */}
        <div className={styles.infoRow}>
          <span>(주)실루엣코리아</span>
          <span className={styles.divider}>|</span>
          <span>사업자등록번호: 202-86-54321</span>
          <span className={styles.divider}>|</span>
          <span>통신판매업신고: 제 2026-서울강남-01582호</span>
          <span className={styles.divider}>|</span>
          <span>고객지원: support@silhouette.me</span>
        </div>

        <p className={styles.copyright}>
          © 2026 Silhouette, Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
