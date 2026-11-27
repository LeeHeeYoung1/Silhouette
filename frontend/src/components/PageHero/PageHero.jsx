import styles from './PageHero.module.css';

/* =========================================================
   공통 페이지 히어로 (라이브 · 게시판 · 이벤트)
   - 홈 히어로와 같은 허니 옐로 띠를 헤더 뒤부터 히어로 바닥까지 화면 가로 전체로 깔아줌
   - eyebrow: 제목 위 검정 칩 문구 / live: 칩에 빨간 ON AIR 점 표시
   - title, description: 제목과 소개 문구
   - wordmark: 오른쪽 큰 영문 워드마크 (홈 Silhouette 로고와 같은 서체, 모바일에서는 숨김)
   - children: 소개 문구 아래에 놓일 버튼·통계 등 (버튼은 heroButton.js의 클래스 사용)
   ========================================================= */
export default function PageHero({ eyebrow, live = false, title, description, wordmark, children }) {
  return (
    <section className={styles.hero}>
      <div className={styles.text}>
        {eyebrow && (
          <span className={styles.chip}>
            {live && <span className={styles.liveDot} aria-hidden="true" />}
            {eyebrow}
          </span>
        )}
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
        {children && <div className={styles.extra}>{children}</div>}
      </div>
      {wordmark && (
        <span
          className={styles.wordmark}
          style={{ '--wordmark-len': wordmark.length }}
          aria-hidden="true"
        >
          {wordmark}
        </span>
      )}
    </section>
  );
}
