
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';
import styles from './login.module.css';

function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.login);

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e) => {
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

    // 임시 로그인 처리
    // 실제 로그인 API 연결 후 이 부분 변경
    setAuth({
      token: 'mock_jwt_token',
      id: loginId
    });

    navigate('/');
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.badge}>
          ✨ SILHOUETTE DATING
        </div>

        <h1 className={styles.title}>
          실루엣 (Silhouette)
        </h1>

        <p className={styles.subtitle}>
          베일에 싸인 매력적인 인연을 만나는 곳
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {errorMessage && (
          <div className={styles.errorBanner}>
            ⚠️ {errorMessage}
          </div>
        )}

        <div className={styles.formGroup}>
          <label
            className={styles.formLabel}
            htmlFor="loginId"
          >
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
          />
        </div>

        <div className={styles.formGroup}>
          <label
            className={styles.formLabel}
            htmlFor="loginPassword"
          >
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
          />
        </div>

        <button
          type="submit"
          className={styles.submitBtn}
        >
          로그인하기
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
  );
}

export default Login;
