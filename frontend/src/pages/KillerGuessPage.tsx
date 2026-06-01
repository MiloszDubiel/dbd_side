import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchKillers,
  fetchSelectedKiller,
  type KillersArray,
  type Killers,
} from "../store/killersStore";
import { useUIStore } from "../store/killersStore";

const columns = {
  Killer: "killer",
  Gender: "gender",
  "Terror Radius": "terror_radius",
  "Movement Speed": "movement_speed",
  "Attack Type": "attack_type",
  Height: "height",
  Origin: "origin",
  "Release Date": "release_date",
};

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

export default function KillerGuessPage() {
  const [guesses, setGuesses] = useState<Killers[]>([]);

  const search = useUIStore((s) => s.search);
  const setSearch = useUIStore((s) => s.setSearch);

  const { data: killers } = useQuery<KillersArray>({
    queryKey: ["killers"],
    queryFn: fetchKillers,
  });

  console.log(guesses);

  const { data: selectedKiller } = useQuery<Killers[]>({
    queryKey: ["selected-killer"],
    queryFn: fetchSelectedKiller,
  });

  const filteredKillers =
    killers?.killers?.filter((killer) => {
      const value = search.toLowerCase();

      return (
        killer.in_game_name?.toLowerCase().includes(value) ||
        killer.name?.toLowerCase().includes(value) ||
        killer.game_aliases?.toLowerCase().includes(value)
      );
    }) || [];

  const handleSelectKiller = (killer: Killers) => {
    setGuesses((prev) => [...prev, killer]);
  };

  const getValue = (col: string, guess: Killers): string | undefined => {
    const keysWithValues = Object.entries(guess);

    if (col === "killer") return guess.in_game_name;

    for (const [k, v] of keysWithValues) {
      if (k.includes(col.toLowerCase())) return v as string;
    }
  };

  return (
    <div className="min-h-screen  text-white flex items-center justify-center p-6">
      <div className="w-full max-w-6xl">
        <h1 className="text-4xl font-extrabold text-center mb-8 tracking-wide">
          DBDLE
        </h1>

        <form className="mb-6 flex flex-col items-center relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Guess a killer..."
            className="w-full p-4 rounded-xl bg-zinc-800 border border-zinc-600 focus:outline-none text-lg"
          />
          {search.length > 0 && filteredKillers.length > 0 && (
            <div className="mt-2 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden shadow-xl w-1/2 flex flex-col  items-center max-h-75 h-auto overflow-y-auto absolute top-16">
              {filteredKillers.map((killer: Killers) => (
                <button
                  key={killer.id}
                  type="button"
                  onClick={() => {
                    handleSelectKiller(killer);
                    setSearch("");
                  }}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-zinc-700 transition border-b border-zinc-700 last:border-none cursor-pointer "
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

        <div className="grid grid-cols-8 gap-2 mb-2 text-xs text-zinc-400 px-2">
          {Object.entries(columns).map(([k, v]) => (
            <div key={v} className="text-center uppercase">
              {k}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {guesses.map((guess, index) => (
            <div key={index} className="grid grid-cols-8 gap-2 animate-fade-in">
              {Object.entries(columns).map(([k, v]) => (
                <div
                  key={v}
                  className={`h-14 flex items-center justify-center rounded-md border text-xs font-semibold text-center px-1 ${getColor(
                    " guess?.result[col",
                  )}`}
                >
                  {getValue(v, guess)}
                </div>
              ))}
            </div>
          ))}
        </div>

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
