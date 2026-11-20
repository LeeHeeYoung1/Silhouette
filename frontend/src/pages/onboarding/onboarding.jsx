import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './onboarding.module.css';
import useAuthStore from '../../stores/useAuthStore';
import Client from '../../api/client';
import {
    MBTI_LIST, JOB_LIST, DRINKING_LIST, SMOKING_LIST, RELIGION_LIST,
    FACE_TYPE_LIST, SKIN_TYPE_LIST, LOVE_TYPE_LIST, HOBBY_LIST, FAVORITE_LIST,
    DISLIKE_LIST, FOOD_LIST, BODY_TYPE_LIST, SMOKING_PREF_LIST, DRINKING_PREF_LIST,
} from './onboardingOptions';

/* =========================================================
   실루엣 온보딩 (Onboarding) - 담당: 권형석
   - 경로: /onboarding
   - 나의 정보(MEMBER_PROFILE, 필수) + 이상형(IDEAL_TYPE, 선택)
   ========================================================= */

const STEPS = ['기본 정보', '나는 이런 사람', '나의 취향', '이상형', '자기소개'];

// 글자 수 제한 (한글은 1글자 = 약 3바이트라 DB 칸 길이보다 넉넉히 작게)
const MAX_INTRO = 300;   // MEMBER_PROFILE.INTRODUCTION
const MAX_MEMO = 150;    // IDEAL_TYPE.MEMO (VARCHAR2 500바이트)

/* ---------- 칩 선택 (하나 / 여러 개 공용) ---------- */
function ChipGroup({ options, value, onChange, multiple = false, max }) {
    const isSelected = (opt) => (multiple ? value.includes(opt) : value === opt);

    const handleClick = (opt) => {
        if (!multiple) {
            onChange(value === opt ? '' : opt);   // 다시 누르면 선택 해제
            return;
        }
        if (value.includes(opt)) {
            onChange(value.filter((v) => v !== opt));   // 빼기
        } else if (!max || value.length < max) {
            onChange([...value, opt]);                  // 넣기
        } else {
            alert(`최대 ${max}개까지 선택할 수 있습니다.`);
        }
    };

    return (
        <div className={styles.chips}>
            {options.map((opt) => (
                <button
                    key={opt}
                    type="button"
                    className={`${styles.chip} ${isSelected(opt) ? styles.chipActive : ''}`}
                    onClick={() => handleClick(opt)}
                >
                    {opt}
                </button>
            ))}
        </div>
    );
}

/* ---------- 입력 칸 묶음 (제목 + 내용) ---------- */
function Field({ label, hint, children }) {
    return (
        <div className={styles.field}>
            <label className={styles.label}>
                {label}
                {hint && <span className={styles.hint}>{hint}</span>}
            </label>
            {children}
        </div>
    );
}

/* ---------- 이상형 빈 값 (처음 값, 건너뛰기에 같이 씀) ---------- */
const EMPTY_IDEAL = {
    ageMin: '', ageMax: '', minHeight: '', maxHeight: '',
    bodyType: [], mbtiPref: [], smokingPref: '', drinkingPref: '', memo: '',
};

// 입력칸 값 → 숫자 (빈칸이면 null)
const toNum = (v) => (v === '' || v == null ? null : Number(v));

// 성별 표시 (DB 값이 M/F면 한글로, 그 외는 그대로)
const genderLabel = (g) => (g === 'M' ? '남성' : g === 'F' ? '여성' : g || '');

