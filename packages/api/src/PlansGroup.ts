import * as HttpApiEndpoint from "@effect/platform/HttpApiEndpoint";
import * as HttpApiGroup from "@effect/platform/HttpApiGroup";
import * as Budget from "@repo/domain/Budget";
import * as Schema from "effect/Schema";

import * as ApiError from "./ApiError";

export const PlansGroup = HttpApiGroup.make("Plans")
  .add(HttpApiEndpoint.get("getPlans")`/`.addSuccess(Schema.Array(Budget.Plan)))
  .add(
    HttpApiEndpoint.post("postPlans")`/`
      .addSuccess(Schema.Void)
      .addError(ApiError.PlanAlreadyExists)
      .setPayload(Budget.Plan),
  )
  .prefix("/plans");
