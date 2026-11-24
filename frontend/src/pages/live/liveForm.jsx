import { useState } from 'react';
import { uploadThumbnail } from '../../api/live';
import {
  CATEGORIES,
  DESCRIPTION_MAX,
  HASHTAG_MAX_COUNT,
  HASHTAG_MAX_LENGTH,
  THUMBNAIL_MAX_SIZE,
  THUMBNAIL_TYPES,
  TITLE_MAX,
  errorMessage,
  parseHashtags,
} from './liveConstants';
import { Modal } from './liveModals';
import styles from './live.module.css';

// 방송 시작 / 정보 수정 공용 폼
// initial이 있으면 수정 모드, onSubmit(body)는 실패 시 에러를 throw
function LiveForm({ initial, onSubmit, onClose }) {
  const editing = Boolean(initial);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [category, setCategory] = useState(initial?.category ?? 'TALK');
  const [tagText, setTagText] = useState((initial?.hashtags ?? []).map((t) => `#${t}`).join(' '));
  const [description, setDescription] = useState(initial?.description ?? '');
  const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnailUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const tags = parseHashtags(tagText);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!THUMBNAIL_TYPES.includes(file.type)) return setError('jpg, png, webp 이미지만 가능해요.');
    if (file.size > THUMBNAIL_MAX_SIZE) return setError('썸네일은 5MB까지 가능해요.');

    setError('');
    setUploading(true);
    try {
      const { data } = await uploadThumbnail(file);
      setThumbnailUrl(data.thumbnailUrl);
    } catch (err) {
      setError(errorMessage(err, '썸네일을 올리지 못했어요.'));
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!title.trim()) return setError('방송 제목을 입력해주세요.');
    if (tags.length > HASHTAG_MAX_COUNT) return setError('해시태그는 5개까지 가능해요.');
    if (tags.some((t) => t.length > HASHTAG_MAX_LENGTH)) return setError('해시태그는 10자까지 가능해요.');

    setError('');
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        category,
        hashtags: tags,
        description: description.trim() || null,
        thumbnailUrl: thumbnailUrl,
      });
    } catch (err) {
      setError(errorMessage(err, editing ? '수정하지 못했어요.' : '방송을 시작하지 못했어요.'));
      setSubmitting(false);
    }
  };

  return (
    <Modal title={editing ? '방송 정보 수정' : '방송 시작하기'} onClose={onClose}>
      <div className={styles.form}>
        <label>
          <span className={styles.labelRow}>제목 <small>{title.length}/{TITLE_MAX}</small></span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={TITLE_MAX}
            placeholder="어떤 방송인가요?"
            autoFocus
          />
        </label>

        <label>
          <span className={styles.labelRow}>카테고리</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>

        <label>
          <span className={styles.labelRow}>
            해시태그 <small>최대 {HASHTAG_MAX_COUNT}개, 각 {HASHTAG_MAX_LENGTH}자</small>
          </span>
          <input
            value={tagText}
            onChange={(e) => setTagText(e.target.value)}
            placeholder="#여행 #맛집"
          />
        </label>
        {tags.length > 0 && (
          <div className={styles.tags}>
            {tags.map((t) => (
              <span key={t} className={t.length > HASHTAG_MAX_LENGTH ? styles.tagError : styles.tag}>
                #{t}
              </span>
            ))}
          </div>
        )}

        <label>
          <span className={styles.labelRow}>
            설명 <small>(선택) {description.length}/{DESCRIPTION_MAX}</small>
          </span>
          <textarea
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={DESCRIPTION_MAX}
          />
        </label>

        <div>
          <span className={styles.labelRow}>썸네일 <small>(선택) jpg·png·webp, 5MB 이하</small></span>
          <div className={styles.thumbPicker}>
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt="썸네일 미리보기" />
            ) : (
              <div className={styles.thumbEmpty}>미리보기</div>
            )}
            <div className={styles.thumbButtons}>
              <label className={styles.ghostButton}>
                {uploading ? '올리는 중...' : '이미지 선택'}
                <input type="file" accept=".jpg,.jpeg,.png,.webp" hidden onChange={onFile} disabled={uploading} />
              </label>
              {thumbnailUrl && (
                <button className={styles.ghostButton} onClick={() => setThumbnailUrl(null)}>삭제</button>
              )}
            </div>
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.primaryButton} onClick={submit} disabled={submitting || uploading}>
          {editing ? '저장' : '📡 방송 시작'}
        </button>
      </div>
    </Modal>
  );
}

export default LiveForm;
