import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';
import styles from './login.module.css';
import Client from '../../api/client';

const REGEX_PASSWORD =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?~`-]).{8,20}$/;

const formatPhone = (value) => {
  const numbers = value.replace(/[^0-9]/g, '');
  if (numbers.length > 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  }
  if (numbers.length > 3) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  }
  return numbers;
};

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

  // 아이디 찾기 입력 및 본인인증 상태 (이름 + 본인인증)
  const [findIdForm, setFindIdForm] = useState({
    name: '',
    phone: '',
  });
  const [findIdCode, setFindIdCode] = useState('');
  const [isFindIdSending, setIsFindIdSending] = useState(false);
  const [isFindIdCodeSent, setIsFindIdCodeSent] = useState(false);
  const [isFindIdVerifying, setIsFindIdVerifying] = useState(false);
  const [findIdTimer, setFindIdTimer] = useState(0);
  const [findIdStatus, setFindIdStatus] = useState(null);
  const [findIdMessage, setFindIdMessage] = useState('');
  const [foundLoginId, setFoundLoginId] = useState('');

  // 비밀번호 찾기 입력 및 본인인증 상태 (아이디 + 이름 + 본인인증)
  const [findPwForm, setFindPwForm] = useState({
    id: '',
    name: '',
    phone: '',
  });
  const [findPwCode, setFindPwCode] = useState('');
  const [isFindPwSending, setIsFindPwSending] = useState(false);
  const [isFindPwCodeSent, setIsFindPwCodeSent] = useState(false);
  const [isFindPwVerifying, setIsFindPwVerifying] = useState(false);
  const [isFindPwVerified, setIsFindPwVerified] = useState(false);
  const [findPwTimer, setFindPwTimer] = useState(0);
  const [findPwStatus, setFindPwStatus] = useState(null);
  const [findPwMessage, setFindPwMessage] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [isResettingPw, setIsResettingPw] = useState(false);

  useEffect(() => {
    if (!isFindIdCodeSent || foundLoginId || findIdTimer <= 0) return;
    const interval = setInterval(() => {
      setFindIdTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isFindIdCodeSent, foundLoginId, findIdTimer]);

  useEffect(() => {
    if (!isFindPwCodeSent || isFindPwVerified || findPwTimer <= 0) return;
    const interval = setInterval(() => {
      setFindPwTimer((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isFindPwCodeSent, isFindPwVerified, findPwTimer]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? `0${s}` : s}`;
  };

  const handleViewChange = (view) => {
    setErrorMessage('');
    setCurrentView(view);
  };

  // ==================== 아이디 찾기 핸들러 ====================
  const handleSendFindIdCode = async () => {
    if (!findIdForm.name.trim()) {
      setFindIdStatus('ERROR');
      setFindIdMessage('이름을 입력해 주세요.');
      return;
    }
    if (findIdForm.phone.replace(/\D/g, '').length < 10) {
      setFindIdStatus('ERROR');
      setFindIdMessage('휴대폰 번호를 정확히 입력해 주세요.');
      return;
    }

    try {
      setIsFindIdSending(true);
      setFindIdStatus(null);
      setFindIdMessage('');
      setFoundLoginId('');

      const resp = await Client.post('/members/find-id/send', {
        name: findIdForm.name.trim(),
        phone: findIdForm.phone.trim(),
      });

      setIsFindIdCodeSent(true);
      setFindIdCode('');
      setFindIdTimer(180);
      setFindIdStatus('SENT');
      setFindIdMessage(resp.data?.message || '인증번호가 발송되었습니다.');
    } catch (err) {
      setFindIdStatus('ERROR');
      setFindIdMessage(
        err.response?.data?.message || '인증번호 발송에 실패했습니다.'
      );
    } finally {
      setIsFindIdSending(false);
    }
  };

  const handleVerifyFindIdCode = async () => {
    if (findIdCode.trim().length !== 6) {
      setFindIdStatus('ERROR');
      setFindIdMessage('6자리 인증번호를 입력해 주세요.');
      return;
    }

    try {
      setIsFindIdVerifying(true);
      const resp = await Client.post('/members/find-id/verify', {
        name: findIdForm.name.trim(),
        phone: findIdForm.phone.trim(),
        code: findIdCode.trim(),
      });

      setFoundLoginId(resp.data?.loginId || '');
      setFindIdTimer(0);
      setFindIdStatus('SUCCESS');
      setFindIdMessage(resp.data?.message || '본인인증이 완료되었습니다.');
    } catch (err) {
      setFindIdStatus('ERROR');
      setFindIdMessage(
        err.response?.data?.message || '인증번호 확인에 실패했습니다.'
      );
    } finally {
      setIsFindIdVerifying(false);
    }
  };

  // ==================== 비밀번호 찾기 핸들러 ====================
  const handleSendFindPwCode = async () => {
    if (!findPwForm.id.trim()) {
      setFindPwStatus('ERROR');
      setFindPwMessage('아이디를 입력해 주세요.');
      return;
    }
    if (!findPwForm.name.trim()) {
      setFindPwStatus('ERROR');
      setFindPwMessage('이름을 입력해 주세요.');
      return;
    }
    if (findPwForm.phone.replace(/\D/g, '').length < 10) {
      setFindPwStatus('ERROR');
      setFindPwMessage('휴대폰 번호를 정확히 입력해 주세요.');
      return;
    }

    try {
      setIsFindPwSending(true);
      setFindPwStatus(null);
      setFindPwMessage('');
      setIsFindPwVerified(false);

      const resp = await Client.post('/members/find-pw/send', {
        loginId: findPwForm.id.trim(),
        name: findPwForm.name.trim(),
        phone: findPwForm.phone.trim(),
      });

      setIsFindPwCodeSent(true);
      setFindPwCode('');
      setFindPwTimer(180);
      setFindPwStatus('SENT');
      setFindPwMessage(resp.data?.message || '인증번호가 발송되었습니다.');
    } catch (err) {
      setFindPwStatus('ERROR');
      setFindPwMessage(
        err.response?.data?.message || '인증번호 발송에 실패했습니다.'
      );
    } finally {
      setIsFindPwSending(false);
    }
  };

  const handleVerifyFindPwCode = async () => {
    if (findPwCode.trim().length !== 6) {
      setFindPwStatus('ERROR');
      setFindPwMessage('6자리 인증번호를 입력해 주세요.');
      return;
    }

    try {
      setIsFindPwVerifying(true);
      const resp = await Client.post('/members/find-pw/verify', {
        loginId: findPwForm.id.trim(),
        name: findPwForm.name.trim(),
        phone: findPwForm.phone.trim(),
        code: findPwCode.trim(),
      });

      setIsFindPwVerified(true);
      setFindPwTimer(0);
      setFindPwStatus('SUCCESS');
      setFindPwMessage(resp.data?.message || '본인인증이 완료되었습니다. 새 비밀번호를 입력해 주세요.');
    } catch (err) {
      setIsFindPwVerified(false);
      setFindPwStatus('ERROR');
      setFindPwMessage(
        err.response?.data?.message || '인증번호 확인에 실패했습니다.'
      );
    } finally {
      setIsFindPwVerifying(false);
    }
  };

  const handleResetPassword = async () => {
    if (!REGEX_PASSWORD.test(newPassword)) {
      setFindPwStatus('ERROR');
      setFindPwMessage('새 비밀번호는 영문 대소문자, 숫자, 특수기호 포함 8~20자리여야 합니다.');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setFindPwStatus('ERROR');
      setFindPwMessage('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    try {
      setIsResettingPw(true);
      const resp = await Client.post('/members/find-pw/reset', {
        loginId: findPwForm.id.trim(),
        name: findPwForm.name.trim(),
        phone: findPwForm.phone.trim(),
        newPassword,
      });

      alert(resp.data?.message || '비밀번호가 성공적으로 변경되었습니다.');
      setLoginId(findPwForm.id.trim());
      setPassword('');
      handleViewChange('login');
    } catch (err) {
      setFindPwStatus('ERROR');
      setFindPwMessage(
        err.response?.data?.message || '비밀번호 재설정에 실패했습니다.'
      );
    } finally {
      setIsResettingPw(false);
    }
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
        id: resp.data.id,
        role: resp.data.role
      });

      navigate('/');
    } catch (error) {
      const data = error.response?.data;
      const msg =
        typeof data === 'string'
          ? data
          : data?.message || '아이디 또는 비밀번호가 일치하지 않습니다.';
      setErrorMessage(msg);
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
                  가입 시 등록한 이름과 휴대폰 번호로<br />
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
                    disabled={Boolean(foundLoginId)}
                    onChange={(e) =>
                      setFindIdForm({ ...findIdForm, name: e.target.value })
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="findIdPhone">
                    휴대폰 번호
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      id="findIdPhone"
                      type="tel"
                      maxLength={13}
                      className={styles.input}
                      placeholder="010-1234-5678"
                      value={findIdForm.phone}
                      disabled={Boolean(foundLoginId)}
                      onChange={(e) => {
                        setFindIdForm({
                          ...findIdForm,
                          phone: formatPhone(e.target.value),
                        });
                        setIsFindIdCodeSent(false);
                        setFindIdCode('');
                        setFindIdTimer(0);
                      }}
                    />
                    <button
                      type="button"
                      className={styles.submitBtn}
                      style={{ width: 'auto', marginTop: 0, padding: '0 18px', whiteSpace: 'nowrap', fontSize: '13px' }}
                      onClick={handleSendFindIdCode}
                      disabled={isFindIdSending || Boolean(foundLoginId)}
                    >
                      {foundLoginId
                        ? '인증완료'
                        : isFindIdSending
                          ? '발송 중...'
                          : isFindIdCodeSent
                            ? '재전송'
                            : '인증번호 발송'}
                    </button>
                  </div>
                </div>

                {isFindIdCodeSent && !foundLoginId && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="findIdCode">
                      인증번호 6자리 ({formatTimer(findIdTimer)})
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        id="findIdCode"
                        type="text"
                        maxLength={6}
                        className={styles.input}
                        placeholder="인증번호 6자리 입력"
                        value={findIdCode}
                        onChange={(e) =>
                          setFindIdCode(e.target.value.replace(/[^0-9]/g, ''))
                        }
                      />
                      <button
                        type="button"
                        className={styles.submitBtn}
                        style={{ width: 'auto', marginTop: 0, padding: '0 18px', whiteSpace: 'nowrap', fontSize: '13px' }}
                        onClick={handleVerifyFindIdCode}
                        disabled={isFindIdVerifying || findIdTimer === 0}
                      >
                        {isFindIdVerifying ? '확인 중...' : '인증 확인'}
                      </button>
                    </div>
                  </div>
                )}

                {findIdMessage && (
                  <div
                    className={
                      findIdStatus === 'ERROR'
                        ? styles.errorBanner
                        : styles.authInfoNotice
                    }
                    style={{ marginBottom: '10px' }}
                  >
                    {findIdStatus === 'ERROR' ? '⚠️ ' : '✔ '}
                    {findIdMessage}
                  </div>
                )}

                {foundLoginId && (
                  <div className={styles.authInfoNotice} style={{ marginBottom: '12px', fontSize: '14px' }}>
                    회원님의 아이디는 <strong style={{ fontSize: '16px', textDecoration: 'underline' }}>{foundLoginId}</strong> 입니다.
                    <button
                      type="button"
                      className={styles.submitBtn}
                      style={{ marginTop: '12px' }}
                      onClick={() => {
                        setLoginId(foundLoginId);
                        handleViewChange('login');
                      }}
                    >
                      이 아이디로 로그인하기
                    </button>
                  </div>
                )}

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
                  아이디와 이름, 휴대폰 번호로<br />
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
                    disabled={isFindPwVerified}
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
                    disabled={isFindPwVerified}
                    onChange={(e) =>
                      setFindPwForm({ ...findPwForm, name: e.target.value })
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="findPwPhone">
                    휴대폰 번호
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      id="findPwPhone"
                      type="tel"
                      maxLength={13}
                      className={styles.input}
                      placeholder="010-1234-5678"
                      value={findPwForm.phone}
                      disabled={isFindPwVerified}
                      onChange={(e) => {
                        setFindPwForm({
                          ...findPwForm,
                          phone: formatPhone(e.target.value),
                        });
                        setIsFindPwCodeSent(false);
                        setIsFindPwVerified(false);
                        setFindPwCode('');
                        setFindPwTimer(0);
                      }}
                    />
                    <button
                      type="button"
                      className={styles.submitBtn}
                      style={{ width: 'auto', marginTop: 0, padding: '0 18px', whiteSpace: 'nowrap', fontSize: '13px' }}
                      onClick={handleSendFindPwCode}
                      disabled={isFindPwSending || isFindPwVerified}
                    >
                      {isFindPwVerified
                        ? '인증완료'
                        : isFindPwSending
                          ? '발송 중...'
                          : isFindPwCodeSent
                            ? '재전송'
                            : '인증번호 발송'}
                    </button>
                  </div>
                </div>

                {isFindPwCodeSent && !isFindPwVerified && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="findPwCode">
                      인증번호 6자리 ({formatTimer(findPwTimer)})
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        id="findPwCode"
                        type="text"
                        maxLength={6}
                        className={styles.input}
                        placeholder="인증번호 6자리 입력"
                        value={findPwCode}
                        onChange={(e) =>
                          setFindPwCode(e.target.value.replace(/[^0-9]/g, ''))
                        }
                      />
                      <button
                        type="button"
                        className={styles.submitBtn}
                        style={{ width: 'auto', marginTop: 0, padding: '0 18px', whiteSpace: 'nowrap', fontSize: '13px' }}
                        onClick={handleVerifyFindPwCode}
                        disabled={isFindPwVerifying || findPwTimer === 0}
                      >
                        {isFindPwVerifying ? '확인 중...' : '인증 확인'}
                      </button>
                    </div>
                  </div>
                )}

                {findPwMessage && (
                  <div
                    className={
                      findPwStatus === 'ERROR'
                        ? styles.errorBanner
                        : styles.authInfoNotice
                    }
                    style={{ marginBottom: '12px' }}
                  >
                    {findPwStatus === 'ERROR' ? '⚠️ ' : '✔ '}
                    {findPwMessage}
                  </div>
                )}

                {isFindPwVerified && (
                  <>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} htmlFor="newPassword">
                        새 비밀번호
                      </label>
                      <input
                        id="newPassword"
                        type="password"
                        className={styles.input}
                        placeholder="영문 대/소문자+숫자+특수기호 8~20자"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} htmlFor="newPasswordConfirm">
                        새 비밀번호 확인
                      </label>
                      <input
                        id="newPasswordConfirm"
                        type="password"
                        className={styles.input}
                        placeholder="새 비밀번호를 다시 입력하세요"
                        value={newPasswordConfirm}
                        onChange={(e) => setNewPasswordConfirm(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className={styles.submitBtn}
                      onClick={handleResetPassword}
                      disabled={isResettingPw}
                    >
                      {isResettingPw ? '변경 중...' : '비밀번호 재설정 완료'}
                    </button>
                  </>
                )}

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
