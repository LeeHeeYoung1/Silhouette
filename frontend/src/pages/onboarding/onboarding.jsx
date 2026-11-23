import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';
import Client from '../../api/client';
import styles from './onboarding.module.css';
import {
  MBTI_LIST, JOB_LIST, DRINKING_LIST, SMOKING_LIST, RELIGION_LIST,
  FACE_TYPE_LIST, SKIN_TYPE_LIST, LOVE_TYPE_LIST, HOBBY_LIST,
  FAVORITE_LIST, DISLIKE_LIST, FOOD_LIST, BODY_TYPE_LIST,
  SMOKING_PREF_LIST, DRINKING_PREF_LIST,
  MILITARY_LIST, MILITARY_PREF_LIST,
} from './onboardingOptions';

const MAX_INTRO = 300;
const MAX_MEMO = 150;
const MAX_PHOTO_SIZE = 10 * 1024 * 1024;   // 프로필 사진 1장, 최대 10MB
const HEIGHT_MIN = 100;                     // 키 최소 (내 키, 이상형 키 공통)
const HEIGHT_MAX = 250;                     // 키 최대
const WEIGHT_MIN = 30;                      // ✅ 몸무게 최소
const WEIGHT_MAX = 200;                     // ✅ 몸무게 최대
const IDEAL_AGE_MIN = 14;                   // 이상형 나이 최소
const IDEAL_AGE_MAX = 100;                  // 이상형 나이 최대
const TOTAL_STEPS = 6;
const STEP_TITLES = [
  '프로필 사진', '기본 정보', '생활 습관', '외모 · 연애 성향', '취향 · 자기소개', '이상형 (선택)',
];

// ===== 도우미 함수 =====
const toNum = (v) => (v === '' || v == null ? null : Number(v));
const isMaleGender = (g) => g === 'MALE' || g === 'M';
const isFemaleGender = (g) => g === 'FEMALE' || g === 'F';
const genderLabel = (g) => (isMaleGender(g) ? '남성' : isFemaleGender(g) ? '여성' : g ?? '-');
const joinList = (arr) => (arr.length ? arr.join(', ') : null);   // ['등산','독서'] → '등산, 독서'
// ✅ 숫자만 남기고 최대 3자리 (글자 입력칸용)
const onlyDigits = (v) => String(v).replace(/[^0-9]/g, '').slice(0, 3);
// 범위 밖 숫자를 min~max 안으로 맞춤 (빈칸은 그대로)
const clamp = (v, min, max) => {
  if (v === '' || v == null) return '';
  const n = Number(v);
  if (Number.isNaN(n)) return '';
  return String(Math.min(Math.max(n, min), max));
};

// ===== 칩 선택 (하나 또는 여러 개) =====
function Chips({ options, value, onSelect }) {
  const isActive = (opt) => (Array.isArray(value) ? value.includes(opt) : value === opt);
  return (
    <div className={styles.chips}>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`${styles.chip} ${isActive(opt) ? styles.chipActive : ''}`}
          onClick={() => onSelect(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ===== 카드 선택 (병역용: 아이콘 + 이름 + 설명) =====
function OptionCards({ options, value, onSelect }) {
  return (
    <div className={styles.optionGrid}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`${styles.optionCard} ${value === opt.value ? styles.optionCardActive : ''}`}
          onClick={() => onSelect(opt.value)}
        >
          <span className={styles.optionIcon}>{opt.icon}</span>
          <span className={styles.optionTitle}>{opt.value}</span>
          <span className={styles.optionDesc}>{opt.desc}</span>
        </button>
      ))}
    </div>
  );
}

// ===== 입력 칸 묶음 (제목 + 안내 + 입력) =====
function Field({ label, hint, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      {hint && <p className={styles.hint}>{hint}</p>}
      {children}
    </div>
  );
}

// ✅ 숫자 글자 입력칸 (숫자만, 3자리, 칸을 벗어나면 범위 안으로 보정)
function NumberText({ value, onChange, min, max, placeholder }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      maxLength={3}
      className={styles.input}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(onlyDigits(e.target.value))}
      onBlur={(e) => onChange(clamp(e.target.value, min, max))}
    />
  );
}

