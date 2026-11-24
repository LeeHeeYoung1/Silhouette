/* ==========================================================================
   [권형석] E001 외모 등급 테스트 페이지 - 시작
   - 이벤트 > 'AI 외모 등급 테스트' 카드를 누르면 들어오는 페이지 (/event/beauty-test)
   - 사진 1~4장 업로드 → AI 분석(얼굴 검출 + 동일 인물 확인 + 평균 점수) → 결과·기록 표시
   - 사진은 서버에 저장되지 않고 분석 후 바로 폐기, DB에는 점수만 저장
   - 외모 테스트는 일주일에 1번 (관리자는 제한 없음)
   ========================================================================== */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';
import Client from '../../api/client';
import styles from './beautytest.module.css';

const MAX_PHOTOS = 4;                                          // 최대 사진 수
const MAX_SIZE = 10 * 1024 * 1024;                             // 사진 1장 최대 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']; // 올릴 수 있는 형식

// 등급별 문구 (D등급도 상처받지 않게 부드럽게)
const GRADE_INFO = {
  S: { title: '눈부신 실루엣', emoji: '👑', comment: '첫눈에 시선을 사로잡는 압도적인 분위기예요!' },
  A: { title: '매력 넘치는 실루엣', emoji: '💖', comment: '누구에게나 호감을 주는 또렷한 매력을 가졌어요.' },
  B: { title: '호감 가득 실루엣', emoji: '😊', comment: '편안하고 친근한 인상으로 대화가 즐거워지는 타입이에요.' },
  C: { title: '은은한 매력 실루엣', emoji: '🌙', comment: '볼수록 빠져드는 은은한 매력이 있어요.' },
  D: { title: '숨은 매력 실루엣', emoji: '🌱', comment: '사진보다 실제로 만났을 때 더 빛나는 타입이에요.' },
};

