import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';
import Client from '../../api/client';
import styles from './adminreport.module.css';

/* =========================================================
   관리자 메인 대시보드 (AdminMain)
   - A001: 회원 관리, 블랙리스트 등록/해제, 강제 삭제
   - A001: 금칙어(비속어/광고) 필터 등록 및 삭제
   - A001: 프로필 사진 AI 심사 및 수동 승인/반려
   - /admin/reports (기존 신고 관리) 바로가기 연동
   ========================================================= */

function AdminMain() {
  const navigate = useNavigate();
  const { token, role } = useAuthStore();

  // 1. 관리자 권한 확인 상태
  const [isAdmin, setIsAdmin] = useState(false);

  // 2. 현재 선택된 탭 ('MEMBERS': 회원, 'WORDS': 금칙어, 'PHOTOS': 사진심사)
  const [currentTab, setCurrentTab] = useState('MEMBERS');

  // ========================================================
  // [A001] 회원 관리 데이터 & 함수 (백엔드 AdminController 연동)
  // ========================================================
  const [members, setMembers] = useState([]);

  const loadMembers = () => {
    Client.get('/api/admin/members')
      .then((res) => setMembers(res.data || []))
      .catch((err) => console.error('회원 목록 조회 실패:', err));
  };

  // 블랙리스트 등록
  const handleBlacklist = (memberSeq) => {
    const reason = prompt('블랙리스트 등록 사유를 입력하세요:');
    if (!reason) return;

    Client.post('/api/admin/blacklist', {
      memberSeq: memberSeq,
      blacklistReason: reason,
      adminMemo: '관리자 수동 차단'
    })
      .then(() => {
        alert('블랙리스트에 등록되었습니다.');
        loadMembers();
      })
      .catch((err) => alert('등록 실패: ' + err.message));
  };

  // 블랙리스트 해제
  const handleRelease = (memberSeq) => {
    if (!window.confirm('블랙리스트를 해제하시겠습니까?')) return;
    Client.post(`/api/admin/blacklist/release/${memberSeq}`)
      .then(() => {
        alert('해제되었습니다.');
        loadMembers();
      })
      .catch((err) => alert('해제 실패: ' + err.message));
  };

  // 회원 강제 삭제(탈퇴)
  const handleDeleteMember = (memberSeq) => {
    if (!window.confirm('정말 이 회원을 강제 삭제(탈퇴) 처리하시겠습니까?')) return;
    Client.delete(`/api/admin/members/${memberSeq}`)
      .then(() => {
        alert('회원이 삭제되었습니다.');
        loadMembers();
      })
      .catch((err) => alert('삭제 실패: ' + err.message));
  };

  // ========================================================
  // [A001] 금칙어 필터 데이터 & 함수
  // ========================================================
  const [words, setWords] = useState([]);
  const [inputWord, setInputWord] = useState('');
  const [inputCategory, setInputCategory] = useState('비속어');

  const loadWords = () => {
    Client.get('/api/admin/banned-words')
      .then((res) => setWords(res.data || []))
      .catch((err) => console.error('금칙어 조회 실패:', err));
  };

  const handleAddWord = (e) => {
    e.preventDefault();
    if (!inputWord.trim()) return;

    Client.post('/api/admin/banned-words', {
      word: inputWord.trim(),
      category: inputCategory,
      replacement: '***'
    })
      .then(() => {
        alert('금칙어가 등록되었습니다.');
        setInputWord('');
        loadWords();
      })
      .catch((err) => alert('등록 실패: ' + err.message));
  };

  const handleDeleteWord = (seq) => {
    if (!window.confirm('이 금칙어를 삭제하시겠습니까?')) return;
    Client.delete(`/api/admin/banned-words/${seq}`)
      .then(() => {
        loadWords();
      })
      .catch((err) => alert('삭제 실패: ' + err.message));
  };

  // ========================================================
  // [A001] AI 사진 심사 데이터 & 함수
  // ========================================================
  const [photos, setPhotos] = useState([]);
  const [photoFilter, setPhotoFilter] = useState('WAITING');

  const loadPhotos = () => {
    Client.get(`/api/admin/photo-reviews?status=${photoFilter}`)
      .then((res) => setPhotos(res.data || []))
      .catch((err) => console.error('사진 목록 조회 실패:', err));
  };

  const handleAiCheck = (photoReviewSeq) => {
    Client.post(`/api/admin/photo-reviews/${photoReviewSeq}/ai-check`)
      .then(() => {
        alert('AI 재검사가 완료되었습니다.');
        loadPhotos();
      })
      .catch((err) => alert('재검사 실패: ' + err.message));
  };

  const handleDecidePhoto = (photoReviewSeq, status) => {
    const reason = status === 'REJECTED' ? prompt('반려 사유를 입력해주세요:') : null;
    if (status === 'REJECTED' && !reason) return;

    Client.post('/api/admin/photo-reviews/decide', {
      photoReviewSeq: photoReviewSeq,
      status: status,
      rejectReason: reason
    })
      .then(() => {
        alert(status === 'APPROVED' ? '승인 처리되었습니다.' : '반려 처리되었습니다.');
        loadPhotos();
      })
      .catch((err) => alert('처리 실패: ' + err.message));
  };

  // ========================================================
  // 관리자 권한 확인 (useAuthStore의 role로 즉시 확인)
  // ========================================================
  useEffect(() => {
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/login', { replace: true });
      return;
    }

    if (role !== 'ROLE_ADMIN') {
      alert('관리자만 접근할 수 있습니다.');
      navigate('/', { replace: true });
      return;
    }

    setIsAdmin(true);
  }, [token, role, navigate]);

  // 탭 또는 사진 필터 변경 시 데이터 호출
  useEffect(() => {
    if (!isAdmin) return;
    if (currentTab === 'MEMBERS') loadMembers();
    if (currentTab === 'WORDS') loadWords();
    if (currentTab === 'PHOTOS') loadPhotos();
  }, [currentTab, photoFilter, isAdmin]);

  if (!isAdmin) {
    return <div className={styles.notice}>관리자 권한을 확인하고 있습니다...</div>;
  }

  return (
    <div className={styles.page}>
      {/* 헤더 타이틀 및 신고 관리 바로가기 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <h1 className={styles.pageTitle} style={{ margin: 0 }}>🛡️ 관리자 통합 대시보드</h1>
        <button
          onClick={() => navigate('/admin/reports')}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            background: '#ffd34e',
            color: '#22201e',
            border: 'none',
            fontWeight: 800,
            cursor: 'pointer',
            fontSize: '0.85rem'
          }}
        >
          🚨 접수된 신고 관리 이동 →
        </button>
      </div>

      {/* 상단 탭 버튼들 */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${currentTab === 'MEMBERS' ? styles.tabActive : ''}`}
          onClick={() => setCurrentTab('MEMBERS')}
        >
          👤 회원 & 블랙리스트 (A001)
        </button>
        <button
          className={`${styles.tab} ${currentTab === 'WORDS' ? styles.tabActive : ''}`}
          onClick={() => setCurrentTab('WORDS')}
        >
          🚫 금칙어 필터 (A001)
        </button>
        <button
          className={`${styles.tab} ${currentTab === 'PHOTOS' ? styles.tabActive : ''}`}
          onClick={() => setCurrentTab('PHOTOS')}
        >
          🖼️ AI 사진 심사 (A001)
        </button>
      </div>
       
      {/* =========================================================
          탭 2. [A001] 회원 및 블랙리스트 관리
      ========================================================= */}
      {currentTab === 'MEMBERS' && (
        <div className={styles.card}>
          <div className={styles.topRow}>
            <h3 style={{ margin: 0 }}>회원 목록 ({members.length}명)</h3>
            <button className={styles.btnGhost} onClick={loadMembers}>새로고침</button>
          </div>
          <div style={{ overflowX: 'auto', marginTop: '12px' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e7e0ce', color: '#5c5549' }}>
                  <th style={{ padding: '10px' }}>번호</th>
                  <th>닉네임</th>
                  <th>이메일</th>
                  <th>상태</th>
                  <th>블랙리스트 사유</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.memberSeq} style={{ borderBottom: '1px solid #e7e0ce' }}>
                    <td style={{ padding: '10px' }}>{m.memberSeq}</td>
                    <td style={{ fontWeight: 'bold' }}>{m.nickname}</td>
                    <td>{m.email}</td>
                    <td>
                      <span className={m.status === 'BLACKLIST' ? styles.badgeRed : styles.badgeGray}>
                        {m.status}
                      </span>
                    </td>
                    <td className={styles.dim}>{m.blacklistReason || '-'}</td>
                    <td>
                      {m.status === 'BLACKLIST' ? (
                        <button
                          onClick={() => handleRelease(m.memberSeq)}
                          style={{ marginRight: '6px', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          해제
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBlacklist(m.memberSeq)}
                          style={{ marginRight: '6px', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          차단
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteMember(m.memberSeq)}
                        style={{ padding: '4px 8px', borderRadius: '4px', background: '#fdecea', color: '#b42318', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#a9a9b8' }}>
                      등록된 회원이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================
          탭 3. [A001] 금칙어 필터 관리
      ========================================================= */}
      {currentTab === 'WORDS' && (
        <div className={styles.card}>
          <h3 style={{ marginTop: 0 }}>금칙어(비속어/광고) 필터 등록</h3>
          <form onSubmit={handleAddWord} style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="차단할 단어 입력"
              value={inputWord}
              onChange={(e) => setInputWord(e.target.value)}
              className={styles.input}
              style={{ width: '220px' }}
              required
            />
            <select
              value={inputCategory}
              onChange={(e) => setInputCategory(e.target.value)}
              className={styles.input}
              style={{ width: '120px' }}
            >
              <option value="비속어">비속어</option>
              <option value="광고">광고</option>
              <option value="음란">음란</option>
              <option value="기타">기타</option>
            </select>
            <button type="submit" className={styles.btnOutline}>
              + 금칙어 추가
            </button>
          </form>

          <h4 style={{ marginBottom: '10px' }}>등록된 금칙어 목록 ({words.length}개)</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {words.map((w) => (
              <span
                key={w.bannedWordSeq}
                className={styles.badgeGray}
                style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}
              >
                <strong>{w.word}</strong>
                <span className={styles.dim}>({w.category})</span>
                <button
                  onClick={() => handleDeleteWord(w.bannedWordSeq)}
                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  ✕
                </button>
              </span>
            ))}
            {words.length === 0 && <div className={styles.dim}>등록된 금칙어가 없습니다.</div>}
          </div>
        </div>
      )}

      {/* =========================================================
          탭 4. [A001] AI 프로필 사진 심사
      ========================================================= */}
      {currentTab === 'PHOTOS' && (
        <div className={styles.card}>
          <div className={styles.topRow}>
            <h3 style={{ margin: 0 }}>프로필 사진 심사 ({photos.length}건)</h3>
            <select
              value={photoFilter}
              onChange={(e) => setPhotoFilter(e.target.value)}
              className={styles.input}
              style={{ width: '130px', padding: '6px 10px' }}
            >
              <option value="WAITING">대기중</option>
              <option value="ALL">전체 보기</option>
              <option value="APPROVED">승인 완료</option>
              <option value="REJECTED">반려됨</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px', marginTop: '16px' }}>
            {photos.map((p) => (
              <div key={p.photoReviewSeq} style={{ background: '#ffffff', borderRadius: '20px', padding: '14px', textAlign: 'center', border: 'none' }}>
                <img
                  src={p.photoUrl}
                  alt="프로필"
                  style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '6px', background: '#f7f3e6' }}
                />
                <div style={{ margin: '8px 0 4px', fontWeight: 'bold', fontSize: '0.95rem' }}>
                  {p.nickname} (회원 #{p.memberSeq})
                </div>

                {/* AI 점수 & 의심 뱃지 */}
                <div style={{ marginBottom: '8px', fontSize: '0.82rem' }}>
                  <span className={styles.dim}>AI 확률: {p.aiScore || 0}% </span>
                  {p.isAiSuspect === 'Y' && <span className={styles.badgeRed} style={{ marginLeft: '4px' }}>AI 의심</span>}
                </div>

                <div style={{ fontSize: '0.85rem', marginBottom: '10px' }}>
                  상태: <strong>{p.status}</strong>
                  {p.rejectReason && <div style={{ color: '#f87171', fontSize: '0.78rem' }}>{p.rejectReason}</div>}
                </div>

                {/* 관리 버튼들 */}
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleAiCheck(p.photoReviewSeq)}
                    style={{ fontSize: '0.75rem', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    AI 재검사
                  </button>
                  <button
                    onClick={() => handleDecidePhoto(p.photoReviewSeq, 'APPROVED')}
                    style={{ fontSize: '0.75rem', padding: '4px 6px', borderRadius: '4px', background: '#ffd34e', color: '#22201e', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                  >
                    승인
                  </button>
                  <button
                    onClick={() => handleDecidePhoto(p.photoReviewSeq, 'REJECTED')}
                    style={{ fontSize: '0.75rem', padding: '4px 6px', borderRadius: '4px', background: '#fdecea', color: '#b42318', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                  >
                    반려
                  </button>
                </div>
              </div>
            ))}
            {photos.length === 0 && (
              <div className={styles.notice} style={{ gridColumn: '1 / -1' }}>
                심사 대상 사진이 없습니다.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminMain;
