import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from "@/components/ui/context-menu";
import { isLocalManagedDirectoryPath } from "@/workbench/localFileManagement";
import { useI18n } from "@/i18n";

export default function LocalDirectoryContextMenu({
  directory,
  canManageLocalFiles = false,
  onRenameLocalEntry,
  onDeleteLocalEntry,
  children
}) {
  const { t } = useI18n();
  if (
    !canManageLocalFiles ||
    !directory ||
    !isLocalManagedDirectoryPath(directory.id) ||
    (typeof onRenameLocalEntry !== "function" && typeof onDeleteLocalEntry !== "function")
  ) {
    return children;
  }

  return (
    <ContextMenu modal={false}>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {typeof onRenameLocalEntry === "function" ? (
          <ContextMenuItem
            className="text-xs"
            onSelect={() => {
              onRenameLocalEntry(directory);
            }}
          >
            <span className="min-w-0 truncate">{t("renameEntry")}</span>
          </ContextMenuItem>
        ) : null}
        {typeof onDeleteLocalEntry === "function" ? (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              className="text-xs"
              onSelect={() => {
                onDeleteLocalEntry(directory);
              }}
            >
              <span className="min-w-0 truncate">{t("deleteEntry")}</span>
            </ContextMenuItem>
          </>
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  );
}
