import * as DateTime from "effect/DateTime";
import { pipe } from "effect/Function";
import * as Option from "effect/Option";
import * as ParseResult from "effect/ParseResult";
import * as Schema from "effect/Schema";
// NOTE: RRule incorrectly defines an `index.d.ts`! We need to import it as a default-import
// oxlint-disable-next-line
import RRule from "rrule";

const MONTH_MAX = 12;
const HOUR_MAX = 23;
const MINUTE_MAX = 59;
const MONTH_DAY_MAX = 31;
const SECOND_MAX = 60;
const WEEK_NUMBER_MAX = 53;
const YEAR_DAY_MAX = 366;
const WEEKDAY_MAX = 6;

const WeekdayDay = Schema.Int.pipe(Schema.between(0, WEEKDAY_MAX));

const WeekdayFromDayAndNth = Schema.transform(
  Schema.Tuple(
    WeekdayDay,
    Schema.OptionFromNullOr(Schema.Int.pipe(Schema.nonNegative())),
  ),
  Schema.instanceOf(RRule.Weekday),
  {
    decode: (_toI, [weekdayDay, weekdayN]) =>
      new RRule.Weekday(weekdayDay, weekdayN ?? undefined),
    encode: (from) => [from.weekday, Option.fromNullable(from.n)] as const,
    strict: true,
  },
);

const WeekdayFromDay = Schema.transform(
  WeekdayDay,
  Schema.instanceOf(RRule.Weekday),
  {
    decode: (day) => new RRule.Weekday(day),
    encode: (from) => from.weekday,
    strict: true,
  },
);

const OptionalTimeZone = Schema.transformOrFail(
  Schema.NullOr(Schema.String),
  Schema.OptionFromNullOr(Schema.TimeZoneFromSelf),
  {
    decode: (toI, options) => {
      if (toI === null) return ParseResult.succeed(null);
      return ParseResult.decode(Schema.TimeZone)(toI, options);
    },
    encode: (fromA) =>
      ParseResult.succeed(
        pipe(
          fromA,
          Option.fromNullable,
          Option.map(DateTime.zoneToString),
          Option.getOrNull,
        ),
      ),
    strict: true,
  },
);

const absoluteBetween =
  <TSchema extends Schema.Any>(minimum: number, maximum: number) =>
  <TValue extends number>(
    self: TSchema &
      Schema.Schema<
        TValue,
        Schema.Schema.Encoded<TSchema>,
        Schema.Schema.Context<TSchema>
      >,
  ) =>
    self.pipe(
      Schema.filter(
        (value: number) => {
          if (value < 0) value = -value;
          return value >= minimum && value <= maximum;
        },
        {
          description: `a number with an absolute value between ${minimum} and ${maximum}`,
          jsonSchema: {
            anyOf: [
              { maximum, minimum },
              { maximum: -minimum, minimum: -maximum },
            ],
          },
          title: `absoluteBetween(${minimum}, ${maximum})`,
        },
      ),
    );

export const RecurrenceInput = Schema.Struct({
  byHour: Schema.Array(Schema.Int.pipe(Schema.between(0, HOUR_MAX))),
  byMinute: Schema.Array(Schema.Int.pipe(Schema.between(0, MINUTE_MAX))),
  byMonth: Schema.Array(Schema.Int.pipe(Schema.between(1, MONTH_MAX))),
  byMonthDay: Schema.Array(Schema.Int.pipe(absoluteBetween(1, MONTH_DAY_MAX))),
  bySecond: Schema.Array(Schema.Int.pipe(Schema.between(0, SECOND_MAX))),
  bySetPosition: Schema.Array(
    Schema.Int.pipe(absoluteBetween(1, YEAR_DAY_MAX)),
  ),
  byWeekNumber: Schema.Array(
    Schema.Int.pipe(absoluteBetween(1, WEEK_NUMBER_MAX)),
  ),
  byWeekday: Schema.Array(WeekdayFromDayAndNth),
  byYearDay: Schema.Array(Schema.Int.pipe(absoluteBetween(1, YEAR_DAY_MAX))),
  count: Schema.OptionFromNullOr(Schema.Int.pipe(Schema.positive())),
  endDate: Schema.OptionFromNullOr(Schema.DateTimeUtc),
  frequency: Schema.Enums(RRule.Frequency),
  interval: Schema.Int.pipe(Schema.positive()),
  startDate: Schema.DateTimeUtc,
  timeZone: OptionalTimeZone,
  weekStart: Schema.OptionFromNullOr(WeekdayFromDay),
});
export type RecurrenceInput = typeof RecurrenceInput.Type;

const fromBy = <TValue>(by: readonly TValue[]) => {
  if (by[0] !== undefined) return by[0];
  if (by.length > 0) return by as TValue[];
  return null;
};

class RecurrenceOutput {
  readonly #rule: RRule.RRule;

  constructor(public readonly input: RecurrenceInput) {
    this.#rule = new RRule.RRule({
      byhour: fromBy(input.byHour),
      byminute: fromBy(input.byMinute),
      bymonth: fromBy(input.byMonth),
      bymonthday: fromBy(input.byMonthDay),
      bysecond: fromBy(input.bySecond),
      bysetpos: fromBy(input.bySetPosition),
      byweekday: fromBy(input.byWeekday),
      byweekno: fromBy(input.byWeekNumber),
      byyearday: fromBy(input.byYearDay),
      count: Option.getOrNull(input.count),
      dtstart: DateTime.toDateUtc(input.startDate),
      freq: input.frequency,
      interval: input.interval,
      tzid: input.timeZone.pipe(
        Option.map(DateTime.zoneToString),
        Option.getOrNull,
      ),
      until: input.endDate.pipe(
        Option.map(DateTime.toDateUtc),
        Option.getOrNull,
      ),
      wkst: Option.getOrNull(input.weekStart),
    });
  }

  #toDateTime(date: Date): DateTime.Utc {
    // NOTE: asserting that `RRule` methods return valid dates!
    return DateTime.unsafeMake(date);
  }

  all(): DateTime.Utc[] {
    return this.#rule.all().map(this.#toDateTime);
  }

  between(
    start: DateTime.Utc,
    end: DateTime.Utc,
    inc?: boolean,
    iterator?: (date: DateTime.Utc, length: number) => boolean,
  ): DateTime.Utc[] {
    return this.#rule
      .between(
        DateTime.toDate(start),
        DateTime.toDate(end),
        inc,
        iterator
          ? (date, length) => iterator(this.#toDateTime(date), length)
          : undefined,
      )
      .map(this.#toDateTime);
  }

  after(date: DateTime.Utc): Option.Option<DateTime.Utc> {
    return pipe(
      date,
      DateTime.toDate,
      this.#rule.after,
      Option.fromNullable,
      Option.map(this.#toDateTime),
    );
  }

  before(date: DateTime.Utc): Option.Option<DateTime.Utc> {
    return pipe(
      date,
      DateTime.toDate,
      this.#rule.before,
      Option.fromNullable,
      Option.map(this.#toDateTime),
    );
  }
}

export const Recurrence = Schema.transform(
  RecurrenceInput,
  Schema.instanceOf(RecurrenceOutput),
  {
    decode: (from) => new RecurrenceOutput(from),
    encode: (to) => to.input,
    strict: true,
  },
);
export type Recurrence = typeof Recurrence.Type;

export const isRecurrence = (value: unknown): value is Recurrence =>
  Boolean(value) && value instanceof RecurrenceOutput;
