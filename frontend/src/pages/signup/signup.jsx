import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { INITIAL_TERMS } from '../../mockData';
import styles from './signup.module.css';

function Signup({ onRegisterSuccess, existingUsers = [] }) {
  const navigate = useNavigate();

  // 현재 스텝 상태 (1: 내 정보 적기, 2: 약관동의내용, 3: 회원가입완료)
  const [currentStep, setCurrentStep] = useState(1);

  // 1단계 입력 폼 상태 (MEMBER 테이블 필드)
  const [formData, setFormData] = useState({
    loginId: '',
    password: '',
    passwordConfirm: '',
    name: '',
    nickname: '',
    phone: '',
    email: '',
    gender: 'FEMALE',
    birthDate: '',
    zipcode: '',
    address1: '',
    address2: ''
  });

  // 유효성 에러 및 피드백 상태
  const [errors, setErrors] = useState({});
  const [idCheckStatus, setIdCheckStatus] = useState(null); // null, 'SUCCESS', 'DUPLICATE', 'INVALID'
  const [idCheckMessage, setIdCheckMessage] = useState('');

  // 비밀번호 확인 실시간 메시지 상태 (onKeyUp 요구사항 반영)
  const [pwConfirmMessage, setPwConfirmMessage] = useState('');
  const [isPwMatched, setIsPwMatched] = useState(false);

  // 2단계 약관 동의 상태 (TERMS 및 MEMBER_TERMS_AGREEMENT 테이블 연계)
  const [agreedTerms, setAgreedTerms] = useState({
    1: false, // 서비스 이용약관 (필수)
    2: false, // 개인정보 동의서 (필수)
    3: false  // 마케팅 동의 (선택)
  });
  const [expandedTerm, setExpandedTerm] = useState(null);

  // 3단계 완료 시 저장된 회원 데이터
  const [completedMember, setCompletedMember] = useState(null);

  // =========================================================================
  // 정규식 정의
  // =========================================================================
  const regexId = /^(?=.*[a-z])(?=.*\d)[a-z0-9]{8,20}$/;
  const regexPassword = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?~`-]).{8,20}$/;
  const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const regexName = /^[가-힣]{2,10}$/;
  const regexNickname = /^[a-zA-Z0-9가-힣]{2,20}$/;
  const regexPhone = /^\d{3}-\d{3,4}-\d{4}$/;

  // 인풋 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;

    // 핸드폰 번호 자동 하이픈 포맷팅 편의 제공
    if (name === 'phone') {
      const numbers = value.replace(/[^0-9]/g, '');
      let formattedPhone = numbers;
      if (numbers.length > 3 && numbers.length <= 7) {
        formattedPhone = `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
      } else if (numbers.length > 7) {
        formattedPhone = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
      }
      setFormData((prev) => ({ ...prev, [name]: formattedPhone }));
      return;
    }

    // 아이디 변경 시 중복확인 초기화
    if (name === 'loginId') {
      setIdCheckStatus(null);
      setIdCheckMessage('');
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 비밀번호 확인 onKeyUp 이벤트
  const handlePasswordConfirmKeyUp = (e) => {
    const currentConfirmVal = e.target.value;

    if (!currentConfirmVal) {
      setPwConfirmMessage('');
      setIsPwMatched(false);
      return;
    }

    if (formData.password && currentConfirmVal === formData.password) {
      setPwConfirmMessage('비밀번호가 확인되었습니다.');
      setIsPwMatched(true);
    } else {
      setPwConfirmMessage('비밀번호가 틀립니다.');
      setIsPwMatched(false);
    }
  };

  // 아이디 중복 검사
  const handleCheckIdDuplicate = () => {
    if (!formData.loginId.trim()) {
      setIdCheckStatus('INVALID');
      setIdCheckMessage('아이디를 먼저 입력해 주세요.');
      return;
    }

    if (!regexId.test(formData.loginId)) {
      setIdCheckStatus('INVALID');
      setIdCheckMessage('아이디는 영문 소문자와 숫자를 각각 1개 이상 포함한 8~20자리여야 합니다.');
      return;
    }

    // 기존 로컬스토리지 유저 목록과 결합 검사
    let users = existingUsers;
    try {
      const saved = localStorage.getItem('silhouette_users');
      if (saved) {
        users = [...users, ...JSON.parse(saved)];
      }
    } catch {
      // ignore
    }

    const isDuplicate = users.some(
      (u) => u.loginId?.toLowerCase() === formData.loginId.toLowerCase()
    );

    if (isDuplicate) {
      setIdCheckStatus('DUPLICATE');
      setIdCheckMessage('이미 사용 중인 아이디입니다.');
    } else {
      setIdCheckStatus('SUCCESS');
      setIdCheckMessage('사용 가능한 아이디입니다.');
    }
  };

  // 휴대폰 본인인증 안내
  const handlePhoneAuth = () => {
    alert('✨ 본인확인 인증 기능은 프로젝트 후반부에 연동 예정입니다. (현재는 정상 통과로 처리됩니다.)');
  };

  // 카카오 우편번호 검색
  const handleOpenKakaoPostcode = () => {
    const Postcode = window.daum?.Postcode || window.kakao?.Postcode;

    if (!Postcode) {
      const script = document.createElement('script');
      script.src = 'https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      script.onload = () => {
        const LoadedPostcode = window.daum?.Postcode || window.kakao?.Postcode;
        if (LoadedPostcode) {
          executePostcode(LoadedPostcode);
        }
      };
      document.head.appendChild(script);
      return;
    }

    executePostcode(Postcode);
  };

  const executePostcode = (PostcodeConstructor) => {
    new PostcodeConstructor({
      oncomplete: function (data) {
        let fullAddress = data.address;
        let extraAddress = '';

        if (data.addressType === 'R') {
          if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
            extraAddress += data.bname;
          }
          if (data.buildingName !== '' && data.apartment === 'Y') {
            extraAddress += extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName;
          }
          if (extraAddress !== '') {
            extraAddress = ` (${extraAddress})`;
          }
          fullAddress += extraAddress;
        }

        setFormData((prev) => ({
          ...prev,
          zipcode: data.zonecode,
          address1: fullAddress,
          address2: ''
        }));

        setErrors((prev) => ({ ...prev, address: null }));

        setTimeout(() => {
          const addr2Input = document.getElementById('address2');
          if (addr2Input) addr2Input.focus();
        }, 100);
      }
    }).open();
  };

  // 1단계 유효성 검사 및 2단계 이동
  const handleStep1Next = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!regexId.test(formData.loginId)) {
      newErrors.loginId = '영문 소문자 + 숫자 포함 8~20자리로 입력해 주세요.';
    } else if (idCheckStatus !== 'SUCCESS') {
      newErrors.loginId = '아이디 중복 검사를 진행해 주세요.';
    }

    if (!regexPassword.test(formData.password)) {
      newErrors.password = '영문 대소문자(대문자 1개 이상 필수), 숫자, 특수기호 포함 8~20자리여야 합니다.';
    }

    if (!formData.passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호 확인을 입력해 주세요.';
    } else if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 틀립니다.';
    }

    if (!regexName.test(formData.name)) {
      newErrors.name = '이름은 한글 2~10자리로 입력해 주세요.';
    }

    if (!regexNickname.test(formData.nickname)) {
      newErrors.nickname = '닉네임은 영문, 숫자, 한글로 2자리 이상 입력해 주세요.';
    }

    if (!regexEmail.test(formData.email)) {
      newErrors.email = '올바른 이메일 양식(예: love@silhouette.com)을 입력해 주세요.';
    }

    if (!regexPhone.test(formData.phone)) {
      newErrors.phone = '핸드폰 번호를 010-XXXX-XXXX 양식으로 입력해 주세요.';
    }

    if (!formData.birthDate) {
      newErrors.birthDate = '생년월일을 선택해 주세요.';
    }

    if (!formData.zipcode || !formData.address1) {
      newErrors.address = '우편번호 검색을 통해 주소를 입력해 주세요.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 2단계 약관 동의 체크박스 제어
  const handleToggleTerm = (seq) => {
    setAgreedTerms((prev) => ({
      ...prev,
      [seq]: !prev[seq]
    }));
  };

  const handleToggleAllTerms = () => {
    const allChecked = Object.values(agreedTerms).every(Boolean);
    const updated = {};
    INITIAL_TERMS.forEach((term) => {
      updated[term.termsSeq] = !allChecked;
    });
    setAgreedTerms(updated);
  };

  // 2단계 제출 -> 회원가입 최종 완료 (Step 3)
  const handleFinalSubmit = (e) => {
    e.preventDefault();

    const requiredTerms = INITIAL_TERMS.filter((t) => t.requiredYn === 'Y');
    const allRequiredAgreed = requiredTerms.every((t) => agreedTerms[t.termsSeq]);

    if (!allRequiredAgreed) {
      alert('필수 약관 및 개인정보 동의 항목에 모두 체크해 주셔야 가입이 가능합니다.');
      return;
    }

    const now = new Date();
    const formattedNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newMemberSeq = Date.now();

    const agreementRecords = INITIAL_TERMS.map((term) => ({
      memberTermsAgreementSeq: Date.now() + term.termsSeq,
      memberSeq: newMemberSeq,
      termsSeq: term.termsSeq,
      agreeYn: agreedTerms[term.termsSeq] ? 'Y' : 'N',
      agreedAt: formattedNow
    }));

    const newMember = {
      memberSeq: newMemberSeq,
      loginId: formData.loginId,
      password: formData.password,
      name: formData.name,
      nickname: formData.nickname,
      phone: formData.phone,
      email: formData.email,
      gender: formData.gender,
      birthDate: formData.birthDate,
      zipcode: formData.zipcode,
      address1: formData.address1,
      address2: formData.address2 || '상세주소 없음',
      role: 'ROLE_USER',
      memberStatus: 'ACTIVE',
      createdAt: formattedNow,
      agreements: agreementRecords
    };

    // 로컬스토리지에 회원 정보 추가 저장
    try {
      const saved = localStorage.getItem('silhouette_users');
      const currentList = saved ? JSON.parse(saved) : [];
      localStorage.setItem('silhouette_users', JSON.stringify([newMember, ...currentList]));
    } catch {
      // ignore
    }

    setCompletedMember(newMember);
    if (onRegisterSuccess) {
      onRegisterSuccess(newMember);
    }
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getProgressClass = () => {
    if (currentStep === 1) return styles.stepProgressStep1;
    if (currentStep === 2) return styles.stepProgressStep2;
    return styles.stepProgressStep3;
  };

  return (
    <div className={styles.card}>
      {/* 3단계 스텝 인디케이터 */}
      <div className={styles.stepStepper}>
        <div className={`${styles.stepProgressBar} ${getProgressClass()}`} />
        <div className={`${styles.stepItem} ${currentStep === 1 ? styles.active : currentStep > 1 ? styles.completed : ''}`}>
          <div className={styles.stepCircle}>{currentStep > 1 ? '✓' : '1'}</div>
          <span className={styles.stepLabel}>내 정보 적기</span>
        </div>
        <div className={`${styles.stepItem} ${currentStep === 2 ? styles.active : currentStep > 2 ? styles.completed : ''}`}>
          <div className={styles.stepCircle}>{currentStep > 2 ? '✓' : '2'}</div>
          <span className={styles.stepLabel}>약관동의내용</span>
        </div>
        <div className={`${styles.stepItem} ${currentStep === 3 ? styles.active : ''}`}>
          <div className={styles.stepCircle}>3</div>
          <span className={styles.stepLabel}>회원가입완료</span>
        </div>
      </div>

      {/* 1단계: 내 정보 적기 */}
      {currentStep === 1 && (
        <form onSubmit={handleStep1Next}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>실루엣 회원가입</h2>
            <p className={styles.cardSubtitle}>
              새로운 인연을 위한 첫 걸음, 회원님의 정보를 입력해 주세요.
            </p>
          </div>

          {/* 아이디 + 중복검사 버튼 */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="loginId">
              <span>
                아이디 (LOGIN_ID) <span className={styles.labelRequired}>*</span>
              </span>
            </label>
            <div className={styles.inputWithButton}>
              <input
                id="loginId"
                name="loginId"
                type="text"
                className={styles.input}
                placeholder="예: silhouette01"
                value={formData.loginId}
                onChange={handleChange}
                autoComplete="username"
              />
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={handleCheckIdDuplicate}
              >
                중복검사
              </button>
            </div>
            {idCheckMessage && (
              <div className={`${styles.validationMsg} ${idCheckStatus === 'SUCCESS' ? styles.success : styles.error}`}>
                {idCheckStatus === 'SUCCESS' ? '✓ ' : '⚠️ '}
                {idCheckMessage}
              </div>
            )}
            {errors.loginId && (
              <div className={`${styles.validationMsg} ${styles.error}`}>⚠️ {errors.loginId}</div>
            )}
          </div>

          {/* 비밀번호 */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="password">
              <span>
                비밀번호 (PASSWORD) <span className={styles.labelRequired}>*</span>
              </span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className={styles.input}
              placeholder="대소문자, 숫자, 특수문자 조합"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
            />
            {errors.password && (
              <div className={`${styles.validationMsg} ${styles.error}`}>⚠️ {errors.password}</div>
            )}
          </div>

          {/* 비밀번호 확인 (onKeyUp 이벤트) */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="passwordConfirm">
              <span>
                비밀번호 확인 <span className={styles.labelRequired}>*</span>
              </span>
            </label>
            <input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              className={styles.input}
              placeholder="비밀번호를 한번 더 입력해 주세요"
              value={formData.passwordConfirm}
              onChange={handleChange}
              onKeyUp={handlePasswordConfirmKeyUp}
              autoComplete="new-password"
            />
            {pwConfirmMessage && (
              <div className={`${styles.validationMsg} ${isPwMatched ? styles.success : styles.error}`}>
                {isPwMatched ? '✓ ' : '⚠️ '}
                {pwConfirmMessage}
              </div>
            )}
            {errors.passwordConfirm && !pwConfirmMessage && (
              <div className={`${styles.validationMsg} ${styles.error}`}>⚠️ {errors.passwordConfirm}</div>
            )}
          </div>

          {/* 이름 & 닉네임 (2열) */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="name">
                <span>
                  성명 (한글) <span className={styles.labelRequired}>*</span>
                </span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className={styles.input}
                placeholder="홍길동 (2~10자)"
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && (
                <div className={`${styles.validationMsg} ${styles.error}`}>⚠️ {errors.name}</div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="nickname">
                <span>
                  닉네임 <span className={styles.labelRequired}>*</span>
                </span>
              </label>
              <input
                id="nickname"
                name="nickname"
                type="text"
                className={styles.input}
                placeholder="2자 이상 (한글/영문/숫자)"
                value={formData.nickname}
                onChange={handleChange}
              />
              {errors.nickname && (
                <div className={`${styles.validationMsg} ${styles.error}`}>⚠️ {errors.nickname}</div>
              )}
            </div>
          </div>

          {/* 성별 & 생년월일 (2열) */}
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="gender">
                <span>
                  성별 <span className={styles.labelRequired}>*</span>
                </span>
              </label>
              <select
                id="gender"
                name="gender"
                className={styles.select}
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="FEMALE">여성 (Female)</option>
                <option value="MALE">남성 (Male)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="birthDate">
                <span>
                  생년월일 <span className={styles.labelRequired}>*</span>
                </span>
              </label>
              <input
                id="birthDate"
                name="birthDate"
                type="date"
                className={styles.input}
                value={formData.birthDate}
                onChange={handleChange}
                max="2007-12-31"
              />
              {errors.birthDate && (
                <div className={`${styles.validationMsg} ${styles.error}`}>⚠️ {errors.birthDate}</div>
              )}
            </div>
          </div>

          {/* 핸드폰 번호 + 본인확인 인증 버튼 */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="phone">
              <span>
                휴대폰 번호 (PHONE) <span className={styles.labelRequired}>*</span>
              </span>
            </label>
            <div className={styles.inputWithButton}>
              <input
                id="phone"
                name="phone"
                type="tel"
                maxLength={13}
                className={styles.input}
                placeholder="010-1234-5678"
                value={formData.phone}
                onChange={handleChange}
              />
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={handlePhoneAuth}
                title="프로젝트 마지막에 연동 예정"
              >
                본인확인 인증
              </button>
            </div>
            {errors.phone && (
              <div className={`${styles.validationMsg} ${styles.error}`}>⚠️ {errors.phone}</div>
            )}
          </div>

          {/* 이메일 */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="email">
              <span>
                이메일 (EMAIL) <span className={styles.labelRequired}>*</span>
              </span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className={styles.input}
              placeholder="example@silhouette.com"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && (
              <div className={`${styles.validationMsg} ${styles.error}`}>⚠️ {errors.email}</div>
            )}
          </div>

          {/* 주소 검색 (ZIPCODE / ADDRESS) */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <span>
                주소 (ZIPCODE / ADDRESS) <span className={styles.labelRequired}>*</span>
              </span>
            </label>
            <div className={styles.addressSearchGroup}>
              <input
                type="text"
                name="zipcode"
                className={`${styles.input} ${styles.zipcodeInput}`}
                placeholder="우편번호"
                value={formData.zipcode}
                onClick={handleOpenKakaoPostcode}
                readOnly
              />
              <input
                type="text"
                name="address1"
                className={`${styles.input} ${styles.address1Input}`}
                placeholder="주소 검색을 클릭해 주세요"
                value={formData.address1}
                onClick={handleOpenKakaoPostcode}
                readOnly
              />
              <button
                type="button"
                className={`${styles.btnSecondary} ${styles.searchBtn}`}
                onClick={handleOpenKakaoPostcode}
              >
                🔍 주소 검색
              </button>
            </div>
            <input
              id="address2"
              type="text"
              name="address2"
              className={styles.input}
              placeholder="상세주소를 입력해 주세요 (동/호수, 층 등)"
              value={formData.address2}
              onChange={handleChange}
            />
            {errors.address && (
              <div className={`${styles.validationMsg} ${styles.error}`}>⚠️ {errors.address}</div>
            )}
          </div>

          {/* 다음 단계 버튼 */}
          <button type="submit" className={`${styles.btnPrimary} ${styles.submitBtn}`}>
            다음: 약관 동의하기 ➔
          </button>

          <div className={styles.backBtnWrapper}>
            <button
              type="button"
              className={styles.btnOutline}
              onClick={() => navigate('/login')}
            >
              로그인 화면으로 돌아가기
            </button>
          </div>
        </form>
      )}

      {/* 2단계: 약관동의내용 */}
      {currentStep === 2 && (
        <form onSubmit={handleFinalSubmit}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>이용약관 및 개인정보 동의</h2>
            <p className={styles.cardSubtitle}>
              안전하고 진정성 있는 만남을 위해 약관을 확인해 주세요.
            </p>
          </div>

          {/* 전체 동의 버튼 */}
          <div className={styles.allAgreeCard}>
            <div className={styles.termsHeaderRow}>
              <label className={styles.termsCheckboxWrap} onClick={handleToggleAllTerms}>
                <input
                  type="checkbox"
                  checked={Object.values(agreedTerms).every(Boolean)}
                  onChange={() => {}}
                />
                <span className={`${styles.termsTitleText} ${styles.allAgreeTitle}`}>
                  실루엣 모든 약관 및 개인정보 수집에 전체 동의합니다
                </span>
              </label>
            </div>
          </div>

          {/* 약관 리스트 */}
          {INITIAL_TERMS.map((term) => (
            <div key={term.termsSeq} className={styles.termsCard}>
              <div className={styles.termsHeaderRow}>
                <label className={styles.termsCheckboxWrap} onClick={() => handleToggleTerm(term.termsSeq)}>
                  <input
                    type="checkbox"
                    checked={!!agreedTerms[term.termsSeq]}
                    onChange={() => {}}
                  />
                  <span className={styles.termsTitleText}>
                    {term.title}
                    <span className={`${styles.termsTag} ${term.requiredYn === 'Y' ? styles.termsTagReq : styles.termsTagOpt}`}>
                      {term.requiredYn === 'Y' ? '필수' : '선택'}
                    </span>
                  </span>
                </label>
                <button
                  type="button"
                  className={styles.termsViewBtn}
                  onClick={() =>
                    setExpandedTerm(expandedTerm === term.termsSeq ? null : term.termsSeq)
                  }
                >
                  {expandedTerm === term.termsSeq ? '닫기 ▲' : '전문보기 ▼'}
                </button>
              </div>

              {expandedTerm === term.termsSeq && (
                <div className={styles.termsContentBox}>
                  <div className={styles.termsMeta}>
                    버전: {term.version} | 시행일: {term.effectiveAt}
                  </div>
                  {term.content}
                </div>
              )}
            </div>
          ))}

          <div className={styles.termsButtonGroup}>
            <button
              type="button"
              className={`${styles.btnOutline} ${styles.prevStepBtn}`}
              onClick={() => setCurrentStep(1)}
            >
              ⬅ 이전 단계
            </button>
            <button type="submit" className={`${styles.btnPrimary} ${styles.nextStepBtn}`}>
              동의하고 회원가입 완료 💖
            </button>
          </div>
        </form>
      )}

      {/* 3단계: 회원가입완료 */}
      {currentStep === 3 && completedMember && (
        <div className={styles.successBanner}>
          <div className={styles.successIconWrap}>🎉</div>
          <h2 className={`${styles.cardTitle} ${styles.successTitle}`}>
            실루엣 회원가입이 완료되었습니다!
          </h2>
          <p className={`${styles.cardSubtitle} ${styles.successSubtitle}`}>
            {completedMember.name}님, 당신만을 위한 특별한 인연이 기다리고 있습니다.
          </p>

          <div className={styles.summaryCard}>
            <div className={styles.summaryCardTitle}>
              ✓ 등록된 계정 요약
            </div>
            <div className={styles.summaryCardContent}>
              <div>• <strong>아이디:</strong> {completedMember.loginId}</div>
              <div>• <strong>성명 / 닉네임:</strong> {completedMember.name} ({completedMember.nickname})</div>
              <div>• <strong>연락처:</strong> {completedMember.phone}</div>
              <div>• <strong>이메일:</strong> {completedMember.email}</div>
              <div>• <strong>주소:</strong> [{completedMember.zipcode}] {completedMember.address1} {completedMember.address2}</div>
              <div>• <strong>회원상태:</strong> {completedMember.memberStatus} (정상)</div>
            </div>
          </div>

          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => navigate('/login')}
          >
            로그인하러 가기 ➔
          </button>
        </div>
      )}
    </div>
  );
}

export default Signup;
