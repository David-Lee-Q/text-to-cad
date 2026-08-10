import {
  readActiveCadDir,
  refreshCadCatalog
} from "./cadManifestStore.js";

export const LOCAL_FILES_DIRECTORY_NAME = "本地文件";

export const LOCAL_FILE_ACCEPT_EXTENSIONS = Object.freeze([
  ".step",
  ".stp",
  ".stl",
  ".3mf",
  ".glb",
  ".gcode",
  ".dxf",
  ".urdf",
  ".srdf",
  ".sdf",
  ".implicit.js",
]);

export const LOCAL_FILE_ACCEPT_ATTR = LOCAL_FILE_ACCEPT_EXTENSIONS.join(",");

function normalizedPosixPath(value) {
  return String(value || "").trim().replace(/\\/g, "/").replace(/^\/+/, "");
}

function hasLocalFilesPathSegment(path) {
  return normalizedPosixPath(path).split("/").filter(Boolean).includes(LOCAL_FILES_DIRECTORY_NAME);
}

export function isLocalManagedEntryFile(fileRef) {
  return hasLocalFilesPathSegment(fileRef);
}

export function isLocalManagedDirectoryPath(directoryId) {
  const normalized = normalizedPosixPath(directoryId);
  return normalized === LOCAL_FILES_DIRECTORY_NAME || normalized.startsWith(`${LOCAL_FILES_DIRECTORY_NAME}/`);
}

export function isSupportedLocalFile(name) {
  const normalized = String(name || "").trim().toLowerCase();
  return LOCAL_FILE_ACCEPT_EXTENSIONS.some((extension) => normalized.endsWith(extension));
}

function localFilesApiUrl(path, params = {}) {
  const activeDir = readActiveCadDir();
  const url = new URL(path, "http://cad.local");
  if (activeDir) {
    url.searchParams.set("dir", activeDir);
  }
  for (const [key, value] of Object.entries(params)) {
    const text = String(value ?? "").trim();
    if (text) {
      url.searchParams.set(key, text);
    }
  }
  return `${url.pathname}${url.search}`;
}

async function readJsonErrorPayload(response, fallback) {
  try {
    const payload = await response.json();
    return String(payload?.error || fallback).trim() || fallback;
  } catch {
    return fallback;
  }
}

function refreshAfterLocalFilesChange(payload) {
  if (payload?.catalog) {
    refreshCadCatalog({ markRefreshing: false }).catch(() => {});
  }
}

export async function requestLocalFileUpload({ file }) {
  const name = String(file?.name || "").trim();
  if (!name) {
    throw new Error("Missing file name");
  }
  if (!isSupportedLocalFile(name)) {
    throw new Error(`Unsupported CAD file format: ${name}`);
  }
  const response = await fetch(localFilesApiUrl("/__cad/local-upload", { filename: name }), {
    method: "POST",
    headers: {
      "content-type": "application/octet-stream",
    },
    body: file,
  });
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok || !payload?.ok) {
    throw new Error(String(payload?.error || `Upload failed with HTTP ${response.status}`));
  }
  refreshAfterLocalFilesChange(payload);
  return payload;
}

export async function requestLocalFileRename({ file, name }) {
  const fileRef = String(file || "").trim();
  const nextName = String(name || "").trim();
  if (!fileRef) {
    throw new Error("Missing file reference");
  }
  if (!nextName) {
    throw new Error("Missing new entry name");
  }
  const response = await fetch(localFilesApiUrl("/__cad/local-rename"), {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ file: fileRef, name: nextName }),
  });
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok || !payload?.ok) {
    throw new Error(String(payload?.error || `Rename failed with HTTP ${response.status}`));
  }
  refreshAfterLocalFilesChange(payload);
  return payload;
}

export async function requestLocalFileDelete({ file }) {
  const fileRef = String(file || "").trim();
  if (!fileRef) {
    throw new Error("Missing file reference");
  }
  const response = await fetch(localFilesApiUrl("/__cad/local-delete"), {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ file: fileRef }),
  });
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  if (!response.ok || !payload?.ok) {
    throw new Error(String(payload?.error || `Delete failed with HTTP ${response.status}`));
  }
  refreshAfterLocalFilesChange(payload);
  return payload;
}
