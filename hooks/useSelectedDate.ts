import { create } from "zustand";

interface SelectedDateStore {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

export const useSelectedDate = create<SelectedDateStore>((set) => ({
  selectedDate: new Date(),
  setSelectedDate: (date) => set({ selectedDate: date }),
}));