function Onboarding() {
    const navigate = useNavigate();
    const { id: loginId, token } = useAuthStore();

    const [step, setStep] = useState(0);                 // 지금 단계 (0부터)
    const [submitting, setSubmitting] = useState(false); // 저장 중 중복 클릭 방지

    // 회원 기본 정보 (MEMBER, 표시만)
    const [basic, setBasic] = useState({ nickname: '', gender: '', age: null });

    // 나의 정보 (MEMBER_PROFILE, 전부 필수)
    const [profile, setProfile] = useState({
        height: '', weight: '', mbti: '', job: '',
        loveType: [], drinking: '', smoking: '', religion: '', faceType: '', skinType: '',
        hobby: [], favorite: [], dislike: [], foodPreference: [],
        introduction: '',
    });

    // 이상형 (IDEAL_TYPE, 전부 선택)
    const [ideal, setIdeal] = useState(EMPTY_IDEAL);

    // 칸 하나만 바꾸기
    const setP = (key, value) => setProfile((prev) => ({ ...prev, [key]: value }));
    const setI = (key, value) => setIdeal((prev) => ({ ...prev, [key]: value }));

    const isFirst = step === 0;
    const isLast = step === STEPS.length - 1;

    /* ---------- 들어올 때: 로그인 확인 → 이미 했으면 메인 → 아니면 기본 정보 ---------- */
    useEffect(() => {
        if (!token || !loginId) {
            navigate('/login', { replace: true });
            return;
        }

        let cancelled = false;   // 화면을 떠난 뒤 늦게 온 응답 무시

        Client.get('/api/profile/status', { params: { loginId } })
            .then((res) => {
                if (cancelled) return;
                if (res.data.completed) {
                    navigate('/', { replace: true });   // 이미 온보딩 완료
                    return;
                }
                return Client.get('/api/profile/basic', { params: { loginId } })
                    .then((r) => {
                        if (cancelled) return;
                        setBasic({
                            nickname: r.data.nickname,
                            gender: genderLabel(r.data.gender),
                            age: r.data.age,
                        });
                    });
            })
            .catch((err) => console.error(err));

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, loginId]);

    /* ---------- 단계별 확인 (통과면 null, 막히면 안내 문구) ---------- */
    const validateStep = () => {
        const p = profile;
        if (step === 0) {
            const h = Number(p.height);
            const w = Number(p.weight);
            if (!h || h < 100 || h > 250) return '키를 100~250cm 사이로 입력해 주세요.';
            if (!w || w < 30 || w > 200) return '몸무게를 30~200kg 사이로 입력해 주세요.';
            if (!p.mbti) return 'MBTI를 선택해 주세요.';
            if (!p.job) return '직업을 선택해 주세요.';
        }
        if (step === 1) {
            if (p.loveType.length === 0) return '연애 스타일을 하나 이상 선택해 주세요.';
            if (!p.drinking) return '음주 여부를 선택해 주세요.';
            if (!p.smoking) return '흡연 여부를 선택해 주세요.';
            if (!p.religion) return '종교를 선택해 주세요.';
            if (!p.faceType) return '얼굴상을 선택해 주세요.';
            if (!p.skinType) return '피부 톤을 선택해 주세요.';
        }
        if (step === 2) {
            if (p.hobby.length === 0) return '취미를 하나 이상 선택해 주세요.';
            if (p.favorite.length === 0) return '좋아하는 것을 하나 이상 선택해 주세요.';
            if (p.dislike.length === 0) return '싫어하는 것을 하나 이상 선택해 주세요.';
            if (p.foodPreference.length === 0) return '음식 취향을 하나 이상 선택해 주세요.';
        }
        if (step === 3) {
            const { ageMin, ageMax, minHeight, maxHeight } = ideal;
            if (ageMin && ageMax && Number(ageMin) > Number(ageMax)) return '이상형 나이 범위를 확인해 주세요.';
            if (minHeight && maxHeight && Number(minHeight) > Number(maxHeight)) return '이상형 키 범위를 확인해 주세요.';
        }
        if (step === 4) {
            if (!p.introduction.trim()) return '자기소개를 입력해 주세요.';
        }
        return null;
    };

    const handleNext = () => {
        const error = validateStep();
        if (error) {
            alert(error);
            return;
        }
        if (isLast) {
            handleSubmit();
        } else {
            setStep(step + 1);
        }
    };

    const handlePrev = () => {
        if (!isFirst) setStep(step - 1);
    };

    // 이상형 건너뛰기
    const handleSkipIdeal = () => {
        if (!window.confirm('이상형을 입력하지 않으면 매칭 확률이 낮아질 수 있어요.\n나중에 프로필에서 입력할 수 있습니다. 건너뛸까요?')) return;
        setIdeal(EMPTY_IDEAL);
        setStep(step + 1);
    };

    /* ---------- 저장: 서버로 전송 ---------- */
    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);

        const payload = {
            loginId,
            profile: {
                ...profile,
                height: toNum(profile.height),
                weight: toNum(profile.weight),
                loveType: profile.loveType.join(','),
                hobby: profile.hobby.join(','),
                favorite: profile.favorite.join(','),
                dislike: profile.dislike.join(','),
                foodPreference: profile.foodPreference.join(','),
                introduction: profile.introduction.trim(),
            },
            ideal: {
                ...ideal,
                ageMin: toNum(ideal.ageMin),
                ageMax: toNum(ideal.ageMax),
                minHeight: toNum(ideal.minHeight),
                maxHeight: toNum(ideal.maxHeight),
                bodyType: ideal.bodyType.join(','),
                mbtiPref: ideal.mbtiPref.join(','),
                memo: ideal.memo.trim(),
            },
        };

        try {
            await Client.post('/api/profile', payload);
            alert('프로필이 등록되었습니다. 실루엣에 오신 걸 환영해요!');
            navigate('/', { replace: true });
        } catch (err) {
            console.error(err);
            const status = err.response?.status;
            if (status === 409) {
                navigate('/', { replace: true });            // 이미 등록됨
            } else if (status === 401) {
                alert('로그인 정보가 없습니다. 다시 로그인해 주세요.');
                navigate('/login', { replace: true });
            } else if (status === 400) {
                alert('입력하지 않은 항목이 있어요. 다시 확인해 주세요.');
            } else {
                alert('프로필 등록에 실패했습니다.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                {/* 진행 표시 */}
                <div className={styles.progress}>
                    <span className={styles.stepCount}>{step + 1} / {STEPS.length}</span>
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
                    </div>
                </div>

                <h2 className={styles.title}>{STEPS[step]}</h2>

                <div className={styles.body}>
                    {/* ===== 1. 기본 정보 ===== */}
                    {step === 0 && (
                        <>
                            <div className={styles.infoBox}>
                                <span>{basic.nickname || '닉네임'}</span>
                                <span>·</span>
                                <span>{basic.gender || '성별'}</span>
                                <span>·</span>
                                <span>{basic.age != null ? `만 ${basic.age}세` : '나이'}</span>
                                <span className={styles.hint}>회원가입 정보는 수정할 수 없어요</span>
                            </div>

                            <div className={styles.row}>
                                <Field label="키" hint="cm">
                                    <input type="number" className={styles.input} value={profile.height}
                                        onChange={(e) => setP('height', e.target.value)} placeholder="175" />
                                </Field>
                                <Field label="몸무게" hint="kg">
                                    <input type="number" className={styles.input} value={profile.weight}
                                        onChange={(e) => setP('weight', e.target.value)} placeholder="65" />
                                </Field>
                            </div>
                            <Field label="MBTI">
                                <ChipGroup options={MBTI_LIST} value={profile.mbti} onChange={(v) => setP('mbti', v)} />
                            </Field>
                            <Field label="직업">
                                <ChipGroup options={JOB_LIST} value={profile.job} onChange={(v) => setP('job', v)} />
                            </Field>
                        </>
                    )}

                    {/* ===== 2. 나는 이런 사람 ===== */}
                    {step === 1 && (
                        <>
                            <Field label="나의 연애 스타일" hint="최대 3개">
                                <ChipGroup options={LOVE_TYPE_LIST} value={profile.loveType} multiple max={3}
                                    onChange={(v) => setP('loveType', v)} />
                            </Field>
                            <Field label="음주">
                                <ChipGroup options={DRINKING_LIST} value={profile.drinking} onChange={(v) => setP('drinking', v)} />
                            </Field>
                            <Field label="흡연">
                                <ChipGroup options={SMOKING_LIST} value={profile.smoking} onChange={(v) => setP('smoking', v)} />
                            </Field>
                            <Field label="종교">
                                <ChipGroup options={RELIGION_LIST} value={profile.religion} onChange={(v) => setP('religion', v)} />
                            </Field>
                            <Field label="얼굴상">
                                <ChipGroup options={FACE_TYPE_LIST} value={profile.faceType} onChange={(v) => setP('faceType', v)} />
                            </Field>
                            <Field label="피부 톤">
                                <ChipGroup options={SKIN_TYPE_LIST} value={profile.skinType} onChange={(v) => setP('skinType', v)} />
                            </Field>
                        </>
                    )}

                    {/* ===== 3. 나의 취향 ===== */}
                    {step === 2 && (
                        <>
                            <Field label="취미" hint="최대 5개">
                                <ChipGroup options={HOBBY_LIST} value={profile.hobby} multiple max={5}
                                    onChange={(v) => setP('hobby', v)} />
                            </Field>
                            <Field label="좋아하는 것" hint="최대 5개">
                                <ChipGroup options={FAVORITE_LIST} value={profile.favorite} multiple max={5}
                                    onChange={(v) => setP('favorite', v)} />
                            </Field>
                            <Field label="싫어하는 것" hint="최대 5개">
                                <ChipGroup options={DISLIKE_LIST} value={profile.dislike} multiple max={5}
                                    onChange={(v) => setP('dislike', v)} />
                            </Field>
                            <Field label="음식 취향" hint="최대 5개">
                                <ChipGroup options={FOOD_LIST} value={profile.foodPreference} multiple max={5}
                                    onChange={(v) => setP('foodPreference', v)} />
                            </Field>
                        </>
                    )}

                    {/* ===== 4. 이상형 (선택) ===== */}
                    {step === 3 && (
                        <>
                            <p className={styles.notice}>
                                이상형은 선택 사항이에요. 입력하면 더 잘 맞는 상대를 추천받을 수 있어요.
                            </p>
                            <div className={styles.row}>
                                <Field label="나이" hint="세">
                                    <div className={styles.range}>
                                        <input type="number" className={styles.input} value={ideal.ageMin}
                                            onChange={(e) => setI('ageMin', e.target.value)} placeholder="25" />
                                        <span>~</span>
                                        <input type="number" className={styles.input} value={ideal.ageMax}
                                            onChange={(e) => setI('ageMax', e.target.value)} placeholder="32" />
                                    </div>
                                </Field>
                                <Field label="키" hint="cm">
                                    <div className={styles.range}>
                                        <input type="number" className={styles.input} value={ideal.minHeight}
                                            onChange={(e) => setI('minHeight', e.target.value)} placeholder="160" />
                                        <span>~</span>
                                        <input type="number" className={styles.input} value={ideal.maxHeight}
                                            onChange={(e) => setI('maxHeight', e.target.value)} placeholder="180" />
                                    </div>
                                </Field>
                            </div>
                            <Field label="체형">
                                <ChipGroup options={BODY_TYPE_LIST} value={ideal.bodyType} multiple
                                    onChange={(v) => setI('bodyType', v)} />
                            </Field>
                            <Field label="MBTI" hint="여러 개 선택">
                                <ChipGroup options={MBTI_LIST} value={ideal.mbtiPref} multiple
                                    onChange={(v) => setI('mbtiPref', v)} />
                            </Field>
                            <Field label="흡연">
                                <ChipGroup options={SMOKING_PREF_LIST} value={ideal.smokingPref} onChange={(v) => setI('smokingPref', v)} />
                            </Field>
                            <Field label="음주">
                                <ChipGroup options={DRINKING_PREF_LIST} value={ideal.drinkingPref} onChange={(v) => setI('drinkingPref', v)} />
                            </Field>
                            <Field label="이상형 한마디" hint={`${ideal.memo.length}/${MAX_MEMO}자 · 선택`}>
                                <textarea className={styles.textarea} value={ideal.memo} maxLength={MAX_MEMO}
                                    onChange={(e) => setI('memo', e.target.value)} placeholder="웃음이 많은 사람이 좋아요" />
                            </Field>
                            <button type="button" className={styles.skipBtn} onClick={handleSkipIdeal}>
                                이상형은 나중에 입력할게요
                            </button>
                        </>
                    )}

                    {/* ===== 5. 자기소개 ===== */}
                    {step === 4 && (
                        <Field label="자기소개" hint={`${profile.introduction.length}/${MAX_INTRO}자`}>
                            <textarea className={styles.textarea} value={profile.introduction} maxLength={MAX_INTRO}
                                onChange={(e) => setP('introduction', e.target.value)}
                                placeholder="나를 소개하는 한마디를 남겨주세요" />
                        </Field>
                    )}
                </div>

                {/* 이전 / 다음 */}
                <div className={styles.buttons}>
                    <button type="button" className={styles.prevBtn} onClick={handlePrev} disabled={isFirst || submitting}>
                        이전
                    </button>
                    <button type="button" className={styles.nextBtn} onClick={handleNext} disabled={submitting}>
                        {isLast ? (submitting ? '저장 중...' : '시작하기') : '다음'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Onboarding;