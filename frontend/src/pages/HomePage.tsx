import { useNavigate } from "react-router-dom";

const sections = [
  {
    title: "Random Builds",
    description: "Losuj buildy dla Killera i Survivora",
    path: "/builds",
    emoji: "🎲",
  },
  {
    title: "DBDle",
    description: "Zgadnij perk, killera lub survivora",
    path: "/dbdle",
    emoji: "🧩",
  },
  {
    title: "Perks",
    description: "Przeglądaj wszystkie perki",
    path: "/perks",
    emoji: "📚",
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <>
      <h1 className="text-4xl font-bold mb-10">Dead by Daylight</h1>

      <div className="grid gap-6 md:grid-cols-3 w-full max-w-5xl">
        {sections.map((section) => (
          <div
            key={section.title}
            onClick={() => navigate(section.path)}
            className="cursor-pointer bg-zinc-900 p-6 rounded-2xl hover:scale-105 hover:bg-zinc-800 transition-all shadow-lg"
          >
            <div className="text-4xl mb-4">{section.emoji}</div>

            <h2 className="text-xl font-semibold mb-2">{section.title}</h2>

            <p className="text-zinc-400 text-sm">{section.description}</p>
          </div>
        ))}
      </div>
    </>
  );
}
