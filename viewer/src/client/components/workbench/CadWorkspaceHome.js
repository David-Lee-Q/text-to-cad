import { useRef, useState } from "react";
import {
  Bot,
  Boxes,
  ChevronRight,
  Code,
  Cuboid,
  DraftingCompass,
  FileBox,
  FolderOpen,
  Layers3,
  Package,
  Route,
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { cn } from "@/ui/utils";
import { RENDER_FORMAT } from "@/workbench/constants";
import {
  entrySourceFormat,
  isMeshRenderFormat,
  isRobotRenderFormat
} from "cadjs/lib/fileFormats";
import {
  ENTRY_ICON_KIND,
  entryIconKind
} from "@/workbench/entryIconKind";
import {
  fileKey,
  sidebarLabelForEntry
} from "@/workbench/sidebar";
import {
  LOCAL_FILE_ACCEPT_ATTR
} from "@/workbench/localFileManagement";
import { useI18n } from "@/i18n";

const MAX_HOME_OPTIONS = 6;

const HOME_FILE_FILTERS = Object.freeze([
  { value: "all", match: () => true },
  { value: "assembly", match: (entry, sourceFormat) => entry?.kind === "assembly" },
  { value: "step", match: (entry, sourceFormat) => sourceFormat === RENDER_FORMAT.STEP && entry?.kind !== "assembly" },
  { value: "dxf", match: (entry, sourceFormat) => sourceFormat === RENDER_FORMAT.DXF },
  { value: "gcode", match: (entry, sourceFormat) => sourceFormat === RENDER_FORMAT.GCODE },
  { value: "implicit", match: (entry, sourceFormat) => sourceFormat === RENDER_FORMAT.IMPLICIT },
  { value: "robot", match: (entry, sourceFormat) => isRobotRenderFormat(sourceFormat) || entry?.kind === "srdf" },
  { value: "mesh", match: (entry, sourceFormat) => isMeshRenderFormat(sourceFormat) }
]);

function homeFilterLabel(value, t) {
  const translate = typeof t === "function" ? t : (key) => key;
  const labels = {
    all: translate("homeFilterAll"),
    assembly: "Assembly",
    step: "STEP",
    dxf: "DXF",
    gcode: "G-code",
    implicit: "Implicit",
    robot: "URDF / SRDF / SDF",
    mesh: "STL / 3MF / GLB"
  };
  return labels[value] || translate("homeFilterAll");
}

const ENTRY_ICON_COMPONENTS = {
  [ENTRY_ICON_KIND.ASSEMBLY]: Boxes,
  [ENTRY_ICON_KIND.DXF]: DraftingCompass,
  [ENTRY_ICON_KIND.GCODE]: Route,
  [ENTRY_ICON_KIND.IMPLICIT]: Code,
  [ENTRY_ICON_KIND.ROBOT]: Bot,
  [ENTRY_ICON_KIND.STEP_PART]: Package,
  [ENTRY_ICON_KIND.STL_MESH]: Cuboid,
  [ENTRY_ICON_KIND.THREE_MF_MESH]: Layers3,
  [ENTRY_ICON_KIND.GLB_MESH]: FileBox
};

function iconForEntry(entry, sourceFormat) {
  return ENTRY_ICON_COMPONENTS[entryIconKind(entry, { sourceFormat })] || Package;
}

function formatLabelForEntry(entry, sourceFormat) {
  if (entry?.kind === "assembly") {
    return "Assembly";
  }
  if (sourceFormat === RENDER_FORMAT.DXF) {
    return "DXF";
  }
  if (sourceFormat === RENDER_FORMAT.GCODE) {
    return "G-code";
  }
  if (sourceFormat === RENDER_FORMAT.IMPLICIT) {
    return "Implicit";
  }
  if (entry?.kind === "srdf") {
    return "SRDF";
  }
  if (sourceFormat === RENDER_FORMAT.URDF) {
    return "URDF";
  }
  if (sourceFormat === RENDER_FORMAT.SDF) {
    return "SDF";
  }
  if (isMeshRenderFormat(sourceFormat)) {
    return sourceFormat.toUpperCase();
  }
  return "STEP";
}

function pathLabelForEntry(entry) {
  return String(entry?.file || "").trim();
}

function directoryLabelForOption(option) {
  const rootName = String(option?.rootName || "").trim();
  if (rootName) {
    return rootName;
  }
  const pathLabel = String(option?.rootPath || option?.dir || "").trim().replace(/\\/g, "/").replace(/\/+$/g, "");
  return pathLabel.split("/").filter(Boolean).pop() || pathLabel || "Directory";
}

function directoryPathLabelForOption(option) {
  return String(option?.rootPath || option?.dir || "").trim();
}

function normalizeDirectoryOptions(options) {
  const seen = new Set();
  const result = [];
  for (const option of Array.isArray(options) ? options : []) {
    const dir = String(option?.dir || "").trim();
    const rootPath = String(option?.rootPath || "").trim();
    const key = rootPath || dir;
    if (!dir || !key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push({
      dir,
      rootPath,
      rootName: String(option?.rootName || "").trim()
    });
  }
  return result;
}

function compareEntryLabels(a, b) {
  return sidebarLabelForEntry(a).localeCompare(sidebarLabelForEntry(b), undefined, {
    numeric: true,
    sensitivity: "base"
  });
}

function addHomeEntry(result, seenKeys, entry) {
  const key = fileKey(entry);
  if (!key || seenKeys.has(key)) {
    return;
  }
  seenKeys.add(key);
  result.push(entry);
}

export function selectHomeEntries(entries) {
  const sortedEntries = [...(Array.isArray(entries) ? entries : [])].sort(compareEntryLabels);
  const result = [];
  const seenKeys = new Set();
  const groups = [
    (entry) => entry?.kind === "assembly",
    (entry) => entrySourceFormat(entry) === RENDER_FORMAT.STEP && entry?.kind !== "assembly",
    (entry) => entrySourceFormat(entry) === RENDER_FORMAT.DXF,
    (entry) => entrySourceFormat(entry) === RENDER_FORMAT.GCODE,
    (entry) => entrySourceFormat(entry) === RENDER_FORMAT.IMPLICIT,
    (entry) => isRobotRenderFormat(entrySourceFormat(entry)) || entry?.kind === "srdf",
    (entry) => isMeshRenderFormat(entrySourceFormat(entry))
  ];

  for (const matchesGroup of groups) {
    const match = sortedEntries.find((entry) => matchesGroup(entry));
    addHomeEntry(result, seenKeys, match);
  }

  for (const entry of sortedEntries) {
    if (result.length >= MAX_HOME_OPTIONS) {
      break;
    }
    addHomeEntry(result, seenKeys, entry);
  }

  return result.slice(0, MAX_HOME_OPTIONS);
}

export default function CadWorkspaceHome({
  entries,
  onSelectEntry,
  catalogHydrated = false,
  catalogRefreshing = false,
  catalogError = "",
  directorySelectionActive = false,
  directoryOptions = [],
  onSelectDirectory,
  canManageLocalFiles = false,
  localFilesBusy = false,
  onUploadLocalFiles
}) {
  const { t } = useI18n();
  const uploadInputRef = useRef(null);
  const [fileFilter, setFileFilter] = useState("all");
  const activeFilter = HOME_FILE_FILTERS.find((filter) => filter.value === fileFilter) || HOME_FILE_FILTERS[0];
  const filteredEntries = (Array.isArray(entries) ? entries : []).filter((entry) => (
    activeFilter.match(entry, entrySourceFormat(entry))
  ));
  const homeEntries = selectHomeEntries(filteredEntries);
  const normalizedDirectoryOptions = normalizeDirectoryOptions(directoryOptions);
  const hasEntries = homeEntries.length > 0;
  const hasDirectoryOptions = normalizedDirectoryOptions.length > 0;
  const catalogErrorMessage = String(catalogError || "").trim();
  const catalogLoading = !catalogHydrated || (catalogRefreshing && !hasEntries);

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex min-w-0 items-center justify-center px-4 py-6">
      <section
        className="cad-glass-popover pointer-events-auto w-full max-w-2xl overflow-hidden rounded-md border border-sidebar-border text-popover-foreground shadow-xl shadow-black/10"
        aria-label={t("homeAria")}
      >
        <div className="flex items-center justify-between gap-3 border-b border-sidebar-border px-5 py-4 sm:px-6">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-2xl font-bold leading-7 tracking-tight text-foreground sm:text-3xl">
              COSMO AI CAD
            </h1>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">
              {t("homeTagline")}
            </p>
          </div>
          {!directorySelectionActive ? (
            <div className="flex shrink-0 items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Select
                  value={fileFilter}
                  onValueChange={(nextValue) => setFileFilter(nextValue)}
                >
                  <SelectTrigger size="sm" className="h-7 min-w-32 !text-xs" aria-label={t("homeFilter")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOME_FILE_FILTERS.map((filter) => (
                      <SelectItem key={filter.value} value={filter.value} className="text-xs">
                        {homeFilterLabel(filter.value, t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {canManageLocalFiles ? (
                <div className="flex items-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    disabled={localFilesBusy}
                    title={t("uploadLocalFilesHint")}
                    aria-label={t("uploadLocalFiles")}
                    onClick={() => {
                      uploadInputRef.current?.click?.();
                    }}
                  >
                    <Upload className={cn("size-4", localFilesBusy && "animate-spin")} aria-hidden="true" />
                  </Button>
                  <input
                    ref={uploadInputRef}
                    type="file"
                    multiple
                    accept={LOCAL_FILE_ACCEPT_ATTR}
                    className="hidden"
                    aria-hidden="true"
                    tabIndex={-1}
                    onChange={(event) => {
                      const files = Array.from(event.target.files || []);
                      event.target.value = "";
                      if (files.length > 0 && typeof onUploadLocalFiles === "function") {
                        onUploadLocalFiles(files);
                      }
                    }}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="divide-y divide-sidebar-border/70">
          {directorySelectionActive ? (
            hasDirectoryOptions ? normalizedDirectoryOptions.map((option) => {
              const label = directoryLabelForOption(option);
              const pathLabel = directoryPathLabelForOption(option);

              return (
                <Button
                  key={option.rootPath || option.dir}
                  type="button"
                  variant="ghost"
                  className="group h-auto w-full justify-start rounded-none px-5 py-3 text-left hover:bg-sidebar-accent/80 focus-visible:ring-inset has-[>svg]:px-5 sm:px-6 sm:has-[>svg]:px-6"
                  onClick={() => {
                    if (typeof onSelectDirectory === "function") {
                      onSelectDirectory(option.dir);
                    }
                  }}
                  title={pathLabel || label}
                >
                  <FolderOpen className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block min-w-0 truncate text-sm font-medium text-foreground">
                      {label}
                    </span>
                    {pathLabel ? (
                      <span className="mt-0.5 block min-w-0 truncate text-[11px] font-normal text-muted-foreground">
                        {pathLabel}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-md border border-sidebar-border px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none text-muted-foreground",
                      "max-sm:hidden"
                    )}
                  >
                    {t("directory")}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden="true" />
                </Button>
              );
            }) : (
              <p className="px-5 py-5 text-sm text-muted-foreground sm:px-6">
                {t("noActiveDirectories")}
              </p>
            )
          ) : hasEntries ? homeEntries.map((entry) => {
            const key = fileKey(entry);
            const sourceFormat = entrySourceFormat(entry);
            const EntryIcon = iconForEntry(entry, sourceFormat);
            const label = sidebarLabelForEntry(entry) || key;
            const pathLabel = pathLabelForEntry(entry);
            const formatLabel = formatLabelForEntry(entry, sourceFormat);

            return (
              <Button
                key={key}
                type="button"
                variant="ghost"
                className="group h-auto w-full justify-start rounded-none px-5 py-3 text-left hover:bg-sidebar-accent/80 focus-visible:ring-inset has-[>svg]:px-5 sm:px-6 sm:has-[>svg]:px-6"
                onClick={() => {
                  if (key && typeof onSelectEntry === "function") {
                    onSelectEntry(key);
                  }
                }}
                title={pathLabel || label}
              >
                <EntryIcon className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block min-w-0 truncate text-sm font-medium text-foreground">
                    {label}
                  </span>
                  {pathLabel ? (
                    <span className="mt-0.5 block min-w-0 truncate text-[11px] font-normal text-muted-foreground">
                      {pathLabel}
                    </span>
                  ) : null}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-md border border-sidebar-border px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none text-muted-foreground",
                    "max-sm:hidden"
                  )}
                >
                  {formatLabel}
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden="true" />
              </Button>
            );
          }) : catalogErrorMessage ? (
            <p className="break-words px-5 py-5 text-sm text-muted-foreground sm:px-6" role="status">
              {t("catalogUnavailable", { message: catalogErrorMessage })}
            </p>
          ) : catalogLoading ? (
            <p className="px-5 py-5 text-sm text-muted-foreground sm:px-6" role="status">
              {t("loadingCatalog")}
            </p>
          ) : (
            <p className="px-5 py-5 text-sm text-muted-foreground sm:px-6">
              {t("noEntries")}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
