import fs from "node:fs";
import path from "node:path";

const STATIC_CONTENT_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".wasm", "application/wasm"],
]);

export function contentTypeForStaticAsset(filePath) {
  return STATIC_CONTENT_TYPES.get(path.extname(String(filePath || "")).toLowerCase()) || "";
}

export function sendJson(res, statusCode, payload, { cacheControl = "no-store" } = {}) {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", cacheControl || "no-store");
  res.end(JSON.stringify(payload));
}

function downloadFilename(value) {
  const rawFilename = path.basename(String(value || "").replace(/\\/g, "/")) || "download";
  return rawFilename.replace(/[\x00-\x1f"\\]/g, "_");
}

function encodeContentDispositionFilename(value) {
  return encodeURIComponent(value).replace(/['()*]/g, (char) => (
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  ));
}

function attachmentContentDisposition(filename) {
  const safeFilename = downloadFilename(filename);
  const quotedFilename = safeFilename.replace(/[^\x20-\x7e]/g, "_");
  return `attachment; filename="${quotedFilename}"; filename*=UTF-8''${encodeContentDispositionFilename(safeFilename)}`;
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

function requestRootDir(requestUrl) {
  return String(requestUrl?.searchParams?.get("dir") || "").trim();
}

function requestFileRef(requestUrl) {
  return String(requestUrl?.searchParams?.get("file") || "").trim();
}

function requestHeader(req, name) {
  const headers = req?.headers || {};
  const value = headers[String(name || "").toLowerCase()];
  return Array.isArray(value) ? value[0] : String(value || "");
}

function requestRefererUrl(req) {
  const value = requestHeader(req, "referer") || requestHeader(req, "referrer");
  if (!value) {
    return null;
  }
  try {
    return new URL(value, "http://localhost");
  } catch {
    return null;
  }
}

function siblingFileRef(sourceFileRef, relativeFileRef) {
  const source = String(sourceFileRef || "").replace(/\\/g, "/");
  const relative = String(relativeFileRef || "").replace(/\\/g, "/").replace(/^\/+/g, "");
  if (!source || !relative) {
    return "";
  }
  if (path.isAbsolute(source)) {
    return path.resolve(path.dirname(source), relative);
  }
  const sourceDir = path.posix.dirname(source);
  return path.posix.normalize(path.posix.join(sourceDir === "." ? "" : sourceDir, relative));
}

function legacyCadAssetFileRef(requestUrl, req) {
  if (!requestUrl.pathname.startsWith("/__cad/") || requestUrl.pathname === "/__cad/asset") {
    return "";
  }
  const relativePath = decodeURIComponent(requestUrl.pathname.slice("/__cad/".length));
  if (!relativePath || !path.extname(relativePath)) {
    return "";
  }
  const refererUrl = requestRefererUrl(req);
  return siblingFileRef(requestFileRef(refererUrl), relativePath);
}

function readJsonBody(req, { limitBytes = 256 * 1024 } = {}) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding?.("utf8");
    req.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body) > limitBytes) {
        reject(new Error("Request body is too large"));
        req.destroy?.();
      }
    });
    req.on("error", reject);
    req.on("end", () => {
      const text = body.trim();
      if (!text) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(text));
      } catch {
        reject(new Error("Request body must be valid JSON"));
      }
    });
  });
}

function readRawBody(req, { limitBytes = 256 * 1024 * 1024 } = {}) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let received = 0;
    req.on("data", (chunk) => {
      received += chunk.length;
      if (received > limitBytes) {
        reject(new Error("Request body is too large"));
        req.destroy?.();
        return;
      }
      chunks.push(chunk);
    });
    req.on("error", reject);
    req.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
  });
}

function fileAssetRequest(backend, requestUrl, {
  rootDir,
  catalog,
} = {}) {
  const fileRef = requestFileRef(requestUrl);
  const request = {
    fileRef,
    asset: requestUrl.searchParams.get("asset") || "output",
    rootDir,
    catalog,
  };
  if (typeof backend.resolveRequestRoot === "function") {
    request.resolvedRoot = backend.resolveRequestRoot({ rootDir, fileRef });
  } else if (typeof backend.resolveRoot === "function" && rootDir) {
    request.resolvedRoot = backend.resolveRoot(rootDir);
  }
  return request;
}

