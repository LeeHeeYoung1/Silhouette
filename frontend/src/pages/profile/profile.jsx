import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';
import Client from '../../api/client';
import styles from './profile.module.css';
import ob from '../onboarding/onboarding.module.css';   // 수정 모드 칩·입력칸 (온보딩과 같은 모양)
import {
    MBTI_LIST, JOB_LIST, DRINKING_LIST, SMOKING_LIST, RELIGION_LIST,
    FACE_TYPE_LIST, SKIN_TYPE_LIST, LOVE_TYPE_LIST, HOBBY_LIST,
    FAVORITE_LIST, DISLIKE_LIST, FOOD_LIST, BODY_TYPE_LIST,
    SMOKING_PREF_LIST, DRINKING_PREF_LIST,
    MILITARY_LIST, MILITARY_PREF_LIST,
} from '../onboarding/onboardingOptions';

/* =========================================================
   실루엣 내 프로필 (Profile) - 담당: 권형석
   - 경로: /profile
   - 보기 모드: 증명사진(3:4) + 온보딩 내용 전부 + 이상형
   - 수정 모드: 온보딩과 같은 선택지로 수정 → PUT /api/profile
   - 사진 교체: PUT /api/profile/images/1 (사진은 1장)
   - 사진 표시: 토큰이 필요해서 Client(axios)로 받아서 보여줌
   - ✅ 내 체형 표시·수정, 만 18세 미만 남성 병역 '미필' 고정
   - ✅ 숫자 칸은 값을 몰래 고치지 않고 범위를 벗어나면 안내 (온보딩과 같은 규칙)
   ========================================================= */

// ===== 규칙 (온보딩 · 서버와 같음) =====
const MAX_INTRO = 300;
const MAX_MEMO = 150;
const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
const HEIGHT_MIN = 100;
const HEIGHT_MAX = 250;
const WEIGHT_MIN = 30;
const WEIGHT_MAX = 200;
const IDEAL_AGE_MIN = 14;   // ✅ [권형석] 이상형 나이: 만 14세 이상 (최대 제한 없음)
// ✅ [권형석] 병역: 만 18세 미만 남성은 '미필' 고정 (온보딩과 같은 규칙)
const MILITARY_MIN_AGE = 18;
const MILITARY_UNDERAGE_VALUE = '미필';
// ✅ [권형석] 내 체형 선택지 (이상형 체형 목록에서 '상관없음'만 제외)
const MY_BODY_TYPE_LIST = BODY_TYPE_LIST.filter((v) => v !== '상관없음');

// ===== 도우미 함수 =====
const toTags = (v) => (v ? String(v).split(',').map((s) => s.trim()).filter(Boolean) : []);  // "등산, 독서" → ['등산','독서']
const joinList = (arr) => (arr.length ? arr.join(', ') : null);                                // ['등산','독서'] → "등산, 독서"
const toNum = (v) => (v === '' || v == null ? null : Number(v));
const toStr = (v) => (v === null || v === undefined ? '' : String(v));
const isMaleGender = (g) => g === 'MALE' || g === 'M';
const isFemaleGender = (g) => g === 'FEMALE' || g === 'F';
const genderLabel = (g) => (isMaleGender(g) ? '남성' : isFemaleGender(g) ? '여성' : '-');
const prefText = (v) => (!v || String(v).toLowerCase() === 'none' ? '상관없어요' : v);
const show = (v, unit = '') => (v === null || v === undefined || v === '' ? '-' : `${v}${unit}`);
const isNone = (v) => String(v ?? '').toLowerCase() === 'none';
const smokingText = (v) => (isNone(v) ? '비흡연' : show(v));
const drinkingText = (v) => (isNone(v) ? '안 마셔요' : show(v));
// 숫자만 남기고 최대 3자리 (글자 입력칸용)
const onlyDigits = (v) => String(v).replace(/[^0-9]/g, '').slice(0, 3);
// ✅ [권형석] 만 18세 미만 남성인지
const isUnderageMaleOf = (basic) =>
    isMaleGender(basic?.gender) && basic?.age != null && Number(basic.age) < MILITARY_MIN_AGE;

const rangeText = (min, max, unit) => {
    if (min == null && max == null) return '상관없음';
    if (min != null && max != null) return `${min}${unit} ~ ${max}${unit}`;
    return min != null ? `${min}${unit} 이상` : `${max}${unit} 이하`;
};

// 대표 사진 주소 (sortOrder 가장 작은 것)
const getMainFileUrl = (images) => {
    if (!images || images.length === 0) return null;
    const sorted = [...images].sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
    return sorted[0]?.fileUrl ?? null;
};

