import * as Schema from "effect/Schema";

export const NIS = "NIS";
export type NIS = typeof NIS;
export const USD = "USD";
export type USD = typeof USD;

export const Cost = Schema.Struct({
  amount: Schema.Int,
  currency: Schema.Literal(NIS, USD),
  ratio: Schema.Int,
}).annotations({
  // oxlint-disable-next-line numeric-separators-style
  examples: [{ amount: 10092, currency: NIS, ratio: 100 }],
});
export type Cost = typeof Cost.Type;

export const Payment = Schema.Struct({
  amount: Cost,
  date: Schema.DateTimeUtc,
});
export type Payment = typeof Payment.Type;
