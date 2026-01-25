import { HttpApiBuilder } from "@effect/platform";
import * as Api from "@repo/api/Api";

import { BudgetRepository } from "./BudgetRepository";

export const TransactionsGroupHandler = HttpApiBuilder.group(
  Api.Api,
  "Transactions",
  (handlers) =>
    handlers
      .handle("getUpcoming", () => BudgetRepository.readUpcomingTransactions)
      .handle("getDue", () => BudgetRepository.readDueTransactions)
      .handle("patchActual", ({ payload: { name, date, amount } }) =>
        BudgetRepository.updateTransactionActual(name, date, amount),
      ),
);
