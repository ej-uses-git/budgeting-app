import * as Schema from "effect/Schema";

import * as Currency from "./Currency.js";
import * as Recurrence from "./Recurrence.js";

export enum TransactionKind {
  EXPECTED_PAYMENT = 0,
  LIMIT = 1,
  INCOME = 2,
}

const NAME_MAX_LENGTH = 255;

export const Plan = Schema.Struct({
  cost: Currency.Cost,
  kind: Schema.Enums(TransactionKind),
  name: Schema.NonEmptyString.pipe(Schema.maxLength(NAME_MAX_LENGTH)),
  recurrence: Recurrence.Recurrence,
});
export type Plan = typeof Plan.Type;

export const Transaction = Schema.Struct({
  ...Plan.omit("recurrence").fields,
  actual: Schema.Array(Currency.Payment),
  date: Schema.DateTimeUtc,
});
export type Transaction = typeof Transaction.Type;
