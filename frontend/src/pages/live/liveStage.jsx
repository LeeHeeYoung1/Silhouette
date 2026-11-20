import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RoomAudioRenderer,
  StartAudio,
  VideoTrack,
  useConnectionState,
  useIsMuted,
  useRoomContext,
  useTracks,
} from '@livekit/components-react';
import { ConnectionState, Track, createLocalTracks } from 'livekit-client';
import styles from './live.module.css';

// 카메라·마이크 권한 에러 → 안내 문구
const mediaErrorMessage = (e) => {
  switch (e?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return '카메라·마이크 권한이 거부됐어요. 주소창 왼쪽의 사이트 설정에서 권한을 허용한 뒤 다시 시도해주세요.';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return '카메라나 마이크를 찾을 수 없어요. 장치 연결을 확인해주세요.';
    case 'NotReadableError':
      return '다른 프로그램이 카메라·마이크를 사용 중이에요. 종료한 뒤 다시 시도해주세요.';
    default:
      return '카메라·마이크를 켜지 못했어요.';
  }
};

function CameraOff({ nickname, profileUrl }) {
  return (
    <div className={styles.cameraOff}>
      <img src={profileUrl || '/silhouette_man_cutout.png'} alt="" className={styles.avatarLarge} />
      <span>{nickname} · 카메라 꺼짐</span>
    </div>
  );
}

// ========================= 방송자 =========================
// createLocalTracks로 직접 켜고, ON/OFF는 track.mute()/unmute()
// → 시청자 쪽에서 TrackMuted 이벤트로 상태 표시
export function HostStage({ nickname }) {
  const room = useRoomContext();
  const connection = useConnectionState();
  const videoRef = useRef(null);
  const tracksRef = useRef([]);
  const startedRef = useRef(false);
  const [tracks, setTracks] = useState({ video: null, audio: null });
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [mediaError, setMediaError] = useState('');

  const startMedia = useCallback(async () => {
    try {
      const created = await createLocalTracks({ audio: true, video: true });
      tracksRef.current = created;
      for (const t of created) {
        await room.localParticipant.publishTrack(t);
      }
      setMediaError('');
      setCamOn(true);
      setMicOn(true);
      setTracks({
        video: created.find((t) => t.kind === Track.Kind.Video) ?? null,
        audio: created.find((t) => t.kind === Track.Kind.Audio) ?? null,
      });
    } catch (e) {
      tracksRef.current.forEach((t) => t.stop());
      tracksRef.current = [];
      setMediaError(mediaErrorMessage(e));
    }
  }, [room]);

  // LiveKit 접속이 끝나면 한 번만 송출 시작 (재연결 때 다시 만들지 않음)
  useEffect(() => {
    if (connection !== ConnectionState.Connected || startedRef.current) return;
    startedRef.current = true;
    const timer = setTimeout(startMedia, 0);
    return () => clearTimeout(timer);
  }, [connection, startMedia]);

  // 화면을 떠나면 카메라·마이크 끄기
  useEffect(() => () => tracksRef.current.forEach((t) => t.stop()), []);

  // 내 화면 미리보기
  useEffect(() => {
    const el = videoRef.current;
    const video = tracks.video;
    if (!el || !video) return;
    video.attach(el);
    return () => {
      video.detach(el);
    };
  }, [tracks.video]);

  const toggleCam = async () => {
    if (!tracks.video) return;
    if (camOn) await tracks.video.mute();
    else await tracks.video.unmute();
    setCamOn(!camOn);
  };

  const toggleMic = async () => {
    if (!tracks.audio) return;
    if (micOn) await tracks.audio.mute();
    else await tracks.audio.unmute();
    setMicOn(!micOn);
  };

  return (
    <div className={styles.stage}>
      <video ref={videoRef} className={styles.video} muted playsInline hidden={!camOn || !tracks.video} />
      {tracks.video && !camOn && <CameraOff nickname={nickname} />}

      {connection !== ConnectionState.Connected && (
        <div className={styles.stageMessage}>
          {connection === ConnectionState.Reconnecting ? '다시 연결하는 중...' : '연결하는 중...'}
        </div>
      )}

      {mediaError && (
        <div className={styles.stageMessage}>
          <p>{mediaError}</p>
          <button className={styles.primaryButton} onClick={startMedia}>다시 시도</button>
        </div>
      )}

      {tracks.video && (
        <div className={styles.mediaControls}>
          <button onClick={toggleCam} className={camOn ? '' : styles.off}>
            {camOn ? '📷 카메라 끄기' : '📷 카메라 켜기'}
          </button>
          <button onClick={toggleMic} className={micOn ? '' : styles.off}>
            {micOn ? '🎙️ 마이크 끄기' : '🔇 마이크 켜기'}
          </button>
        </div>
      )}
      {!micOn && <span className={styles.micBadge}>🔇 음소거 중</span>}
    </div>
  );
}

// ========================= 시청자 =========================

function HostVideo({ trackRef, nickname, profileUrl }) {
  const muted = useIsMuted(trackRef);
  if (!trackRef.publication || muted) {
    return <CameraOff nickname={nickname} profileUrl={profileUrl} />;
  }
  return <VideoTrack trackRef={trackRef} className={styles.video} />;
}

function MicBadge({ trackRef }) {
  const muted = useIsMuted(trackRef);
  return muted ? <span className={styles.micBadge}>🔇 방송자 마이크 꺼짐</span> : null;
}

export function ViewerStage({ hostSeq, nickname, profileUrl }) {
  const identity = String(hostSeq);
  const connection = useConnectionState();
  const cams = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }], { onlySubscribed: false });
  const mics = useTracks([{ source: Track.Source.Microphone, withPlaceholder: true }], { onlySubscribed: false });
  const cam = cams.find((t) => t.participant.identity === identity);
  const mic = mics.find((t) => t.participant.identity === identity);

  return (
    <div className={styles.stage}>
      {cam ? (
        <HostVideo trackRef={cam} nickname={nickname} profileUrl={profileUrl} />
      ) : (
        <div className={styles.stageMessage}>
          {connection === ConnectionState.Connected
            ? '방송자의 연결을 기다리는 중이에요...'
            : '연결하는 중...'}
        </div>
      )}
      {mic && <MicBadge trackRef={mic} />}

      <RoomAudioRenderer />
      {/* 브라우저 자동재생 정책으로 소리가 막혔을 때만 보임 → room.startAudio() */}
      <StartAudio label="🔊 소리 켜기" className={styles.startAudio} />
    </div>
  );
}