function sendBufferDownload(res, {
  body,
  filename,
  contentType,
} = {}) {
  const bytes = Buffer.isBuffer(body) ? body : Buffer.from(body || "");
  res.statusCode = 200;
  res.setHeader("content-type", contentType || "application/octet-stream");
  res.setHeader("cache-control", "no-store");
  res.setHeader("content-disposition", attachmentContentDisposition(filename));
  res.setHeader("content-length", String(bytes.length));
  res.end(bytes);
}

export function serveStaticFile(filePath, req, res, next, { contentType, headers = {} } = {}) {
  fs.stat(filePath, (error, stats) => {
    if (res.destroyed) {
      return;
    }
    if (error || !stats.isFile()) {
      next();
      return;
    }
    if (contentType) {
      res.setHeader("content-type", contentType);
    }
    for (const [name, value] of Object.entries(headers)) {
      if (value !== undefined && value !== null && value !== "") {
        res.setHeader(name, value);
      }
    }
    res.setHeader("cache-control", "no-store");
    res.setHeader("content-length", String(stats.size));
    const stream = fs.createReadStream(filePath);
    res.on("close", () => {
      if (!res.writableEnded) {
        stream.destroy();
      }
    });
    stream.on("error", () => {
      if (!res.headersSent) {
        next();
      } else {
        res.destroy();
      }
    });
    stream.pipe(res);
  });
}

