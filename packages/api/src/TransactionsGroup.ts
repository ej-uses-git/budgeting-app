import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import * as Budget from "@repo/domain/Budget";
import * as Currency from "@repo/domain/Currency";
import * as Schema from "effect/Schema";

import * as ApiError from "./ApiError";

export const TransactionsGroup = HttpApiGroup.make("Transactions")
  .add(
    HttpApiEndpoint.get("getUpcoming")`/upcoming`.addSuccess(
      Schema.Array(Budget.Transaction),
    ),
  )
  .add(
    HttpApiEndpoint.get("getDue")`/due`.addSuccess(
      Schema.Array(Budget.Transaction),
    ),
  )
  .add(
    HttpApiEndpoint.patch("patchActual")`/actual`
      .setPayload(
        Schema.Struct({
          ...Budget.Transaction.pick("name", "date").fields,
          amount: Currency.Cost,
        }),
      )
      .addSuccess(Schema.Void)
      .addError(ApiError.NoSuchTransaction),
  )
  .prefix("/transactions");
