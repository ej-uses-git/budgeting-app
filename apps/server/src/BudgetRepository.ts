import * as ApiError from "@repo/api/ApiError";
import * as Budget from "@repo/domain/Budget";
import * as Currency from "@repo/domain/Currency";
import * as Array from "effect/Array";
import * as DateTime from "effect/DateTime";
import * as Effect from "effect/Effect";
import * as Equal from "effect/Equal";
import { pipe } from "effect/Function";
import * as HashMap from "effect/HashMap";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Ref from "effect/Ref";

export class BudgetRepository extends Effect.Service<BudgetRepository>()(
  "BudgetRepository",
  {
    accessors: true,
    succeed: {
      createPlan: (plan: Budget.Plan) =>
        Effect.fail(ApiError.PlanAlreadyExists.make({ name: plan.name })).pipe(
          Effect.zipRight(Effect.void),
        ),
      readDueTransactions: Effect.succeed<Budget.Transaction[]>([]),
      readPlans: Effect.succeed<Budget.Plan[]>([]),
      readUpcomingTransactions: Effect.succeed<Budget.Transaction[]>([]),
      updateTransactionActual: (
        name: string,
        date: DateTime.Utc,
        amount: Currency.Cost,
      ) =>
        Effect.fail(ApiError.NoSuchTransaction.make({ date, name })).pipe(
          Effect.zipRight(Effect.log(amount)),
        ),
    },
  },
) {
  static Test = Layer.effect(
    BudgetRepository,
    Effect.gen(function* () {
      const plansRef = yield* Ref.make(HashMap.empty<string, Budget.Plan>());
      const transactionsRef = yield* Ref.make(
        HashMap.empty<string, Budget.Transaction[]>(),
      );

      return BudgetRepository.make({
        createPlan: Effect.fnUntraced(function* (plan) {
          const { name } = plan;
          const { startDate } = plan.recurrence.input;

          yield* pipe(
            yield* plansRef,
            HashMap.get(name),
            Option.match({
              onNone: Effect.fnUntraced(function* () {
                yield* Ref.update(plansRef, HashMap.set(name, plan));

                const planDates = plan.recurrence.between(
                  startDate,
                  DateTime.add(startDate, { years: 1 }),
                  true,
                );

                const planTransactions = planDates.map((date) =>
                  Budget.Transaction.make({
                    actual: [],
                    cost: plan.cost,
                    date,
                    kind: plan.kind,
                    name,
                  }),
                );

                yield* Ref.update(
                  transactionsRef,
                  HashMap.set(name, planTransactions),
                );
              }),
              onSome: () =>
                Effect.fail(ApiError.PlanAlreadyExists.make({ name })),
            }),
          );
        }),
        readDueTransactions: Effect.gen(function* () {
          const now = yield* DateTime.now;

          return pipe(
            yield* transactionsRef,
            HashMap.map(
              Array.findLast((transaction) =>
                DateTime.lessThan(transaction.date, now),
              ),
            ),
            HashMap.toValues,
            Array.getSomes,
          );
        }),
        readPlans: Ref.get(plansRef).pipe(Effect.map(HashMap.toValues)),
        readUpcomingTransactions: Effect.gen(function* () {
          const now = yield* DateTime.now;

          return pipe(
            yield* transactionsRef,
            HashMap.map(
              Array.findFirst((transaction) =>
                DateTime.greaterThanOrEqualTo(transaction.date, now),
              ),
            ),
            HashMap.toValues,
            Array.getSomes,
          );
        }),
        updateTransactionActual: Effect.fnUntraced(
          function* (name, date, amount) {
            const now = yield* DateTime.now;

            const transactionsMap = yield* transactionsRef;

            const [transaction, index] = yield* pipe(
              transactionsMap,
              HashMap.get(name),
              Option.flatMap(
                Array.findFirstWithIndex((transaction) =>
                  Equal.equals(transaction.date, date),
                ),
              ),
              Effect.mapError(() =>
                ApiError.NoSuchTransaction.make({ date, name }),
              ),
            );

            let newTransaction: Budget.Transaction;
            switch (transaction.kind) {
              case Budget.TransactionKind.EXPECTED_PAYMENT:
              case Budget.TransactionKind.INCOME: {
                newTransaction = {
                  ...transaction,
                  actual: [Currency.Payment.make({ amount, date: now })],
                };
                break;
              }
              case Budget.TransactionKind.LIMIT: {
                newTransaction = {
                  ...transaction,
                  actual: [
                    ...transaction.actual,
                    Currency.Payment.make({ amount, date: now }),
                  ],
                };
                break;
              }
            }

            yield* Ref.update(
              transactionsRef,
              HashMap.modify(name, Array.replace(index, newTransaction)),
            );
          },
        ),
      });
    }),
  );
}
