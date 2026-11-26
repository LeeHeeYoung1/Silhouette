import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Client as StompClient } from '@stomp/stompjs';
import useAuthStore from '../../stores/useAuthStore';
import { wsUrl } from '../../api/ws';
import {
    getBlindRoom, getBlindMessages, sendBlindMessage, voteBlind, leaveBlind,
    getBlindAiStatus, getBlindSuggestions,
} from '../../api/blind';
import styles from './blindChatting.module.css';

/*
 * 블라인드 대화방
 *  - 대화 시간(서버가 정함) 동안 익명 채팅 → 끝나면 GO / STOP 선택 (투표 시간 표시)
 *  - 둘 다 GO  → 프로필이 공개된 일반 채팅방으로 이동
 *  - 한 명이라도 STOP / 시간 안에 선택 안 함 → 종료 후 홈
 *  - 메시지는 "나 / 상대"만 구분 (상대 아이디는 서버가 보내지 않음)
 *  - 고스트채팅: 상대의 마지막 메시지 옆 👻 버튼 → AI 답장 추천 3개 → 고르면 입력창에 채워짐 (자동 전송 X)
 */

// AI 추천 톤 → 화면 표시
const TONE_LABELS = { EMPATHY: '공감', QUESTION: '질문', HUMOR: '유머' };
// 서버 에러 → 화면에 보여줄 문구 (문자열이 아닌 응답(500 에러 JSON 등)은 기본 문구로)
const errorText = (error, fallback) =>
    typeof error?.response?.data === 'string' && error.response.data ? error.response.data : fallback;

