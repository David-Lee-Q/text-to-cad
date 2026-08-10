import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from "@/components/ui/context-menu";
import { fileAccessAssetsForEntry } from "@/workbench/fileAccessAssets";
import { IMPLICIT_EXPORT_FORMATS } from "@/workbench/implicitExport";
import { isLocalManagedEntryFile } from "@/workbench/localFileManagement";
import { useI18n } from "@/i18n";

function LocalFilesManagementSection({
  entry,
  onRenameLocalEntry,
  onDeleteLocalEntry
}) {
  const { t } = useI18n();
  if (
    !entry ||
    !isLocalManagedEntryFile(entry?.file) ||
    (typeof onRenameLocalEntry !== "function" && typeof onDeleteLocalEntry !== "function")
  ) {
    return null;
  }

  return (
    <>
      <ContextMenuSeparator />
      {typeof onRenameLocalEntry === "function" ? (
        <ContextMenuItem
          className="text-xs"
          onSelect={() => {
            onRenameLocalEntry(entry);
          }}
        >
          <span className="min-w-0 truncate">{t("renameEntry")}</span>
        </ContextMenuItem>
      ) : null}
      {typeof onDeleteLocalEntry === "function" ? (
        <ContextMenuItem
          className="text-xs"
          onSelect={() => {
            onDeleteLocalEntry(entry);
          }}
        >
          <span className="min-w-0 truncate">{t("deleteEntry")}</span>
        </ContextMenuItem>
      ) : null}
    </>
  );
}

function ExplorerViewSection({
  entry,
  onRevealInExplorerView
}) {
  const { t } = useI18n();
  if (typeof onRevealInExplorerView !== "function") {
    return null;
  }

  return (
    <ContextMenuItem
      className="text-xs"
      onSelect={() => {
        onRevealInExplorerView(entry);
      }}
    >
      <span className="min-w-0 truncate">{t("revealInExplorerView")}</span>
    </ContextMenuItem>
  );
}

function FileAccessSection({
  entry,
  asset,
  canRevealFileAssets,
  canCopyFileAssetLinks,
  canCopyFileAssetPaths,
  busyKey = "",
  onDownloadFileAsset,
  onRevealFileAsset,
  onRevealInExplorerView,
  onCopyFileAssetReference
}) {
  const { t } = useI18n();
  if (!asset) {
    return null;
  }

  const key = `${asset.fileRef}:${asset.asset}`;
  const revealBusy = busyKey === key;
  const canCopyFileAssetReference = typeof onCopyFileAssetReference === "function";

  return (
    <>
      {canRevealFileAssets ? (
        <ContextMenuItem
          className="text-xs"
          disabled={revealBusy}
          onSelect={() => {
            onRevealFileAsset(entry, asset.asset, asset);
          }}
        >
          <span className="min-w-0 truncate">{t("revealInFolder")}</span>
        </ContextMenuItem>
      ) : null}
      <ExplorerViewSection
        entry={entry}
        onRevealInExplorerView={onRevealInExplorerView}
      />
      {canCopyFileAssetPaths && canCopyFileAssetReference ? (
        <>
          <ContextMenuItem
            className="text-xs"
            onSelect={() => {
              onCopyFileAssetReference(entry, asset.asset, asset, "path");
            }}
          >
            <span className="min-w-0 truncate">{t("copyPath")}</span>
          </ContextMenuItem>
          <ContextMenuItem
            className="text-xs"
            onSelect={() => {
              onCopyFileAssetReference(entry, asset.asset, asset, "relativePath");
            }}
          >
            <span className="min-w-0 truncate">{t("copyRelativePath")}</span>
          </ContextMenuItem>
        </>
      ) : null}
      {canCopyFileAssetLinks && canCopyFileAssetReference ? (
        <ContextMenuItem
          className="text-xs"
          onSelect={() => {
            onCopyFileAssetReference(entry, asset.asset, asset, "link");
          }}
        >
          <span className="min-w-0 truncate">{t("copyLink")}</span>
        </ContextMenuItem>
      ) : null}
      <ContextMenuItem
        className="text-xs"
        onSelect={() => {
          onDownloadFileAsset(entry, asset.asset, asset);
        }}
      >
        <span className="min-w-0 truncate">{t("download")}</span>
      </ContextMenuItem>
    </>
  );
}