export function createCadViewerApiMiddleware({
  backend,
  serverInfo = () => ({}),
  enableStepArtifactBackend = false,
  claimDisabledStepArtifactRoute = false,
  preferFileDownloadRedirects = false,
  onCatalogChanged = () => {},
  onCatalogActivated = () => {},
  onDirectoryActivated = () => {},
  rootDir,
  catalogCacheControl = "",
} = {}) {
  if (!backend) {
    throw new Error("createCadViewerApiMiddleware requires backend");
  }
  return async function cadViewerApiMiddleware(req, res, next) {
    const requestUrl = new URL(req.url || "/", "http://localhost");
    const activeRootDir = requestRootDir(requestUrl) || rootDir || "";
    const activeFileRef = requestFileRef(requestUrl);
    if (requestUrl.pathname === "/__cad/server") {
      sendJson(res, 200, serverInfo({ rootDir: activeRootDir, fileRef: activeFileRef }));
      return;
    }
    if (requestUrl.pathname === "/__cad/directory/activate") {
      const method = String(req.method || "GET").toUpperCase();
      if (method !== "POST") {
        res.setHeader("allow", "POST");
        sendJson(res, 405, {
          error: "Use POST to activate a CAD Viewer directory",
        });
        return;
      }
      if (typeof backend.resolveRequestRoot !== "function" && typeof backend.resolveRoot !== "function") {
        sendJson(res, 501, {
          error: "Directory activation requires a local filesystem CAD Viewer backend",
        });
        return;
      }
      try {
        const resolvedRoot = typeof backend.resolveRequestRoot === "function"
          ? backend.resolveRequestRoot({ rootDir: activeRootDir, fileRef: activeFileRef })
          : backend.resolveRoot(activeRootDir);
        onDirectoryActivated(resolvedRoot, { rootDir: activeRootDir, fileRef: activeFileRef });
        sendJson(res, 200, {
          ok: true,
          directory: {
            dir: String(resolvedRoot?.dir || activeRootDir || ""),
            rootPath: String(resolvedRoot?.rootPath || ""),
            rootName: String(resolvedRoot?.rootName || ""),
          },
          server: serverInfo({ rootDir: String(resolvedRoot?.dir || activeRootDir || ""), fileRef: activeFileRef }),
        });
      } catch (error) {
        sendJson(res, 400, {
          ok: false,
          error: errorMessage(error),
        });
      }
      return;
    }
    if (requestUrl.pathname === "/__cad/catalog") {
      try {
        const catalog = await backend.readCatalog({ rootDir: activeRootDir, fileRef: activeFileRef });
        if (typeof backend.resolveRequestRoot === "function" && (activeRootDir || activeFileRef)) {
          onCatalogActivated(
            backend.resolveRequestRoot({ rootDir: activeRootDir, fileRef: activeFileRef }),
            { rootDir: activeRootDir, fileRef: activeFileRef },
          );
        } else if (activeRootDir && typeof backend.resolveRoot === "function") {
          onCatalogActivated(backend.resolveRoot(activeRootDir), { rootDir: activeRootDir, fileRef: activeFileRef });
        }
        sendJson(res, 200, catalog, { cacheControl: catalogCacheControl });
      } catch (error) {
        sendJson(res, 400, {
          error: errorMessage(error),
        });
      }
      return;
    }
    if (requestUrl.pathname === "/__cad/generation-status") {
      if (typeof backend.readGenerationStatus !== "function") {
        sendJson(res, 501, {
          error: "Generation status is not available for this CAD Viewer backend",
        });
        return;
      }
      try {
        sendJson(res, 200, await backend.readGenerationStatus({ rootDir: activeRootDir }));
      } catch (error) {
        sendJson(res, 400, {
          error: errorMessage(error),
        });
      }
      return;
    }
    if (requestUrl.pathname === "/__cad/download") {
      const method = String(req.method || "GET").toUpperCase();
      if (method !== "GET") {
        res.setHeader("allow", "GET");
        sendJson(res, 405, {
          error: "Use GET to download a file asset",
        });
        return;
      }

      try {
        const catalog = await backend.readCatalog({ rootDir: activeRootDir, fileRef: activeFileRef });
        const request = fileAssetRequest(backend, requestUrl, { rootDir: activeRootDir, catalog });

        if (preferFileDownloadRedirects && typeof backend.resolveFileAssetAccess === "function") {
          const access = await backend.resolveFileAssetAccess(request);
          if (access?.url) {
            res.statusCode = 302;
            res.setHeader("location", access.url);
            res.setHeader("cache-control", "no-store");
            res.end("");
            return;
          }
        }

        if (typeof backend.readFileAsset === "function") {
          const result = await backend.readFileAsset(request);
          sendBufferDownload(res, result);
          return;
        }

        if (typeof backend.resolveFileAssetAccess !== "function") {
          sendJson(res, 501, {
            error: "File downloads are not available for this CAD Viewer backend",
          });
          return;
        }

        const access = await backend.resolveFileAssetAccess(request);
        if (access?.path) {
          serveStaticFile(access.path, req, res, () => {
            sendJson(res, 404, {
              error: "File asset not found",
            });
          }, {
            contentType: access.contentType || backend.contentTypeForPath?.(access.path) || "application/octet-stream",
            headers: {
              "content-disposition": attachmentContentDisposition(access.filename || access.file || access.path),
            },
          });
          return;
        }
        if (access?.url) {
          res.statusCode = 302;
          res.setHeader("location", access.url);
          res.setHeader("cache-control", "no-store");
          res.end("");
          return;
        }
        sendJson(res, 404, {
          error: "File asset not found",
        });
      } catch (error) {
        sendJson(res, 400, {
          ok: false,
          error: errorMessage(error),
        });
      }
      return;
    }
    if (requestUrl.pathname === "/__cad/asset") {
      const method = String(req.method || "GET").toUpperCase();
      if (method !== "GET") {
        res.setHeader("allow", "GET");
        sendJson(res, 405, {
          error: "Use GET to read a CAD Viewer asset",
        });
        return;
      }
      try {
        if (typeof backend.assetPathForFileRef !== "function") {
          sendJson(res, 501, {
            error: "Direct CAD Viewer assets are not available for this backend",
          });
          return;
        }
        const assetPath = backend.assetPathForFileRef(activeFileRef, {
          rootDir: activeRootDir,
          ...(typeof backend.resolveRequestRoot === "function" && (activeRootDir || activeFileRef)
            ? { resolvedRoot: backend.resolveRequestRoot({ rootDir: activeRootDir, fileRef: activeFileRef }) }
            : {}),
        });
        if (!assetPath) {
          sendJson(res, 404, {
            error: "CAD Viewer asset not found",
          });
          return;
        }
        serveStaticFile(assetPath, req, res, () => {
          sendJson(res, 404, {
            error: "CAD Viewer asset not found",
          });
        }, {
          contentType: backend.contentTypeForPath?.(assetPath) || "application/octet-stream",
        });
      } catch (error) {
        if (Number(error?.statusCode) === 403) {
          sendJson(res, 403, {
            error: "Forbidden",
          });
          return;
        }
        sendJson(res, 400, {
          error: errorMessage(error),
        });
      }
      return;
    }
    if (requestUrl.pathname === "/__cad/reveal") {
      const method = String(req.method || "GET").toUpperCase();
      if (method !== "POST") {
        res.setHeader("allow", "POST");
        sendJson(res, 405, {
          error: "Use POST to reveal a file asset",
        });
        return;
      }

      try {
        if (typeof backend.openFileAsset !== "function") {
          sendJson(res, 405, {
            error: "Revealing files is only available for the local filesystem backend",
          });
          return;
        }
        const catalog = await backend.readCatalog({ rootDir: activeRootDir, fileRef: activeFileRef });
        const request = fileAssetRequest(backend, requestUrl, { rootDir: activeRootDir, catalog });
        const result = await backend.openFileAsset(request);
        sendJson(res, 200, {
          ok: true,
          ...result,
        });
      } catch (error) {
        sendJson(res, 400, {
          ok: false,
          error: errorMessage(error),
        });
      }
      return;
    }
    if (requestUrl.pathname === "/__cad/implicit-export") {
      const method = String(req.method || "GET").toUpperCase();
      if (method !== "POST") {
        res.setHeader("allow", "POST");
        sendJson(res, 405, {
          error: "Use POST to export implicit CAD files",
        });
        return;
      }
      if (
        backend.kind !== "local-fs" ||
        typeof backend.generateImplicitExport !== "function" ||
        typeof backend.resolveRoot !== "function"
      ) {
        sendJson(res, 405, {
          error: "Implicit CAD export is only available for the local filesystem backend",
        });
        return;
      }
      try {
        const body = await readJsonBody(req);
        const catalog = await backend.readCatalog({ rootDir: activeRootDir, fileRef: activeFileRef });
        const resolvedRoot = typeof backend.resolveRequestRoot === "function"
          ? backend.resolveRequestRoot({ rootDir: activeRootDir, fileRef: activeFileRef })
          : backend.resolveRoot(activeRootDir);
        const format = requestUrl.searchParams.get("format") || body.format || "glb";
        const result = await backend.generateImplicitExport({
          fileRef: activeFileRef || body.file,
          format,
          parameterValues: body.parameterValues || body.params || null,
          animationState: body.animationState || body.implicitAnimationState || null,
          resolution: body.resolution,
          maxCells: body.maxCells,
          resolvedRoot,
          rootDir: activeRootDir,
          catalog,
        });
        onCatalogChanged(resolvedRoot);
        sendJson(res, 200, {
          ok: true,
          result,
          entry: result.entry || null,
          catalog: result.catalog || (
            typeof backend.refreshCatalog === "function"
              ? await backend.refreshCatalog({ rootDir: activeRootDir, fileRef: activeFileRef })
              : await backend.readCatalog({ rootDir: activeRootDir, fileRef: activeFileRef })
          ),
          downloadUrl: `/__cad/download?dir=${encodeURIComponent(activeRootDir)}&file=${encodeURIComponent(result.outputFileRef)}&asset=output`,
          filename: result.filename,
        });
      } catch (error) {
        sendJson(res, 400, {
          ok: false,
          error: errorMessage(error),
        });
      }
      return;
    }
    if (requestUrl.pathname === "/__cad/step-source-status") {
      if (typeof backend.readStepSourceStatus !== "function") {
        sendJson(res, 501, {
          error: "STEP source status is not available for this CAD Viewer backend",
        });
        return;
      }
      try {
        const catalog = await backend.readCatalog({ rootDir: activeRootDir, fileRef: activeFileRef });
        const request = {
          fileRef: activeFileRef,
          rootDir: activeRootDir,
          catalog,
        };
        if (typeof backend.resolveRequestRoot === "function") {
          request.resolvedRoot = backend.resolveRequestRoot({ rootDir: activeRootDir, fileRef: activeFileRef });
        } else if (typeof backend.resolveRoot === "function" && activeRootDir) {
          request.resolvedRoot = backend.resolveRoot(activeRootDir);
        }
        sendJson(res, 200, await backend.readStepSourceStatus(request));
      } catch (error) {
        sendJson(res, 400, {
          error: errorMessage(error),
        });
      }
      return;
    }
    if (requestUrl.pathname === "/__cad/step-artifact") {
      if (!enableStepArtifactBackend) {
        if (claimDisabledStepArtifactRoute) {
          sendJson(res, 501, {
            error: "STEP artifact generation is not enabled for this CAD Viewer backend",
          });
          return;
        }
        next();
        return;
      }
      if (req.method !== "POST") {
        sendJson(res, 405, {
          error: "Use POST to generate a STEP artifact",
        });
        return;
      }
      if (typeof backend.resolveRoot !== "function") {
        sendJson(res, 501, {
          error: "STEP artifact generation requires a local filesystem CAD Viewer backend",
        });
        return;
      }
      try {
        const catalog = await backend.readCatalog({ rootDir: activeRootDir, fileRef: activeFileRef });
        const resolvedRoot = typeof backend.resolveRequestRoot === "function"
          ? backend.resolveRequestRoot({ rootDir: activeRootDir, fileRef: activeFileRef })
          : backend.resolveRoot(activeRootDir);
        const result = await backend.generateStepArtifact({
          fileRef: activeFileRef,
          force: requestUrl.searchParams.get("force") === "1",
          resolvedRoot,
          catalog,
        });
        const nextCatalog = typeof backend.refreshCatalog === "function"
          ? await backend.refreshCatalog({ rootDir: activeRootDir, fileRef: activeFileRef })
          : await backend.readCatalog({ rootDir: activeRootDir, fileRef: activeFileRef });
        onCatalogChanged(resolvedRoot);
        sendJson(res, result.ok ? 200 : 500, {
          ok: result.ok,
          error: result.error,
          result: result.result,
          entry: backend.entryForSourcePath(nextCatalog, resolvedRoot, result.stepPath),
          catalog: nextCatalog,
        });
      } catch (error) {
        sendJson(res, 400, {
          error: errorMessage(error),
        });
      }
      return;
    }
    if (requestUrl.pathname === "/__cad/local-upload" || requestUrl.pathname === "/__cad/local-rename" || requestUrl.pathname === "/__cad/local-delete") {
      if (req.method !== "POST") {
        res.setHeader("allow", "POST");
        sendJson(res, 405, {
          error: "Use POST to manage Local Files entries",
        });
        return;
      }
      if (backend.kind !== "local-fs") {
        sendJson(res, 405, {
          error: "Local Files management is only available for the local filesystem backend",
        });
        return;
      }
      try {
        const resolvedRoot = typeof backend.resolveRequestRoot === "function"
          ? backend.resolveRequestRoot({ rootDir: activeRootDir, fileRef: activeFileRef })
          : backend.resolveRoot(activeRootDir);
        let result = null;
        if (requestUrl.pathname === "/__cad/local-upload") {
          if (typeof backend.uploadLocalFile !== "function") {
            sendJson(res, 405, {
              error: "Uploads are not available for this CAD Viewer backend",
            });
            return;
          }
          const filename = String(requestUrl.searchParams.get("filename") || "").trim();
          const body = await readRawBody(req);
          result = await backend.uploadLocalFile({ rootDir: activeRootDir, filename, body });
        } else if (requestUrl.pathname === "/__cad/local-rename") {
          if (typeof backend.renameLocalEntry !== "function") {
            sendJson(res, 405, {
              error: "Renaming is not available for this CAD Viewer backend",
            });
            return;
          }
          const body = await readJsonBody(req);
          result = await backend.renameLocalEntry({
            rootDir: activeRootDir,
            fileRef: body.file || activeFileRef,
            name: body.name,
          });
        } else {
          if (typeof backend.deleteLocalEntry !== "function") {
            sendJson(res, 405, {
              error: "Deleting is not available for this CAD Viewer backend",
            });
            return;
          }
          const body = await readJsonBody(req);
          result = await backend.deleteLocalEntry({
            rootDir: activeRootDir,
            fileRef: body.file || activeFileRef,
          });
        }
        onCatalogChanged(resolvedRoot);
        const nextCatalog = result?.catalog || await backend.readCatalog({ rootDir: activeRootDir, fileRef: activeFileRef });
        sendJson(res, 200, {
          ok: true,
          ...result,
          catalog: nextCatalog,
        });
      } catch (error) {
        sendJson(res, 400, {
          ok: false,
          error: errorMessage(error),
        });
      }
      return;
    }
    next();
  };
}

