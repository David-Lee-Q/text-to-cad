function AssemblyContextMenuItemLabel({ children }) {
  return <span className="min-w-0 truncate">{children}</span>;
}

import { useI18n } from "@/i18n";

export default function AssemblyContextMenuItems({
  Item,
  Separator,
  itemClassName = "text-xs",
  selected = false,
  isolated = false,
  hidden = false,
  actionCount = 1,
  copyReferenceDisabled = false,
  selectDisabled = false,
  showIsolate = true,
  isolateDisabled = false,
  showExitAllIsolate = false,
  exitAllIsolateDisabled = false,
  showHideOther = true,
  hideOtherDisabled = false,
  hideAllDisabled = true,
  hideAllLabel = "Show all",
  showVisibility = true,
  visibilityDisabled = false,
  showCameraActions = false,
  resetZoomDisabled = false,
  zoomToFitDisabled = false,
  showHideAll = false,
  showExpandCollapse = false,
  expandSelectedDisabled = true,
  collapseSelectedDisabled = true,
  expandAllDisabled = true,
  collapseAllDisabled = true,
  onCopyReference,
  onSelect,
  onIsolate,
  onExitAllIsolate,
  onHideOther,
  onHideAll,
  onToggleVisibility,
  onResetZoom,
  onZoomToFit,
  onExpandSelected,
  onCollapseSelected,
  onExpandAll,
  onCollapseAll
}) {
  const { t } = useI18n();
  const selectLabel = selected ? t("deselect") : t("select");
  const isolateLabel = isolated
    ? t("exitIsolate")
    : t("isolate");
  const visibilityLabel = hidden
    ? t("reveal")
    : t("hide");

  return (
    <>
      <Item
        className={itemClassName}
        disabled={copyReferenceDisabled}
        onSelect={onCopyReference}
      >
        <AssemblyContextMenuItemLabel>{t("copyReference")}</AssemblyContextMenuItemLabel>
      </Item>
      <Separator />
      <Item
        className={itemClassName}
        disabled={selectDisabled}
        onSelect={onSelect}
      >
        <AssemblyContextMenuItemLabel>{selectLabel}</AssemblyContextMenuItemLabel>
      </Item>
      {showIsolate ? (
        <Item
          className={itemClassName}
          disabled={isolateDisabled}
          onSelect={onIsolate}
        >
          <AssemblyContextMenuItemLabel>{isolateLabel}</AssemblyContextMenuItemLabel>
        </Item>
      ) : null}
      {showExitAllIsolate ? (
        <Item
          className={itemClassName}
          disabled={exitAllIsolateDisabled}
          onSelect={onExitAllIsolate}
        >
          <AssemblyContextMenuItemLabel>{t("exitAllIsolates")}</AssemblyContextMenuItemLabel>
        </Item>
      ) : null}
      {showHideOther || showHideAll || showVisibility ? <Separator /> : null}
      {showHideOther ? (
        <Item
          className={itemClassName}
          disabled={hideOtherDisabled}
          onSelect={onHideOther}
        >
          <AssemblyContextMenuItemLabel>{t("hideOthers")}</AssemblyContextMenuItemLabel>
        </Item>
      ) : null}
      {showHideAll ? (
        <Item
          className={itemClassName}
          disabled={hideAllDisabled}
          onSelect={onHideAll}
        >
          <AssemblyContextMenuItemLabel>{hideAllLabel}</AssemblyContextMenuItemLabel>
        </Item>
      ) : null}
      {showVisibility ? (
        <Item
          className={itemClassName}
          disabled={visibilityDisabled}
          onSelect={onToggleVisibility}
        >
          <AssemblyContextMenuItemLabel>{visibilityLabel}</AssemblyContextMenuItemLabel>
        </Item>
      ) : null}
      {showCameraActions ? (
        <>
          <Separator />
          <Item
            className={itemClassName}
            disabled={resetZoomDisabled}
            onSelect={onResetZoom}
          >
            <AssemblyContextMenuItemLabel>{t("resetZoomMenu")}</AssemblyContextMenuItemLabel>
          </Item>
          <Item
            className={itemClassName}
            disabled={zoomToFitDisabled}
            onSelect={onZoomToFit}
          >
            <AssemblyContextMenuItemLabel>{t("zoomToFit")}</AssemblyContextMenuItemLabel>
          </Item>
        </>
      ) : null}
      {showExpandCollapse ? (
        <>
          <Separator />
          <Item
            className={itemClassName}
            disabled={expandSelectedDisabled}
            onSelect={onExpandSelected}
          >
            <AssemblyContextMenuItemLabel>{t("expand")}</AssemblyContextMenuItemLabel>
          </Item>
          <Item
            className={itemClassName}
            disabled={collapseSelectedDisabled}
            onSelect={onCollapseSelected}
          >
            <AssemblyContextMenuItemLabel>{t("collapse")}</AssemblyContextMenuItemLabel>
          </Item>
          <Item
            className={itemClassName}
            disabled={expandAllDisabled}
            onSelect={onExpandAll}
          >
            <AssemblyContextMenuItemLabel>{t("expandAll")}</AssemblyContextMenuItemLabel>
          </Item>
          <Item
            className={itemClassName}
            disabled={collapseAllDisabled}
            onSelect={onCollapseAll}
          >
            <AssemblyContextMenuItemLabel>{t("collapseAll")}</AssemblyContextMenuItemLabel>
          </Item>
        </>
      ) : null}
    </>
  );
}
