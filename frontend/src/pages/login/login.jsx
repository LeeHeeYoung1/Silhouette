import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';
import styles from './login.module.css';
import Client from '../../api/client';

function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.login);

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!loginId.trim()) {
      setErrorMessage('아이디를 입력해 주세요.');
      return;
    }

    if (!password) {
      setErrorMessage('비밀번호를 입력해 주세요.');
      return;
    }

    try {
      setIsLoading(true);
      const resp = await Client.post('/auth/login', {
        id: loginId,
        pw: password
      });

      setAuth({
        token: resp.data.token,
        id: resp.data.id
      });

      navigate('/');
    } catch (error) {
      setErrorMessage(
        error.response?.data || '아이디 또는 비밀번호가 일치하지 않습니다.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.stage}>
      {/* 
        상단 헤더 너비(1140px) 기준
        배경 이미지 박스 없이 원본 이미지에서 정밀 추출한 남녀 실루엣만 80% 크기로 배치
      */}
      <div className={styles.stageContent}>
        
        {/* 1. 좌측: 원본 이미지에서 추출한 남성 실루엣 (80% 크기) */}
        <aside className={styles.silhouetteColLeft} aria-label="남성 실루엣">
          <img
            src="/silhouette_man_cutout.png"
            alt="남성 실루엣"
            className={styles.silhouetteImage}
            draggable="false"
          />
        </aside>

        {/* 2. 중앙: 실루엣 브랜드 테마 로그인 카드 */}
        <div className={styles.loginCard}>
          <div className={styles.cardHeader}>
            <div className={styles.brandBadge}>
              <span>💌 FIRST FLUTTER · SILHOUETTE</span>
            </div>
            <h1 className={styles.title}>Blind Match</h1>
            <p className={styles.subtitle}>
              외모와 조건을 걷어낸 순수한 자리에서,<br />
              오직 마음과 대화로 전해지는 풋풋한 설렘
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {errorMessage && (
              <div className={styles.errorBanner} role="alert">
                ⚠️ {errorMessage}
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="loginId">
                아이디
              </label>
              <input
                id="loginId"
                type="text"
                className={styles.input}
                placeholder="아이디를 입력하세요"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                autoComplete="username"
                disabled={isLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="loginPassword">
                비밀번호
              </label>
              <input
                id="loginPassword"
                type="password"
                className={styles.input}
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? '설레는 만남 연결 중...' : '두근거리는 마음으로 시작하기'}
            </button>

            <div className={styles.signupPrompt}>
              <span className={styles.signupPromptText}>
                아직 실루엣 회원이 아니신가요?
              </span>
              <button
                type="button"
                className={styles.signupLinkBtn}
                onClick={() => navigate('/signup')}
              >
                회원가입
              </button>
            </div>
          </form>
        </div>

        {/* 3. 우측: 원본 이미지에서 추출한 여성 실루엣 (80% 크기) */}
        <aside className={styles.silhouetteColRight} aria-label="여성 실루엣">
          <img
            src="/silhouette_woman_cutout.png"
            alt="여성 실루엣"
            className={styles.silhouetteImage}
            draggable="false"
          />
        </aside>

      </div>
    </div>
  );
}

export default Login;
