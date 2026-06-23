"use client";

import { useCallback, useReducer } from "react";
import {
  cloneMapEditSnapshot,
  MAP_EDIT_HISTORY_LIMIT,
  type MapEditSnapshot,
} from "@/lib/map-edit-history";

type HistoryState = {
  past: MapEditSnapshot[];
  present: MapEditSnapshot;
  future: MapEditSnapshot[];
};

type HistoryAction =
  | { type: "mutate"; recipe: (prev: MapEditSnapshot) => MapEditSnapshot }
  | { type: "patch"; recipe: (prev: MapEditSnapshot) => MapEditSnapshot }
  | { type: "record" }
  | { type: "undo" }
  | { type: "redo" };

function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case "patch":
      return {
        ...state,
        present: action.recipe(state.present),
      };
    case "mutate": {
      const next = action.recipe(state.present);
      if (next === state.present) return state;
      return {
        past: [
          ...state.past.slice(-(MAP_EDIT_HISTORY_LIMIT - 1)),
          cloneMapEditSnapshot(state.present),
        ],
        present: next,
        future: [],
      };
    }
    case "record":
      return {
        ...state,
        past: [
          ...state.past.slice(-(MAP_EDIT_HISTORY_LIMIT - 1)),
          cloneMapEditSnapshot(state.present),
        ],
        future: [],
      };
    case "undo": {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1]!;
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [cloneMapEditSnapshot(state.present), ...state.future],
      };
    }
    case "redo": {
      if (state.future.length === 0) return state;
      const next = state.future[0]!;
      return {
        past: [
          ...state.past.slice(-(MAP_EDIT_HISTORY_LIMIT - 1)),
          cloneMapEditSnapshot(state.present),
        ],
        present: next,
        future: state.future.slice(1),
      };
    }
    default: {
      const _exhaustive: never = action;
      return state;
    }
  }
}

export function useMapEditHistory(initial: MapEditSnapshot) {
  const [state, dispatch] = useReducer(historyReducer, {
    past: [],
    present: cloneMapEditSnapshot(initial),
    future: [],
  });

  const patch = useCallback((recipe: (prev: MapEditSnapshot) => MapEditSnapshot) => {
    dispatch({ type: "patch", recipe });
  }, []);

  const mutate = useCallback((recipe: (prev: MapEditSnapshot) => MapEditSnapshot) => {
    dispatch({ type: "mutate", recipe });
  }, []);

  const record = useCallback(() => {
    dispatch({ type: "record" });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: "undo" });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: "redo" });
  }, []);

  return {
    lots: state.present.lots,
    places: state.present.places,
    valves: state.present.valves,
    mutate,
    patch,
    record,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