function ImplicitExportSection({
  entry,
  busyKey = "",
  onExportImplicitFile
}) {
  if (
    String(entry?.kind || "").trim().toLowerCase() !== "implicit" ||
    typeof onExportImplicitFile !== "function"
  ) {
    return null;
  }
  const fileRef = String(entry?.file || entry?.id || "").trim();
  return (
    <>
      <ContextMenuSeparator />
      {IMPLICIT_EXPORT_FORMATS.map((format) => {
        const upperFormat = format.toUpperCase();
        const key = `${fileRef}:export:${format}`;
        return (
          <ContextMenuItem
            key={format}
            className="text-xs"
            disabled={busyKey === key}
            onSelect={() => {
              onExportImplicitFile(entry, format);
            }}
          >
            <span className="min-w-0 truncate">Export to {upperFormat}</span>
          </ContextMenuItem>
        );
      })}
    </>
  );
}

export default function FileAccessContextMenu({
  entry,
  canRevealFileAssets = false,
  canCopyFileAssetLinks = false,
  canCopyFileAssetPaths = false,
  canManageLocalFiles = false,
  busyKey = "",
  onDownloadFileAsset,
  onExportImplicitFile,
  onRevealFileAsset,
  onRevealInExplorerView,
  onCopyFileAssetReference,
  onRenameLocalEntry,
  onDeleteLocalEntry,
  children
}) {
  const { t } = useI18n();
  const revealInExplorerViewAvailable = entry && typeof onRevealInExplorerView === "function";
  const assetActionsAvailable = entry && typeof onDownloadFileAsset === "function";
  const implicitExportAvailable = entry && typeof onExportImplicitFile === "function" &&
    String(entry?.kind || "").trim().toLowerCase() === "implicit";
  const localManagementAvailable = canManageLocalFiles &&
    entry &&
    isLocalManagedEntryFile(entry?.file) &&
    (typeof onRenameLocalEntry === "function" || typeof onDeleteLocalEntry === "function");
  if (!revealInExplorerViewAvailable && !assetActionsAvailable && !implicitExportAvailable && !localManagementAvailable) {
    return children;
  }

  const assets = fileAccessAssetsForEntry(entry);
  if (!revealInExplorerViewAvailable && !assets.output && !implicitExportAvailable && !localManagementAvailable) {
    return children;
  }

  return (
    <ContextMenu modal={false}>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        {!assets.output || !assetActionsAvailable ? (
          <ExplorerViewSection
            entry={entry}
            onRevealInExplorerView={onRevealInExplorerView}
          />
        ) : null}
        {assets.output && assetActionsAvailable ? (
          <FileAccessSection
            entry={entry}
            asset={assets.output}
            canRevealFileAssets={canRevealFileAssets && typeof onRevealFileAsset === "function"}
            canCopyFileAssetLinks={canCopyFileAssetLinks}
            canCopyFileAssetPaths={canCopyFileAssetPaths}
            busyKey={busyKey}
            onDownloadFileAsset={onDownloadFileAsset}
            onRevealFileAsset={onRevealFileAsset}
            onRevealInExplorerView={onRevealInExplorerView}
            onCopyFileAssetReference={onCopyFileAssetReference}
          />
        ) : null}
        <ImplicitExportSection
          entry={entry}
          busyKey={busyKey}
          onExportImplicitFile={onExportImplicitFile}
        />
        <LocalFilesManagementSection
          entry={entry}
          onRenameLocalEntry={onRenameLocalEntry}
          onDeleteLocalEntry={onDeleteLocalEntry}
        />
      </ContextMenuContent>
    </ContextMenu>
  );
}