function Onboarding() {
  const navigate = useNavigate();
  const { id: loginId, token } = useAuthStore();

  const [step, setStep] = useState(1);
  const [basic, setBasic] = useState(null);       // MEMBER: 닉네임, 성별, 나이
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ===== 프로필 사진 1장 =====
  const [photo, setPhoto] = useState(null);       // 실제 파일
  const [preview, setPreview] = useState(null);   // 미리보기 주소
  const fileInputRef = useRef(null);              // 숨겨진 파일 선택창
  const previewRef = useRef(null);                // 화면을 떠날 때 정리용
  previewRef.current = preview;

  // 나의 정보 (MEMBER_PROFILE)
  const [profile, setProfile] = useState({
    mbti: '', job: '', height: '', weight: '',
    militaryStatus: '',                              // 남성만
    drinking: '', smoking: '', religion: '', foodPreference: [],
    faceType: '', skinType: '', loveType: '',
    hobby: [], favorite: [], dislike: [], introduction: '',
  });

  // 이상형 (IDEAL_TYPE, 선택)
  const [ideal, setIdeal] = useState({
    ageMin: '', ageMax: '', minHeight: '', maxHeight: '',
    bodyType: [], mbtiPref: [], smokingPref: '', drinkingPref: '',
    militaryPref: [],                                // 여성만
    memo: '',
  });

  const isMale = isMaleGender(basic?.gender);
  const isFemale = isFemaleGender(basic?.gender);

  // ===== 처음 들어왔을 때: 로그인 확인 → 이미 했으면 메인 → 기본 정보 불러오기 =====
  useEffect(() => {
    if (!token || !loginId) {
      navigate('/login', { replace: true });
      return;
    }
    let cancelled = false;

    Client.get('/api/profile/status', { params: { loginId } })
      .then((res) => {
        if (cancelled) return null;
        if (res.data.completed) {
          navigate('/', { replace: true });
          return null;
        }
        return Client.get('/api/profile/basic', { params: { loginId } });
      })
      .then((res) => {
        if (!cancelled && res) setBasic(res.data);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError('회원 정보를 불러오지 못했습니다.');
      });

    return () => { cancelled = true; };
  }, [token, loginId, navigate]);

  // 화면을 떠날 때 미리보기 주소 정리 (메모리 누수 방지)
  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  // ===== 사진 고르기 / 지우기 =====
  const openPicker = () => {
    fileInputRef.current.value = '';   // 같은 파일 다시 골라도 반응하게
    fileInputRef.current.click();
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 올릴 수 있어요.');
      return;
    }
    if (file.size > MAX_PHOTO_SIZE) {
      setError('사진은 10MB까지 올릴 수 있어요.');
      return;
    }
    setError('');
    if (preview) URL.revokeObjectURL(preview);   // 이전 미리보기 정리
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(null);
    setPreview(null);
  };

  // ===== 값 바꾸기 =====
  const setProfileValue = (key, value) =>
    setProfile((prev) => ({ ...prev, [key]: value }));

  const toggleProfileList = (key, value) =>
    setProfile((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));

  const setIdealValue = (key, value) =>
    setIdeal((prev) => ({ ...prev, [key]: value }));

  const toggleIdealList = (key, value) =>
    setIdeal((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((v) => v !== value)
        : [...prev[key], value],
    }));

  // 이상형 병역: '상관없음'을 고르면 나머지 해제, 다른 걸 고르면 '상관없음' 해제
  const toggleMilitaryPref = (value) =>
    setIdeal((prev) => {
      if (value === '상관없음') {
        return { ...prev, militaryPref: prev.militaryPref.includes('상관없음') ? [] : ['상관없음'] };
      }
      const rest = prev.militaryPref.filter((v) => v !== '상관없음');
      return {
        ...prev,
        militaryPref: rest.includes(value) ? rest.filter((v) => v !== value) : [...rest, value],
      };
    });

  // ===== 단계별 검사 (문제 있으면 메시지, 없으면 '') =====
  const validateStep = (s) => {
    if (s === 1) {
      if (!photo) return '프로필 사진을 올려 주세요.';
    }
    if (s === 2) {
      if (!profile.mbti) return 'MBTI를 선택해 주세요.';
      if (!profile.job) return '직업을 선택해 주세요.';
      const h = toNum(profile.height);
      const w = toNum(profile.weight);
      if (h === null || h < HEIGHT_MIN || h > HEIGHT_MAX) {
        return `키를 ${HEIGHT_MIN}~${HEIGHT_MAX}cm 사이로 입력해 주세요.`;
      }
      if (w === null || w < WEIGHT_MIN || w > WEIGHT_MAX) {
        return `몸무게를 ${WEIGHT_MIN}~${WEIGHT_MAX}kg 사이로 입력해 주세요.`;
      }
      if (isMale && !profile.militaryStatus) return '병역 사항을 선택해 주세요.';
    }
    if (s === 3) {
      if (!profile.drinking) return '음주 여부를 선택해 주세요.';
      if (!profile.smoking) return '흡연 여부를 선택해 주세요.';
      if (!profile.religion) return '종교를 선택해 주세요.';
      if (profile.foodPreference.length === 0) return '음식 취향을 하나 이상 선택해 주세요.';
    }
    if (s === 4) {
      if (!profile.faceType) return '얼굴상을 선택해 주세요.';
      if (!profile.skinType) return '피부 타입을 선택해 주세요.';
      if (!profile.loveType) return '연애 스타일을 선택해 주세요.';
    }
    if (s === 5) {
      if (profile.hobby.length === 0) return '취미를 하나 이상 선택해 주세요.';
      if (profile.favorite.length === 0) return '좋아하는 것을 하나 이상 선택해 주세요.';
      if (profile.dislike.length === 0) return '싫어하는 것을 하나 이상 선택해 주세요.';
      if (!profile.introduction.trim()) return '자기소개를 입력해 주세요.';
    }
    if (s === 6) {
      // 이상형은 선택이라 "입력한 값만" 검사해요
      const aMin = toNum(ideal.ageMin);
      const aMax = toNum(ideal.ageMax);
      const hMin = toNum(ideal.minHeight);
      const hMax = toNum(ideal.maxHeight);

      const ageOut = (a) => a !== null && (a < IDEAL_AGE_MIN || a > IDEAL_AGE_MAX);
      const heightOut = (h) => h !== null && (h < HEIGHT_MIN || h > HEIGHT_MAX);

      if (ageOut(aMin) || ageOut(aMax)) {
        return `이상형 나이는 ${IDEAL_AGE_MIN}~${IDEAL_AGE_MAX}세 사이로 입력해 주세요.`;
      }
      if (heightOut(hMin) || heightOut(hMax)) {
        return `이상형 키는 ${HEIGHT_MIN}~${HEIGHT_MAX}cm 사이로 입력해 주세요.`;
      }
      if (aMin !== null && aMax !== null && aMin > aMax) return '이상형 나이의 최소값이 최대값보다 클 수 없어요.';
      if (hMin !== null && hMax !== null && hMin > hMax) return '이상형 키의 최소값이 최대값보다 클 수 없어요.';
    }
    return '';
  };

  const handleNext = () => {
    const msg = validateStep(step);
    if (msg) { setError(msg); return; }
    setError('');
    setStep((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrev = () => {
    setError('');
    setStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ===== 저장: ① 프로필 사진 1장 → ② 프로필 + 이상형 =====
  const submit = async (skipIdeal) => {
    if (!skipIdeal) {
      const msg = validateStep(6);
      if (msg) { setError(msg); return; }
    }
    if (!photo) {
      setError('프로필 사진을 올려 주세요.');
      setStep(1);
      return;
    }

    const payload = {
      loginId,
      profile: {
        mbti: profile.mbti,
        job: profile.job,
        height: toNum(profile.height),
        weight: toNum(profile.weight),
        introduction: profile.introduction.trim(),
        loveType: profile.loveType,
        hobby: joinList(profile.hobby),
        favorite: joinList(profile.favorite),
        dislike: joinList(profile.dislike),
        drinking: profile.drinking,
        smoking: profile.smoking,
        religion: profile.religion,
        foodPreference: joinList(profile.foodPreference),
        faceType: profile.faceType,
        skinType: profile.skinType,
        militaryStatus: isMale ? profile.militaryStatus : null,
      },
      ideal: skipIdeal ? null : {
        ageMin: toNum(ideal.ageMin),
        ageMax: toNum(ideal.ageMax),
        minHeight: toNum(ideal.minHeight),
        maxHeight: toNum(ideal.maxHeight),
        bodyType: joinList(ideal.bodyType),
        mbtiPref: joinList(ideal.mbtiPref),
        smokingPref: ideal.smokingPref || null,
        drinkingPref: ideal.drinkingPref || null,
        militaryPref: isFemale ? joinList(ideal.militaryPref) : null,
        memo: ideal.memo.trim() || null,
      },
    };

    setSubmitting(true);
    setError('');

    try {
      // ① 프로필 사진 1장 업로드
      const formData = new FormData();
      formData.append('loginId', loginId);
      formData.append('files', photo);
      await Client.post('/api/profile/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // ② 프로필 + 이상형 저장
      await Client.post('/api/profile', payload);

      navigate('/', { replace: true });
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        alert('이미 온보딩을 완료했어요.');
        navigate('/', { replace: true });
      } else if (status === 401) {
        alert('로그인이 필요합니다.');
        navigate('/login', { replace: true });
      } else if (status === 413) {
        setError('사진 용량이 너무 커요. 더 작은 사진으로 바꿔 주세요.');
        setStep(1);
      } else if (status === 400) {
        setError('입력하지 않은 항목이 있어요. 다시 확인해 주세요.');
      } else {
        console.error(err);
        setError('저장에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipIdeal = () => {
    if (window.confirm('이상형을 건너뛰면 매칭 확률이 낮아질 수 있어요. 건너뛸까요?')) {
      submit(true);
    }
  };

  // ===== 화면 =====
  if (!basic) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <p className={styles.notice}>{error || '불러오는 중...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* 진행 상황 */}
        <div className={styles.header}>
          <p className={styles.stepLabel}>{step} / {TOTAL_STEPS} · {STEP_TITLES[step - 1]}</p>
          <div className={styles.progress}>
            <div className={styles.progressBar} style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
          </div>
        </div>

        {/* ===== 1단계: 프로필 사진 1장 (필수) ===== */}
        {step === 1 && (
          <Field
            label="프로필 사진 (필수)"
            hint="매칭 화면에 보이는 사진이에요. 얼굴이 잘 보이는 사진 1장을 올려 주세요."
          >
            <div className={styles.photoGrid}>
              <div className={styles.photoSlot} onClick={openPicker}>
                {preview ? (
                  <>
                    <img src={preview} alt="프로필 사진" className={styles.photoImg} />
                    <button
                      type="button"
                      className={styles.photoRemove}
                      onClick={(e) => { e.stopPropagation(); removePhoto(); }}
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <span className={styles.photoPlus}>＋</span>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handlePhotoChange}
            />
            <p className={styles.counter}>{photo ? '사진 선택 완료 ✓' : '사진을 눌러서 올려 주세요'}</p>
          </Field>
        )}

        {/* ===== 2단계: 기본 정보 ===== */}
        {step === 2 && (
          <>
            <div className={styles.infoBox}>
              <div className={styles.infoItem}><span>닉네임</span><strong>{basic.nickname}</strong></div>
              <div className={styles.infoItem}><span>성별</span><strong>{genderLabel(basic.gender)}</strong></div>
              <div className={styles.infoItem}><span>나이</span><strong>만 {basic.age}세</strong></div>
            </div>

            <Field label="MBTI">
              <Chips options={MBTI_LIST} value={profile.mbti} onSelect={(v) => setProfileValue('mbti', v)} />
            </Field>

            <Field label="직업">
              <Chips options={JOB_LIST} value={profile.job} onSelect={(v) => setProfileValue('job', v)} />
            </Field>

            {/* ✅ 키 · 몸무게: 글자 입력 (숫자만) */}
            <div className={styles.row}>
              <Field label={`키 (cm, ${HEIGHT_MIN}~${HEIGHT_MAX})`}>
                <NumberText value={profile.height} min={HEIGHT_MIN} max={HEIGHT_MAX} placeholder="예: 175"
                  onChange={(v) => setProfileValue('height', v)} />
              </Field>
              <Field label={`몸무게 (kg, ${WEIGHT_MIN}~${WEIGHT_MAX})`}>
                <NumberText value={profile.weight} min={WEIGHT_MIN} max={WEIGHT_MAX} placeholder="예: 68"
                  onChange={(v) => setProfileValue('weight', v)} />
              </Field>
            </div>

            {/* 남성만: 병역 */}
            {isMale && (
              <Field label="병역" hint="남성 회원에게만 표시돼요. 프로필에 공개됩니다.">
                <OptionCards options={MILITARY_LIST} value={profile.militaryStatus}
                  onSelect={(v) => setProfileValue('militaryStatus', v)} />
              </Field>
            )}
          </>
        )}

        {/* ===== 3단계: 생활 습관 ===== */}
        {step === 3 && (
          <>
            <Field label="음주">
              <Chips options={DRINKING_LIST} value={profile.drinking} onSelect={(v) => setProfileValue('drinking', v)} />
            </Field>
            <Field label="흡연">
              <Chips options={SMOKING_LIST} value={profile.smoking} onSelect={(v) => setProfileValue('smoking', v)} />
            </Field>
            <Field label="종교">
              <Chips options={RELIGION_LIST} value={profile.religion} onSelect={(v) => setProfileValue('religion', v)} />
            </Field>
            <Field label="음식 취향" hint="여러 개 선택할 수 있어요.">
              <Chips options={FOOD_LIST} value={profile.foodPreference} onSelect={(v) => toggleProfileList('foodPreference', v)} />
            </Field>
          </>
        )}

        {/* ===== 4단계: 외모 · 연애 성향 ===== */}
        {step === 4 && (
          <>
            <Field label="얼굴상">
              <Chips options={FACE_TYPE_LIST} value={profile.faceType} onSelect={(v) => setProfileValue('faceType', v)} />
            </Field>
            <Field label="피부 타입">
              <Chips options={SKIN_TYPE_LIST} value={profile.skinType} onSelect={(v) => setProfileValue('skinType', v)} />
            </Field>
            <Field label="연애 스타일">
              <Chips options={LOVE_TYPE_LIST} value={profile.loveType} onSelect={(v) => setProfileValue('loveType', v)} />
            </Field>
          </>
        )}

        {/* ===== 5단계: 취향 · 자기소개 ===== */}
        {step === 5 && (
          <>
            <Field label="취미" hint="여러 개 선택할 수 있어요.">
              <Chips options={HOBBY_LIST} value={profile.hobby} onSelect={(v) => toggleProfileList('hobby', v)} />
            </Field>
            <Field label="좋아하는 것" hint="여러 개 선택할 수 있어요.">
              <Chips options={FAVORITE_LIST} value={profile.favorite} onSelect={(v) => toggleProfileList('favorite', v)} />
            </Field>
            <Field label="싫어하는 것" hint="여러 개 선택할 수 있어요.">
              <Chips options={DISLIKE_LIST} value={profile.dislike} onSelect={(v) => toggleProfileList('dislike', v)} />
            </Field>
            <Field label="자기소개">
              <textarea className={styles.textarea} maxLength={MAX_INTRO} rows={5}
                placeholder="나를 소개하는 글을 적어 주세요."
                value={profile.introduction} onChange={(e) => setProfileValue('introduction', e.target.value)} />
              <p className={styles.counter}>{profile.introduction.length} / {MAX_INTRO}</p>
            </Field>
          </>
        )}

        {/* ===== 6단계: 이상형 (선택) ===== */}
        {step === 6 && (
          <>
            <p className={styles.notice}>
              이상형은 선택 사항이에요. 입력하지 않으면 매칭 확률이 낮아질 수 있어요.
            </p>

            {/* ✅ 나이: 글자 입력 (숫자만, 14~100으로 자동 보정) */}
            <div className={styles.row}>
              <Field label={`나이 (최소, ${IDEAL_AGE_MIN}세 이상)`}>
                <NumberText value={ideal.ageMin} min={IDEAL_AGE_MIN} max={IDEAL_AGE_MAX} placeholder="예: 25"
                  onChange={(v) => setIdealValue('ageMin', v)} />
              </Field>
              <Field label={`나이 (최대, ${IDEAL_AGE_MAX}세 이하)`}>
                <NumberText value={ideal.ageMax} min={IDEAL_AGE_MIN} max={IDEAL_AGE_MAX} placeholder="예: 32"
                  onChange={(v) => setIdealValue('ageMax', v)} />
              </Field>
            </div>

            {/* ✅ 키: 글자 입력 (숫자만, 100~250으로 자동 보정) */}
            <div className={styles.row}>
              <Field label="키 (최소 cm)">
                <NumberText value={ideal.minHeight} min={HEIGHT_MIN} max={HEIGHT_MAX} placeholder="예: 160"
                  onChange={(v) => setIdealValue('minHeight', v)} />
              </Field>
              <Field label="키 (최대 cm)">
                <NumberText value={ideal.maxHeight} min={HEIGHT_MIN} max={HEIGHT_MAX} placeholder="예: 185"
                  onChange={(v) => setIdealValue('maxHeight', v)} />
              </Field>
            </div>

            <Field label="체형" hint="여러 개 선택할 수 있어요.">
              <Chips options={BODY_TYPE_LIST} value={ideal.bodyType} onSelect={(v) => toggleIdealList('bodyType', v)} />
            </Field>
            <Field label="MBTI" hint="여러 개 선택할 수 있어요.">
              <Chips options={MBTI_LIST} value={ideal.mbtiPref} onSelect={(v) => toggleIdealList('mbtiPref', v)} />
            </Field>
            <Field label="흡연">
              <Chips options={SMOKING_PREF_LIST} value={ideal.smokingPref} onSelect={(v) => setIdealValue('smokingPref', v)} />
            </Field>
            <Field label="음주">
              <Chips options={DRINKING_PREF_LIST} value={ideal.drinkingPref} onSelect={(v) => setIdealValue('drinkingPref', v)} />
            </Field>

            {/* 여성만: 이상형 병역 */}
            {isFemale && (
              <Field label="병역" hint="여러 개 선택할 수 있어요. '상관없음'은 단독으로 선택돼요.">
                <Chips options={MILITARY_PREF_LIST} value={ideal.militaryPref} onSelect={toggleMilitaryPref} />
              </Field>
            )}

            <Field label="하고 싶은 말">
              <textarea className={styles.textarea} maxLength={MAX_MEMO} rows={3}
                placeholder="이상형에 대해 자유롭게 적어 주세요."
                value={ideal.memo} onChange={(e) => setIdealValue('memo', e.target.value)} />
              <p className={styles.counter}>{ideal.memo.length} / {MAX_MEMO}</p>
            </Field>
          </>
        )}

        {/* 에러 메시지 */}
        {error && <p className={styles.error}>⚠️ {error}</p>}

        {/* 버튼 */}
        <div className={styles.buttons}>
          {step > 1 && (
            <button type="button" className={styles.prevBtn} onClick={handlePrev} disabled={submitting}>
              이전
            </button>
          )}

          {step < TOTAL_STEPS && (
            <button type="button" className={styles.nextBtn} onClick={handleNext}>
              다음
            </button>
          )}

          {step === TOTAL_STEPS && (
            <>
              <button type="button" className={styles.skipBtn} onClick={handleSkipIdeal} disabled={submitting}>
                건너뛰기
              </button>
              <button type="button" className={styles.nextBtn} onClick={() => submit(false)} disabled={submitting}>
                {submitting ? '저장 중...' : '시작하기'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Onboarding;