export function createLocalAssetMiddleware({ backend, rootDir } = {}) {
  if (!backend) {
    throw new Error("createLocalAssetMiddleware requires backend");
  }
  return function localAssetMiddleware(req, res, next) {
    const requestUrl = new URL(req.url || "/", "http://localhost");
    const fallbackFileRef = legacyCadAssetFileRef(requestUrl, req);
    if (
      (requestUrl.pathname !== "/__cad/asset" && !fallbackFileRef) ||
      typeof backend.assetPathForFileRef !== "function"
    ) {
      next();
      return;
    }
    let assetPath = null;
    try {
      const refererUrl = requestRefererUrl(req);
      const activeRootDir = requestRootDir(requestUrl) || requestRootDir(refererUrl) || rootDir || "";
      const activeFileRef = requestFileRef(requestUrl) || fallbackFileRef;
      assetPath = backend.assetPathForFileRef(activeFileRef, {
        rootDir: activeRootDir,
        ...(typeof backend.resolveRequestRoot === "function" && (activeRootDir || activeFileRef)
          ? { resolvedRoot: backend.resolveRequestRoot({ rootDir: activeRootDir, fileRef: activeFileRef }) }
          : {}),
      });
    } catch (error) {
      if (Number(error?.statusCode) === 403) {
        res.statusCode = 403;
        res.end("Forbidden");
        return;
      }
      next();
      return;
    }
    if (!assetPath) {
      next();
      return;
    }
    serveStaticFile(assetPath, req, res, next, {
      contentType: backend.contentTypeForPath?.(assetPath) || undefined,
    });
  };
}

