import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder";
import * as Api from "@repo/api/Api";

import { BudgetRepository } from "./BudgetRepository";

export const PlansGroupHandler = HttpApiBuilder.group(
  Api.Api,
  "Plans",
  (handlers) =>
    handlers
      .handle("getPlans", () => BudgetRepository.readPlans)
      .handle("postPlans", ({ payload }) =>
        BudgetRepository.createPlan(payload),
      ),
);