// 서버 데이터 → 수정 폼 값 (콤마 문자열은 배열로, 숫자는 문자열로)
const toForm = (data) => {
    const p = data?.profile ?? {};
    const i = data?.ideal ?? {};
    return {
        profile: {
            mbti: toStr(p.mbti), job: toStr(p.job),
            height: toStr(p.height), weight: toStr(p.weight),
            // ✅ [권형석] 만 18세 미만 남성은 미필로 고정
            militaryStatus: isUnderageMaleOf(data?.basic) ? MILITARY_UNDERAGE_VALUE : toStr(p.militaryStatus),
            drinking: toStr(p.drinking), smoking: toStr(p.smoking), religion: toStr(p.religion),
            foodPreference: toTags(p.foodPreference),
            // ✅ [권형석] bodyType(내 체형) 추가
            faceType: toStr(p.faceType), skinType: toStr(p.skinType), bodyType: toStr(p.bodyType), loveType: toStr(p.loveType),
            hobby: toTags(p.hobby), favorite: toTags(p.favorite), dislike: toTags(p.dislike),
            introduction: toStr(p.introduction),
        },
        ideal: {
            ageMin: toStr(i.ageMin), ageMax: toStr(i.ageMax),
            minHeight: toStr(i.minHeight), maxHeight: toStr(i.maxHeight),
            bodyType: toTags(i.bodyType), mbtiPref: toTags(i.mbtiPref),
            smokingPref: toStr(i.smokingPref), drinkingPref: toStr(i.drinkingPref),
            militaryPref: toTags(i.militaryPref),
            memo: toStr(i.memo),
        },
    };
};

// ===== 보기 모드 조각 =====
function Section({ title, icon, children }) {
    return (
        <section className={styles.section}>
            <h3 className={styles.sectionTitle}><span>{icon}</span> {title}</h3>
            {children}
        </section>
    );
}

function InfoRow({ label, value }) {
    return (
        <div className={styles.infoRow}>
            <span className={styles.infoLabel}>{label}</span>
            <span className={styles.infoValue}>{value}</span>
        </div>
    );
}

function Tags({ value }) {
    const items = toTags(value);
    if (items.length === 0) return <span className={styles.empty}>-</span>;
    return (
        <div className={styles.tags}>
            {items.map((t) => <span key={t} className={styles.tag}>{t}</span>)}
        </div>
    );
}

function TagRow({ label, value }) {
    return (
        <div className={styles.tagRow}>
            <span className={styles.infoLabel}>{label}</span>
            <Tags value={value} />
        </div>
    );
}

// ===== 수정 모드 조각 (온보딩과 같은 모양) =====
function Chips({ options, value, onSelect }) {
    const isActive = (opt) => (Array.isArray(value) ? value.includes(opt) : value === opt);
    return (
        <div className={ob.chips}>
            {options.map((opt) => (
                <button key={opt} type="button"
                    className={`${ob.chip} ${isActive(opt) ? ob.chipActive : ''}`}
                    onClick={() => onSelect(opt)}>
                    {opt}
                </button>
            ))}
        </div>
    );
}

function OptionCards({ options, value, onSelect }) {
    return (
        <div className={ob.optionGrid}>
            {options.map((opt) => (
                <button key={opt.value} type="button"
                    className={`${ob.optionCard} ${value === opt.value ? ob.optionCardActive : ''}`}
                    onClick={() => onSelect(opt.value)}>
                    <span className={ob.optionIcon}>{opt.icon}</span>
                    <span className={ob.optionTitle}>{opt.value}</span>
                    <span className={ob.optionDesc}>{opt.desc}</span>
                </button>
            ))}
        </div>
    );
}

function Field({ label, hint, children }) {
    return (
        <div className={ob.field}>
            <label className={ob.label}>{label}</label>
            {hint && <p className={ob.hint}>{hint}</p>}
            {children}
        </div>
    );
}

// ✅ [권형석] 숫자 글자 입력칸 (온보딩과 같은 규칙: 값을 몰래 고치지 않고 범위를 벗어나면 안내)
//   - 최대값보다 크면: 입력하는 동안 바로 안내
//   - 최소값보다 작으면: 칸을 벗어났을 때 안내
//   - 범위 밖 값은 저장할 때 막힘 (validate)
function NumberText({ value, onChange, min, max, unit = '', placeholder }) {
    const [focused, setFocused] = useState(false);

    const n = value === '' || value == null ? null : Number(value);
    const overMax = n !== null && max != null && n > max;
    const underMin = n !== null && min != null && n < min;

    let warn = '';
    if (overMax) warn = `최대 ${max}${unit}까지만 입력할 수 있어요. (지금 ${n}${unit})`;
    else if (underMin && !focused) warn = `최소 ${min}${unit} 이상 입력해야 해요. (지금 ${n}${unit})`;

    return (
        <>
            <input
                type="text"
                inputMode="numeric"
                maxLength={3}
                className={ob.input}
                placeholder={placeholder}
                value={value}
                aria-invalid={warn ? 'true' : 'false'}
                style={warn ? { borderColor: '#f43f5e' } : undefined}
                onChange={(e) => onChange(onlyDigits(e.target.value))}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
            />
            {warn && <p className={ob.error}>⚠️ {warn}</p>}
        </>
    );
}

