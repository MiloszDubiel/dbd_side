import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchKillers,
  fetchSelectedKiller,
  type KillersArray,
} from "../store/killersStore";
import { useUIStore } from "../store/killersStore";

const columns = [
  "Killer",
  "Gender",
  "Terror Radius",
  "Movement Speed",
  "Range Type",
  "Height",
  "Origin",
  "Release Date",
];

const getColor = (status: any) => {
  switch (status) {
    case "correct":
      return "bg-green-600 border-green-400";
    case "close":
      return "bg-yellow-500 border-yellow-300";
    case "far":
      return "bg-zinc-700 border-zinc-500";
    default:
      return "bg-zinc-800 border-zinc-600";
  }
};

type Killer = {
  id: number;
  name: string;
  in_game_name: string;
  game_aliases?: string;
};

export default function KillerGuessPage() {
  const [guesses, setGuesses] = useState<KillersArray[]>([]);

  const search = useUIStore((s) => s.search);
  const setSearch = useUIStore((s) => s.setSearch);

  const { data: killers } = useQuery({
    queryKey: ["killers"],
    queryFn: fetchKillers,
  });

  const { data: selectedKiller } = useQuery({
    queryKey: ["selectedKillers"],
    queryFn: fetchSelectedKiller,
  });

  const filteredKillers =
    killers.killers.filter((killer: KillersArray) => {
      const value = search.toLowerCase();

      return (
        killer.in_game_name?.toLowerCase().includes(value) ||
        killer.name?.toLowerCase().includes(value) ||
        killer.game_aliases?.toLowerCase().includes(value)
      );
    }) || [];

  const handleSelectKiller = (killer: KillersArray) => {
    setSearch(killer.in_game_name);
    console.log(killer);
  };

  // const handleSubmit = (e: any) => {
  //   e.preventDefault();
  //   if (!input.trim()) return;

  //   setGuesses((prev) => [
  //     {
  //       name: input,
  //       result: mockResult,
  //     },
  //     ...prev,
  //   ]);

  //   setInput("");
  // };

  return (
    <div className="min-h-screen  text-white flex items-center justify-center p-6">
      <div className="w-full max-w-6xl">
        <h1 className="text-4xl font-extrabold text-center mb-8 tracking-wide">
          DBDLE
        </h1>

        <form className="mb-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Guess a killer..."
            className="w-full p-4 rounded-xl bg-zinc-800 border border-zinc-600 focus:outline-none text-lg"
          />
          {search.length > 0 && filteredKillers.length > 0 && (
            <div className="mt-2 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden shadow-xl">
              {filteredKillers.slice(0, 5).map((killer: KillersArray) => (
                <button
                  key={killer.id}
                  type="button"
                  onClick={() => handleSelectKiller(killer)}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-zinc-700 transition border-b border-zinc-700 last:border-none"
                >
                  <img
                    src={killer.image_url}
                    alt={killer.in_game_name}
                    className="w-12 h-12 object-cover rounded-md"
                  />

                  <div className="text-left">
                    <div className="font-semibold">{killer.in_game_name}</div>

                    <div className="text-sm text-zinc-400">{killer.name}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </form>

        {/* Header */}
        <div className="grid grid-cols-8 gap-2 mb-2 text-xs text-zinc-400 px-2">
          {columns.map((col) => (
            <div key={col} className="text-center uppercase">
              {col}
            </div>
          ))}
        </div>

        {/* Guesses */}
        <div className="space-y-2">
          {guesses.map((guess, index) => (
            <div key={index} className="grid grid-cols-8 gap-2 animate-fade-in">
              {columns.map((col) => (
                <div
                  key={col}
                  className={`h-14 flex items-center justify-center rounded-md border text-xs font-semibold text-center px-1 ${getColor(
                    guess?.result[col],
                  )}`}
                >
                  {col === "Killer" ? guess?.name : ""}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-8 text-sm text-zinc-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 rounded" /> Correct
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded" /> Close
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-zinc-700 rounded" /> Far
          </div>
        </div>
      </div>
    </div>
  );
}
