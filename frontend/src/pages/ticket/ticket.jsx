import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Client from '../../api/client';
import styles from './ticket.module.css';
import * as PortOne from '@portone/browser-sdk/v2';

/* =========================================================
   실루엣 프리미엄 티켓 스토어 (ticket.jsx)
   - 이용권 패키지 선택 + 마일리지 사용 + 주문 요약
   - [결제하기] 클릭 시 바로 PortOne 결제창(카드)으로 이동
   ========================================================= */

// 왼쪽 LNB 메뉴 목록 (마이페이지 연동)
const MENU_MAIN = [
  { id: 'basic', icon: 'fa-id-card', label: '기본 정보', code: 'M005' },
  { id: 'onboarding', icon: 'fa-user-pen', label: '내 정보 (온보딩)', code: 'M015' },
  { id: 'ideal', icon: 'fa-heart-circle-check', label: '이상형 (온보딩)', code: 'M011' },
  { id: 'bookmarks', icon: 'fa-bookmark', label: '북마크', code: 'M008' },
  { id: 'calendar', icon: 'fa-calendar-check', label: '캘린더', code: 'M012' },
  { id: 'ticket', icon: 'fa-ticket', label: '이용권 구매', code: 'P001' },
];

const MENU_ACCOUNT = [
  { id: 'payment', icon: 'fa-credit-card', label: '결제 내역', code: 'M010' },
];

// 기본 아바타
const DEFAULT_AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
    '<rect width="100" height="100" fill="#22201e"/>' +
    '<circle cx="50" cy="38" r="18" fill="#ffd34e"/>' +
    '<path d="M18 88c4-18 18-28 32-28s28 10 32 28z" fill="#ffd34e"/></svg>'
  );

