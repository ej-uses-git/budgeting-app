import * as HttpApi from "@effect/platform/HttpApi";

import { PlansGroup } from "./PlansGroup.js";
import { TransactionsGroup } from "./TransactionsGroup.js";

export const Api = HttpApi.make("Budgeting")
  .add(PlansGroup)
  .add(TransactionsGroup);
