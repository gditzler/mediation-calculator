import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
} from "react";
import type { Tab } from "../types";

export interface TabState {
  tabs: Tab[];
  activeTabId: string;
}

export type TabAction =
  | { type: "OPEN_MEDIATION"; mediationId: string; label: string }
  | { type: "CLOSE_TAB"; tabId: string }
  | { type: "SET_ACTIVE"; tabId: string }
  | { type: "UPDATE_LABEL"; tabId: string; label: string };

export const HOME_TAB: Tab = {
  id: "home",
  type: "home",
  label: "Home",
};

function tabReducer(state: TabState, action: TabAction): TabState {
  switch (action.type) {
    case "OPEN_MEDIATION": {
      const existing = state.tabs.find(
        (t) => t.type === "mediation" && t.mediationId === action.mediationId
      );
      if (existing) {
        return { ...state, activeTabId: existing.id };
      }
      const newTab: Tab = {
        id: `mediation-${action.mediationId}`,
        type: "mediation",
        mediationId: action.mediationId,
        label: action.label,
      };
      return {
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id,
      };
    }

    case "CLOSE_TAB": {
      if (action.tabId === HOME_TAB.id) {
        return state;
      }
      const idx = state.tabs.findIndex((t) => t.id === action.tabId);
      if (idx === -1) {
        return state;
      }
      const newTabs = state.tabs.filter((t) => t.id !== action.tabId);
      let newActiveId = state.activeTabId;
      if (state.activeTabId === action.tabId) {
        // Switch to adjacent tab: prefer the one before, otherwise the one after
        if (idx > 0) {
          newActiveId = newTabs[idx - 1].id;
        } else if (newTabs.length > 0) {
          newActiveId = newTabs[0].id;
        } else {
          newActiveId = HOME_TAB.id;
        }
      }
      return { tabs: newTabs, activeTabId: newActiveId };
    }

    case "SET_ACTIVE": {
      const exists = state.tabs.some((t) => t.id === action.tabId);
      if (!exists) {
        return state;
      }
      return { ...state, activeTabId: action.tabId };
    }

    case "UPDATE_LABEL": {
      return {
        ...state,
        tabs: state.tabs.map((t) =>
          t.id === action.tabId ? { ...t, label: action.label } : t
        ),
      };
    }

    default:
      return state;
  }
}

interface TabContextValue {
  state: TabState;
  dispatch: React.Dispatch<TabAction>;
}

const TabContext = createContext<TabContextValue>({
  state: { tabs: [HOME_TAB], activeTabId: HOME_TAB.id },
  dispatch: () => {},
});

export function TabProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(tabReducer, {
    tabs: [HOME_TAB],
    activeTabId: HOME_TAB.id,
  });

  return (
    <TabContext.Provider value={{ state, dispatch }}>
      {children}
    </TabContext.Provider>
  );
}

export function useTabs() {
  return useContext(TabContext);
}