export default function Ticket() {
  const navigate = useNavigate();

  // 회원 정보 & 프로필
  const [member, setMember] = useState(null);
  const [myProfile, setMyProfile] = useState(null);

  // 현재 보유 자산 (이용권 & 마일리지)
  const [myTicketCount, setMyTicketCount] = useState(0);
  const [myMileage, setMyMileage] = useState(0);
  const [ticketProducts, setTicketProducts] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [loading, setLoading] = useState(true);

  // 마일리지 사용
  const [usedMileage, setUsedMileage] = useState(0);
  const [mileageInput, setMileageInput] = useState('');

  // 결제 진행 / 완료 상태
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 필수 약관 동의 상태
  const [agreeAll, setAgreeAll] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [agreePrivacy, setAgreePrivacy] = useState(true);
  const [agreeConfirm, setAgreeConfirm] = useState(true);

  // 회원 정보, 프로필, DB 상품, 지갑 잔액 조회
  useEffect(() => {
    Promise.all([
      Client.get('/api/mypage/me'),
      Client.get('/api/profile/me'),
      Client.get('/api/ticket/products'),
      Client.get('/api/ticket/wallet')
    ]).then(([memberRes, profileRes, productRes, walletRes]) => {
      setMember(memberRes.data);
      setMyProfile(profileRes.data);
      setTicketProducts(productRes.data);
      if (productRes.data.length > 0) {
        setSelectedTicketId(productRes.data[0].ticketProductSeq);
      }
      setMyTicketCount(walletRes.data.ticketBalance);
      setMyMileage(walletRes.data.mileageBalance);
    }).catch((err) => {
      console.error(err);
      alert(err.response?.data?.message || '이용권 정보를 불러오지 못했습니다.');
    }).finally(() => setLoading(false));
  }, []);

  // DB 상품 선택 및 결제 금액 계산
  const selectedProduct = ticketProducts.find(
    (p) => p.ticketProductSeq === selectedTicketId
  ) || null;
  const orderPrice = selectedProduct?.price || 0;
  const finalPrice = Math.max(0, orderPrice - usedMileage);
  const expectedRewardPoint = Math.floor(finalPrice * 0.01);

  // 마일리지 직접 입력
  const handleMileageChange = (e) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const num = Number(raw) || 0;
    if (num > myMileage) {
      setUsedMileage(myMileage);
      setMileageInput(String(myMileage));
    } else if (num > orderPrice) {
      setUsedMileage(orderPrice);
      setMileageInput(String(orderPrice));
    } else {
      setUsedMileage(num);
      setMileageInput(raw);
    }
  };

  // 마일리지 전액 사용
  const handleUseAllMileage = () => {
    const maxVal = Math.min(myMileage, orderPrice);
    setUsedMileage(maxVal);
    setMileageInput(String(maxVal));
  };

  // 약관 전체 토글
  const handleToggleAllAgreements = () => {
    const next = !agreeAll;
    setAgreeAll(next);
    setAgreeTerms(next);
    setAgreePrivacy(next);
    setAgreeConfirm(next);
  };

  // 개별 약관 토글
  const handleToggleAgreement = (type) => {
    let t = agreeTerms, p = agreePrivacy, c = agreeConfirm;
    if (type === 'terms') t = !t;
    if (type === 'privacy') p = !p;
    if (type === 'confirm') c = !c;
    setAgreeTerms(t);
    setAgreePrivacy(p);
    setAgreeConfirm(c);
    setAgreeAll(t && p && c);
  };

  // [결제하기] 클릭 -> 주문 생성 -> PortOne 결제창 -> 서버 검증
  const handlePayment = async () => {
    if (!selectedProduct) {
      alert('구매할 이용권을 선택해 주세요.');
      return;
    }
    if (!agreeTerms || !agreePrivacy || !agreeConfirm) {
      alert('주문 진행을 위해 필수 약관에 모두 동의해 주세요.');
      return;
    }
    if (finalPrice <= 0) {
      alert('결제 금액이 0원인 주문은 결제할 수 없습니다.');
      return;
    }

    const storeId = import.meta.env.VITE_PORTONE_STORE_ID;
    const channelKey = import.meta.env.VITE_PORTONE_CHANNEL_KEY;
    if (!storeId || !channelKey) {
      alert('frontend/.env.local에 PortOne Store ID와 Channel Key를 설정해 주세요.');
      return;
    }

    setIsProcessing(true);
    try {
      // 서버가 DB 상품 가격과 마일리지 잔액으로 결제 금액을 계산하고 주문을 생성
      const prepareRes = await Client.post('/api/ticket/prepare', {
        ticketProductSeq: selectedProduct.ticketProductSeq,
        mileageUsed: usedMileage
      });
      const order = prepareRes.data;

      const customer = {
        fullName: member?.name || member?.nickname || 'Silhouette Member',
      };
      if (member?.phone) customer.phoneNumber = member.phone;
      if (member?.email) customer.email = member.email;

      const payRequest = await PortOne.requestPayment({
        storeId,
        channelKey,
        paymentId: order.pgTransactionId,
        orderName: selectedProduct.productName,
        totalAmount: order.paymentAmount,
        currency: 'KRW',
        payMethod: 'CARD',
        customer,
      });

      if (payRequest?.code) {
        alert(payRequest.message || '결제가 취소되었거나 실패했습니다.');
        return;
      }

      // 브라우저 응답만 믿지 않고 서버가 PortOne 결제 조회 API로 재검증
      const completeRes = await Client.post('/api/ticket/complete', {
        pgTransactionId: order.pgTransactionId,
        paymentMethod: 'card'
      });

      setMyTicketCount(completeRes.data.ticketBalance);
      setMyMileage(completeRes.data.mileageBalance);
      setShowSuccessModal(true);
      setUsedMileage(0);
      setMileageInput('');
    } catch (err) {
      console.error('결제 오류:', err);
      alert(err.response?.data?.message || err.message || '결제 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 사이드바 사용자 표시 정보
  const pData = myProfile?.profile ?? null;
  const genderLabel = member?.gender === 'MALE' || member?.gender === 'M' ? '남성' : member?.gender ? '여성' : '-';

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.mainLayout}>
        {/* =========================================================
            왼쪽 사이드바
            ========================================================= */}
        <aside className={styles.sidebar}>
          <div className={styles.profileSidecard}>
            <div className={styles.avatarWrap}>
              <img
                src={member?.userSeq ? `/api/profile/images/${member.userSeq}` : DEFAULT_AVATAR}
                alt="프로필 사진"
                className={styles.avatarImg}
                onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
              />
            </div>
            <div className={styles.sideNick}>{member?.nickname || '실루엣 회원'}</div>
            <div className={styles.sideSubinfo}>{member?.name || '익명 회원'}</div>

            <div className={styles.sideBadges}>
              <span className={styles.badgePill}>{genderLabel}</span>
              {pData?.mbti && <span className={styles.badgePill}>{pData.mbti}</span>}
              {pData?.job && <span className={styles.badgePillWhite}>{pData.job}</span>}
            </div>

            <div className={styles.sideAssetBox}>
              <div className={styles.sideAssetItem} title="현재 보유 중인 채팅 이용권">
                <span className={styles.sideAssetLabel}>보유 이용권</span>
                <span className={styles.sideAssetVal} style={{ color: 'var(--ink)' }}>
                  {myTicketCount}개
                </span>
              </div>
              <div className={styles.sideAssetItem} title="현재 보유 중인 마일리지">
                <span className={styles.sideAssetLabel}>보유 마일리지</span>
                <span className={styles.sideAssetVal} style={{ color: 'var(--text-sub)' }}>
                  {myMileage.toLocaleString()}P
                </span>
              </div>
            </div>
          </div>

          <nav className={styles.lnbMenu}>
            <div className={styles.lnbGroupTitle}>마이 대시보드</div>
            {MENU_MAIN.map((m) => {
              const isActive = m.id === 'ticket';
              return (
                <a
                  key={m.id}
                  className={`${styles.lnbItem} ${isActive ? styles.active : ''}`}
                  onClick={() => {
                    if (m.id !== 'ticket') navigate('/mypage');
                  }}
                >
                  <div className={styles.lnbItemLeft}>
                    <i className={`fa-solid ${m.icon}`} />
                    <span>{m.label}</span>
                  </div>
                  {m.code && <span className={styles.lnbCode}>{m.code}</span>}
                </a>
              );
            })}

            <div className={styles.lnbGroupTitle} style={{ marginTop: 12 }}>계정 관리</div>
            {MENU_ACCOUNT.map((m) => (
              <a key={m.id} className={styles.lnbItem} onClick={() => navigate('/mypage')}>
                <div className={styles.lnbItemLeft}>
                  <i className={`fa-solid ${m.icon}`} />
                  <span>{m.label}</span>
                </div>
                {m.code && <span className={styles.lnbCode}>{m.code}</span>}
              </a>
            ))}
          </nav>
        </aside>

        {/* =========================================================
            오른쪽 메인 콘텐츠
            ========================================================= */}
        <main className={styles.mainContent}>
          {/* 상단 타이틀 */}
          <div className={styles.topHeader}>
            <span className={styles.eyebrow}>SILHOUETTE TICKET PASS · 프리미엄 충전소</span>
            <h1 className={styles.pageTitle}>
              <span className={styles.pageTitleIcon}>
                <i className="fa-solid fa-ticket" />
              </span>
              이용권 구매
            </h1>
            <p className={styles.pageDesc}>
              원하는 인연과 실루엣을 해제하고 1:1 대화를 시작할 수 있는 채팅 이용권을 충전합니다.
            </p>
          </div>

          {/* 프리미엄 허니 배너 */}
          <div className={styles.storeHeroBanner}>
            <div className={styles.heroBannerText}>
              <div className={styles.heroTag}>
                <i className="fa-solid fa-bolt" /> 혜택 즉시 적용
              </div>
              <h2 className={styles.heroTitle}>더 많은 설렘, 실루엣 프리미엄</h2>
              <p className={styles.heroSubtitle}>
                대용량 패키지로 최대 21% 할인 혜택을 누리고, 마일리지 1% 적립까지 챙기세요.
              </p>
            </div>
            <div className={styles.heroAssets}>
              <div className={styles.heroAssetCard}>
                <div className={styles.heroAssetLabel}>내 보유 이용권</div>
                <div className={`${styles.heroAssetValue} ${styles.honey}`}>{myTicketCount}개</div>
              </div>
              <div className={styles.heroAssetCard}>
                <div className={styles.heroAssetLabel}>내 보유 마일리지</div>
                <div className={styles.heroAssetValue}>{myMileage.toLocaleString()} P</div>
              </div>
            </div>
          </div>

          {/* 상품 선택 그리드 & 결제 요약 레이아웃 */}
          <div className={styles.storeContentGrid}>
            <div className={styles.gridLeftCol}>
              {/* 이용권 패키지 선택 */}
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>
                  <span className={styles.sectionTitleDot} />
                  이용권 패키지 선택
                </h3>
              </div>

              <div className={styles.ticketGrid}>
                {loading && <p>이용권 상품을 불러오는 중입니다.</p>}
                {!loading && ticketProducts.length === 0 && <p>판매 중인 이용권 상품이 없습니다.</p>}
                {ticketProducts.map((pkg) => {
                  const isSelected = selectedTicketId === pkg.ticketProductSeq;
                  return (
                    <div
                      key={pkg.ticketProductSeq}
                      className={`${styles.ticketCard} ${isSelected ? styles.selected : ''}`}
                      onClick={() => setSelectedTicketId(pkg.ticketProductSeq)}
                    >
                      {pkg.ticketCount === 12 && (
                        <span className={`${styles.cardTag} ${styles.best}`}>추천 BEST</span>
                      )}
                      {pkg.ticketCount === 120 && (
                        <span className={`${styles.cardTag} ${styles.vip}`}>VIP 대용량</span>
                      )}

                      <div className={styles.ticketCardTop}>
                        <div className={styles.ticketIconWrap}>
                          <i className="fa-solid fa-ticket" />
                        </div>
                        <div className={styles.ticketTitleWrap}>
                          <span className={styles.ticketCount}>{pkg.ticketCount}개</span>
                          <span className={styles.ticketUnitPrice}>
                            개당 {Math.floor(pkg.price / pkg.ticketCount).toLocaleString()}원
                          </span>
                        </div>
                      </div>

                      <div className={styles.ticketCardBottom}>
                        <span className={styles.ticketPrice}>{pkg.price.toLocaleString()}원</span>
                        <div className={styles.selectRadio}>
                          {isSelected && <div className={styles.selectRadioDot} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 마일리지 사용 영역 */}
              <div className={styles.mileageCard}>
                <div className={styles.mileageHeader}>
                  <span>
                    보유 마일리지: <strong>{myMileage.toLocaleString()} P</strong>
                  </span>
                  <span>(1P = 1원 즉시 차감)</span>
                </div>
                <div className={styles.mileageInputGroup}>
                  <input
                    type="text"
                    className={styles.mileageInput}
                    placeholder="사용할 마일리지 입력"
                    value={mileageInput}
                    onChange={handleMileageChange}
                  />
                  <button type="button" className={styles.btnAllUse} onClick={handleUseAllMileage}>
                    전액 사용
                  </button>
                </div>
              </div>

              {/* 유의사항 안내 카드 */}
              <div className={styles.guideCard}>
                <div className={styles.guideTitle}>
                  <i className="fa-solid fa-circle-info" /> 이용권 구매 및 환불 안내
                </div>
                <ul className={styles.guideList}>
                  <li>구매한 채팅 이용권은 결제 즉시 계정으로 지급되며 유효기간은 1년입니다.</li>
                  <li>미사용 이용권은 전자상거래법에 따라 결제 후 7일 이내 전액 환불이 가능합니다.</li>
                  <li>마일리지는 현금으로 환급되지 않으며, 결제 시 1P 단위로 자유롭게 사용할 수 있습니다.</li>
                </ul>
              </div>
            </div>

            {/* 우측 사이드 주문 요약 패널 */}
            <div className={styles.orderSummaryPanel}>
              <h3 className={styles.summaryTitle}>주문 요약</h3>

              <div className={styles.summaryRows}>
                <div className={`${styles.summaryRow} ${styles.strong}`}>
                  <span>선택 패키지</span>
                  <span>채팅 이용권 {selectedProduct?.ticketCount || 0}개</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>상품 정가</span>
                  <span>{orderPrice.toLocaleString()}원</span>
                </div>
                <div className={`${styles.summaryRow} ${styles.discount}`}>
                  <span>마일리지 할인</span>
                  <span>-{usedMileage.toLocaleString()}원</span>
                </div>
                <div className={styles.summaryTotalRow}>
                  <span className={styles.summaryTotalLabel}>최종 결제 금액</span>
                  <span className={styles.summaryTotalPrice}>{finalPrice.toLocaleString()}원</span>
                </div>
              </div>

              <div className={styles.pointRewardBanner}>
                <span className={styles.pointDot} />
                <span>결제 완료 시 +{expectedRewardPoint.toLocaleString()} P 마일리지 적립</span>
              </div>

              {/* 필수 약관 동의 체크박스 */}
              <div className={styles.termsSection}>
                <label className={`${styles.termLabel} ${styles.all}`}>
                  <input
                    type="checkbox"
                    className={styles.termCheckbox}
                    checked={agreeAll}
                    onChange={handleToggleAllAgreements}
                  />
                  <span>주문 내용 확인 및 전체 동의</span>
                </label>
                <label className={styles.termLabel}>
                  <input
                    type="checkbox"
                    className={styles.termCheckbox}
                    checked={agreeTerms}
                    onChange={() => handleToggleAgreement('terms')}
                  />
                  <span>[필수] 전자금융거래 이용약관 동의</span>
                </label>
                <label className={styles.termLabel}>
                  <input
                    type="checkbox"
                    className={styles.termCheckbox}
                    checked={agreePrivacy}
                    onChange={() => handleToggleAgreement('privacy')}
                  />
                  <span>[필수] 개인정보 제3자 제공 동의</span>
                </label>
                <label className={styles.termLabel}>
                  <input
                    type="checkbox"
                    className={styles.termCheckbox}
                    checked={agreeConfirm}
                    onChange={() => handleToggleAgreement('confirm')}
                  />
                  <span>[필수] 구매 조건 확인 및 결제 진행 동의</span>
                </label>
              </div>

              {/* 결제하기 버튼 (클릭 시 바로 PortOne 결제창) */}
              <button
                type="button"
                className={styles.btnPayCta}
                onClick={handlePayment}
                disabled={!agreeTerms || !agreePrivacy || !agreeConfirm || !selectedProduct || loading || isProcessing}
              >
                <span>
                  {isProcessing ? '결제 진행 중...' : `${finalPrice.toLocaleString()}원 결제하기`}
                </span>
                <i className="fa-solid fa-arrow-right" />
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* =========================================================
          결제 완료 성공 모달
          ========================================================= */}
      {showSuccessModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSuccessModal(false)}>
          <div className={styles.successModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.successIconCircle}>
              <i className="fa-solid fa-check" />
            </div>
            <h3 className={styles.successTitle}>이용권 충전 완료!</h3>
            <p className={styles.successDesc}>
              채팅 이용권 <strong>{selectedProduct?.ticketCount || 0}개</strong>가 성공적으로 충전되었습니다.<br />
              현재 보유 이용권: <strong>{myTicketCount}개</strong>
            </p>
            <button
              type="button"
              className={styles.modalActionBtn}
              onClick={() => setShowSuccessModal(false)}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}