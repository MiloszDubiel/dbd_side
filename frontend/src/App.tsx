import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import bgImage from "../src/assets/background/dbd_background.jpg";
import DBDlePage from "./pages/DBDlePage";

function App() {
  return (
    <div
      className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.9)),
          url(${bgImage})
        `,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/builds" element={<div>Builds</div>} />
          <Route path="/dbdle" element={<DBDlePage />} />
          <Route path="/perks" element={<div>Perks</div>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
