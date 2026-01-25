import { HttpMiddleware } from "@effect/platform";
import * as NodeHttpServer from "@effect/platform-node/NodeHttpServer";
import * as NodeRuntime from "@effect/platform-node/NodeRuntime";
import * as HttpApiBuilder from "@effect/platform/HttpApiBuilder";
import * as HttpApiSwagger from "@effect/platform/HttpApiSwagger";
import * as HttpServer from "@effect/platform/HttpServer";
import * as Api from "@repo/api/Api";
import * as Config from "effect/Config";
import * as Layer from "effect/Layer";
import { createServer } from "node:http";

import { BudgetRepository } from "./BudgetRepository";
import { PlansGroupHandler } from "./PlansGroupHandler";
import { TransactionsGroupHandler } from "./TransactionsGroupHandler";

const ApiLive = HttpApiBuilder.api(Api.Api).pipe(
  Layer.provide(PlansGroupHandler),
  Layer.provide(TransactionsGroupHandler),
  Layer.provide(BudgetRepository.Test),
);

const DEFAULT_PORT = 7654;

const ServerLive = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(HttpApiSwagger.layer()),
  Layer.provide(ApiLive),
  HttpServer.withLogAddress,
  Layer.provide(
    NodeHttpServer.layerConfig(createServer, {
      port: Config.port().pipe(Config.withDefault(DEFAULT_PORT)),
    }),
  ),
);

Layer.launch(ServerLive).pipe(NodeRuntime.runMain);
