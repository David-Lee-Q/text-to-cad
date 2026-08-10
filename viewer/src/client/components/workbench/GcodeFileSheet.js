import FileSheet, {
  FILE_SHEET_FIELD_LABEL_CLASSES,
  FILE_SHEET_PRECISION_SLIDER_CLASSES,
  FileSheetSection,
  FileSheetSliderField,
  FileSheetSubsection,
  FileSheetToggleRow,
  parseFileSheetNumberInput
} from "./FileSheet";
import FileMetadataSection from "./FileMetadataSection";
import {
  Accordion
} from "../ui/accordion";
import { Badge } from "../ui/badge";
import { Slider } from "../ui/slider";
import {
  DEFAULT_GCODE_PREVIEW_DETAIL_LEVEL,
  GCODE_PREVIEW_DETAIL_MAX,
  GCODE_PREVIEW_DETAIL_MIN
} from "cadjs/lib/gcode/buildPreviewMesh";
import FileStatusSection from "./FileStatusSection";
import { useI18n } from "@/i18n";
const fieldLabelClasses = FILE_SHEET_FIELD_LABEL_CLASSES;
const compactNumberBadgeClasses = "h-4 rounded-sm px-1.5 py-0 text-[10px] font-medium leading-none";

function formatNumber(value, digits = 2) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(digits) : (0).toFixed(digits);
}

function formatCount(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? String(Math.round(numericValue)) : "0";
}

function formatOrdinal(value) {
  const numericValue = Math.round(Number(value) || 0);
  const absoluteValue = Math.abs(numericValue);
  const tensRemainder = absoluteValue % 100;
  if (tensRemainder >= 11 && tensRemainder <= 13) {
    return `${numericValue}th`;
  }
  switch (absoluteValue % 10) {
    case 1:
      return `${numericValue}st`;
    case 2:
      return `${numericValue}nd`;
    case 3:
      return `${numericValue}rd`;
    default:
      return `${numericValue}th`;
  }
}

function formatDistance(value, digits = 1) {
  return `${formatNumber(value, digits)} mm`;
}

function formatCommandCount(value) {
  const count = formatCount(value);
  return `${count} cmd${count === "1" ? "" : "s"}`;
}

function formatFeatureCategory(value) {
  const normalized = String(value || "").trim();
  return normalized ? `${normalized[0].toUpperCase()}${normalized.slice(1)}` : "Other";
}

function previewDetailLabel(value, t) {
  const translate = typeof t === "function" ? t : (key) => key;
  switch (Math.round(Number(value) || DEFAULT_GCODE_PREVIEW_DETAIL_LEVEL)) {
    case 1:
      return translate("detailLight");
    case 2:
      return translate("detailLean");
    case 4:
      return translate("detailDense");
    case 5:
      return translate("detailHigh");
    case 6:
      return translate("detailVeryHigh");
    case 7:
      return translate("detailMaxAdaptive");
    case 3:
    default:
      return translate("detailStandard");
  }
}

function normalizedBounds(bounds) {
  const min = Array.isArray(bounds?.min) ? bounds.min : [0, 0, 0];
  const max = Array.isArray(bounds?.max) ? bounds.max : [0, 0, 0];
  return { min, max };
}

function boundsAxisText(bounds, axis, digits = 1) {
  const { min, max } = normalizedBounds(bounds);
  return `${formatNumber(min[axis], digits)} to ${formatNumber(max[axis], digits)} mm`;
}

function visibleLayerText(layerCount, maxLayer) {
  if (layerCount < 1) {
    return "0 / 0";
  }
  const visibleCount = maxLayer + 1;
  return visibleCount > 1
    ? `1-${visibleCount} / ${layerCount}`
    : `1 / ${layerCount}`;
}

function parseVisibleLayerInput(value, fallbackVisibleCount, layerCount) {
  if (layerCount < 1) {
    return 0;
  }
  const text = String(value ?? "").trim();
  const rangeMatch = text.match(/\b\d+\s*-\s*(\d+)\b/);
  const parsedValue = rangeMatch?.[1] ?? value;
  return parseFileSheetNumberInput(parsedValue, {
    fallback: fallbackVisibleCount,
    min: 1,
    max: Math.max(layerCount, 0),
    integer: true
  }) - 1;
}

