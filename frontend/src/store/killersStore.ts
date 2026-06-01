import { create } from "zustand";
import axios from "axios";

export type Killers = {
  id: number;
  in_game_name: string;
  name: string;
  game_aliases: string | null;
  gender: string;
  power_attack_type: string;
  movement_speed: string;
  alternative_movement_speed: string | null;
  terror_radius: string;
  height: string;
  image_url: string;
  result: any;
};

export type KillersArray = {
  killers: Killers[];
};

export const fetchKillers = async (): Promise<KillersArray> => {
  const res = await axios.get("http://localhost:5000/get-killers");

  if (!res.data) throw new Error("Failed to fetch killers");

  return res.data;
};

export const fetchSelectedKiller = async (): Promise<Killers[]> => {
  const res = await axios.get("http://localhost:5000/get-selected-killer");

  if (!res.data) throw new Error("Failed to fetch killers");

  return res.data;
};

type UIStore = {
  selectedKillerId: number | null;
  search: string;

  setSelectedKiller: (id: number) => void;
  setSearch: (value: string) => void;
};

export const useUIStore = create<UIStore>((set) => ({
  selectedKillerId: null,
  search: "",

  setSelectedKiller: (id) => set({ selectedKillerId: id }),
  setSearch: (value) => set({ search: value }),
}));
