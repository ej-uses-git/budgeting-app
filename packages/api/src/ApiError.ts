import * as HttpApiSchema from "@effect/platform/HttpApiSchema";
import * as Budget from "@repo/domain/Budget";
import * as Schema from "effect/Schema";

export class PlanAlreadyExists extends Schema.TaggedError<PlanAlreadyExists>()(
  "PlanAlreadyExists",
  {
    name: Budget.Plan.fields.name,
  },
  HttpApiSchema.annotations({ status: 409 }),
) {}

export class NoSuchTransaction extends Schema.TaggedError<NoSuchTransaction>()(
  "NoSuchTransaction",
  {
    date: Budget.Transaction.fields.date,
    name: Budget.Transaction.fields.name,
  },
  HttpApiSchema.annotations({ status: 404 }),
) {}
