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

export type Currency = Cost["currency"];

export const Payment = Schema.Struct({
  amount: Cost,
  date: Schema.DateTimeUtc,
});
export type Payment = typeof Payment.Type;

export const sum = (amounts: readonly Cost[]) =>
  amounts.reduce<Cost>(
    (acc, cur) => {
      if (acc.ratio < cur.ratio) {
        const diff = cur.ratio / acc.ratio;
        return {
          amount: acc.amount * diff + cur.amount,
          // TODO: handle different currencies?
          currency: NIS,
          ratio: cur.ratio,
        };
      }

      const diff = acc.ratio / cur.ratio;
      return {
        amount: acc.amount + cur.amount * diff,
        // TODO: handle different currencies?
        currency: NIS,
        ratio: acc.ratio,
      };
    },
    { amount: 0, currency: NIS, ratio: 1 },
  );
