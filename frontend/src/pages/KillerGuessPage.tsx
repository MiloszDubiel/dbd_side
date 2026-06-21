import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchKillers,
  fetchSelectedKiller,
  type KillersArray,
  type Killers,
} from "../store/killersStore";
import { useUIStore } from "../store/killersStore";

const columns = {
  Killer: "in_game_name",
  Gender: "gender",
  "Terror Radius": "terror_radius",
  "Movement Speed": "movement_speed",
  "Attack Type": "attack_type",
  Height: "height",
  Origin: "origin",
  "Release Date": "release_date",
};

const getValue = (
  col: string,
  guess: Killers,
): string | undefined | React.ReactNode => {
  const keysWithValues = Object.entries(guess);

  if (col === "movement_speed") {
    const movementSpeed = guess.movement_speed?.split(" ");
    const alterante = guess.alternate_movement_speed?.split(" ") || [];

    const defualtMvnts = ["4.6m/s", "4.4m/s", "4.2m/s", "3.85m/s"];

    return [...movementSpeed, ...alterante]
      .filter((el) => defualtMvnts.includes(el))
      .join(" ");
  }

  for (const [k, v] of keysWithValues) {
    if (k === "in_game_name") continue;

    if (k.includes(col.toLowerCase())) {
      console.log(...new Set(v.split(" ")));

      const values = [...new Set(v.split(" "))].join(" ");
      return values as string;
    }
  }
};
const getAttackTypeColor = (selectedType: string, guessType: string) => {
  if (selectedType === guessType) {
    return "bg-green-600";
  }

  const isClose =
    (selectedType === "Hybrid" && guessType === "Basic Attack") ||
    (selectedType === "Basic Attack" && guessType === "Hybrid") ||
    (selectedType === "Hybrid" && guessType === "Hybrid") ||
    (selectedType === "Ranged" && guessType === "Hybrid");

  if (isClose) {
    return "bg-yellow-500";
  }

  return "bg-red-600";
};

const getCellColor = (
  key: keyof Killers,
  selected: Killers[],
  guess: Killers,
) => {
  if (key === "in_game_name") return;

  const { movement_speed, alternate_movement_speed, terror_radius } =
    selected[0];
  const {
    movement_speed: movement_speed_guees,
    alternate_movement_speed: alternate_movement_speed_guess,
    terror_radius: terror_radius_guess,
  } = guess;

  const altMvt = [
    alternate_movement_speed?.split(" "),
    movement_speed.split(" ")[1],
  ];

  const altMvtGuess = [
    ...new Set([
      ...(alternate_movement_speed_guess
        ? alternate_movement_speed_guess.split(" ")
        : ""),
      movement_speed_guees.split(" ")[1],
    ]),
  ];

  const terr = terror_radius.split(" ");
  const terrGuess = terror_radius_guess.split(" ");

  if (terr.length === terrGuess.length && key === "terror_radius")
    return selected[0]["terror_radius"] === guess["terror_radius"]
      ? "bg-green-600"
      : "bg-red-600";

  if (terr.includes(terrGuess[0]) && key === "terror_radius") {
    return "bg-yellow-500";
  }

  if (!altMvtGuess.length)
    return selected[0]["movement_speed"] === guess["movement_speed"]
      ? "bg-green-600"
      : "bg-red-600";

  if (altMvtGuess.length > 1 && key === "movement_speed") {
    const checks = altMvt.some((v, i) => [...altMvtGuess][i] === v);
    if (checks) return "bg-yellow-500";
  }

  if (key === "attack_type") {
    return getAttackTypeColor(
      selected[0].power_attack_type as string,
      guess.power_attack_type as string,
    );
  }

  return selected[0][key] === guess[key] ? "bg-green-600" : "bg-red-600";
};

export default function KillerGuessPage() {
  const [guesses, setGuesses] = useState<Killers[]>([]);
  const [succes, setSucces] = useState<boolean>(false);
  const [unlock, setUnlock] = useState<boolean>(true);

  const search = useUIStore((s) => s.search);
  const setSearch = useUIStore((s) => s.setSearch);

  const { data: killers } = useQuery<KillersArray>({
    queryKey: ["killers"],
    queryFn: fetchKillers,
  });

  const { data: selectedKiller } = useQuery<KillersArray>({
    queryKey: ["selected-killer"],
    queryFn: fetchSelectedKiller,
  });

  console.log(selectedKiller?.killers[0], guesses);

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
    setGuesses((prev) => {
      const isAlreadyInState = prev.some((el) => el.id === killer.id);

      if (isAlreadyInState) return prev;
      return [...prev, killer];
    });
  };

  return (
    <div className="min-h-screen  text-white flex items-center justify-center p-6">
      <div className="w-137.5">
        <h1 className="text-4xl font-extrabold text-center mb-8 tracking-wide">
          DBDLE
        </h1>

        <form className="mb-6 flex flex-col items-center relative">
          {unlock && (
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Guess a killer..."
              className="w-full p-4 rounded-xl bg-zinc-800 border border-zinc-600 focus:outline-none text-lg"
            />
          )}
          {search.length > 0 && filteredKillers.length > 0 && (
            <div className="mt-2 z-10 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden shadow-xl w-1/2 flex flex-col items-center max-h-75 h-auto overflow-y-auto absolute top-16">
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

        <div className="grid grid-cols-8 mb-2 text-xs text-zinc-400 ">
          {Object.entries(columns).map(([k, v]) => (
            <div key={v} className="text-center uppercase">
              {k}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {guesses.map((guess, rowIndex) => (
            <div
              key={rowIndex}
              className="grid grid-cols-8  place-items-center"
            >
              {Object.entries(columns).map(([c, v], cellIndex) => {
                if (cellIndex === 0) {
                  setUnlock(false);
                } else if (
                  cellIndex === 6 &&
                  guess.id !== selectedKiller?.killers[0].id
                ) {
                  setTimeout(() => {
                    setUnlock(true);
                  }, 7 * 460);
                } else if (guess.id === selectedKiller?.killers[0].id) {
                  setTimeout(() => {
                    setSucces(true);
                  }, 7 * 460);
                }
                return (
                  <div
                    key={v}
                    style={{
                      animationDelay: `${cellIndex * 400}ms`,
                      backgroundImage:
                        c === "Killer"
                          ? `url("${guess.image_url}")`
                          : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                    }}
                    className={`w-16 h-16 flex items-center justify-center rounded-md border-gray-700 border text-xs font-semibold text-center opacity-0 animate-flip-in 
            ${getCellColor(
              v as keyof Killers,
              selectedKiller?.killers as Killers[],
              guess,
            )}
          `}
                  >
                    {getValue(v, guess)}
                    {v === "release_date" &&
                      guess.release_date !==
                        selectedKiller?.killers?.[0].release_date && (
                        <span className="flex justify-center items-center text-white text-4xl">
                          {Number(guess.release_date) <
                          Number(selectedKiller?.killers?.[0].release_date)
                            ? "↑"
                            : "↓"}
                        </span>
                      )}
                  </div>
                );
              })}
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
            <div className="w-4 h-4 bg-red-600 rounded" /> Far
          </div>
        </div>
        {succes && (
          <div className="flex flex-col items-center justify-center mt-8">
            <div className="relative">
              <img
                src={selectedKiller?.killers[0].image_url}
                alt={selectedKiller?.killers[0].in_game_name}
                className="h-60 rounded-xl border-2 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.5)]"
              />

              <p className="text-xl font-bold text-green-400 tracking-wide text-center">
                {selectedKiller?.killers[0].in_game_name}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
