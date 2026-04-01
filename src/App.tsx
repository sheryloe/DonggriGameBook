import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import StoryAudioController from "./components/StoryAudioController";
import LandingPage from "./pages/LandingPage";
import StoryPage from "./pages/StoryPage";

export default function App() {
  const location = useLocation();
  const isStory1Route = /^\/story\/1(\/|$)/.test(location.pathname);

  return (
    <div className="app-shell">
      <StoryAudioController enabled={true} path="/audio/story1.mp3" isActive={isStory1Route} />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/story/:storyId" element={<StoryPage />} />
        <Route path="/story/:storyId/:nodeId" element={<StoryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
