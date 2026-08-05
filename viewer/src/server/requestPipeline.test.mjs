import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";
import { EventEmitter } from "node:events";

import {
  createRequestPipeline,
  installProcessErrorGuards,
} from "./requestPipeline.mjs";

const host = "127.0.0.1";

async function startPipelineServer(t, middlewares) {
  const logs = [];
  const pipeline = createRequestPipeline({
    middlewares,
    log: (message) => logs.push(message),
  });
  const server = http.createServer(pipeline.handleRequest);
  const port = await new Promise((resolve) => {
    server.listen(0, host, () => resolve(server.address().port));
  });
  t.after(() => new Promise((resolve) => server.close(() => resolve())));
  return { pipeline, logs, port, server };
}

function request(port, requestPath) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host, port, path: requestPath, method: "GET" }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("error", reject);
      res.on("end", () => resolve({
        statusCode: res.statusCode,
        body: Buffer.concat(chunks).toString("utf8"),
        aborted: res.destroyed && !res.complete,
      }));
    });
    req.on("error", reject);
    req.end();
  });
}

function okMiddleware(req, res) {
  res.statusCode = 200;
  res.end("ok");
}

test("a middleware that throws synchronously yields 500 and leaves the server responsive", async (t) => {
  const { logs, port } = await startPipelineServer(t, [
    (req, res, next) => {
      if (req.url === "/boom") {
        throw new Error("synchronous handler failure");
      }
      next();
    },
    okMiddleware,
  ]);

  const failed = await request(port, "/boom");
  assert.equal(failed.statusCode, 500);
  assert.equal(failed.body, "Internal Server Error");

  const followUp = await request(port, "/healthy");
  assert.equal(followUp.statusCode, 200);
  assert.equal(followUp.body, "ok");

  assert.equal(logs.length, 1);
  assert.match(logs[0], /GET \/boom/u);
  assert.match(logs[0], /synchronous handler failure/u);
});

test("a middleware that rejects asynchronously yields 500 and leaves the server responsive", async (t) => {
  const { logs, port } = await startPipelineServer(t, [
    async (req, res, next) => {
      if (req.url === "/boom") {
        await Promise.resolve();
        throw new Error("asynchronous handler failure");
      }
      next();
    },
    okMiddleware,
  ]);

  const failed = await request(port, "/boom");
  assert.equal(failed.statusCode, 500);
  assert.equal(failed.body, "Internal Server Error");

  const followUp = await request(port, "/healthy");
  assert.equal(followUp.statusCode, 200);
  assert.equal(followUp.body, "ok");

  assert.equal(logs.length, 1);
  assert.match(logs[0], /asynchronous handler failure/u);
});

test("a failure after headers are sent destroys the response instead of throwing", async (t) => {
  const { logs, port } = await startPipelineServer(t, [
    (req, res, next) => {
      if (req.url !== "/late-failure") {
        next();
        return;
      }
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.write("partial");
      throw new Error("failure after headers");
    },
    okMiddleware,
  ]);

  const truncated = await request(port, "/late-failure").catch((error) => error);
  // Node surfaces the destroyed socket either as a response error or as a
  // response that ends without completing; both prove the process survived.
  if (truncated instanceof Error) {
    assert.match(String(truncated.code || truncated.message), /ECONNRESET|aborted/u);
  } else {
    assert.equal(truncated.statusCode, 200);
  }

  const followUp = await request(port, "/healthy");
  assert.equal(followUp.statusCode, 200);

  assert.equal(logs.length, 1);
  assert.match(logs[0], /failure after headers/u);
});

test("an exhausted middleware chain still returns 404", async (t) => {
  const { logs, port } = await startPipelineServer(t, [
    (req, res, next) => next(),
  ]);

  const missing = await request(port, "/nothing-here");
  assert.equal(missing.statusCode, 404);
  assert.equal(missing.body, "Not found");
  assert.deepEqual(logs, []);
});

test("only the first failure per request is reported", async (t) => {
  const { logs, port } = await startPipelineServer(t, [
    async (req, res, next) => {
      next();
      await Promise.resolve();
      throw new Error("outer late failure");
    },
    () => {
      throw new Error("inner failure");
    },
  ]);

  const failed = await request(port, "/double");
  assert.equal(failed.statusCode, 500);

  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(logs.length, 1);
  assert.match(logs[0], /inner failure/u);
});

test("describeInFlightRequests reports active requests and clears them afterwards", async (t) => {
  let observed = null;
  let release = () => {};
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const { pipeline, port } = await startPipelineServer(t, [
    async (req, res) => {
      observed = pipeline.describeInFlightRequests();
      await gate;
      res.statusCode = 200;
      res.end("ok");
    },
  ]);

  const pending = request(port, "/slow");
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.deepEqual(observed, ["GET /slow"]);
  release();
  await pending;

  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.deepEqual(pipeline.describeInFlightRequests(), []);
});

test("installProcessErrorGuards logs instead of exiting and includes in-flight requests", () => {
  const logs = [];
  const target = new EventEmitter();
  const uninstall = installProcessErrorGuards({
    log: (message) => logs.push(message),
    describeContext: () => ["GET /__cad/foo%zz.step"],
    target,
  });

  target.emit("unhandledRejection", new Error("stray rejection"));
  target.emit("uncaughtException", new Error("stray throw"));

  assert.equal(logs.length, 2);
  assert.match(logs[0], /unhandled rejection: Error: stray rejection/u);
  assert.match(logs[0], /in-flight: GET \/__cad\/foo%zz\.step/u);
  assert.match(logs[1], /uncaught exception: Error: stray throw/u);

  uninstall();
  target.emit("unhandledRejection", new Error("after uninstall"));
  assert.equal(logs.length, 2);
});

test("installProcessErrorGuards omits the context suffix when nothing is in flight", () => {
  const logs = [];
  const target = new EventEmitter();
  const uninstall = installProcessErrorGuards({
    log: (message) => logs.push(message),
    target,
  });

  target.emit("unhandledRejection", "plain string reason");
  assert.equal(logs.length, 1);
  assert.match(logs[0], /unhandled rejection: plain string reason$/u);

  uninstall();
});
