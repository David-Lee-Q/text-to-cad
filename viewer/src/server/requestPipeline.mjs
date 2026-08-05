const DEFAULT_LOG = (message) => process.stderr.write(`${message}\n`);

function describeError(error) {
  if (error instanceof Error) {
    return error.stack || `${error.name}: ${error.message}`;
  }
  return String(error);
}

function describeRequest(req) {
  const method = String(req?.method || "?");
  const url = String(req?.url || "");
  return url ? `${method} ${url}` : method;
}

/**
 * Turn an unexpected handler failure into a 500 instead of an unhandled throw.
 * Once headers are on the wire a status code is no longer negotiable, so the
 * response is destroyed to signal the truncation to the client.
 */
export function respondWithInternalError(error, req, res, { log = DEFAULT_LOG } = {}) {
  log(`CAD Viewer backend request failed (${describeRequest(req)}): ${describeError(error)}`);
  if (!res || res.writableEnded) {
    return;
  }
  try {
    if (res.headersSent) {
      res.destroy();
      return;
    }
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Internal Server Error");
  } catch (responseError) {
    log(`CAD Viewer backend failed to send 500 (${describeRequest(req)}): ${describeError(responseError)}`);
    try {
      res.destroy();
    } catch {
      // The socket is already gone; nothing left to clean up.
    }
  }
}

/**
 * Build the http request listener from an ordered middleware chain. Each
 * middleware is invoked as `middleware(req, res, next)`; synchronous throws and
 * rejected promises are both contained so one malformed request cannot take the
 * whole server process down.
 */
export function createRequestPipeline({ middlewares = [], log = DEFAULT_LOG } = {}) {
  const chain = [...middlewares];
  const inFlight = new Set();

  function handleRequest(req, res) {
    inFlight.add(req);
    const release = () => inFlight.delete(req);
    res?.once?.("close", release);
    res?.once?.("finish", release);

    // Only the first failure for a request gets a response; later ones are
    // logged by respondWithInternalError but cannot rewrite a sent status.
    let failed = false;
    const fail = (error) => {
      if (failed) {
        return;
      }
      failed = true;
      respondWithInternalError(error, req, res, { log });
    };

    const runFrom = (index) => {
      if (failed) {
        return;
      }
      const middleware = chain[index];
      if (!middleware) {
        res.statusCode = 404;
        res.end("Not found");
        return;
      }
      try {
        const result = middleware(req, res, () => runFrom(index + 1));
        if (result && typeof result.then === "function") {
          Promise.resolve(result).catch(fail);
        }
      } catch (error) {
        fail(error);
      }
    };

    runFrom(0);
  }

  return {
    handleRequest,
    describeInFlightRequests() {
      return [...inFlight].map((req) => describeRequest(req));
    },
  };
}

/**
 * Last-resort guards. An agent session that launched the Viewer should not lose
 * it to a stray async throw, so both handlers log and keep the process alive
 * rather than exiting. This can mask real bugs, which is why the log carries the
 * in-flight request URLs: a crash-shaped log line with the offending request is
 * more diagnosable than a dead process.
 */
export function installProcessErrorGuards({
  log = DEFAULT_LOG,
  describeContext = () => [],
  target = process,
} = {}) {
  const contextSuffix = () => {
    const requests = describeContext() || [];
    return requests.length ? ` [in-flight: ${requests.join(", ")}]` : "";
  };
  const onUnhandledRejection = (reason) => {
    log(`CAD Viewer backend unhandled rejection: ${describeError(reason)}${contextSuffix()}`);
  };
  const onUncaughtException = (error) => {
    log(`CAD Viewer backend uncaught exception: ${describeError(error)}${contextSuffix()}`);
  };
  target.on("unhandledRejection", onUnhandledRejection);
  target.on("uncaughtException", onUncaughtException);
  return () => {
    target.off("unhandledRejection", onUnhandledRejection);
    target.off("uncaughtException", onUncaughtException);
  };
}