// 초 → "mm:ss"
const formatClock = (seconds) => {
    const s = Math.max(0, Math.ceil(seconds));
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

// 종료 사유 → 안내 문구 (내가 끝낸 경우는 바로 홈으로 가므로 문구 없음)
const END_MESSAGES = {
    PARTNER_STOP: '상대가 대화를 이어나가지 않음을 선택했어요.',
    PARTNER_LEFT: '상대가 대화를 종료했어요.',
    TIMEOUT: '선택 시간이 지나 대화가 종료됐어요.',
};

const BlindChatting = () => {
    const { roomSeq } = useParams();
    const navi = useNavigate();
    const { token } = useAuthStore();

    const [room, setRoom] = useState(null);              // 서버가 알려준 방 상태
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [now, setNow] = useState(() => Date.now());
    const [deadlines, setDeadlines] = useState({ chatEnd: 0, voteEnd: 0 });
    const [ending, setEnding] = useState(null);          // 결론 안내 { type: 'CONTINUED' | 'ENDED', text }
    const [busy, setBusy] = useState(false);

    // 고스트채팅 (AI 추천답변)
    const [aiAvailable, setAiAvailable] = useState(false);
    const [ghost, setGhost] = useState({ open: false, loading: false, error: '', list: [] });
    const [chosen, setChosen] = useState(null);           // 고른 추천 { aiReplySuggestionSeq, text }

    const messageEndRef = useRef(null);
    const mySlotRef = useRef(0);
    const myVoteRef = useRef(null);
    const finishedRef = useRef(false);                   // 결론 처리를 한 번만 하기 위함
    const refreshingRef = useRef(false);
    const timelineRef = useRef({ phase: null, chatEnd: 0, voteEnd: 0 });   // 타이머에서 시간 경계 확인용

    // ---------- 결론 처리 ----------
    const finish = useCallback(({ result, chatRoomSeq, endReason }) => {
        if (finishedRef.current) return;
        finishedRef.current = true;

        if (result === 'CONTINUED') {
            setEnding({ type: 'CONTINUED', text: '💞 둘 다 GO! 프로필이 공개된 채팅방으로 이어갈게요.' });
            setTimeout(() => navi(`/chatting/${chatRoomSeq}`, { replace: true }), 1500);
            return;
        }
        if (endReason === 'MINE') {
            navi('/', { replace: true });
            return;
        }
        const text = endReason === 'TIMEOUT' && myVoteRef.current === 'GO'
            ? '상대가 시간 안에 선택하지 않아 대화가 종료됐어요.'
            : END_MESSAGES[endReason] || '대화가 종료됐어요.';
        setEnding({ type: 'ENDED', text });
        setTimeout(() => navi('/', { replace: true }), 3000);
    }, [navi]);

    // 서버 상태 반영 (남은 시간 → 내 화면 기준 마감 시각으로 변환)
    const applyState = useCallback((state) => {
        mySlotRef.current = state.mySlot;
        myVoteRef.current = state.myVote;
        const base = Date.now();
        const chatEnd = base + state.remainingSeconds * 1000;
        const voteEnd = state.phase === 'CHAT'
            ? chatEnd + state.voteRemainingSeconds * 1000
            : base + state.voteRemainingSeconds * 1000;
        timelineRef.current = { phase: state.phase, chatEnd, voteEnd };
        setRoom(state);
        setDeadlines({ chatEnd, voteEnd });
        setNow(base);
        if (state.phase === 'DONE') {
            finish({ result: state.result, chatRoomSeq: state.linkedChatRoomSeq, endReason: state.endReason });
        }
    }, [finish]);

    // 상태 + 메시지 다시 불러오기 (처음 입장, 재연결, 시간 경계)
    const refresh = useCallback(async () => {
        if (refreshingRef.current) return;
        refreshingRef.current = true;
        try {
            const [{ data: state }, { data: list }] = await Promise.all([
                getBlindRoom(roomSeq),
                getBlindMessages(roomSeq),
            ]);
            setMessages(list);
            applyState(state);
        } catch (error) {
            const status = error.response?.status;
            if (status === 403 || status === 404) {
                alert(errorText(error, '참여할 수 없는 대화방이에요.'));
                navi('/', { replace: true });
            }
        } finally {
            refreshingRef.current = false;
        }
    }, [roomSeq, applyState, navi]);

    // 메시지 추가 (내가 보낸 응답과 웹소켓 수신이 겹쳐도 한 번만)
    const addMessage = useCallback((m) => {
        setMessages((prev) => (
            prev.some((x) => x.blindChatMessageSeq === m.blindChatMessageSeq) ? prev : [...prev, m]
        ));
    }, []);

    // ---------- 첫 입장 ----------
    useEffect(() => {
        if (!token) {
            navi('/login');
            return;
        }
        const first = setTimeout(refresh, 0);
        return () => clearTimeout(first);
    }, [token, refresh, navi]);

    // ---------- AI 추천 사용 가능 여부 (서버에 API 키가 있는지) ----------
    useEffect(() => {
        if (!token) return;
        let ignore = false;
        getBlindAiStatus()
            .then(({ data }) => { if (!ignore) setAiAvailable(Boolean(data.available)); })
            .catch(() => { if (!ignore) setAiAvailable(false); });
        return () => { ignore = true; };
    }, [token]);

    // ---------- 실시간 수신 ----------
    useEffect(() => {
        if (!token || !roomSeq) return;


        const client = new StompClient({
            brokerURL: wsUrl('/blind'),
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 5000,
            onConnect: () => {
                setIsConnected(true);
                client.subscribe(`/sub/blind/chat/${roomSeq}`, (frame) => {
                    try {
                        const event = JSON.parse(frame.body);
                        if (event.kind === 'MESSAGE') {
                            addMessage(event);
                        } else if (event.kind === 'RESULT') {
                            const endReason = event.result === 'ENDED'
                                ? (event.bySlot === mySlotRef.current
                                    ? 'MINE'
                                    : event.reason === 'STOP' ? 'PARTNER_STOP'
                                        : event.reason === 'LEFT' ? 'PARTNER_LEFT' : 'TIMEOUT')
                                : null;
                            finish({ result: event.result, chatRoomSeq: event.chatRoomSeq, endReason });
                        }
                    } catch (e) {
                        console.error('블라인드 메시지 파싱 실패:', e);
                    }
                });
                refresh();   // 연결이 끊긴 사이 놓친 메시지·결과 반영
            },
            onWebSocketClose: () => setIsConnected(false),
        });

        client.activate();
        return () => { client.deactivate(); };
    }, [token, roomSeq, addMessage, finish, refresh]);

    // ---------- 타이머 ----------
    // 0.25초마다 화면 시계 갱신 + 시간 경계에서 서버 상태 다시 확인 (대화 끝 → 투표, 투표 끝 → 결론)
    useEffect(() => {
        const timer = setInterval(() => {
            const t = Date.now();
            setNow(t);

            if (finishedRef.current) return;
            const { phase: p, chatEnd, voteEnd } = timelineRef.current;
            const atChatEnd = p === 'CHAT' && t >= chatEnd;
            const atVoteEnd = p === 'VOTE' && t >= voteEnd + 1000;
            if (atChatEnd || atVoteEnd) {
                refresh();
            }
        }, 250);
        return () => clearInterval(timer);
    }, [refresh]);

    const phase = room?.phase;
    // 상대의 마지막 메시지 (👻 버튼은 여기에만 표시, 서버도 이 메시지 기준으로 추천)
    const lastPartnerSeq = [...messages].reverse()
        .find((m) => room && m.senderSlot !== room.mySlot)?.blindChatMessageSeq;
    const chatLeft = (deadlines.chatEnd - now) / 1000;
    const voteLeft = (deadlines.voteEnd - now) / 1000;
    // 서버 응답 전이라도 대화 시간이 끝나면 화면은 투표 단계로 전환
    const showVote = !ending && room && phase !== 'DONE' && (phase === 'VOTE' || chatLeft <= 0);
    const canChat = !ending && phase === 'CHAT' && chatLeft > 0;

    // 새 메시지 오면 맨 아래로
    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ---------- 동작 ----------
    const handleSend = async (e) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || !canChat || busy) return;

        setBusy(true);
        try {
            const { data } = await sendBlindMessage(roomSeq, text, chosen?.aiReplySuggestionSeq ?? null);
            addMessage(data);
            setInput('');
            setChosen(null);
        } catch (error) {
            alert(errorText(error, '메시지를 보내지 못했어요.'));
            refresh();
        } finally {
            setBusy(false);
        }
    };

    // 👻 AI 답장 추천 받기
    const handleGhost = async () => {
        if (!aiAvailable || ghost.loading) return;

        // 처음 사용할 때 한 번: 대화가 외부 AI로 전송된다는 안내 후 동의 받기
        let agreed = false;
        try { agreed = sessionStorage.getItem('blindAiNoticeAgreed') === 'Y'; } catch { /* 저장소 사용 불가 */ }
        if (!agreed) {
            const ok = window.confirm(
                'AI 답장 추천을 받으면 이 대화방의 최근 대화 내용(최대 10개)이\n'
                + 'AI(Google Gemini)에 전송돼요. 닉네임·아이디는 전송되지 않아요.\n\n계속할까요?'
            );
            if (!ok) return;
            try { sessionStorage.setItem('blindAiNoticeAgreed', 'Y'); } catch { /* 저장소 사용 불가 */ }
        }
        setGhost({ open: true, loading: true, error: '', list: [] });
        try {
            const { data } = await getBlindSuggestions(roomSeq);
            setGhost({ open: true, loading: false, error: '', list: data });
        } catch (error) {
            setGhost({ open: true, loading: false, error: errorText(error, '추천을 불러오지 못했어요.'), list: [] });
        }
    };

    // 추천 고르기 → 입력창에 채우기 (수정해서 보낼 수 있음)
    const handlePickSuggestion = (s) => {
        setInput(s.text);
        setChosen({ aiReplySuggestionSeq: s.aiReplySuggestionSeq, text: s.text });
        setGhost({ open: false, loading: false, error: '', list: [] });
    };

    const handleVote = async (vote) => {
        if (busy) return;
        setBusy(true);
        try {
            if (vote === 'STOP') {
                await voteBlind(roomSeq, 'STOP');
                finishedRef.current = true;
                navi('/', { replace: true });
                return;
            }
            const { data } = await voteBlind(roomSeq, 'GO');
            applyState(data);
        } catch (error) {
            alert(errorText(error, '선택을 저장하지 못했어요.'));
            refresh();
        } finally {
            setBusy(false);
        }
    };

    const handleLeave = async () => {
        if (!window.confirm('대화를 종료할까요?\n상대에게 대화 종료가 알려져요.')) return;
        try {
            await leaveBlind(roomSeq);
        } catch {
            // 이미 끝난 방이어도 홈으로 이동
        }
        finishedRef.current = true;
        navi('/', { replace: true });
    };

    const voteSeconds = room?.voteSeconds || 30;
    const votePercent = Math.max(0, Math.min(100, (voteLeft / voteSeconds) * 100));

    return (
        <div className={styles.container}>
            <div className={styles.chatWrapper}>
                {/* 상단 헤더 */}
                <div className={styles.chatHeader}>
                    <div className={styles.headerLeft}>
                        <button type="button" onClick={handleLeave} className={styles.backBtn} title="대화 종료">
                            ←
                        </button>
                        <h3 className={styles.title}>🎭 블라인드 대화방</h3>
                    </div>
                    <div className={styles.headerRight}>
                        <span className={`${styles.timerBadge} ${canChat && chatLeft <= 60 ? styles.timerUrgent : ''}`}>
                            {!room ? '⏳ --:--' : canChat ? `⏳ ${formatClock(chatLeft)}` : '🗳️ 선택 시간'}
                        </span>
                        <div className={styles.onlineBadge}>
                            <span className={styles.pulseDot}></span>
                            <span>{isConnected ? '연결됨' : '연결 중...'}</span>
                        </div>
                    </div>
                </div>

                {/* 메시지 영역 */}
                <div className={styles.messageArea}>
                    {messages.length === 0 ? (
                        <div className={styles.emptyNotice}>
                            매칭된 상대와 익명 대화를 시작해보세요! 💬<br />
                            {room ? `${room.timeLimitMin}분 동안 대화한 뒤, 계속 이어갈지 서로 선택해요.` : ''}
                        </div>
                    ) : (
                        messages.map((m) => {
                            const isMine = m.senderSlot === room?.mySlot;
                            const isLastPartner = !isMine && m.blindChatMessageSeq === lastPartnerSeq;
                            return (
                                <div
                                    key={m.blindChatMessageSeq}
                                    className={`${styles.messageRow} ${isMine ? styles.myMessageRow : styles.otherMessageRow}`}
                                >
                                    <span className={styles.senderName}>{isMine ? '나' : '상대방 (익명)'}</span>
                                    <div className={styles.bubbleLine}>
                                        <div className={`${styles.bubble} ${isMine ? styles.myBubble : styles.otherBubble}`}>
                                            {m.content}
                                        </div>
                                        {isLastPartner && canChat && (
                                            <button
                                                type="button"
                                                className={styles.ghostBtn}
                                                onClick={handleGhost}
                                                disabled={!aiAvailable || ghost.loading}
                                                title={aiAvailable ? 'AI 답장 추천 받기' : 'AI 추천은 준비 중이에요'}
                                            >
                                                👻
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messageEndRef} />
                </div>

                {/* 고스트채팅: AI 답장 추천 */}
                {ghost.open && canChat && (
                    <div className={styles.ghostPanel}>
                        <div className={styles.ghostHeader}>
                            <span>👻 AI 답장 추천</span>
                            <button type="button" className={styles.ghostClose}
                                onClick={() => setGhost({ open: false, loading: false, error: '', list: [] })}>
                                ✕
                            </button>
                        </div>
                        {ghost.loading && <p className={styles.ghostInfo}>답장을 고민하고 있어요...</p>}
                        {ghost.error && <p className={styles.ghostError}>{ghost.error}</p>}
                        {ghost.list.length > 0 && (
                            <div className={styles.ghostList}>
                                {ghost.list.map((s) => (
                                    <button key={s.aiReplySuggestionSeq} type="button" className={styles.ghostChip}
                                        onClick={() => handlePickSuggestion(s)}>
                                        <span className={styles.ghostTone}>{TONE_LABELS[s.tone] || '추천'}</span>
                                        {s.text}
                                    </button>
                                ))}
                            </div>
                        )}
                        <p className={styles.ghostNotice}>AI 추천을 받으면 최근 대화 내용이 AI(Google Gemini)에 전송돼요. 고른 답장은 바로 보내지지 않고 입력창에 채워져요.</p>
                    </div>
                )}

                {/* 입력 폼 */}
                <form onSubmit={handleSend} className={styles.inputArea}>
                    <input
                        className={styles.chatInput}
                        placeholder={canChat ? '따뜻한 첫 인사를 건네보세요...' : '대화 시간이 끝났어요'}
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            if (!e.target.value.trim()) setChosen(null);
                        }}
                        disabled={!canChat}
                        maxLength={500}
                        autoFocus
                    />
                    <button type="submit" className={styles.sendBtn} disabled={!canChat || busy || !input.trim()}>
                        전송
                    </button>
                </form>

                {/* GO / STOP 선택 */}
                {showVote && (
                    <div className={styles.overlay}>
                        <div className={styles.voteCard}>
                            <h3 className={styles.voteTitle}>대화 시간이 끝났어요!</h3>
                            <p className={styles.voteDesc}>
                                둘 다 <b>GO</b>를 선택하면 서로의 프로필이 공개된 채팅방으로 이어져요.
                            </p>

                            <div className={styles.voteBar}>
                                <div className={styles.voteBarFill} style={{ width: `${votePercent}%` }} />
                            </div>
                            <span className={styles.voteTime}>{Math.max(0, Math.ceil(voteLeft))}초 남음</span>

                            {room?.myVote === 'GO' ? (
                                <p className={styles.voteWaiting}>GO를 선택했어요. 상대의 선택을 기다리는 중...</p>
                            ) : (
                                <div className={styles.voteButtons}>
                                    <button type="button" className={styles.goBtn} onClick={() => handleVote('GO')}
                                        disabled={busy || phase !== 'VOTE'}>
                                        GO 💞
                                    </button>
                                    <button type="button" className={styles.stopBtn} onClick={() => handleVote('STOP')}
                                        disabled={busy || phase !== 'VOTE'}>
                                        STOP
                                    </button>
                                </div>
                            )}
                            <p className={styles.voteNotice}>시간 안에 선택하지 않으면 대화가 종료돼요.</p>
                        </div>
                    </div>
                )}

                {/* 결론 안내 */}
                {ending && (
                    <div className={styles.overlay}>
                        <div className={styles.voteCard}>
                            <p className={styles.endingText}>{ending.text}</p>
                            {ending.type === 'ENDED' && (
                                <button type="button" className={styles.homeBtn} onClick={() => navi('/', { replace: true })}>
                                    홈으로
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlindChatting;