export function serveDistAsset({ distRoot, indexHtmlPath = path.join(distRoot, "index.html") } = {}) {
  return function distAssetMiddleware(req, res, next) {
    const requestUrl = new URL(req.url || "/", "http://localhost");
    const requestPath = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
    let filePath = "";
    try {
      filePath = path.resolve(distRoot, decodeURIComponent(requestPath).replace(/^\/+/, ""));
    } catch {
      res.statusCode = 400;
      res.end("Bad request");
      return;
    }
    if (!(filePath === distRoot || filePath.startsWith(`${distRoot}${path.sep}`))) {
      res.statusCode = 403;
      res.end("Forbidden");
      return;
    }
    const fileExists = fs.existsSync(filePath);
    const isStaticAssetRequest = requestPath.startsWith("/assets/") || path.extname(requestPath);
    if (!fileExists && isStaticAssetRequest) {
      res.statusCode = 404;
      res.setHeader("content-type", "text/plain; charset=utf-8");
      res.setHeader("cache-control", "no-store");
      res.end("Not found");
      return;
    }
    const fallbackPath = fileExists ? filePath : indexHtmlPath;
    serveStaticFile(fallbackPath, req, res, next, {
      contentType: contentTypeForStaticAsset(fallbackPath) || undefined,
    });
  };
}

