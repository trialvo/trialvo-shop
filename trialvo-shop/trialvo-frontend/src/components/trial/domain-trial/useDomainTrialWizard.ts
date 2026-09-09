"use client";

import { useCallback, useReducer } from "react";

/**
 * Wizard navigation state, kept separate from form values (react-hook-form
 * owns those). A reducer rather than three useStates so "back", "next" and
 * "jump to submitted" are explicit, testable transitions.
 */
export type WizardStep = "pick" | "hosting" | "duration" | "contact" | "submitted";

export const ORDERED_STEPS: WizardStep[] = ["hosting", "duration", "contact"];

type State = {
  step: WizardStep;
  /** Slide direction for the step transition animation */
  direction: 1 | -1;
};

type Action =
  | { type: "GO"; step: WizardStep }
  | { type: "NEXT" }
  | { type: "BACK" }
  | { type: "RESET"; hasProduct: boolean };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "GO": {
      const from = ORDERED_STEPS.indexOf(state.step);
      const to = ORDERED_STEPS.indexOf(action.step);
      return { step: action.step, direction: to >= from ? 1 : -1 };
    }
    case "NEXT": {
      const i = ORDERED_STEPS.indexOf(state.step);
      if (state.step === "pick") return { step: "hosting", direction: 1 };
      if (i === -1 || i === ORDERED_STEPS.length - 1) return { step: "submitted", direction: 1 };
      return { step: ORDERED_STEPS[i + 1], direction: 1 };
    }
    case "BACK": {
      const i = ORDERED_STEPS.indexOf(state.step);
      if (i <= 0) return state;
      return { step: ORDERED_STEPS[i - 1], direction: -1 };
    }
    case "RESET":
      return { step: action.hasProduct ? "hosting" : "pick", direction: 1 };
    default:
      return state;
  }
}

export function useDomainTrialWizard(hasProduct: boolean) {
  const [state, dispatch] = useReducer(reducer, { step: hasProduct ? "hosting" : "pick", direction: 1 });

  const next = useCallback(() => dispatch({ type: "NEXT" }), []);
  const back = useCallback(() => dispatch({ type: "BACK" }), []);
  const go = useCallback((step: WizardStep) => dispatch({ type: "GO", step }), []);
  const reset = useCallback((withProduct: boolean) => dispatch({ type: "RESET", hasProduct: withProduct }), []);

  const index = ORDERED_STEPS.indexOf(state.step);
  return {
    step: state.step,
    direction: state.direction,
    /** 0-based index within the numbered steps; -1 for pick/submitted */
    index,
    isFirst: index === 0,
    isLast: index === ORDERED_STEPS.length - 1,
    next,
    back,
    go,
    reset,
  };
}
