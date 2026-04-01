import { Navigate, Route, Routes } from "react-router-dom";
import { story1 } from "./data/story1";
import { story2 } from "./data/story2";
import { LandingPage } from "./pages/LandingPage";
import { StoryPage } from "./pages/StoryPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/story/1"
        element={<Navigate replace to={`${story1.routeBase}/${story1.startNodeId}`} />}
      />
      <Route
        path="/story/2"
        element={<Navigate replace to={`${story2.routeBase}/${story2.startNodeId}`} />}
      />
      <Route path="/story/:storyId/:nodeId" element={<StoryPage />} />
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}