export function buildIntentPrompt({ text, context = {} }) {
  const files = Array.isArray(context.catalog)
    ? context.catalog.map((entry) => `${entry.key}=${entry.label || entry.key}`).join("; ")
    : "";
  const parameters = Array.isArray(context.parameters)
    ? context.parameters.map((entry) => `${entry.id}=${entry.label || entry.id}`).join("; ")
    : "";
  const fileName = String(context.fileName || "").trim();
  const fileFormat = String(context.fileFormat || context.sourceFormat || "").trim();
  const currentContext = [
    fileName ? `Current file: ${fileName}${fileFormat ? ` (${fileFormat})` : ""}` : "No file is currently open.",
    files ? `Available files: ${files}` : "",
    parameters ? `Available parameters: ${parameters}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return [
    "You are the command router for a CAD model viewer assistant. Map the user's message to exactly ONE intent from the list below, filling params according to its schema. Write the reply text in the same language as the user's message (Simplified Chinese if the user writes Chinese, otherwise English).",
    "",
    "Intents and param schemas:",
    '- "help": {}',
    '- "openFile": {"fileKey": "<key from the file list>"}',
    '- "setDisplayMode": {"mode": "solid"|"rendered"|"transparent"|"hidden_edges"|"hidden_lines_removed"|"unshaded"|"wireframe"}',
    '- "setProjection": {"projection": "orthographic"|"perspective"}',
    '- "fitView": {}',
    '- "resetView": {}',
    '- "hideAll": {}',
    '- "showAll": {}',
    '- "hideOthers": {}',
    '- "playAnimation": {}',
    '- "pauseAnimation": {}',
    '- "screenshot": {}',
    '- "enterPreview": {}',
    '- "exitPreview": {}',
    '- "resetParams": {}',
    '- "resetPose": {}',
    '- "setParam": {"id": "<parameter id from the list>", "value": <number>}',
    '- "setColor": {"hex": "<0xRRGGBB>", "color": "<color name>"} (use {"hex": null} to restore the default color)',
    '- "rotateModel": {"angleDeg": <number>}',
    '- "playDance": {}',
    '- "stopDance": {}',
    '- "darkTheme": {}',
    '- "lightTheme": {}',
    "",
    currentContext,
    "",
    "Examples:",
    '用户说"把模型颜色改成红色" → {"intent":"setColor","params":{"hex":"0xFF0000","color":"red"},"reply":"颜色已设置为红色。"}',
    '用户说"旋转45度" → {"intent":"rotateModel","params":{"angleDeg":45},"reply":"模型已旋转45度。"}',
    '用户说"打开 calibration_block" → {"intent":"openFile","params":{"fileKey":"calibration_block.step"},"reply":"已打开 calibration_block.step。"}',
    '用户说"你好" → {"intent":"chat","reply":"你好！我可以帮你打开、查看和操作 3D 模型。"}',
    "",
    'If the message matches no intent, respond with {"intent": "chat", "reply": "<helpful answer in the user\'s language>"}.',
    "Output ONLY a single valid JSON object. No markdown fences, no extra commentary.",
  ].join("\n");
}

function extractLlmJson(content) {
  const text = String(content || "").trim();
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try {
      return JSON.parse(text.slice(first, last + 1));
    } catch {
      // fall through to chat fallback
    }
  }
  return null;
}

export function createChatProxyMiddleware({
  apiKey = process.env.OPENAI_API_KEY,
  baseUrl = process.env.OPENAI_BASE_URL || "https://gpt.cosmoplat.com/v1",
  model = process.env.OPENAI_MODEL || "cosmo-mind-nothink",
  timeoutMs = 60000,
} = {}) {
  return async function chatProxyMiddleware(req, res, next) {
    const requestUrl = new URL(req.url || "/", "http://localhost");
    if (requestUrl.pathname !== "/__cad/chat") {
      next();
      return;
    }
    if (String(req.method || "GET").toUpperCase() !== "POST") {
      res.setHeader("allow", "POST");
      sendJson(res, 405, { error: "Use POST to /__cad/chat" });
      return;
    }
    if (!apiKey) {
      sendJson(res, 503, { error: "LLM API key is not configured" });
      return;
    }
    let body;
    try {
      body = await readJsonBody(req, { limitBytes: 64 * 1024 });
    } catch (error) {
      sendJson(res, 400, { error: errorMessage(error) });
      return;
    }
    const text = String(body?.text || "").trim();
    if (!text) {
      sendJson(res, 400, { error: "Missing text" });
      return;
    }
    const systemPrompt = buildIntentPrompt({ text, context: body.context || {} });
    let upstream;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        upstream = await fetch(`${baseUrl.replace(/\/+$/u, "")}/chat/completions`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0.1,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: text },
            ],
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
    } catch (error) {
      sendJson(res, 502, { error: errorMessage(error) });
      return;
    }
    if (!upstream.ok) {
      sendJson(res, 502, { error: `LLM upstream ${upstream.status}` });
      return;
    }
    let content = "";
    try {
      const payload = await upstream.json();
      content = String(payload?.choices?.[0]?.message?.content || "").trim();
    } catch (error) {
      sendJson(res, 502, { error: errorMessage(error) });
      return;
    }
    const parsed = extractLlmJson(content);
    sendJson(res, 200, {
      intent: String(parsed?.intent || "chat"),
      params: parsed?.params && typeof parsed.params === "object" ? parsed.params : {},
      reply: String(parsed?.reply || "").trim() || content,
    });
  };
}

export function createHelpDocsMiddleware({ docsRoot = "/workspace/docs" } = {}) {
  return function helpDocsMiddleware(req, res, next) {
    const requestUrl = new URL(req.url || "/", "http://localhost");
    if (!requestUrl.pathname.startsWith("/docs/")) {
      next();
      return;
    }
    let filePath = "";
    try {
      filePath = path.resolve(
        docsRoot,
        decodeURIComponent(requestUrl.pathname).replace(/^\/docs\//u, "")
      );
    } catch {
      res.statusCode = 400;
      res.end("Bad request");
      return;
    }
    if (!(filePath === docsRoot || filePath.startsWith(`${docsRoot}${path.sep}`))) {
      res.statusCode = 403;
      res.end("Forbidden");
      return;
    }
    if (!fs.existsSync(filePath)) {
      res.statusCode = 404;
      res.end("Not found");
      return;
    }
    serveStaticFile(filePath, req, res, next, {
      contentType: contentTypeForStaticAsset(filePath) || undefined,
    });
  };
}
