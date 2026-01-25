import { AtomHttpApi } from "@effect-atom/atom-react";
import * as FetchHttpClient from "@effect/platform/FetchHttpClient";
import * as Api from "@repo/api/Api";

export class BudgetingClient extends AtomHttpApi.Tag<BudgetingClient>()(
  "BudgetingClient",
  {
    api: Api.Api,
    httpClient: FetchHttpClient.layer,
  },
) {}
