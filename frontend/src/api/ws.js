// WebSocket(STOMP) 서버 주소 (CONVENTION 6-5: 서버 주소를 코드에 직접 쓰지 않고 여기서만 만든다)
// - 개발: Vite(5173)로 열었으면 백엔드 80 포트로 연결
// - 배포: 페이지를 연 주소(호스트·포트)를 그대로 사용, https 페이지면 wss
// 예) wsUrl('/live') → ws://localhost:80/live
export function wsUrl(path) {
  const { protocol, hostname, port } = window.location;
  const scheme = protocol === 'https:' ? 'wss' : 'ws';
  const host = hostname || 'localhost';
  const wsPort = port === '5173' ? ':80' : (port ? `:${port}` : '');
  return `${scheme}://${host}${wsPort}${path}`;
}