import { useAtomValue, Result } from "@effect-atom/atom-react";
import { Inspectable } from "effect";

import { BudgetingClient } from "./BudgetingClient";

export default function App() {
  const budgets = useAtomValue(BudgetingClient.query("Plans", "getPlans", {}));

  return Result.match(budgets, {
    onFailure: ({ cause }) => (
      <div>
        ERROR: <pre>{Inspectable.format(cause)}</pre>
      </div>
    ),
    onInitial: () => <div>Loading...</div>,
    onSuccess: ({ value }) => <pre>{Inspectable.format(value)}</pre>,
  });
}