function GcodeValueField({ label, value, mono = false }) {
  const displayValue = String(value ?? "");
  return (
    <div className="block min-w-0">
      <span className={fieldLabelClasses}>{label}</span>
      <div
        className={`mt-1 min-h-7 truncate rounded-md border border-border/70 bg-muted/25 px-2 py-1.5 text-[11px] font-medium leading-4 text-foreground ${mono ? "font-mono" : ""}`}
        title={displayValue}
      >
        {displayValue}
      </div>
    </div>
  );
}

export default function GcodeFileSheet({
  open,
  isDesktop,
  width,
  selectedEntry = null,
  onOpenChange,
  onStartResize,
  gcodeData = null,
  previewMetadata = null,
  maxLayer = 0,
  showTravel = false,
  fullDetail = false,
  previewDetailLevel = DEFAULT_GCODE_PREVIEW_DETAIL_LEVEL,
  onMaxLayerChange,
  onShowTravelChange,
  onFullDetailChange,
  onPreviewDetailLevelChange,
  fileDownloadAvailable = false,
  viewerServerInfo = null,
  localFileOpenAvailable = false,
  fileAccessBusyKey = "",
  onOpenFileAsset,
  suppressDynamicMetadataStatus = false,
  statusItems = [],
  themeSections = null,
  openSectionIds = [],
  onOpenSectionIdsChange
}) {
  const { t } = useI18n();
  const layers = Array.isArray(gcodeData?.layers) ? gcodeData.layers : [];
  const stats = gcodeData?.stats || {};
  const features = Array.isArray(gcodeData?.features) ? gcodeData.features : [];
  const supportFeatures = features.filter((feature) => feature?.category === "support");
  const hasSupports = supportFeatures.some((feature) => (
    Number(feature?.extrusionMoves) > 0 ||
    Number(feature?.markerCount) > 0
  ));
  const featureMarkerCount = features.reduce((total, feature) => total + (Number(feature?.markerCount) || 0), 0);
  const renderedSegments = Number(previewMetadata?.renderedSegments);
  const visibleSegments = Number(previewMetadata?.visibleSegments);
  const layerStride = Number(previewMetadata?.layerStride);
  const renderedLayers = Number(previewMetadata?.renderedLayers);
  const visiblePreviewLayers = Number(previewMetadata?.visibleLayers);
  const decimatedPreview = Boolean(previewMetadata?.decimated);
  const renderedPathText = Number.isFinite(renderedSegments) && Number.isFinite(visibleSegments)
    ? `${formatCount(renderedSegments)} / ${formatCount(visibleSegments)}`
    : "";
  const renderedLayerText = Number.isFinite(renderedLayers) && Number.isFinite(visiblePreviewLayers)
    ? `${formatCount(renderedLayers)} / ${formatCount(visiblePreviewLayers)}`
    : "";
  const layerCount = layers.length;
  const safePreviewDetailLevel = Math.min(
    Math.max(Math.round(Number(previewDetailLevel) || DEFAULT_GCODE_PREVIEW_DETAIL_LEVEL), GCODE_PREVIEW_DETAIL_MIN),
    GCODE_PREVIEW_DETAIL_MAX
  );
  const safeMaxLayer = layerCount > 0
    ? Math.min(Math.max(Math.trunc(Number(maxLayer) || 0), 0), layerCount - 1)
    : 0;
  const hasGcodeData = Boolean(gcodeData);
  const visibleLayers = visibleLayerText(layerCount, safeMaxLayer);

  return (
    <FileSheet
      open={open}
      title={t("gcode")}
      isDesktop={isDesktop}
      width={width}
      onOpenChange={onOpenChange}
      onStartResize={onStartResize}
    >
      <Accordion
        type="multiple"
        value={openSectionIds}
        onValueChange={onOpenSectionIdsChange}
        className="text-sm"
      >
        <FileStatusSection items={statusItems} />

        <FileSheetSection value="toolpath" title={t("toolpath")}>
            <div>
              {!hasGcodeData ? (
                <p className="px-3 py-2 text-xs text-muted-foreground">{t("loadingGcode")}</p>
              ) : null}

              <FileSheetSubsection title={t("summary")} contentClassName="px-3">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="font-normal">
                    {formatCount(layerCount)} layer{layerCount === 1 ? "" : "s"}
                  </Badge>
                  <Badge variant="outline" className="font-normal">
                    {formatCount(stats.extrusionMoves)} path{formatCount(stats.extrusionMoves) === "1" ? "" : "s"}
                  </Badge>
                  <Badge variant={hasSupports ? "secondary" : "outline"} className="font-normal">
                    Supports {hasSupports ? "yes" : "no"}
                  </Badge>
                  {decimatedPreview ? (
                    <Badge variant="outline" className="font-normal">
                      Layer preview
                    </Badge>
                  ) : null}
                </div>
              </FileSheetSubsection>

              <FileSheetSubsection title={t("layers")}>
                <FileSheetSliderField
                  label={t("visibleLayers")}
                  value={visibleLayers}
                  onValueCommit={(nextValue) => {
                    onMaxLayerChange?.(parseVisibleLayerInput(nextValue, safeMaxLayer + 1, layerCount));
                  }}
                  valueInputProps={{
                    disabled: layerCount <= 1,
                    ariaLabel: "Visible G-code layers value",
                    inputMode: "numeric"
                  }}
                >
                <Slider
                  value={[safeMaxLayer]}
                  min={0}
                  max={Math.max(layerCount - 1, 0)}
                  step={1}
                  disabled={layerCount <= 1}
                  onValueChange={(nextValue) => {
                    onMaxLayerChange?.(Number(nextValue?.[0] ?? 0));
                  }}
                  className={FILE_SHEET_PRECISION_SLIDER_CLASSES}
                  aria-label={t("visibleGcodeLayers")}
                />
                </FileSheetSliderField>
              </FileSheetSubsection>

              <FileSheetSubsection
                title={t("preview")}
              >
                <FileSheetSliderField
                  label={t("adaptiveDetail")}
                  value={`${previewDetailLabel(safePreviewDetailLevel, t)} (${safePreviewDetailLevel}/${GCODE_PREVIEW_DETAIL_MAX})`}
                  onValueCommit={(nextValue) => {
                    onPreviewDetailLevelChange?.(parseFileSheetNumberInput(nextValue, {
                      fallback: safePreviewDetailLevel,
                      min: GCODE_PREVIEW_DETAIL_MIN,
                      max: GCODE_PREVIEW_DETAIL_MAX,
                      integer: true
                    }));
                  }}
                  valueInputProps={{
                    disabled: fullDetail,
                    ariaLabel: "G-code preview detail value",
                    inputMode: "numeric"
                  }}
                >
                <Slider
                  value={[safePreviewDetailLevel]}
                  min={GCODE_PREVIEW_DETAIL_MIN}
                  max={GCODE_PREVIEW_DETAIL_MAX}
                  step={1}
                  disabled={fullDetail}
                  onValueChange={(nextValue) => {
                    onPreviewDetailLevelChange?.(Number(nextValue?.[0] ?? DEFAULT_GCODE_PREVIEW_DETAIL_LEVEL));
                  }}
                  className={FILE_SHEET_PRECISION_SLIDER_CLASSES}
                  aria-label={t("gcodePreviewDetail")}
                />
                </FileSheetSliderField>
              </FileSheetSubsection>

              <FileSheetSubsection title={t("rendering")}>
                <FileSheetToggleRow
                  label={t("travelMoves")}
                  description={`${formatCount(stats.travelMoves)} move${formatCount(stats.travelMoves) === "1" ? "" : "s"}`}
                  checked={showTravel}
                  onCheckedChange={(checked) => onShowTravelChange?.(checked)}
                  ariaLabel="Show G-code travel moves"
                />

                <FileSheetToggleRow
                  label={t("fullDetail")}
                  description={fullDetail
                    ? "Exact: render every visible path."
                    : renderedPathText
                      ? `${renderedPathText} rendered path${renderedSegments === 1 ? "" : "s"}${decimatedPreview && Number.isFinite(layerStride) ? ` across ${renderedLayerText || "sampled"} layer${renderedLayers === 1 ? "" : "s"}, every ${formatOrdinal(layerStride)}` : ""}`
                      : "Use adaptive layer sampling."}
                  checked={fullDetail}
                  onCheckedChange={(checked) => onFullDetailChange?.(checked)}
                  ariaLabel="Render full G-code detail"
                />
              </FileSheetSubsection>
            </div>
        </FileSheetSection>

        <FileSheetSection
          value="features"
          title={(
            <span className="flex min-w-0 items-center gap-2">
              <span>{t("features")}</span>
              {features.length ? (
                <Badge variant="outline" className={compactNumberBadgeClasses}>{features.length}</Badge>
              ) : null}
              {hasSupports ? (
                <Badge variant="outline" className="font-normal">{t("supports")}</Badge>
              ) : null}
            </span>
          )}
        >
            <div className="space-y-2 px-3 py-2.5">
              {!features.length ? (
                <p className="text-xs leading-5 text-muted-foreground">
                  No slicer feature annotations found. The preview can still show layers, extrusion paths, and travel moves.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    <Badge variant={hasSupports ? "secondary" : "outline"} className="font-normal">
                      Supports {hasSupports ? "included" : "not detected"}
                    </Badge>
                    <Badge variant="outline" className={compactNumberBadgeClasses}>
                      {formatCount(featureMarkerCount)} markers
                    </Badge>
                  </div>
                  <ul className="divide-y divide-border/60 overflow-hidden rounded-md border border-border/60 bg-muted/15">
                    {features.map((feature) => {
                      const extrusionMoves = formatCount(feature?.extrusionMoves);
                      const markerCount = formatCount(feature?.markerCount);
                      const detailParts = [
                        `${extrusionMoves} path${extrusionMoves === "1" ? "" : "s"}`,
                        formatDistance(feature?.pathMm, 1),
                        feature?.layerRangeText || "",
                        markerCount !== "0" ? `${markerCount} marker${markerCount === "1" ? "" : "s"}` : ""
                      ].filter(Boolean);
                      const rawLabels = Array.isArray(feature?.rawLabels) && feature.rawLabels.length
                        ? feature.rawLabels.join(", ")
                        : "";
                      return (
                        <li
                          key={feature?.id || feature?.label}
                          className="min-w-0 px-2.5 py-1.5"
                          title={rawLabels}
                        >
                          <div className="flex items-center gap-2">
                            <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                              {feature?.label || "Other"}
                            </span>
                            <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                              {formatFeatureCategory(feature?.category)}
                            </span>
                          </div>
                          <p className="truncate text-[11px] leading-5 text-muted-foreground">
                            {detailParts.join(" | ")}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
        </FileSheetSection>

        <FileSheetSection value="stats" title={t("stats")}>
            <div className="grid grid-cols-2 gap-2 px-3 py-3">
              <GcodeValueField label={t("extrusion")} value={formatDistance(stats.extrusionMm, 1)} />
              <GcodeValueField label={t("pathLength")} value={formatDistance(stats.pathMm, 1)} />
              <GcodeValueField label={t("retracts")} value={formatCount(stats.retractMoves)} />
              <GcodeValueField label={t("temperature")} value={formatCommandCount(stats.temperatureCommands)} />
              <GcodeValueField label={t("moveCommands")} value={formatCommandCount(stats.movementCommands)} />
              <GcodeValueField label={t("primeMoves")} value={formatCount(stats.primeMoves)} />
            </div>
        </FileSheetSection>

        <FileSheetSection value="bounds" title={t("bounds")}>
            <div className="grid grid-cols-1 gap-2 px-3 py-3">
              <GcodeValueField label="X" value={boundsAxisText(gcodeData?.bounds, 0, 1)} mono />
              <GcodeValueField label="Y" value={boundsAxisText(gcodeData?.bounds, 1, 1)} mono />
              <GcodeValueField label="Z" value={boundsAxisText(gcodeData?.bounds, 2, 2)} mono />
            </div>
        </FileSheetSection>

        {themeSections}
        <FileMetadataSection
          entry={selectedEntry}
          fileDownloadAvailable={fileDownloadAvailable}
          viewerServerInfo={viewerServerInfo}
          localFileOpenAvailable={localFileOpenAvailable}
          fileAccessBusyKey={fileAccessBusyKey}
          onOpenFileAsset={onOpenFileAsset}
          suppressDynamicStatus={suppressDynamicMetadataStatus}
        />
      </Accordion>
    </FileSheet>
  );
}
