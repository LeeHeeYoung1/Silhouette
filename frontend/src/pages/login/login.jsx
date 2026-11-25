import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';
import styles from './login.module.css';
import Client from '../../api/client';

function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.login);

  // 화면 모드: 'login' | 'findId' | 'findPw'
  const [currentView, setCurrentView] = useState('login');

  // 로그인 상태
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 아이디 찾기 입력 상태 (UI용)
  const [findIdForm, setFindIdForm] = useState({
    name: '',
    birthDate: '',
    phone: '',
  });

  // 비밀번호 찾기 입력 상태 (UI용)
  const [findPwForm, setFindPwForm] = useState({
    id: '',
    name: '',
    birthDate: '',
    phone: '',
  });

  const handleViewChange = (view) => {
    setErrorMessage('');
    setCurrentView(view);
  };

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

        {/* 2. 중앙: 실루엣 브랜드 테마 카드 */}
        <div className={styles.loginCard}>
          {/* ==================== [1] 기본 로그인 화면 ==================== */}
          {currentView === 'login' && (
            <>
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

                {/* 아이디 찾기 / 비밀번호 찾기 전환 링크 */}
                <div className={styles.findLinks}>
                  <button
                    type="button"
                    className={styles.findLinkBtn}
                    onClick={() => handleViewChange('findId')}
                  >
                    아이디 찾기
                  </button>
                  <span className={styles.divider}>|</span>
                  <button
                    type="button"
                    className={styles.findLinkBtn}
                    onClick={() => handleViewChange('findPw')}
                  >
                    비밀번호 찾기
                  </button>
                </div>

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
            </>
          )}

          {/* ==================== [2] 아이디 찾기 화면 ==================== */}
          {currentView === 'findId' && (
            <>
              <div className={styles.cardHeader}>
                <div className={styles.brandBadge}>
                  <span>🔍 ACCOUNT RECOVERY</span>
                </div>
                <h1 className={styles.title}>아이디 찾기</h1>
                <p className={styles.subtitle}>
                  가입 시 등록한 이름, 생년월일, 휴대폰 번호로<br />
                  본인인증을 진행해 주세요.
                </p>
              </div>

              <form onSubmit={(e) => e.preventDefault()} className={styles.form}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="findIdName">
                    이름
                  </label>
                  <input
                    id="findIdName"
                    type="text"
                    className={styles.input}
                    placeholder="이름을 입력하세요"
                    value={findIdForm.name}
                    onChange={(e) =>
                      setFindIdForm({ ...findIdForm, name: e.target.value })
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="findIdBirthDate">
                    생년월일 (8자리)
                  </label>
                  <input
                    id="findIdBirthDate"
                    type="text"
                    maxLength={8}
                    className={styles.input}
                    placeholder="예: 19990101"
                    value={findIdForm.birthDate}
                    onChange={(e) =>
                      setFindIdForm({ ...findIdForm, birthDate: e.target.value })
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="findIdPhone">
                    휴대폰 번호
                  </label>
                  <input
                    id="findIdPhone"
                    type="tel"
                    className={styles.input}
                    placeholder="휴대폰 번호 ('-' 제외 입력)"
                    value={findIdForm.phone}
                    onChange={(e) =>
                      setFindIdForm({ ...findIdForm, phone: e.target.value })
                    }
                  />
                </div>

                <button
                  type="button"
                  className={styles.submitBtn}
                  onClick={() => alert('본인인증 기능은 추후 연동될 예정입니다.')}
                >
                  본인인증하기
                </button>

                <div className={styles.authInfoNotice}>
                  💡 본인인증 API 연동 준비 중입니다.
                </div>

                <div className={styles.findLinks}>
                  <button
                    type="button"
                    className={styles.findLinkBtn}
                    onClick={() => handleViewChange('login')}
                  >
                    로그인으로 돌아가기
                  </button>
                  <span className={styles.divider}>|</span>
                  <button
                    type="button"
                    className={styles.findLinkBtn}
                    onClick={() => handleViewChange('findPw')}
                  >
                    비밀번호 찾기
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ==================== [3] 비밀번호 찾기 화면 ==================== */}
          {currentView === 'findPw' && (
            <>
              <div className={styles.cardHeader}>
                <div className={styles.brandBadge}>
                  <span>🔒 PASSWORD RESET</span>
                </div>
                <h1 className={styles.title}>비밀번호 찾기</h1>
                <p className={styles.subtitle}>
                  아이디와 본인 확인 정보를 입력하여<br />
                  본인인증을 진행해 주세요.
                </p>
              </div>

              <form onSubmit={(e) => e.preventDefault()} className={styles.form}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="findPwId">
                    아이디
                  </label>
                  <input
                    id="findPwId"
                    type="text"
                    className={styles.input}
                    placeholder="아이디를 입력하세요"
                    value={findPwForm.id}
                    onChange={(e) =>
                      setFindPwForm({ ...findPwForm, id: e.target.value })
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="findPwName">
                    이름
                  </label>
                  <input
                    id="findPwName"
                    type="text"
                    className={styles.input}
                    placeholder="이름을 입력하세요"
                    value={findPwForm.name}
                    onChange={(e) =>
                      setFindPwForm({ ...findPwForm, name: e.target.value })
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="findPwBirthDate">
                    생년월일 (8자리)
                  </label>
                  <input
                    id="findPwBirthDate"
                    type="text"
                    maxLength={8}
                    className={styles.input}
                    placeholder="예: 19990101"
                    value={findPwForm.birthDate}
                    onChange={(e) =>
                      setFindPwForm({ ...findPwForm, birthDate: e.target.value })
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="findPwPhone">
                    휴대폰 번호
                  </label>
                  <input
                    id="findPwPhone"
                    type="tel"
                    className={styles.input}
                    placeholder="휴대폰 번호 ('-' 제외 입력)"
                    value={findPwForm.phone}
                    onChange={(e) =>
                      setFindPwForm({ ...findPwForm, phone: e.target.value })
                    }
                  />
                </div>

                <button
                  type="button"
                  className={styles.submitBtn}
                  onClick={() => alert('본인인증 기능은 추후 연동될 예정입니다.')}
                >
                  본인인증하기
                </button>

                <div className={styles.authInfoNotice}>
                  💡 본인인증 API 연동 준비 중입니다.
                </div>

                <div className={styles.findLinks}>
                  <button
                    type="button"
                    className={styles.findLinkBtn}
                    onClick={() => handleViewChange('login')}
                  >
                    로그인으로 돌아가기
                  </button>
                  <span className={styles.divider}>|</span>
                  <button
                    type="button"
                    className={styles.findLinkBtn}
                    onClick={() => handleViewChange('findId')}
                  >
                    아이디 찾기
                  </button>
                </div>
              </form>
            </>
          )}
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
