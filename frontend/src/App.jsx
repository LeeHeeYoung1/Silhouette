
import { Routes, Route, Navigate } from 'react-router-dom';

import Home from './pages/home/home';
import Login from './pages/login/login';
import Signup from './pages/signup/signup';
import Layout from './pages/layout/layout';
import MyPage from './pages/home/mypage/mypage';
import Post from './pages/post/post';
import Live from './pages/live/live';
import Chatting from './pages/chatting/chatting';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/post" element={<Post />} />
        <Route path="/board" element={<Post />} />
        <Route path="/live" element={<Live />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/chatting" element={<Chatting />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