// 서버 날짜(LocalDateTime) → "2026.11.24 14:03"
const formatDate = (value) => {
  if (!value) return '';
  let d;
  if (Array.isArray(value)) {
    const [y, m, day, h = 0, min = 0] = value;
    d = new Date(y, m - 1, day, h, min);
  } else {
    d = new Date(value);
  }
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// 테스트 가능 여부 + 내 기록 한 번에 불러오기
const fetchBeautyInfo = async () => {
  const [statusRes, historyRes] = await Promise.all([
    Client.get('/api/beauty-test/me/status'),
    Client.get('/api/beauty-test/me'),
  ]);
  return { status: statusRes.data, history: historyRes.data ?? [] };
};

const BeautyTest = () => {
  const { token } = useAuthStore();
  const navi = useNavigate();
  const fileInputRef = useRef(null);

  // 서버 정보
  const [status, setStatus] = useState(null);   // { canTest, nextAvailableText }
  const [history, setHistory] = useState([]);   // 내 테스트 기록 (최신순)
  const [isLoading, setIsLoading] = useState(true);

  // 업로드·분석
  const [photos, setPhotos] = useState([]);     // [{ file, url }] (url은 미리보기용, 브라우저 안에서만 사용)
  const [agreed, setAgreed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 결과
  const [result, setResult] = useState(null);   // 방금 받은 결과 (사진별 점수 포함)
  const [barReady, setBarReady] = useState(false);

  // 비로그인 시 로그인 페이지로
  useEffect(() => {
    if (!token) navi('/login');
  }, [token, navi]);

  // 처음 들어올 때: 테스트 가능 여부 + 내 기록
  useEffect(() => {
    if (!token) return;
    let ignore = false;

    const load = async () => {
      setIsLoading(true);
      try {
        const info = await fetchBeautyInfo();
        if (ignore) return;
        setStatus(info.status);
        setHistory(info.history);
      } catch (error) {
        if (!ignore) {
          setErrorMsg(error.response?.data?.message || '테스트 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, [token]);

  // 페이지를 떠날 때 미리보기 주소 정리 (메모리 해제)
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => {
    return () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url));
  }, []);

  // 화면에 보여줄 결과: 방금 받은 결과 > 이번 주에 이미 했으면 최신 기록
  const shownResult = result || (status && !status.canTest ? history[0] : null);
  const shownKey = shownResult ? `${shownResult.beautyTestSeq}-${shownResult.score100}` : '';

  // 결과가 나오면 점수 막대 애니메이션
  useEffect(() => {
    setBarReady(false);
    if (!shownKey) return;
    const timer = setTimeout(() => setBarReady(true), 80);
    return () => clearTimeout(timer);
  }, [shownKey]);

  // 사진 고르기 (여러 장 한 번에 골라도 됨)
  const handleSelectFiles = (e) => {
    const selected = Array.from(e.target.files || []);
    e.target.value = ''; // 같은 사진을 다시 고를 수 있게 초기화
    if (selected.length === 0) return;

    setErrorMsg('');
    const remain = MAX_PHOTOS - photos.length;
    if (selected.length > remain) {
      setErrorMsg(`사진은 최대 ${MAX_PHOTOS}장까지 올릴 수 있어요.`);
    }

    const added = [];
    for (const file of selected.slice(0, remain)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setErrorMsg('jpg, png, webp 사진만 올릴 수 있어요. (아이폰 HEIC 사진은 jpg로 바꿔 주세요)');
        continue;
      }
      if (file.size > MAX_SIZE) {
        setErrorMsg('사진 한 장은 10MB 이하만 올릴 수 있어요.');
        continue;
      }
      added.push({ file, url: URL.createObjectURL(file) });
    }
    if (added.length > 0) setPhotos((prev) => [...prev, ...added]);
  };

  // 사진 빼기
  const handleRemovePhoto = (index) => {
    const target = photos[index];
    if (target) URL.revokeObjectURL(target.url);
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setErrorMsg('');
  };

  // 빈 칸 누르면 사진 고르기 창 열기
  const openFilePicker = () => {
    if (isAnalyzing || photos.length >= MAX_PHOTOS) return;
    fileInputRef.current?.click();
  };

  // AI 분석 시작
  const canSubmit = agreed && photos.length > 0 && !isAnalyzing && status?.canTest;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsAnalyzing(true);
    setErrorMsg('');

    const formData = new FormData();
    photos.forEach((p) => formData.append('files', p.file)); // 서버 @RequestParam("files")와 이름 같아야 함

    try {
      const { data } = await Client.post('/api/beauty-test', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // 테스트 가능 여부·기록 새로고침
      try {
        const info = await fetchBeautyInfo();
        setStatus(info.status);
        setHistory(info.history);
      } catch {
        // 새로고침 실패는 결과 표시에 영향 없음
      }
    } catch (error) {
      const code = error.response?.status;
      if (code === 401) {
        alert('로그인이 필요해요.');
        navi('/login');
        return;
      }
      setErrorMsg(error.response?.data?.message || '분석 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.');

      // 주 1회 제한에 걸렸으면 상태 새로고침 (잠금 화면으로 바뀜)
      if (code === 429) {
        try {
          const info = await fetchBeautyInfo();
          setStatus(info.status);
          setHistory(info.history);
        } catch {
          // 무시
        }
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 다시 테스트하기 (관리자처럼 제한이 없을 때만)
  const handleRetry = () => {
    photos.forEach((p) => URL.revokeObjectURL(p.url));
    setPhotos([]);
    setAgreed(false);
    setResult(null);
    setErrorMsg('');
  };

  // 결과 카드에 쓸 값
  const gradeInfo = shownResult ? GRADE_INFO[shownResult.grade] ?? GRADE_INFO.B : null;
  const showPhotoScores =
    result && Array.isArray(result.photoScores) && result.photoScores.length === photos.length;

  return (
    <div className={styles.container}>
      {/* 뒤로가기 */}
      <button type="button" className={styles.backBtn} onClick={() => navi('/event')}>
        ← 이벤트 목록으로
      </button>

      {/* 1. 상단 배너 */}
      <section className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <span>📸 SILHOUETTE AI BEAUTY TEST</span>
          </div>
          <h1 className={styles.heroTitle}>
            AI가 분석하는 <br />
            <span className={styles.titleHighlight}>나의 외모 등급 테스트</span>
          </h1>
          <p className={styles.heroDesc}>
            본인 사진 1~4장을 올리면 AI가 모든 사진을 분석해 평균 점수와 등급을 알려드려요.
            <br />
            올린 사진은 저장되지 않고 분석이 끝나면 바로 삭제돼요.
          </p>
        </div>

        <div className={styles.heroStats}>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>이번 주 참여</span>
            <span className={`${styles.statValue} ${status?.canTest ? styles.statPink : ''}`}>
              {status ? (status.canTest ? '가능 ✨' : '완료 💖') : '-'}
            </span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>누적 테스트</span>
            <span className={styles.statValue}>{history.length}회</span>
          </div>
        </div>
      </section>

      {/* 2. 오류 안내 */}
      {errorMsg && (
        <div className={styles.errorBox} role="alert">
          <span className={styles.errorIcon}>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {isLoading ? (
        <section className={styles.glassCard}>
          <div className={styles.loadingBox}>
            <div className={styles.spinner} />
            <span>테스트 정보를 불러오는 중이에요...</span>
          </div>
        </section>
      ) : shownResult ? (
        /* 3. 결과 카드 */
        <section className={`${styles.glassCard} ${styles.resultCard}`}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>{result ? '✨ 분석 결과' : '💌 이번 주 나의 결과'}</h2>
            <span className={styles.cardSub}>{formatDate(shownResult.createdAt) || '방금 전'}</span>
          </div>

          <div className={styles.resultMain}>
            {/* 등급 원 */}
            <div className={styles.gradeWrap}>
              <div className={`${styles.gradeRing} ${styles[`grade${shownResult.grade}`] ?? ''}`}>
                <div className={styles.gradeInner}>
                  <span className={styles.gradeLetter}>{shownResult.grade}</span>
                  <span className={styles.gradeCaption}>GRADE</span>
                </div>
              </div>
              <div className={styles.gradeTitle}>
                {gradeInfo.emoji} {gradeInfo.title}
              </div>
            </div>

            {/* 점수 */}
            <div className={styles.scoreWrap}>
              <div className={styles.scoreRow}>
                <span className={styles.scoreBig}>{shownResult.score100}</span>
                <span className={styles.scoreUnit}>점</span>
              </div>
              <div className={styles.scoreBar}>
                <div
                  className={styles.scoreFill}
                  style={{ width: barReady ? `${Math.min(100, Math.max(0, shownResult.score100))}%` : '0%' }}
                />
              </div>
              <div className={styles.scoreMeta}>
                AI 평균 점수 <b>{Number(shownResult.score).toFixed(2)}</b> / 5.00 · 사진 {shownResult.photoCount ?? 1}장 평가
              </div>
              <p className={styles.gradeComment}>{gradeInfo.comment}</p>
            </div>
          </div>

          {/* 사진별 점수 (방금 테스트한 경우만, 사진은 브라우저 안에서만 보여줌) */}
          {showPhotoScores && (
            <div className={styles.photoScoreRow}>
              {photos.map((p, idx) => (
                <div key={p.url} className={styles.photoScoreItem}>
                  <img src={p.url} alt={`${idx + 1}번째 사진`} className={styles.photoScoreImg} />
                  <span className={styles.photoScoreLabel}>
                    {idx + 1}번 · <b>{Number(result.photoScores[idx]).toFixed(2)}</b>
                  </span>
                </div>
              ))}
            </div>
          )}

          <p className={styles.disclaimer}>
            이 결과는 공개 연구용 데이터셋으로 학습한 AI의 추정치로, 재미로만 봐 주세요. 사람의 매력은 점수로 다
            표현할 수 없어요 💫
          </p>

          <div className={styles.resultActions}>
            {status?.canTest ? (
              <button type="button" className={styles.primaryBtn} onClick={handleRetry}>
                다시 테스트하기 📸
              </button>
            ) : (
              <div className={styles.lockNote}>
                🔒 다음 테스트는 <b>{status?.nextAvailableText}</b>부터 가능해요
              </div>
            )}
            <button type="button" className={styles.ghostBtn} onClick={() => navi('/event')}>
              이벤트로 돌아가기
            </button>
          </div>
        </section>
      ) : status?.canTest ? (
        /* 4. 업로드 카드 */
        <section className={`${styles.glassCard} ${styles.uploadCard}`}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>📷 사진 올리기</h2>
            <span className={styles.cardSub}>
              {photos.length} / {MAX_PHOTOS}장
            </span>
          </div>

          <div className={styles.uploadLayout}>
            {/* 촬영 가이드 */}
            <ul className={styles.guideList}>
              <li>
                <span className={styles.guideIcon}>🙂</span>얼굴이 잘 보이는 <b>정면 사진</b>
              </li>
              <li>
                <span className={styles.guideIcon}>👤</span>사진마다 <b>본인 1명만</b> 나오게
              </li>
              <li>
                <span className={styles.guideIcon}>💡</span>밝은 곳에서, 선글라스·마스크 없이
              </li>
              <li>
                <span className={styles.guideIcon}>🖼️</span>jpg · png · webp, 1장당 10MB 이하
              </li>
              <li>
                <span className={styles.guideIcon}>🔍</span>여러 장이면 <b>같은 사람인지</b> AI가 확인해요
              </li>
            </ul>

            {/* 사진 4칸 */}
            <div className={styles.slotGrid}>
              {Array.from({ length: MAX_PHOTOS }).map((_, idx) => {
                const photo = photos[idx];
                return photo ? (
                  <div key={photo.url} className={`${styles.slot} ${styles.slotFilled}`}>
                    <img src={photo.url} alt={`${idx + 1}번째 사진 미리보기`} className={styles.slotImg} />
                    <span className={styles.slotIndex}>{idx + 1}</span>
                    <button
                      type="button"
                      className={styles.slotRemove}
                      onClick={() => handleRemovePhoto(idx)}
                      disabled={isAnalyzing}
                      aria-label={`${idx + 1}번째 사진 빼기`}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    key={`empty-${idx}`}
                    type="button"
                    className={`${styles.slot} ${styles.slotEmpty}`}
                    onClick={openFilePicker}
                    disabled={isAnalyzing || idx !== photos.length}
                  >
                    <span className={styles.slotPlus}>+</span>
                    <span className={styles.slotText}>{idx === photos.length ? '사진 추가' : `${idx + 1}번째`}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={handleSelectFiles}
          />

          {/* 동의 */}
          <label className={styles.agreeBox}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={isAnalyzing}
            />
            <span>
              올린 사진은 <b>AI 분석(얼굴 검출·본인 사진 확인·점수 계산)에만 사용</b>되고, 서버에 저장되지 않으며 분석이
              끝나면 즉시 삭제되는 것에 동의합니다.
            </span>
          </label>

          <div className={styles.weekNotice}>💡 외모 등급 테스트는 일주일에 1번만 참여할 수 있어요.</div>

          <button type="button" className={styles.primaryBtn} onClick={handleSubmit} disabled={!canSubmit}>
            {isAnalyzing
              ? 'AI가 분석하는 중...'
              : photos.length === 0
              ? '사진을 1장 이상 올려 주세요'
              : !agreed
              ? '동의에 체크해 주세요'
              : `사진 ${photos.length}장으로 AI 분석 시작 ✨`}
          </button>
        </section>
      ) : (
        /* 5. 잠금 카드 (이번 주 참여 완료, 기록을 못 불러온 경우) */
        <section className={`${styles.glassCard} ${styles.lockCard}`}>
          <span className={styles.lockIcon}>🔒</span>
          <p className={styles.lockTitle}>이번 주 외모 등급 테스트에 이미 참여했어요</p>
          {status?.nextAvailableText && (
            <p className={styles.lockSub}>
              다음 테스트는 <b>{status.nextAvailableText}</b>부터 가능해요
            </p>
          )}
        </section>
      )}

      {/* 6. 내 테스트 기록 */}
      {!isLoading && (
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>🗂️ 나의 테스트 기록</h2>
            <span className={styles.sectionSubtitle}>점수와 등급만 기록되고 사진은 남지 않아요</span>
          </div>

          {history.length === 0 ? (
            <div className={styles.emptyHistory}>아직 테스트 기록이 없어요. 첫 테스트에 도전해 보세요!</div>
          ) : (
            <ul className={styles.historyList}>
              {history.map((item) => (
                <li key={item.beautyTestSeq} className={styles.historyItem}>
                  <span className={`${styles.historyGrade} ${styles[`grade${item.grade}`] ?? ''}`}>{item.grade}</span>
                  <div className={styles.historyInfo}>
                    <span className={styles.historyTitle}>
                      {(GRADE_INFO[item.grade] ?? GRADE_INFO.B).title}
                    </span>
                    <span className={styles.historyDate}>{formatDate(item.createdAt)}</span>
                  </div>
                  <div className={styles.historyScore}>
                    <b>{item.score100}점</b>
                    <span>사진 {item.photoCount ?? 1}장</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* 7. 분석 중 화면 */}
      {isAnalyzing && (
        <div className={styles.analyzingOverlay} role="status" aria-live="polite">
          <div className={styles.analyzingCard}>
            <div className={styles.scanFrame}>
              {photos[0] && <img src={photos[0].url} alt="" className={styles.scanImg} />}
              <div className={styles.scanLine} />
            </div>
            <p className={styles.analyzingTitle}>AI가 얼굴을 분석하고 있어요</p>
            <p className={styles.analyzingSub}>
              사진 {photos.length}장 · 얼굴 찾기 → 본인 확인 → 점수 계산
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BeautyTest;
/* ==========================================================================
   [권형석] E001 외모 등급 테스트 페이지 - 끝
   ========================================================================== */