function Profile() {
    const navigate = useNavigate();
    const { id: loginId, token } = useAuthStore();

    const [data, setData] = useState(null);          // { basic, profile, ideal, images }
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    // 수정 모드
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState(null);           // { profile, ideal }
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    // 사진
    const [photoUrl, setPhotoUrl] = useState(null);   // 화면에 보여줄 사진 주소 (blob:...)
    const [photoVersion, setPhotoVersion] = useState(0);   // 사진 바꿀 때마다 +1 → 다시 받아오기
    const [imgFailed, setImgFailed] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    // 대표 사진 서버 주소 (/api/profile/image/21)
    const mainFileUrl = getMainFileUrl(data?.images);

    /* ===================== 불러오기 ===================== */
    const loadProfile = () =>
        Client.get('/api/profile/me', { params: { loginId } }).then((res) => {
            setData(res.data);
            return res.data;
        });

    useEffect(() => {
        if (!token || !loginId) {
            navigate('/login', { replace: true });
            return;
        }
        let cancelled = false;

        Client.get('/api/profile/me', { params: { loginId } })
            .then((res) => { if (!cancelled) setData(res.data); })
            .catch((err) => {
                if (cancelled) return;
                const status = err.response?.status;
                if (status === 401) navigate('/login', { replace: true });
                else if (status === 404) navigate('/onboarding', { replace: true });   // 온보딩 안 함
                else { console.error(err); setLoadError('프로필을 불러오지 못했습니다.'); }
            })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [token, loginId, navigate]);

    // 사진 불러오기
    //    - <img src>는 토큰을 못 보내서 401 → Client(토큰 포함)로 받아서 보여줌
    //    - 주소(mainFileUrl)나 버전(photoVersion)이 바뀌면 다시 받아옴
    //    - ?v=버전 → 같은 주소여도 브라우저 캐시 말고 새로 받음
    useEffect(() => {
        if (!mainFileUrl) {
            setPhotoUrl(null);
            return;
        }
        let cancelled = false;
        let objectUrl = null;

        Client.get(mainFileUrl, { responseType: 'blob', params: { v: photoVersion } })
            .then((res) => {
                if (cancelled) return;
                objectUrl = URL.createObjectURL(res.data);   // 받은 사진 → 화면용 임시 주소
                setPhotoUrl(objectUrl);
                setImgFailed(false);
            })
            .catch((err) => {
                if (cancelled) return;
                console.error(err);
                setImgFailed(true);
            });

        // 사진이 바뀌거나 화면을 떠나면 임시 주소 정리 (메모리 누수 방지)
        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [mainFileUrl, photoVersion]);

    /* ===================== 사진 교체 ===================== */
    const openPicker = () => {
        fileInputRef.current.value = '';
        fileInputRef.current.click();
    };

    const handlePhotoChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { alert('이미지 파일만 올릴 수 있어요.'); return; }
        if (file.size > MAX_PHOTO_SIZE) { alert('사진은 10MB까지 올릴 수 있어요.'); return; }

        // 고른 사진을 업로드 전에 바로 보여주기 (기다리는 동안 미리보기)
        const localPreview = URL.createObjectURL(file);
        setPhotoUrl(localPreview);
        setImgFailed(false);

        const formData = new FormData();
        formData.append('loginId', loginId);
        formData.append('file', file);

        setUploading(true);
        try {
            await Client.put('/api/profile/images/1', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            await loadProfile();                 // 새 사진 정보(번호·주소) 받기
            setPhotoVersion((v) => v + 1);       // 주소가 같아도 서버에서 새 사진 다시 받기
            alert('프로필 사진이 변경되었습니다.');
        } catch (err) {
            setPhotoVersion((v) => v + 1);       // 실패하면 원래 사진으로 되돌리기
            const status = err.response?.status;
            if (status === 401) { alert('로그인이 필요합니다.'); navigate('/login'); }
            else if (status === 413) alert('사진 용량이 너무 커요.');
            else { console.error(err); alert('사진 변경에 실패했습니다.'); }
        } finally {
            setUploading(false);
            // 미리보기 주소는 서버 사진이 다시 그려진 뒤 정리
            setTimeout(() => URL.revokeObjectURL(localPreview), 3000);
        }
    };

    /* ===================== 수정 모드 ===================== */
    const startEdit = () => {
        setForm(toForm(data));   // 만 18세 미만 남성은 toForm에서 미필로 고정됨
        setError('');
        setEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        if (!window.confirm('수정한 내용을 취소할까요?')) return;
        setEditing(false);
        setForm(null);
        setError('');
    };

    const setProfileValue = (key, value) =>
        setForm((prev) => ({ ...prev, profile: { ...prev.profile, [key]: value } }));

    const toggleProfileList = (key, value) =>
        setForm((prev) => {
            const list = prev.profile[key];
            return {
                ...prev,
                profile: { ...prev.profile, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] },
            };
        });

    const setIdealValue = (key, value) =>
        setForm((prev) => ({ ...prev, ideal: { ...prev.ideal, [key]: value } }));

    const toggleIdealList = (key, value) =>
        setForm((prev) => {
            const list = prev.ideal[key];
            return {
                ...prev,
                ideal: { ...prev.ideal, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] },
            };
        });

    // 이상형 병역: '상관없음'은 단독 선택
    const toggleMilitaryPref = (value) =>
        setForm((prev) => {
            const list = prev.ideal.militaryPref;
            let next;
            if (value === '상관없음') {
                next = list.includes('상관없음') ? [] : ['상관없음'];
            } else {
                const rest = list.filter((v) => v !== '상관없음');
                next = rest.includes(value) ? rest.filter((v) => v !== value) : [...rest, value];
            }
            return { ...prev, ideal: { ...prev.ideal, militaryPref: next } };
        });

    // 입력값 검사 (온보딩과 같은 규칙)
    const validate = (isMale, isUnderageMale) => {
        const p = form.profile;
        const i = form.ideal;
        if (!p.mbti) return 'MBTI를 선택해 주세요.';
        if (!p.job) return '직업을 선택해 주세요.';
        const h = toNum(p.height);
        const w = toNum(p.weight);
        if (h === null || h < HEIGHT_MIN || h > HEIGHT_MAX) return `키는 ${HEIGHT_MIN}~${HEIGHT_MAX}cm 사이로 입력해 주세요.`;
        if (w === null || w < WEIGHT_MIN || w > WEIGHT_MAX) return `몸무게는 ${WEIGHT_MIN}~${WEIGHT_MAX}kg 사이로 입력해 주세요.`;
        if (isMale && !isUnderageMale && !p.militaryStatus) return '병역 사항을 선택해 주세요.';
        if (!p.drinking) return '음주 여부를 선택해 주세요.';
        if (!p.smoking) return '흡연 여부를 선택해 주세요.';
        if (!p.religion) return '종교를 선택해 주세요.';
        if (p.foodPreference.length === 0) return '음식 취향을 하나 이상 선택해 주세요.';
        if (!p.faceType) return '얼굴상을 선택해 주세요.';
        if (!p.skinType) return '피부 타입을 선택해 주세요.';
        if (!p.bodyType) return '체형을 선택해 주세요.';   // ✅ [권형석]
        if (!p.loveType) return '연애 스타일을 선택해 주세요.';
        if (p.hobby.length === 0) return '취미를 하나 이상 선택해 주세요.';
        if (p.favorite.length === 0) return '좋아하는 것을 하나 이상 선택해 주세요.';
        if (p.dislike.length === 0) return '싫어하는 것을 하나 이상 선택해 주세요.';
        if (!p.introduction.trim()) return '자기소개를 입력해 주세요.';

        const aMin = toNum(i.ageMin), aMax = toNum(i.ageMax);
        const hMin = toNum(i.minHeight), hMax = toNum(i.maxHeight);
        // ✅ [권형석] 이상형 나이는 만 14세 이상만 (최대 제한 없음)
        if (aMin !== null && aMin < IDEAL_AGE_MIN) return `이상형 최소 나이는 만 ${IDEAL_AGE_MIN}세 이상이어야 해요. (지금 ${aMin}세)`;
        if (aMax !== null && aMax < IDEAL_AGE_MIN) return `이상형 최대 나이도 만 ${IDEAL_AGE_MIN}세 이상이어야 해요. (지금 ${aMax}세)`;
        const heightOut = (x) => x !== null && (x < HEIGHT_MIN || x > HEIGHT_MAX);
        if (heightOut(hMin) || heightOut(hMax)) return `이상형 키는 ${HEIGHT_MIN}~${HEIGHT_MAX}cm 사이로 입력해 주세요.`;
        if (aMin !== null && aMax !== null && aMin > aMax) return '이상형 나이의 최소값이 최대값보다 클 수 없어요.';
        if (hMin !== null && hMax !== null && hMin > hMax) return '이상형 키의 최소값이 최대값보다 클 수 없어요.';
        return '';
    };

    const handleSave = async () => {
        const isMale = isMaleGender(data.basic?.gender);
        const isFemale = isFemaleGender(data.basic?.gender);
        const isUnderageMale = isUnderageMaleOf(data.basic);   // ✅ [권형석]

        const msg = validate(isMale, isUnderageMale);
        if (msg) { setError(msg); return; }

        const p = form.profile;
        const i = form.ideal;
        const payload = {
            loginId,
            profile: {
                mbti: p.mbti,
                job: p.job,
                height: toNum(p.height),
                weight: toNum(p.weight),
                introduction: p.introduction.trim(),
                loveType: p.loveType,
                hobby: joinList(p.hobby),
                favorite: joinList(p.favorite),
                dislike: joinList(p.dislike),
                drinking: p.drinking,
                smoking: p.smoking,
                religion: p.religion,
                foodPreference: joinList(p.foodPreference),
                faceType: p.faceType,
                skinType: p.skinType,
                bodyType: p.bodyType,   // ✅ [권형석] 내 체형
                // ✅ [권형석] 만 18세 미만 남성은 저장할 때도 미필로 고정
                militaryStatus: isMale ? (isUnderageMale ? MILITARY_UNDERAGE_VALUE : p.militaryStatus) : null,
            },
            // 이상형: 다 비우면 서버가 이상형을 지움
            ideal: {
                ageMin: toNum(i.ageMin),
                ageMax: toNum(i.ageMax),
                minHeight: toNum(i.minHeight),
                maxHeight: toNum(i.maxHeight),
                bodyType: joinList(i.bodyType),
                mbtiPref: joinList(i.mbtiPref),
                smokingPref: i.smokingPref || null,
                drinkingPref: i.drinkingPref || null,
                militaryPref: isFemale ? joinList(i.militaryPref) : null,
                memo: i.memo.trim() || null,
            },
        };

        setSaving(true);
        setError('');
        try {
            await Client.put('/api/profile', payload);
            await loadProfile();
            setEditing(false);
            setForm(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            alert('프로필이 수정되었습니다.');
        } catch (err) {
            const status = err.response?.status;
            if (status === 401) { alert('로그인이 필요합니다.'); navigate('/login'); }
            else if (status === 400) setError(typeof err.response.data === 'string' ? err.response.data : '입력값을 다시 확인해 주세요.');
            else { console.error(err); setError('저장에 실패했습니다. 잠시 후 다시 시도해 주세요.'); }
        } finally {
            setSaving(false);
        }
    };

    /* ===================== 화면 ===================== */
    if (loading) {
        return <div className={styles.page}><div className={styles.card}><p className={styles.notice}>불러오는 중...</p></div></div>;
    }
    if (loadError || !data) {
        return <div className={styles.page}><div className={styles.card}><p className={styles.notice}>{loadError || '프로필이 없습니다.'}</p></div></div>;
    }

    const { basic = {}, profile = {}, ideal } = data;
    const isMale = isMaleGender(basic.gender);
    const isFemale = isFemaleGender(basic.gender);
    const isUnderageMale = isUnderageMaleOf(basic);   // ✅ [권형석]
    // ✅ [권형석] 화면에 보여줄 병역 (만 18세 미만 남성은 미필 고정)
    const militaryText = isUnderageMale
        ? `${MILITARY_UNDERAGE_VALUE} (만 ${MILITARY_MIN_AGE}세 미만)`
        : show(profile.militaryStatus);

    return (
        <div className={styles.page}>
            <div className={styles.card}>

                {/* ===== 상단: 증명사진 + 기본 정보 (보기 · 수정 공통) ===== */}
                <div className={styles.hero}>
                    <div className={styles.photoBox}>
                        <div className={styles.photoFrame}>
                            {photoUrl && !imgFailed ? (
                                <img src={photoUrl} alt={`${basic.nickname} 프로필 사진`} className={styles.photo} />
                            ) : (
                                <span className={styles.photoEmpty}>👤</span>
                            )}
                            {uploading && <div className={styles.photoLoading}>업로드 중...</div>}
                        </div>
                        <button type="button" className={styles.photoBtn} onClick={openPicker} disabled={uploading}>
                            📷 사진 바꾸기
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handlePhotoChange} />
                    </div>

                    <div className={styles.heroInfo}>
                        <h2 className={styles.nickname}>{basic.nickname}</h2>
                        <p className={styles.heroMeta}>
                            {genderLabel(basic.gender)} · 만 {show(basic.age)}세
                            {profile.mbti && <> · <strong>{profile.mbti}</strong></>}
                            {profile.job && <> · {profile.job}</>}
                        </p>
                        {/* ✅ [권형석] 피부 타입·체형·종교 칩 추가 */}
                        <div className={styles.heroChips}>
                            {profile.loveType && <span className={styles.heroChip}>💕 {profile.loveType}</span>}
                            {profile.faceType && <span className={styles.heroChip}>✨ {profile.faceType}</span>}
                            {profile.skinType && <span className={styles.heroChip}>🧴 {profile.skinType}</span>}
                            {profile.bodyType && <span className={styles.heroChip}>🏃 {profile.bodyType}</span>}
                            {profile.religion && <span className={styles.heroChip}>🙏 {profile.religion}</span>}
                            {isMale && (profile.militaryStatus || isUnderageMale) && (
                                <span className={styles.heroChip}>
                                    🎖️ {isUnderageMale ? MILITARY_UNDERAGE_VALUE : profile.militaryStatus}
                                </span>
                            )}
                        </div>
                        {!editing && (
                            <button type="button" className={styles.editBtn} onClick={startEdit}>
                                ✏️ 프로필 수정
                            </button>
                        )}
                    </div>
                </div>

                {/* ===================== 보기 모드 (✅ [권형석] 온보딩 항목 전부 표시) ===================== */}
                {!editing && (
                    <>
                        <Section title="자기소개" icon="💬">
                            <p className={styles.intro}>{profile.introduction || '-'}</p>
                        </Section>

                        <div className={styles.grid}>
                            <Section title="기본 정보" icon="📋">
                                <InfoRow label="닉네임" value={show(basic.nickname)} />
                                <InfoRow label="성별" value={genderLabel(basic.gender)} />
                                <InfoRow label="나이" value={basic.age != null ? `만 ${basic.age}세` : '-'} />
                                <InfoRow label="키" value={show(profile.height, 'cm')} />
                                <InfoRow label="몸무게" value={show(profile.weight, 'kg')} />
                                <InfoRow label="직업" value={show(profile.job)} />
                                <InfoRow label="MBTI" value={show(profile.mbti)} />
                                {isMale && <InfoRow label="병역" value={militaryText} />}
                            </Section>

                            <Section title="생활 습관" icon="🍷">
                                <InfoRow label="음주" value={drinkingText(profile.drinking)} />
                                <InfoRow label="흡연" value={smokingText(profile.smoking)} />
                                <InfoRow label="종교" value={show(profile.religion)} />
                                <TagRow label="음식 취향" value={profile.foodPreference} />
                            </Section>

                            <Section title="외모 · 연애 성향" icon="💄">
                                <InfoRow label="얼굴상" value={show(profile.faceType)} />
                                <InfoRow label="피부 타입" value={show(profile.skinType)} />
                                <InfoRow label="체형" value={show(profile.bodyType)} />
                                <InfoRow label="연애 스타일" value={show(profile.loveType)} />
                            </Section>

                            <Section title="취향" icon="🎨">
                                <TagRow label="취미" value={profile.hobby} />
                                <TagRow label="좋아하는 것" value={profile.favorite} />
                                <TagRow label="싫어하는 것" value={profile.dislike} />
                            </Section>
                        </div>

                        <Section title="나의 이상형" icon="💖">
                            {ideal ? (
                                <div className={styles.idealBox}>
                                    <InfoRow label="나이" value={rangeText(ideal.ageMin, ideal.ageMax, '세')} />
                                    <InfoRow label="키" value={rangeText(ideal.minHeight, ideal.maxHeight, 'cm')} />
                                    <InfoRow label="흡연" value={prefText(ideal.smokingPref)} />
                                    <InfoRow label="음주" value={prefText(ideal.drinkingPref)} />
                                    <TagRow label="체형" value={ideal.bodyType} />
                                    <TagRow label="MBTI" value={ideal.mbtiPref} />
                                    {isFemale && <TagRow label="병역" value={ideal.militaryPref} />}
                                    <InfoRow label="하고 싶은 말" value={ideal.memo ? `“${ideal.memo}”` : '-'} />
                                </div>
                            ) : (
                                <p className={styles.empty}>
                                    아직 이상형을 입력하지 않았어요. [프로필 수정]에서 입력하면 매칭 확률이 높아져요.
                                </p>
                            )}
                        </Section>
                    </>
                )}

                {/* ===================== 수정 모드 ===================== */}
                {editing && form && (
                    <div className={styles.editArea}>
                        <h3 className={styles.editTitle}>📋 기본 정보</h3>
                        <Field label="MBTI">
                            <Chips options={MBTI_LIST} value={form.profile.mbti} onSelect={(v) => setProfileValue('mbti', v)} />
                        </Field>
                        <Field label="직업">
                            <Chips options={JOB_LIST} value={form.profile.job} onSelect={(v) => setProfileValue('job', v)} />
                        </Field>
                        {/* ✅ [권형석] 키 · 몸무게: 범위를 벗어나면 칸 아래에 안내 */}
                        <div className={ob.row}>
                            <Field label={`키 (cm, ${HEIGHT_MIN}~${HEIGHT_MAX})`}>
                                <NumberText value={form.profile.height} min={HEIGHT_MIN} max={HEIGHT_MAX} unit="cm"
                                    onChange={(v) => setProfileValue('height', v)} />
                            </Field>
                            <Field label={`몸무게 (kg, ${WEIGHT_MIN}~${WEIGHT_MAX})`}>
                                <NumberText value={form.profile.weight} min={WEIGHT_MIN} max={WEIGHT_MAX} unit="kg"
                                    onChange={(v) => setProfileValue('weight', v)} />
                            </Field>
                        </div>
                        {/* ✅ [권형석] 만 18세 미만 남성은 병역 미필 고정 */}
                        {isMale && (
                            isUnderageMale ? (
                                <Field
                                    label="병역"
                                    hint={`만 ${MILITARY_MIN_AGE}세 미만은 병역 의무 나이가 아니라서 '${MILITARY_UNDERAGE_VALUE}'로 고정되며 변경할 수 없어요.`}
                                >
                                    <p className={styles.editHint}>🔒 {MILITARY_UNDERAGE_VALUE} (자동 등록)</p>
                                </Field>
                            ) : (
                                <Field label="병역">
                                    <OptionCards options={MILITARY_LIST} value={form.profile.militaryStatus}
                                        onSelect={(v) => setProfileValue('militaryStatus', v)} />
                                </Field>
                            )
                        )}

                        <h3 className={styles.editTitle}>🍷 생활 습관</h3>
                        <Field label="음주">
                            <Chips options={DRINKING_LIST} value={form.profile.drinking} onSelect={(v) => setProfileValue('drinking', v)} />
                        </Field>
                        <Field label="흡연">
                            <Chips options={SMOKING_LIST} value={form.profile.smoking} onSelect={(v) => setProfileValue('smoking', v)} />
                        </Field>
                        <Field label="종교">
                            <Chips options={RELIGION_LIST} value={form.profile.religion} onSelect={(v) => setProfileValue('religion', v)} />
                        </Field>
                        <Field label="음식 취향" hint="여러 개 선택할 수 있어요.">
                            <Chips options={FOOD_LIST} value={form.profile.foodPreference} onSelect={(v) => toggleProfileList('foodPreference', v)} />
                        </Field>

                        <h3 className={styles.editTitle}>💄 외모 · 연애 성향</h3>
                        <Field label="얼굴상">
                            <Chips options={FACE_TYPE_LIST} value={form.profile.faceType} onSelect={(v) => setProfileValue('faceType', v)} />
                        </Field>
                        <Field label="피부 타입">
                            <Chips options={SKIN_TYPE_LIST} value={form.profile.skinType} onSelect={(v) => setProfileValue('skinType', v)} />
                        </Field>
                        {/* ✅ [권형석] 내 체형 */}
                        <Field label="체형">
                            <Chips options={MY_BODY_TYPE_LIST} value={form.profile.bodyType} onSelect={(v) => setProfileValue('bodyType', v)} />
                        </Field>
                        <Field label="연애 스타일">
                            <Chips options={LOVE_TYPE_LIST} value={form.profile.loveType} onSelect={(v) => setProfileValue('loveType', v)} />
                        </Field>

                        <h3 className={styles.editTitle}>🎨 취향 · 자기소개</h3>
                        <Field label="취미" hint="여러 개 선택할 수 있어요.">
                            <Chips options={HOBBY_LIST} value={form.profile.hobby} onSelect={(v) => toggleProfileList('hobby', v)} />
                        </Field>
                        <Field label="좋아하는 것" hint="여러 개 선택할 수 있어요.">
                            <Chips options={FAVORITE_LIST} value={form.profile.favorite} onSelect={(v) => toggleProfileList('favorite', v)} />
                        </Field>
                        <Field label="싫어하는 것" hint="여러 개 선택할 수 있어요.">
                            <Chips options={DISLIKE_LIST} value={form.profile.dislike} onSelect={(v) => toggleProfileList('dislike', v)} />
                        </Field>
                        <Field label="자기소개">
                            <textarea className={ob.textarea} maxLength={MAX_INTRO} rows={5}
                                value={form.profile.introduction}
                                onChange={(e) => setProfileValue('introduction', e.target.value)} />
                            <p className={ob.counter}>{form.profile.introduction.length} / {MAX_INTRO}</p>
                        </Field>

                        <h3 className={styles.editTitle}>💖 나의 이상형 (선택)</h3>
                        <p className={styles.editHint}>모두 비우고 저장하면 이상형이 삭제돼요.</p>
                        {/* ✅ [권형석] 이상형 나이: 만 14세 이상 (최대 제한 없음) */}
                        <div className={ob.row}>
                            <Field label={`나이 (최소, 만 ${IDEAL_AGE_MIN}세 이상)`}>
                                <NumberText value={form.ideal.ageMin} min={IDEAL_AGE_MIN} unit="세" placeholder="예: 25"
                                    onChange={(v) => setIdealValue('ageMin', v)} />
                            </Field>
                            <Field label={`나이 (최대, 만 ${IDEAL_AGE_MIN}세 이상)`}>
                                <NumberText value={form.ideal.ageMax} min={IDEAL_AGE_MIN} unit="세" placeholder="예: 32"
                                    onChange={(v) => setIdealValue('ageMax', v)} />
                            </Field>
                        </div>
                        {/* ✅ [권형석] 이상형 키: 100~250cm */}
                        <div className={ob.row}>
                            <Field label={`키 (최소 cm, ${HEIGHT_MIN}~${HEIGHT_MAX})`}>
                                <NumberText value={form.ideal.minHeight} min={HEIGHT_MIN} max={HEIGHT_MAX} unit="cm" placeholder="예: 160"
                                    onChange={(v) => setIdealValue('minHeight', v)} />
                            </Field>
                            <Field label={`키 (최대 cm, ${HEIGHT_MIN}~${HEIGHT_MAX})`}>
                                <NumberText value={form.ideal.maxHeight} min={HEIGHT_MIN} max={HEIGHT_MAX} unit="cm" placeholder="예: 185"
                                    onChange={(v) => setIdealValue('maxHeight', v)} />
                            </Field>
                        </div>
                        <Field label="체형" hint="여러 개 선택할 수 있어요.">
                            <Chips options={BODY_TYPE_LIST} value={form.ideal.bodyType} onSelect={(v) => toggleIdealList('bodyType', v)} />
                        </Field>
                        <Field label="MBTI" hint="여러 개 선택할 수 있어요.">
                            <Chips options={MBTI_LIST} value={form.ideal.mbtiPref} onSelect={(v) => toggleIdealList('mbtiPref', v)} />
                        </Field>
                        <Field label="흡연">
                            <Chips options={SMOKING_PREF_LIST} value={form.ideal.smokingPref}
                                onSelect={(v) => setIdealValue('smokingPref', form.ideal.smokingPref === v ? '' : v)} />
                        </Field>
                        <Field label="음주">
                            <Chips options={DRINKING_PREF_LIST} value={form.ideal.drinkingPref}
                                onSelect={(v) => setIdealValue('drinkingPref', form.ideal.drinkingPref === v ? '' : v)} />
                        </Field>
                        {isFemale && (
                            <Field label="병역" hint="여러 개 선택할 수 있어요. '상관없음'은 단독으로 선택돼요.">
                                <Chips options={MILITARY_PREF_LIST} value={form.ideal.militaryPref} onSelect={toggleMilitaryPref} />
                            </Field>
                        )}
                        <Field label="하고 싶은 말">
                            <textarea className={ob.textarea} maxLength={MAX_MEMO} rows={3}
                                value={form.ideal.memo}
                                onChange={(e) => setIdealValue('memo', e.target.value)} />
                            <p className={ob.counter}>{form.ideal.memo.length} / {MAX_MEMO}</p>
                        </Field>

                        {error && <p className={ob.error}>⚠️ {error}</p>}

                        <div className={styles.editButtons}>
                            <button type="button" className={ob.prevBtn} onClick={cancelEdit} disabled={saving}>
                                취소
                            </button>
                            <button type="button" className={ob.nextBtn} onClick={handleSave} disabled={saving}>
                                {saving ? '저장 중...' : '저장하기'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Profile;