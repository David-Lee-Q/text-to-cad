import { Children, isValidElement, useEffect, useId, useMemo, useRef, useState } from "react";
import { Contrast, FlipHorizontal2, Moon, MoreHorizontal, Pencil, Plus, RotateCcw, Sun, Trash2, X } from "lucide-react";
import {
  Accordion
} from "../ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { ColorPicker } from "../ui/color-picker";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "../ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../ui/select";
import { Slider } from "../ui/slider";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "../ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { cn } from "@/ui/utils";
import { useI18n } from "@/i18n";
import {
  cloneThemePresetSettings,
  DEFAULT_THEME_PRESET_ID,
  THEME_PRESETS,
  THEME_COLOR_MODES,
  MAX_THEME_FILL_COLORS,
  normalizeThemePresetId,
  normalizeThemeSettings,
  resolveSystemThemePresetId
} from "cadjs/lib/themeSettings";
import {
  CAD_EDGE_COLOR,
  CAD_EDGE_HIGHLIGHT_COLOR,
  DEFAULT_EXPLODED_VIEW_SETTINGS,
  CAMERA_PROJECTION,
  normalizeDisplayEdgeSettings,
  normalizeDisplaySettings,
  normalizeExplodedViewSettings
} from "cadjs/lib/displaySettings";
import {
  DISPLAY_MODE_OPTIONS,
  displayModeOptionForValue
} from "../viewer/DisplayModeOptions";
import {
  OrthographicProjectionIcon,
  PerspectiveProjectionIcon
} from "../viewer/ProjectionModeIcons";
import {
  buildStepClipPatch,
  clipAxisBounds,
  clipAxisPosition,
  DEFAULT_STEP_CLIP_SETTINGS,
  normalizeStepClipSettings
} from "cadjs/lib/viewer/clipPlane";
import FileSheet, {
  FILE_SHEET_COMPACT_BUTTON_CLASSES,
  FILE_SHEET_COMPACT_INPUT_CLASSES,
  FILE_SHEET_FIELD_LABEL_CLASSES,
  FILE_SHEET_PRECISION_SLIDER_CLASSES,
  FILE_SHEET_ROW_STACK_CLASSES,
  FILE_SHEET_SEGMENTED_ITEM_CLASSES,
  FileSheetBooleanToggle,
  FileSheetControlRow,
  FileSheetSection,
  FileSheetSliderField,
  FileSheetSubsection,
  FileSheetSubsubsection,
  FileSheetToggleRow,
  FileSheetValueInput,
  parseFileSheetNumberInput
} from "./FileSheet";

const BACKGROUND_MODE_OPTIONS = [
  { value: "solid", label: "Solid", labelKey: "bgSolid" },
  { value: "linear", label: "Linear", labelKey: "bgLinear" },
  { value: "radial", label: "Radial", labelKey: "bgRadial" },
  { value: "transparent", label: "Transparent", labelKey: "bgTransparent" }
];

const PROJECTION_MODE_OPTIONS = [
  { value: CAMERA_PROJECTION.ORTHOGRAPHIC, label: "Orthographic", labelKey: "projOrthographic", title: "Parallel projection for CAD inspection", titleKey: "projOrthographicTitle", Icon: OrthographicProjectionIcon },
  { value: CAMERA_PROJECTION.PERSPECTIVE, label: "Perspective", labelKey: "projPerspective", title: "Depth projection with vanishing lines", titleKey: "projPerspectiveTitle", Icon: PerspectiveProjectionIcon }
];

const COLOR_MODE_OPTIONS = [
  { value: THEME_COLOR_MODES.SYSTEM, label: "System", labelKey: "cmSystem" },
  { value: THEME_COLOR_MODES.LIGHT, label: "Light", labelKey: "cmLight" },
  { value: THEME_COLOR_MODES.DARK, label: "Dark", labelKey: "cmDark" }
];

const EXPLODED_AXIS_OPTIONS = [
  { value: "x", label: "X", labelKey: "axisX" },
  { value: "y", label: "Y", labelKey: "axisY" },
  { value: "z", label: "Z", labelKey: "axisZ" },
  { value: "radial", label: "Radial", labelKey: "axisRadial" }
];

const PRIMARY_LIGHT_OPTIONS = [
  { value: "directional", label: "Directional", labelKey: "lightDirectional" },
  { value: "spot", label: "Spot", labelKey: "lightSpot" },
  { value: "point", label: "Point", labelKey: "lightPoint" }
];

const fieldLabelClasses = FILE_SHEET_FIELD_LABEL_CLASSES;
const compactButtonClasses = FILE_SHEET_COMPACT_BUTTON_CLASSES;
const compactInputClasses = FILE_SHEET_COMPACT_INPUT_CLASSES;
const precisionSliderClasses = FILE_SHEET_PRECISION_SLIDER_CLASSES;
const SLIDER_COMMIT_DELAY_MS = 120;
const AXIS_OPTIONS = Object.freeze(["x", "y", "z"]);
const EDGE_CLASS_CONTROLS = Object.freeze([
  Object.freeze({ id: "feature", label: "Feature", labelKey: "edgeFeature", defaultColor: CAD_EDGE_COLOR, defaultOpacity: 1, defaultThickness: 1.15 }),
  Object.freeze({ id: "tangent", label: "Tangent", labelKey: "edgeTangent", defaultColor: CAD_EDGE_COLOR, defaultOpacity: 0.5, defaultThickness: 1.15 }),
  Object.freeze({ id: "seam", label: "Seam", labelKey: "edgeSeam", defaultColor: CAD_EDGE_COLOR, defaultOpacity: 0.85, defaultThickness: 1.15 }),
  Object.freeze({ id: "degenerate", label: "Degenerate", labelKey: "edgeDegenerate", defaultColor: CAD_EDGE_COLOR, defaultOpacity: 1, defaultThickness: 0 })
]);

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatNumber(value, digits = 2) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return "0";
  }
  return numericValue.toFixed(digits);
}

function formatMm(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return "0";
  }
  if (Math.abs(numericValue) >= 100) {
    return numericValue.toFixed(0);
  }
  if (Math.abs(numericValue) >= 10) {
    return numericValue.toFixed(1);
  }
  return numericValue.toFixed(2);
}

function Field({ label, value, trailing, children, className, contentClassName }) {
  return (
    <FileSheetControlRow
      label={label}
      value={value}
      trailing={trailing}
      className={className}
      contentClassName={contentClassName}
    >
      {children}
    </FileSheetControlRow>
  );
}

function Section({ title, value, children, ...props }) {
  return (
    <FileSheetSection value={value} title={title} {...props}>
      {children}
    </FileSheetSection>
  );
}

function ControlSubsection({ title, trailing = null, children, className, hideFirstSeparator = true }) {
  return (
    <FileSheetSubsection
      title={title}
      trailing={trailing}
      className={className}
      hideFirstSeparator={hideFirstSeparator}
    >
      {children}
    </FileSheetSubsection>
  );
}

function NestedControlGroup({ title, children, className, contentClassName }) {
  return (
    <FileSheetSubsubsection
      title={title}
      className={className}
      contentClassName={contentClassName}
    >
      {children}
    </FileSheetSubsubsection>
  );
}

function getSliderInputProps(children) {
  try {
    const child = Children.only(children);
    return isValidElement(child) && child.type === SliderInput ? child.props : null;
  } catch {
    return null;
  }
}

function SliderField({ label, value, children, onValueCommit, valueInputProps }) {
  const sliderInputProps = getSliderInputProps(children);
  const commitValue = onValueCommit || (
    sliderInputProps?.onChange ? (nextValue) => {
      sliderInputProps.onChange(parseFileSheetNumberInput(nextValue, {
        fallback: sliderInputProps.value,
        min: sliderInputProps.min,
        max: sliderInputProps.max
      }));
    } : null
  );

  return (
    <FileSheetSliderField
      label={label}
      value={value}
      onValueCommit={commitValue}
      valueInputProps={commitValue ? {
        ariaLabel: `${label} value`,
        ...valueInputProps
      } : valueInputProps}
    >
      {children}
    </FileSheetSliderField>
  );
}

function ThemeToggleRow({ label, checked, onChange, disabled = false, description }) {
  return (
    <FileSheetToggleRow
      label={label}
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
      description={description}
    />
  );
}

function SliderInput({ value, min, max, step = 0.01, onChange }) {
  const numericValue = Number.isFinite(Number(value)) ? Number(value) : min;
  const [draftValue, setDraftValue] = useState(numericValue);
  const commitTimerRef = useRef(null);

  useEffect(() => {
    setDraftValue(numericValue);
  }, [numericValue]);

  useEffect(() => () => {
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
    }
  }, []);

  const resolveNextValue = (nextValue) => {
    const numericNextValue = Number(nextValue);
    return Number.isFinite(numericNextValue) ? clamp(numericNextValue, min, max) : numericValue;
  };

  const commitValue = (nextValue) => {
    const resolvedNextValue = resolveNextValue(nextValue);
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
    }
    if (Math.abs(resolvedNextValue - numericValue) > 1e-9) {
      onChange(resolvedNextValue);
    }
  };

  const scheduleCommitValue = (nextValue) => {
    const resolvedNextValue = resolveNextValue(nextValue);
    setDraftValue(resolvedNextValue);
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
    }
    commitTimerRef.current = setTimeout(() => {
      commitValue(resolvedNextValue);
    }, SLIDER_COMMIT_DELAY_MS);
  };

  return (
    <Slider
      value={[draftValue]}
      min={min}
      max={max}
      step={step}
      onValueChange={(nextValue) => scheduleCommitValue(nextValue[0] ?? draftValue)}
      onValueCommit={(nextValue) => commitValue(nextValue[0] ?? draftValue)}
      className={precisionSliderClasses}
    />
  );
}

function CompactNumberInput({
  value,
  min = 0,
  max = 6,
  digits = 2,
  disabled = false,
  ariaLabel,
  onChange
}) {
  const numericValue = Number.isFinite(Number(value)) ? Number(value) : min;
  const formattedValue = formatNumber(numericValue, digits);
  const commitValue = (nextValue) => {
    const resolvedValue = parseFileSheetNumberInput(nextValue, {
      fallback: numericValue,
      min,
      max
    });
    if (Math.abs(resolvedValue - numericValue) > 1e-9) {
      onChange?.(resolvedValue);
    }
  };

  return (
    <FileSheetValueInput
      value={formattedValue}
      onValueCommit={commitValue}
      disabled={disabled}
      ariaLabel={ariaLabel}
      inputMode="decimal"
      className="h-full w-16 shrink-0 rounded-none border-0 bg-transparent px-1.5 py-0 text-right !text-[11px] font-medium tabular-nums shadow-none focus-visible:ring-0 dark:bg-transparent"
    />
  );
}

function EdgeMetricInput({
  label,
  color,
  opacity,
  thickness,
  min = 0,
  max = 6,
  digits = 2,
  disabled = false,
  onColorChange,
  onOpacityChange,
  onThicknessChange
}) {
  const { t } = useI18n();
  return (
    <div
      className={cn(
        "inline-flex h-7 shrink-0 items-center overflow-hidden rounded-md border border-input bg-transparent shadow-xs dark:bg-input/30",
        disabled && "opacity-50"
      )}
    >
      <ColorInput
        value={color}
        opacity={opacity}
        showOpacity
        showValue={false}
        disabled={disabled}
        onChange={onColorChange}
        onOpacityChange={onOpacityChange}
        className="h-7 w-7 rounded-none border-0 border-r border-input bg-transparent px-1.5 shadow-none"
        swatchClassName="size-3.5"
        title={`${label} ${t("edgeColor")}`}
        aria-label={`${label} ${t("edgeColor")}`}
      />
      <CompactNumberInput
        value={thickness}
        min={min}
        max={max}
        digits={digits}
        disabled={disabled}
        ariaLabel={`${label} ${t("edgeThickness")}`}
        onChange={onThicknessChange}
      />
      <span className="pr-1.5 text-[10px] font-medium text-muted-foreground">px</span>
    </div>
  );
}

function EdgeClassControlRow({
  label,
  color,
  thickness,
  opacity,
  onColorChange,
  onThicknessChange,
  onOpacityChange
}) {
  return (
    <FileSheetControlRow
      label={label}
      trailing={(
        <EdgeMetricInput
          label={label}
          color={color}
          opacity={opacity}
          thickness={thickness}
          onColorChange={onColorChange}
          onOpacityChange={onOpacityChange}
          onThicknessChange={onThicknessChange}
        />
      )}
      contentClassName="hidden"
    />
  );
}

function ColorInput({
  value,
  onChange,
  className,
  swatchClassName,
  valueClassName,
  showValue = true,
  disabled = false,
  ...props
}) {
  return (
    <ColorPicker
      value={value}
      onChange={onChange}
      className={cn(
        compactInputClasses,
        "w-fit justify-start gap-1.5 px-1.5",
        className
      )}
      swatchClassName={cn("size-3.5", swatchClassName)}
      valueClassName={valueClassName}
      popoverAlign="end"
      showValue={showValue}
      disabled={disabled}
      {...props}
    />
  );
}

function ColorField({ label, value, onChange, className, labelClassName }) {
  return (
    <FileSheetControlRow
      label={label}
      trailing={(
        <ColorInput
          value={value}
          onChange={onChange}
        />
      )}
      className={className}
      labelClassName={labelClassName}
    />
  );
}

function getPathValue(source, path) {
  return path.reduce((value, key) => (
    value && typeof value === "object" ? value[key] : undefined
  ), source);
}

function setPathValue(target, path, value) {
  let cursor = target;
  for (let index = 0; index < path.length - 1; index += 1) {
    const key = path[index];
    if (!cursor[key] || typeof cursor[key] !== "object" || Array.isArray(cursor[key])) {
      cursor[key] = {};
    }
    cursor = cursor[key];
  }
  cursor[path[path.length - 1]] = value;
}

function cloneModeColors(modeColors = {}) {
  return {
    light: JSON.parse(JSON.stringify(modeColors.light || {})),
    dark: JSON.parse(JSON.stringify(modeColors.dark || {}))
  };
}

function activeThemeColorMode(themeSettings = {}, resolvedColorSchemeMode = THEME_COLOR_MODES.LIGHT) {
  if (themeSettings.colorMode === THEME_COLOR_MODES.DARK) {
    return THEME_COLOR_MODES.DARK;
  }
  if (themeSettings.colorMode === THEME_COLOR_MODES.LIGHT) {
    return THEME_COLOR_MODES.LIGHT;
  }
  return resolvedColorSchemeMode === THEME_COLOR_MODES.DARK
    ? THEME_COLOR_MODES.DARK
    : THEME_COLOR_MODES.LIGHT;
}

function themeModeColorValue(themeSettings = {}, path = [], mode = THEME_COLOR_MODES.LIGHT) {
  return getPathValue(themeSettings.modeColors?.[mode], path) ||
    getPathValue(themeSettings, path) ||
    "#ffffff";
}

function ColorModeIndicatorLabel({ label, mode }) {
  const { t } = useI18n();
  const isDarkMode = mode === THEME_COLOR_MODES.DARK;
  const ModeIcon = isDarkMode ? Moon : Sun;
  const modeLabel = isDarkMode ? t("dark") : t("light");
  return (
    <span className="inline-flex max-w-full items-center gap-1 align-bottom" title={t("usesModeColor", { mode: modeLabel })}>
      <span className="min-w-0 truncate">{label}</span>
      <ModeIcon className="size-2.5 shrink-0 text-muted-foreground/70" strokeWidth={2.25} aria-hidden="true" />
      <span className="sr-only">{t("usesModeColor", { mode: modeLabel })}</span>
    </span>
  );
}

function ColorModeField({
  label,
  path,
  themeSettings,
  onChange,
  resolvedColorSchemeMode = THEME_COLOR_MODES.LIGHT
}) {
  const colorMode = themeSettings.colorMode || THEME_COLOR_MODES.SYSTEM;
  const mode = activeThemeColorMode(themeSettings, resolvedColorSchemeMode);
  if (colorMode === THEME_COLOR_MODES.SYSTEM) {
    return (
      <ColorField
        label={<ColorModeIndicatorLabel label={label} mode={mode} />}
        value={themeModeColorValue(themeSettings, path, mode)}
        onChange={(nextValue) => onChange(path, nextValue, mode)}
      />
    );
  }

  return (
    <ColorField
      label={label}
      value={themeModeColorValue(themeSettings, path, mode)}
      onChange={(nextValue) => onChange(path, nextValue)}
    />
  );
}

function resolveFillColors(materials = {}) {
  const colors = Array.isArray(materials.fillColors) && materials.fillColors.length
    ? materials.fillColors
    : [materials.defaultColor || "#ffffff"];
  return colors.slice(0, MAX_THEME_FILL_COLORS);
}

function settingsSignature(settings) {
  return JSON.stringify(normalizeThemeSettings(settings));
}

function FillColorEditor({ colors, onChange, cycleColors = false }) {
  const { t } = useI18n();
  const resolvedColors = colors.length ? colors : ["#ffffff"];
  const commitColors = (nextColors) => {
    const compactColors = nextColors.filter(Boolean).slice(0, MAX_THEME_FILL_COLORS);
    onChange(compactColors.length ? compactColors : [resolvedColors[0] || "#ffffff"]);
  };

  return (
    <div
      className="flex flex-wrap justify-start gap-1.5"
      data-cad-fill-color-grid="true"
    >
      {resolvedColors.map((color, index) => (
        <div
          key={index}
          className={cn(
            "group relative transition-opacity",
            !cycleColors && index > 0 && "opacity-45 grayscale"
          )}
        >
          <ColorInput
            value={color}
            swatchClassName="size-3.5"
            onChange={(nextColor) => {
              const nextColors = [...resolvedColors];
              nextColors[index] = nextColor;
              commitColors(nextColors);
            }}
            aria-label={`${t("fillColor")} ${index + 1}`}
            title={`${t("fillColor")} ${index + 1}: ${color}`}
          />
          {resolvedColors.length > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              className="absolute -right-1.5 -top-1.5 z-10 size-4 rounded-full border-border !bg-[rgb(245_247_250)] p-0 text-muted-foreground shadow-xs hover:!bg-[rgb(245_247_250)] hover:text-foreground dark:!bg-[rgb(12_15_22)] dark:hover:!bg-[rgb(12_15_22)]"
              onClick={() => commitColors(resolvedColors.filter((_, colorIndex) => colorIndex !== index))}
              aria-label={`${t("removeColor")} ${index + 1}`}
              title={`${t("removeColor")} ${index + 1}`}
            >
              <X className="h-2.5 w-2.5" strokeWidth={2.25} aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      ))}
      {resolvedColors.length < MAX_THEME_FILL_COLORS ? (
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="size-7 rounded-md p-0 text-muted-foreground hover:text-foreground"
          onClick={() => commitColors([...resolvedColors, resolvedColors[resolvedColors.length - 1] || "#ffffff"])}
          aria-label={t("addFillColor")}
          title={t("addFillColor")}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}

function SegmentedControl({ value, onChange, options }) {
  const { t } = useI18n();
  const columnCount = Math.max(1, Math.min(options.length, options.length > 4 ? 3 : 4));
  const templateColumns = `repeat(${columnCount}, minmax(0, 1fr))`;
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={value}
      onValueChange={(nextValue) => {
        if (!nextValue) {
          return;
        }
        onChange(nextValue);
      }}
      className="grid min-h-7 w-full min-w-0 auto-rows-[1.75rem]"
      style={{ gridTemplateColumns: templateColumns }}
    >
      {options.map((option) => {
        const Icon = option.Icon;
        const disabled = option.disabled === true;
        return (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            disabled={disabled}
            className={cn("min-w-0 gap-1.5 !h-7 px-1.5 text-[11px]", FILE_SHEET_SEGMENTED_ITEM_CLASSES)}
            title={option.titleKey ? t(option.titleKey) : (option.labelKey ? t(option.labelKey) : option.label)}
            aria-label={option.labelKey ? t(option.labelKey) : option.label}
          >
            {Icon ? <Icon className="size-3" strokeWidth={2} aria-hidden="true" /> : null}
            <span className="truncate">{option.labelKey ? t(option.labelKey) : option.label}</span>
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}

export function PresetSwatch({ preset = null }) {
  if (!preset) {
    return (
      <span
        className="h-4 w-8 shrink-0 rounded-md border border-dashed bg-muted"
        aria-hidden="true"
      />
    );
  }

  return (
    <span
      className="relative h-4 w-8 shrink-0 overflow-hidden rounded-md border shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
      style={{ background: preset.preview.background }}
      aria-hidden="true"
    >
      <span
        className="absolute inset-y-0 right-0 w-3"
        style={{ backgroundColor: preset.preview.accentColor, opacity: 0.9 }}
      />
    </span>
  );
}

export function useSystemDefaultThemePresetId() {
  const [systemDefaultPresetId, setSystemDefaultPresetId] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return DEFAULT_THEME_PRESET_ID;
    }
    return resolveSystemThemePresetId({
      prefersDark: window.matchMedia("(prefers-color-scheme: dark)").matches === true
    });
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const colorSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemDefaultPreset = () => {
      setSystemDefaultPresetId(resolveSystemThemePresetId({
        prefersDark: colorSchemeQuery.matches === true
      }));
    };

    updateSystemDefaultPreset();
    colorSchemeQuery.addEventListener?.("change", updateSystemDefaultPreset);
    return () => {
      colorSchemeQuery.removeEventListener?.("change", updateSystemDefaultPreset);
    };
  }, []);

  return systemDefaultPresetId;
}

function orderedThemePresets(presets, systemDefaultPresetId) {
  const defaultPresetIndex = presets.findIndex((preset) => preset.id === systemDefaultPresetId);
  if (defaultPresetIndex <= 0) {
    return presets;
  }
  return [
    presets[defaultPresetIndex],
    ...presets.slice(0, defaultPresetIndex),
    ...presets.slice(defaultPresetIndex + 1)
  ];
}

function resolveActiveThemePreset(themePresets, themePresetId, themeSettings) {
  const directPreset = themePresets.find((preset) => preset.id === themePresetId) || null;
  if (directPreset) {
    return directPreset;
  }
  const currentThemeSettingsSignature = settingsSignature(themeSettings);
  return themePresets.find((preset) => settingsSignature(preset.settings) === currentThemeSettingsSignature) || null;
}

function themeSettingsChangedFromPreset(preset, themeSettings) {
  return !preset || settingsSignature(preset.settings) !== settingsSignature(themeSettings);
}

function themePresetIsCustom(preset) {
  return String(preset?.id || "").startsWith("custom:");
}

function themePresetCanResetToDefault(preset) {
  const presetId = normalizeThemePresetId(preset?.presetId || preset?.id);
  return Boolean(
    themePresetIsCustom(preset) &&
    presetId &&
    settingsSignature(preset.settings) !== settingsSignature(cloneThemePresetSettings(presetId))
  );
}

function themePresetCanUpdate(preset) {
  return themePresetIsCustom(preset);
}

function themePresetCanDelete(preset) {
  return themePresetIsCustom(preset);
}

function themeLibraryChangedFromDefaults(themePresets = []) {
  if (!Array.isArray(themePresets) || !themePresets.length) {
    return false;
  }
  if (themePresets.length !== THEME_PRESETS.length) {
    return true;
  }
  for (let index = 0; index < THEME_PRESETS.length; index += 1) {
    const defaultPreset = THEME_PRESETS[index];
    const theme = themePresets[index];
    if (!theme || theme.id !== defaultPreset.id || theme.label !== defaultPreset.label) {
      return true;
    }
    if (normalizeThemePresetId(theme.presetId || theme.id) !== defaultPreset.id) {
      return true;
    }
    if (settingsSignature(theme.settings) !== settingsSignature(defaultPreset.settings)) {
      return true;
    }
  }
  return false;
}

function ThemeDirtyIndicator({ className }) {
  return (
    <span
      aria-hidden="true"
      className={cn("h-2 w-2 shrink-0 rounded-full bg-blue-500", className)}
    />
  );
}

function ThemePresetOverflowMenu({
  preset,
  canDeleteTheme,
  canResetToDefault,
  onActionActiveChange,
  onDelete,
  onEdit,
  onReset
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const label = String(preset?.label || "theme").trim() || "theme";
  const actionsLabel = `${t("themeActionsFor")} ${label}`;

  const setActionActive = (nextActive) => {
    onActionActiveChange?.(nextActive);
  };

  const handleOpenChange = (nextOpen) => {
    setOpen(nextOpen);
    setActionActive(nextOpen);
  };

  const stopMenuPropagation = (event) => {
    event.stopPropagation();
  };
  const handleActionSelect = (event, action) => {
    event.preventDefault();
    event.stopPropagation();
    setActionActive(false);
    action?.();
  };

  const handleTriggerBlur = (event) => {
    if (!open && !event.currentTarget.contains(event.relatedTarget)) {
      setActionActive(false);
    }
  };

  return (
    <DropdownMenuSub open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuSubTrigger
        showChevron={false}
        data-theme-menu-action=""
        aria-label={actionsLabel}
        title={actionsLabel}
        className={cn(
          "theme-preset-overflow-trigger flex size-7 shrink-0 items-center justify-center rounded-md p-0",
          "text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
          "focus:bg-accent focus:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        )}
        onPointerEnter={() => setActionActive(true)}
        onPointerLeave={() => {
          if (!open) {
            setActionActive(false);
          }
        }}
        onFocus={() => setActionActive(true)}
        onBlur={handleTriggerBlur}
        onMouseDown={stopMenuPropagation}
        onPointerDown={stopMenuPropagation}
        onKeyDown={stopMenuPropagation}
      >
        <MoreHorizontal className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent sideOffset={6} className="w-40">
        <DropdownMenuItem
          className="gap-2 text-xs"
          onSelect={(event) => handleActionSelect(event, onEdit)}
        >
          <Pencil className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          <span>{t("edit")}</span>
        </DropdownMenuItem>
        {canResetToDefault ? (
          <DropdownMenuItem
            className="gap-2 text-xs"
            onSelect={(event) => handleActionSelect(event, onReset)}
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            <span>{t("resetToPreset")}</span>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={!canDeleteTheme}
          className="gap-2 text-xs"
          onSelect={(event) => handleActionSelect(event, canDeleteTheme ? onDelete : null)}
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          <span>{t("delete")}</span>
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

function ThemeWarningDialog({
  open,
  onOpenChange,
  title,
  description,
  actionLabel,
  onConfirm
}) {
  const { t } = useI18n();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={onConfirm}
          >
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function SaveThemeDialog({
  defaultName,
  onOpenChange,
  onSave,
  open
}) {
  const { t } = useI18n();
  const inputId = useId();
  const [draftName, setDraftName] = useState(defaultName);
  const normalizedDraftName = draftName.trim();

  useEffect(() => {
    if (open) {
      setDraftName(defaultName);
    }
  }, [defaultName, open]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!normalizedDraftName || typeof onSave !== "function") {
      return;
    }
    const savedPreset = onSave(normalizedDraftName);
    if (savedPreset) {
      onOpenChange?.(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-5 sm:max-w-sm">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <DialogHeader className="gap-1.5">
            <DialogTitle className="text-base">{t("saveTheme")}</DialogTitle>
            <DialogDescription className="sr-only">
              {t("enterThemeName")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <label className={fieldLabelClasses} htmlFor={inputId}>
              {t("themeName")}
            </label>
            <Input
              id={inputId}
              value={draftName}
              autoFocus
              onChange={(event) => setDraftName(event.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm">
                {t("cancel")}
              </Button>
            </DialogClose>
            <Button type="submit" size="sm" disabled={!normalizedDraftName}>
              {t("saveTheme")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ThemePresetDropdown({
  themePresets = [],
  themeSettings,
  themePresetId = "",
  updateThemeSettings,
  handleDeleteCustomThemePreset,
  handleEditThemePreset,
  handleResetThemePresetToDefault,
  handleRestoreDefaultThemePresets,
  triggerClassName,
  iconClassName
}) {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteThemeId, setDeleteThemeId] = useState("");
  const [resetThemeId, setResetThemeId] = useState("");
  const [restoreThemesDialogOpen, setRestoreThemesDialogOpen] = useState(false);
  const [activeActionThemeId, setActiveActionThemeId] = useState("");
  const systemDefaultPresetId = useSystemDefaultThemePresetId();
  const orderedPresets = useMemo(
    () => orderedThemePresets(themePresets, systemDefaultPresetId),
    [themePresets, systemDefaultPresetId]
  );
  const activeThemePreset = useMemo(
    () => resolveActiveThemePreset(themePresets, themePresetId, themeSettings),
    [themePresets, themePresetId, themeSettings]
  );
  const activeThemePresetId = activeThemePreset?.id || "";
  const activeThemeLabel = activeThemePreset?.label || t("theme");
  const deleteThemePreset = themePresets.find((preset) => preset.id === deleteThemeId) || null;
  const resetThemePreset = themePresets.find((preset) => preset.id === resetThemeId) || null;
  const themeLibraryHasChanged = useMemo(
    () => themeLibraryChangedFromDefaults(themePresets),
    [themePresets]
  );

  const handleMenuOpenChange = (nextOpen) => {
    setMenuOpen(nextOpen);
    if (!nextOpen) {
      setActiveActionThemeId("");
    }
  };

  const clearThemeMenuActionState = (presetId) => {
    setActiveActionThemeId((currentThemeId) => (
      currentThemeId === presetId ? "" : currentThemeId
    ));
  };

  const applyThemePreset = (presetId) => {
    const preset = themePresets.find((candidate) => candidate.id === presetId);
    if (!preset) {
      return;
    }
    updateThemeSettings?.(preset.settings, {
      persistGlobal: true,
      presetId: preset.id
    });
  };

  const handleDeleteThemePreset = (presetId) => {
    const preset = themePresets.find((candidate) => candidate.id === presetId);
    if (themePresetCanDelete(preset) && typeof handleDeleteCustomThemePreset === "function") {
      setDeleteThemeId(presetId);
      setMenuOpen(false);
    }
  };

  const handleConfirmDeleteTheme = () => {
    if (deleteThemePreset && typeof handleDeleteCustomThemePreset === "function") {
      handleDeleteCustomThemePreset(deleteThemePreset.id);
    }
    setDeleteThemeId("");
  };

  const handleEditTheme = (presetId) => {
    const didEdit = typeof handleEditThemePreset === "function"
      ? handleEditThemePreset(presetId)
      : false;
    if (!didEdit) {
      applyThemePreset(presetId);
    }
    setMenuOpen(false);
  };

  const handleResetThemePreset = (presetId) => {
    setResetThemeId(presetId);
    setMenuOpen(false);
  };

  const handleConfirmResetTheme = () => {
    if (resetThemePreset && typeof handleResetThemePresetToDefault === "function") {
      handleResetThemePresetToDefault(resetThemePreset.id);
    }
    setResetThemeId("");
  };

  const handleConfirmRestoreThemes = () => {
    if (typeof handleRestoreDefaultThemePresets === "function") {
      handleRestoreDefaultThemePresets();
    }
    setRestoreThemesDialogOpen(false);
  };

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={handleMenuOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`${t("theme")}: ${activeThemeLabel}`}
            title={`${t("theme")}: ${activeThemeLabel}`}
            className={triggerClassName}
          >
            <Contrast className={iconClassName} strokeWidth={2} aria-hidden="true" />
            <span className="sr-only">{t("theme")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={6} className="w-64">
          <DropdownMenuLabel className="px-2 py-1.5 text-xs text-muted-foreground">
            {t("theme")}
          </DropdownMenuLabel>
          {orderedPresets.map((preset) => {
            const active = preset.id === activeThemePresetId;
            const canResetToDefault = themePresetCanResetToDefault(preset);
            const canDeleteTheme = themePresetCanDelete(preset);
            const actionActive = activeActionThemeId === preset.id;
            return (
              <div
                key={preset.id}
                data-active={active ? "true" : undefined}
                data-action-hover={actionActive ? "true" : undefined}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "theme-preset-menu-item flex min-w-0 items-center gap-1 rounded-sm text-xs"
                )}
              >
                <DropdownMenuItem
                  className={cn(
                    "theme-preset-menu-row min-w-0 flex-1 gap-2 px-2 py-1.5 text-xs",
                    active && "font-semibold"
                  )}
                  data-theme-menu-row-surface=""
                  onSelect={() => applyThemePreset(preset.id)}
                >
                  <PresetSwatch preset={preset} />
                  <span className="min-w-0 flex-1 truncate">{preset.label}</span>
                  {preset.id === systemDefaultPresetId ? (
                    <span
                      className="rounded-full border px-1.5 py-0.5 text-[9px] uppercase text-muted-foreground"
                      data-theme-menu-default-badge=""
                    >
                      {t("default")}
                    </span>
                  ) : null}
                </DropdownMenuItem>
                <span
                  className="theme-preset-menu-actions ml-auto flex shrink-0 items-center gap-0.5 rounded-sm px-0.5 py-0.5"
                >
                  <ThemePresetOverflowMenu
                    preset={preset}
                    canDeleteTheme={canDeleteTheme}
                    canResetToDefault={canResetToDefault}
                    onActionActiveChange={(nextActive) => {
                      if (nextActive) {
                        setActiveActionThemeId(preset.id);
                      } else {
                        clearThemeMenuActionState(preset.id);
                      }
                    }}
                    onEdit={() => handleEditTheme(preset.id)}
                    onReset={() => handleResetThemePreset(preset.id)}
                    onDelete={() => handleDeleteThemePreset(preset.id)}
                  />
                </span>
              </div>
            );
          })}
          {themeLibraryHasChanged ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-xs"
                onSelect={(event) => {
                  event.preventDefault();
                  setRestoreThemesDialogOpen(true);
                  setMenuOpen(false);
                }}
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                <span>{t("restoreDefaults")}</span>
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <ThemeWarningDialog
        open={Boolean(deleteThemePreset)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setDeleteThemeId("");
          }
        }}
        title={t("deleteTheme")}
        description={t("deleteThemeDescription", { name: deleteThemePreset?.label || t("thisTheme") })}
        actionLabel={t("deleteThemeAction")}
        onConfirm={handleConfirmDeleteTheme}
      />
      <ThemeWarningDialog
        open={Boolean(resetThemePreset)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setResetThemeId("");
          }
        }}
        title={t("resetTheme")}
        description={t("resetThemeDescription", { name: resetThemePreset?.label || t("thisTheme") })}
        actionLabel={t("resetThemeAction")}
        onConfirm={handleConfirmResetTheme}
      />
      <ThemeWarningDialog
        open={restoreThemesDialogOpen}
        onOpenChange={setRestoreThemesDialogOpen}
        title={t("restoreDefaults")}
        description={t("restoreDefaultsDescription")}
        actionLabel={t("restoreDefaults")}
        onConfirm={handleConfirmRestoreThemes}
      />
    </>
  );
}

function ThemeAppearanceSection({
  themePresets = [],
  themeSettings,
  themePresetId = "",
  updateThemeSettings,
  handleResetThemeSettings,
  handleSaveCustomThemePreset,
  handleUpdateThemePresetSettings
}) {
  const { t } = useI18n();
  const [saveThemeDialogOpen, setSaveThemeDialogOpen] = useState(false);
  const activeThemePreset = useMemo(
    () => resolveActiveThemePreset(themePresets, themePresetId, themeSettings),
    [themePresets, themePresetId, themeSettings]
  );
  const activeThemeId = activeThemePreset?.id || "";
  const canUpdateActiveTheme = themePresetCanUpdate(activeThemePreset);
  const themeHasChanged = themeSettingsChangedFromPreset(activeThemePreset, themeSettings);
  const fallbackThemeName = activeThemePreset?.label
    ? `${activeThemePreset.label} ${t("copy")}`
    : t("themeCopy");
  const colorMode = themeSettings.colorMode || THEME_COLOR_MODES.SYSTEM;

  const applyThemePreset = (presetId) => {
    const preset = themePresets.find((candidate) => candidate.id === presetId);
    if (!preset) {
      return;
    }
    updateThemeSettings?.(preset.settings, {
      persistGlobal: true,
      presetId: preset.id
    });
  };

  const handleSaveTheme = (themeName) => {
    if (!themeHasChanged || typeof handleSaveCustomThemePreset !== "function") {
      return null;
    }
    return handleSaveCustomThemePreset(themeName);
  };

  const handleUpdateTheme = () => {
    if (!themeHasChanged || !activeThemeId || !canUpdateActiveTheme || typeof handleUpdateThemePresetSettings !== "function") {
      return;
    }
    handleUpdateThemePresetSettings(activeThemeId);
  };

  const handleColorModeChange = (nextColorMode) => {
    updateThemeSettings?.((current) => ({
      ...normalizeThemeSettings(current),
      colorMode: nextColorMode
    }));
  };

  return (
    <>
      <ControlSubsection title={t("theme")}>
        <Field
          label={t("current")}
          value={themeHasChanged ? t("changed") : t("saved")}
        >
          <Select value={activeThemeId} onValueChange={applyThemePreset}>
            <SelectTrigger
              size="sm"
              className={cn(compactInputClasses, "w-full justify-between")}
              aria-label={t("theme")}
            >
              <span className="flex min-w-0 items-center gap-2">
                <PresetSwatch preset={activeThemePreset} />
                <span className="min-w-0 truncate">{activeThemePreset?.label || t("theme")}</span>
              </span>
            </SelectTrigger>
            <SelectContent>
              {themePresets.map((preset) => (
                <SelectItem key={preset.id} value={preset.id} className="text-xs">
                  <PresetSwatch preset={preset} />
                  <span className="min-w-0 truncate">{preset.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label={t("colorMode")}>
          <SegmentedControl
            value={colorMode}
            options={COLOR_MODE_OPTIONS}
            onChange={handleColorModeChange}
          />
        </Field>

        <FileSheetControlRow>
          <div className="flex flex-wrap gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(compactButtonClasses, "relative", themeHasChanged ? "pr-5" : null)}
              disabled={!themeHasChanged || typeof handleSaveCustomThemePreset !== "function"}
              onClick={() => setSaveThemeDialogOpen(true)}
            >
              <span>{t("saveAs")}</span>
              {themeHasChanged ? (
                <ThemeDirtyIndicator className="absolute right-1.5 top-1.5 h-1.5 w-1.5" />
              ) : null}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={compactButtonClasses}
              disabled={!themeHasChanged || !activeThemeId || !canUpdateActiveTheme || typeof handleUpdateThemePresetSettings !== "function"}
              onClick={handleUpdateTheme}
            >
              <span>{t("update")}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={compactButtonClasses}
              disabled={!themeHasChanged || !activeThemeId || typeof handleResetThemeSettings !== "function"}
              onClick={() => handleResetThemeSettings?.()}
            >
              <RotateCcw className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
              <span>{t("restoreToDefault")}</span>
            </Button>
          </div>
        </FileSheetControlRow>
      </ControlSubsection>
      <SaveThemeDialog
        defaultName={fallbackThemeName}
        onOpenChange={setSaveThemeDialogOpen}
        onSave={handleSaveTheme}
        open={saveThemeDialogOpen}
      />
    </>
  );
}

function PositionPad({ value, onChange }) {
  const { t } = useI18n();
  const resolvedX = Number.isFinite(Number(value?.x)) ? Number(value.x) : 0;
  const resolvedZ = Number.isFinite(Number(value?.z)) ? Number(value.z) : 0;
  const [draftPosition, setDraftPosition] = useState({ x: resolvedX, z: resolvedZ });
  const draftPositionRef = useRef(draftPosition);
  const commitTimerRef = useRef(null);
  const x = draftPosition.x;
  const z = draftPosition.z;

  useEffect(() => {
    const nextPosition = { x: resolvedX, z: resolvedZ };
    draftPositionRef.current = nextPosition;
    setDraftPosition(nextPosition);
  }, [resolvedX, resolvedZ]);

  useEffect(() => () => {
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
    }
  }, []);

  const extent = useMemo(() => {
    const magnitude = Math.max(Math.abs(x), Math.abs(z), 220);
    return Math.min(5000, Math.ceil((magnitude * 1.2) / 20) * 20);
  }, [x, z]);

  const markerLeft = ((x + extent) / (extent * 2)) * 100;
  const markerTop = ((extent - z) / (extent * 2)) * 100;

  const commitPosition = (nextX, nextZ) => {
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
    }
    if (nextX !== resolvedX) {
      onChange("x", nextX);
    }
    if (nextZ !== resolvedZ) {
      onChange("z", nextZ);
    }
  };

  const scheduleCommitPosition = (nextX, nextZ) => {
    const nextPosition = { x: nextX, z: nextZ };
    draftPositionRef.current = nextPosition;
    setDraftPosition(nextPosition);
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
    }
    commitTimerRef.current = setTimeout(() => {
      commitPosition(nextX, nextZ);
    }, SLIDER_COMMIT_DELAY_MS);
  };

  const updateFromPointer = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }
    const ratioX = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const ratioY = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    const nextX = Math.round((ratioX * 2 - 1) * extent);
    const nextZ = Math.round((1 - ratioY * 2) * extent);
    scheduleCommitPosition(nextX, nextZ);
  };

  return (
    <div className="space-y-2">
      <div
        className="relative h-28 w-full touch-none overflow-hidden rounded-md border bg-background"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          updateFromPointer(event);
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
            return;
          }
          updateFromPointer(event);
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
          }
          commitPosition(draftPositionRef.current.x, draftPositionRef.current.z);
        }}
      >
        <div
          className="absolute inset-0 opacity-45"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(154, 169, 188, 0.65) 1.5px, transparent 1.5px)",
            backgroundSize: "22px 22px"
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-x-0 top-1/2 h-px bg-border" aria-hidden="true" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-border" aria-hidden="true" />
        <div
          className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary bg-foreground shadow-xs"
          style={{ left: `${markerLeft}%`, top: `${markerTop}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>X {Math.round(x)}</span>
        <span>Z {Math.round(z)}</span>
        <span>{t("positionRange", { extent })}</span>
      </div>
    </div>
  );
}

export function DisplaySettingsSection({
  displaySettings,
  updateDisplaySettings,
  clipBounds = null,
  showClip = false
}) {
  const { t } = useI18n();
  const normalizedDisplaySettings = useMemo(
    () => normalizeDisplaySettings(displaySettings),
    [displaySettings]
  );
  const normalizedClipSettings = useMemo(
    () => normalizeStepClipSettings(normalizedDisplaySettings.clip),
    [normalizedDisplaySettings.clip]
  );
  const normalizedExplodedSettings = useMemo(
    () => normalizeExplodedViewSettings(normalizedDisplaySettings.exploded),
    [normalizedDisplaySettings.exploded]
  );
  const normalizedEdgeSettings = useMemo(
    () => normalizeDisplayEdgeSettings(normalizedDisplaySettings.edges),
    [normalizedDisplaySettings.edges]
  );
  const setDisplay = (patch) => {
    updateDisplaySettings?.((current) => ({
      ...normalizeDisplaySettings(current),
      ...patch
    }));
  };
  const setClip = (patch) => {
    updateDisplaySettings?.((current) => {
      const currentSettings = normalizeDisplaySettings(current);
      return {
        ...currentSettings,
        clip: buildStepClipPatch(currentSettings.clip, patch)
      };
    });
  };
  const setExploded = (patch) => {
    updateDisplaySettings?.((current) => {
      const currentSettings = normalizeDisplaySettings(current);
      return {
        ...currentSettings,
        exploded: normalizeExplodedViewSettings({ ...currentSettings.exploded, ...patch })
      };
    });
  };
  const setEdges = (patch) => {
    updateDisplaySettings?.((current) => {
      const currentSettings = normalizeDisplaySettings(current);
      return {
        ...currentSettings,
        edges: normalizeDisplayEdgeSettings({
          ...currentSettings.edges,
          ...patch
        })
      };
    });
  };
  const setEdgeClass = (classId, patch) => {
    updateDisplaySettings?.((current) => {
      const currentSettings = normalizeDisplaySettings(current);
      return {
        ...currentSettings,
        edges: normalizeDisplayEdgeSettings({
          ...currentSettings.edges,
          classes: {
            ...(currentSettings.edges?.classes || {}),
            [classId]: {
              ...(currentSettings.edges?.classes?.[classId] || {}),
              ...patch
            }
          }
        })
      };
    });
  };
  const resetEdges = () => {
    setDisplay({ edges: normalizeDisplayEdgeSettings() });
  };
  const selectedDisplayModeOption = displayModeOptionForValue(normalizedDisplaySettings.mode);
  const SelectedDisplayModeIcon = selectedDisplayModeOption?.Icon || null;
  const updateClipAxisOffset = (axis, nextOffset) => {
    const numericOffset = Number(nextOffset);
    const resolvedOffset = Number.isFinite(numericOffset) ? numericOffset : 0;
    setClip({
      axis,
      offset: resolvedOffset,
      offsets: { [axis]: resolvedOffset },
      enabled: resolvedOffset > 0
    });
  };

  return (
    <Section title={t("display")} value="display">
      <ControlSubsection title={t("mode")}>
        <Field label={t("projection")}>
          <SegmentedControl
            value={normalizedDisplaySettings.projection}
            onChange={(nextValue) => setDisplay({ projection: nextValue })}
            options={PROJECTION_MODE_OPTIONS}
          />
        </Field>

        <Field label={t("style")}>
          <Select
            value={normalizedDisplaySettings.mode}
            onValueChange={(nextValue) => setDisplay({ mode: nextValue })}
          >
            <SelectTrigger size="sm" className="h-7 !text-[11px]" aria-label={t("displayMode")}>
              <span className="flex min-w-0 items-center gap-1.5 overflow-hidden">
                {SelectedDisplayModeIcon ? (
                  <SelectedDisplayModeIcon className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={2} aria-hidden="true" />
                ) : null}
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent>
              {DISPLAY_MODE_OPTIONS.map((option) => {
                const Icon = option.Icon;
                return (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-xs"
                    title={option.titleKey ? t(option.titleKey) : (option.title || option.label)}
                    icon={Icon ? <Icon className="size-3.5" strokeWidth={2} /> : null}
                  >
                    {option.labelKey ? t(option.labelKey) : option.label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </Field>
      </ControlSubsection>

      <ControlSubsection title={t("edges")}>
        {EDGE_CLASS_CONTROLS.map((edgeClass) => {
          const settings = normalizedEdgeSettings.classes?.[edgeClass.id] || {};
          const color = settings.color || edgeClass.defaultColor;
          const thickness = settings.thickness ?? edgeClass.defaultThickness;
          const opacity = settings.opacity ?? edgeClass.defaultOpacity;
          return (
            <EdgeClassControlRow
              key={edgeClass.id}
              label={edgeClass.labelKey ? t(edgeClass.labelKey) : edgeClass.label}
              color={color}
              thickness={thickness}
              opacity={opacity}
              onColorChange={(nextValue) => setEdgeClass(edgeClass.id, { color: nextValue })}
              onThicknessChange={(nextValue) => setEdgeClass(edgeClass.id, { thickness: nextValue })}
              onOpacityChange={(nextValue) => setEdgeClass(edgeClass.id, { opacity: nextValue })}
            />
          );
        })}

        <FileSheetControlRow
          label={t("highlight")}
          trailing={(
            <EdgeMetricInput
              label={t("highlight")}
              color={normalizedEdgeSettings.highlightColor || CAD_EDGE_HIGHLIGHT_COLOR}
              opacity={normalizedEdgeSettings.highlightOpacity ?? 1}
              thickness={normalizedEdgeSettings.highlightThickness ?? 3}
              min={0.5}
              max={6}
              digits={1}
              onColorChange={(nextValue) => setEdges({ highlightColor: nextValue })}
              onOpacityChange={(nextValue) => setEdges({ highlightOpacity: nextValue })}
              onThicknessChange={(nextValue) => setEdges({ highlightThickness: nextValue })}
            />
          )}
          contentClassName="hidden"
        />

        <FileSheetControlRow>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={compactButtonClasses}
            onClick={resetEdges}
            title={t("resetEdgeDisplay")}
          >
            <RotateCcw className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
            <span>{t("reset")}</span>
          </Button>
        </FileSheetControlRow>
      </ControlSubsection>

      <ControlSubsection title={t("explodedView")}>
        <FileSheetToggleRow
          label={t("enabled")}
          checked={normalizedExplodedSettings.enabled}
          onCheckedChange={(checked) => setExploded({ enabled: checked })}
        />

        {normalizedExplodedSettings.enabled ? (
          <>
            <Field label={t("axis")}>
              <SegmentedControl
                value={normalizedExplodedSettings.axis}
                options={EXPLODED_AXIS_OPTIONS}
                onChange={(nextValue) => setExploded({ axis: nextValue })}
              />
            </Field>

            <FileSheetSliderField
              label={t("spacing")}
              value={`${normalizedExplodedSettings.spacing.toFixed(2)}x`}
              onValueCommit={(nextValue) => {
                setExploded({
                  spacing: parseFileSheetNumberInput(nextValue, {
                    fallback: normalizedExplodedSettings.spacing,
                    min: 0.25,
                    max: 4
                  })
                });
              }}
            >
              <Slider
                className={precisionSliderClasses}
                value={[normalizedExplodedSettings.spacing]}
                min={0.25}
                max={4}
                step={0.05}
                onValueChange={(value) => {
                  setExploded({ spacing: Array.isArray(value) ? value[0] : value });
                }}
                aria-label={t("explodedSpacing")}
              />
            </FileSheetSliderField>

            <FileSheetSliderField
              label={t("depth")}
              value={`${normalizedExplodedSettings.depth}`}
              onValueCommit={(nextValue) => {
                setExploded({
                  depth: parseFileSheetNumberInput(nextValue, {
                    fallback: normalizedExplodedSettings.depth,
                    min: 1,
                    max: 8,
                    integer: true
                  })
                });
              }}
            >
              <Slider
                className={precisionSliderClasses}
                value={[normalizedExplodedSettings.depth]}
                min={1}
                max={8}
                step={1}
                onValueChange={(value) => {
                  setExploded({ depth: Array.isArray(value) ? value[0] : value });
                }}
                aria-label={t("explodedDepth")}
              />
            </FileSheetSliderField>

            <FileSheetToggleRow
              label={t("mergeLevels")}
              checked={normalizedExplodedSettings.mergeCoplanar}
              onCheckedChange={(checked) => setExploded({ mergeCoplanar: checked })}
            />

            <FileSheetToggleRow
              label={t("groundBase")}
              checked={normalizedExplodedSettings.keepBaseGrounded}
              onCheckedChange={(checked) => setExploded({ keepBaseGrounded: checked })}
            />

            <FileSheetControlRow>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={compactButtonClasses}
                onClick={() => setExploded(DEFAULT_EXPLODED_VIEW_SETTINGS)}
                title={t("resetExplodedView")}
              >
                <RotateCcw className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
                <span>{t("reset")}</span>
              </Button>
            </FileSheetControlRow>
          </>
        ) : null}
      </ControlSubsection>

      {showClip ? (
        <ControlSubsection title={t("clip")} hideFirstSeparator={false}>
          {AXIS_OPTIONS.map((axis) => {
            const axisOffset = normalizedClipSettings.offsets?.[axis] ?? DEFAULT_STEP_CLIP_SETTINGS.offsets[axis];
            const axisSettings = {
              ...normalizedClipSettings,
              axis,
              offset: axisOffset,
              offsets: {
                ...normalizedClipSettings.offsets,
                [axis]: axisOffset
              }
            };
            const boundsForAxis = clipAxisBounds(clipBounds, axis);
            const axisRange = Math.max(boundsForAxis.max - boundsForAxis.min, 0);
            const clipPosition = clipAxisPosition(clipBounds, axisSettings);
            return (
              <FileSheetSliderField
                key={axis}
                label={axis}
                value={`${formatMm(clipPosition)} mm`}
                onValueCommit={(nextValue) => {
                  const nextPosition = parseFileSheetNumberInput(nextValue, {
                    fallback: clipPosition,
                    min: boundsForAxis.min,
                    max: boundsForAxis.max
                  });
                  updateClipAxisOffset(
                    axis,
                    axisRange > 0 ? (nextPosition - boundsForAxis.min) / axisRange : axisOffset
                  );
                }}
                valueInputProps={{
                  disabled: !axisRange,
                  ariaLabel: `${t("clip")} ${axis.toUpperCase()} ${t("position")}`
                }}
              >
                <Slider
                  className={precisionSliderClasses}
                  value={[axisOffset]}
                  min={0}
                  max={1}
                  step={0.001}
                  disabled={!axisRange}
                  onValueChange={(value) => {
                    const nextOffset = Array.isArray(value) ? value[0] : value;
                    updateClipAxisOffset(axis, nextOffset);
                  }}
                  aria-label={`${t("clip")} ${axis.toUpperCase()} ${t("axis")}`}
                />
                <div className="mt-1 flex justify-between text-[10px] text-[var(--ui-text-muted)]">
                  <span>{formatMm(boundsForAxis.min)}</span>
                  <span>{formatMm(boundsForAxis.max)}</span>
                </div>
              </FileSheetSliderField>
            );
          })}

          <FileSheetControlRow>
            <div className="flex flex-wrap gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={compactButtonClasses}
                onClick={() => setClip({ invert: !normalizedClipSettings.invert })}
                aria-pressed={normalizedClipSettings.invert}
                title={t("flipClipSide")}
              >
                <FlipHorizontal2 className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
                <span>{t("flip")}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={compactButtonClasses}
                onClick={() => setDisplay({ clip: normalizeStepClipSettings(DEFAULT_STEP_CLIP_SETTINGS) })}
                title={t("resetClipPlane")}
              >
                <RotateCcw className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
                <span>{t("reset")}</span>
              </Button>
            </div>
          </FileSheetControlRow>
        </ControlSubsection>
      ) : null}
    </Section>
  );
}

export function ThemeSettingsSections({
  themePresets = [],
  themeSettings,
  themePresetId = "",
  resolvedColorSchemeMode = THEME_COLOR_MODES.LIGHT,
  updateThemeSettings,
  handleResetThemeSettings,
  handleSaveCustomThemePreset,
  handleUpdateThemePresetSettings
}) {
  const { t } = useI18n();
  const [activePrimaryLight, setActivePrimaryLight] = useState("directional");
  const activeThemePreset = useMemo(
    () => resolveActiveThemePreset(themePresets, themePresetId, themeSettings),
    [themePresets, themePresetId, themeSettings]
  );
  const themeHasChanged = themeSettingsChangedFromPreset(activeThemePreset, themeSettings);
  const appearanceTitle = (
    <span className="flex min-w-0 items-center gap-2">
      <span>{t("appearance")}</span>
      {themeHasChanged ? <ThemeDirtyIndicator className="h-1.5 w-1.5" /> : null}
    </span>
  );

  const setMaterials = (patch) => {
    updateThemeSettings((current) => ({
      ...current,
      materials: {
        ...current.materials,
        ...patch
      }
    }));
  };

  const setBackground = (patch) => {
    updateThemeSettings((current) => ({
      ...current,
      background: {
        ...current.background,
        ...patch
      }
    }));
  };

  const setFloor = (patch) => {
    updateThemeSettings((current) => ({
      ...current,
      floor: {
        ...current.floor,
        ...patch
      }
    }));
  };
  const setFloorGrid = (patch) => {
    updateThemeSettings((current) => {
      const currentFloor = current.floor || {};
      return {
        ...current,
        floor: {
          ...currentFloor,
          grid: {
            ...(currentFloor.grid || {}),
            ...patch
          }
        }
      };
    });
  };

  const setEnvironment = (patch) => {
    updateThemeSettings((current) => ({
      ...current,
      environment: {
        ...current.environment,
        ...patch
      }
    }));
  };

  const setLighting = (patch) => {
    updateThemeSettings((current) => ({
      ...current,
      lighting: {
        ...current.lighting,
        ...patch
      }
    }));
  };

  const setThemeColor = (path, nextValue, mode = "") => {
    updateThemeSettings((current) => {
      const normalized = normalizeThemeSettings(current);
      const modeColors = cloneModeColors(normalized.modeColors);
      const next = {
        ...normalized,
        modeColors
      };
      if (mode === THEME_COLOR_MODES.LIGHT || mode === THEME_COLOR_MODES.DARK) {
        setPathValue(modeColors[mode], path, nextValue);
        return next;
      }
      const activeMode = activeThemeColorMode(normalized, resolvedColorSchemeMode);
      setPathValue(next, path, nextValue);
      setPathValue(modeColors[activeMode], path, nextValue);
      return next;
    });
  };
  const themeColorFieldProps = {
    themeSettings,
    resolvedColorSchemeMode,
    onChange: setThemeColor
  };

  const setLightConfig = (lightKey, patch) => {
    updateThemeSettings((current) => ({
      ...current,
      lighting: {
        ...current.lighting,
        [lightKey]: {
          ...current.lighting[lightKey],
          ...patch
        }
      }
    }));
  };

  const setLightPosition = (lightKey, axis, nextValue) => {
    updateThemeSettings((current) => ({
      ...current,
      lighting: {
        ...current.lighting,
        [lightKey]: {
          ...current.lighting[lightKey],
          position: {
            ...current.lighting[lightKey].position,
            [axis]: nextValue
          }
        }
      }
    }));
  };

  return (
    <Section
      title={appearanceTitle}
      value="appearance"
      data-cad-theme-appearance-section="true"
    >
      <ThemeAppearanceSection
        themePresets={themePresets}
        themeSettings={themeSettings}
        themePresetId={themePresetId}
        updateThemeSettings={updateThemeSettings}
        handleResetThemeSettings={handleResetThemeSettings}
        handleSaveCustomThemePreset={handleSaveCustomThemePreset}
        handleUpdateThemePresetSettings={handleUpdateThemePresetSettings}
      />

      <ControlSubsection title={t("surface")}>
        <Field label={t("colors")} value={`${resolveFillColors(themeSettings.materials).length}/${MAX_THEME_FILL_COLORS}`}>
          <FillColorEditor
            colors={resolveFillColors(themeSettings.materials)}
            cycleColors={themeSettings.materials.cycleColors === true}
            onChange={(nextColors) => setMaterials({
              defaultColor: nextColors[0],
              fillColors: nextColors
            })}
          />
        </Field>

        <ThemeToggleRow
          label={t("cycleColors")}
          checked={themeSettings.materials.cycleColors === true}
          onChange={(nextValue) => setMaterials({ cycleColors: nextValue })}
        />

        <ThemeToggleRow
          label={t("overrideColors")}
          checked={themeSettings.materials.overrideSourceColors === true}
          onChange={(nextValue) => setMaterials({ overrideSourceColors: nextValue })}
        />

        <SliderField label={t("saturation")} value={formatNumber(themeSettings.materials.saturation)}>
          <SliderInput
            value={themeSettings.materials.saturation}
            min={0}
            max={2.5}
            step={0.01}
            onChange={(nextValue) => setMaterials({ saturation: nextValue })}
          />
        </SliderField>

        <SliderField label={t("contrast")} value={formatNumber(themeSettings.materials.contrast)}>
          <SliderInput
            value={themeSettings.materials.contrast}
            min={0}
            max={2.5}
            step={0.01}
            onChange={(nextValue) => setMaterials({ contrast: nextValue })}
          />
        </SliderField>

        <SliderField label={t("brightness")} value={formatNumber(themeSettings.materials.brightness)}>
          <SliderInput
            value={themeSettings.materials.brightness}
            min={0}
            max={2}
            step={0.01}
            onChange={(nextValue) => setMaterials({ brightness: nextValue })}
          />
        </SliderField>
      </ControlSubsection>

      <ControlSubsection title={t("backdrop")}>
        <Field label={t("style")}>
          <SegmentedControl
            value={themeSettings.background.type}
            onChange={(nextValue) => setBackground({ type: nextValue })}
            options={BACKGROUND_MODE_OPTIONS}
          />
        </Field>

        {themeSettings.background.type === "solid" ? (
          <ColorModeField
            label={t("color")}
            path={["background", "solidColor"]}
            {...themeColorFieldProps}
          />
        ) : null}

        {themeSettings.background.type === "linear" ? (
          <>
            <ColorModeField
              label={t("startColor")}
              path={["background", "linearStart"]}
              {...themeColorFieldProps}
            />
            <ColorModeField
              label={t("endColor")}
              path={["background", "linearEnd"]}
              {...themeColorFieldProps}
            />
            <SliderField label={t("angle")} value={`${formatNumber(themeSettings.background.linearAngle, 0)} deg`}>
              <SliderInput
                value={themeSettings.background.linearAngle}
                min={-360}
                max={360}
                step={1}
                onChange={(nextValue) => setBackground({ linearAngle: nextValue })}
              />
            </SliderField>
          </>
        ) : null}

        {themeSettings.background.type === "radial" ? (
          <>
            <ColorModeField
              label={t("innerColor")}
              path={["background", "radialInner"]}
              {...themeColorFieldProps}
            />
            <ColorModeField
              label={t("outerColor")}
              path={["background", "radialOuter"]}
              {...themeColorFieldProps}
            />
          </>
        ) : null}
      </ControlSubsection>

      <ControlSubsection
        title={t("floor")}
        trailing={(
          <FileSheetBooleanToggle
            checked={themeSettings.floor?.enabled === true}
            onCheckedChange={(nextValue) => setFloor({ enabled: nextValue })}
            ariaLabel={t("enableFloor")}
          />
        )}
      >
        {themeSettings.floor?.enabled === true ? (
          <>
            <ColorModeField
              label={t("color")}
              path={["floor", "color"]}
              {...themeColorFieldProps}
            />
            <SliderField label={t("roughness")} value={formatNumber(themeSettings.floor?.roughness ?? 0.72)}>
              <SliderInput
                value={themeSettings.floor?.roughness ?? 0.72}
                min={0}
                max={1}
                step={0.01}
                onChange={(nextValue) => setFloor({ roughness: nextValue })}
              />
            </SliderField>
            <SliderField label={t("reflectivity")} value={formatNumber(themeSettings.floor?.reflectivity ?? 0.12)}>
              <SliderInput
                value={themeSettings.floor?.reflectivity ?? 0.12}
                min={0}
                max={1}
                step={0.01}
                onChange={(nextValue) => setFloor({ reflectivity: nextValue })}
              />
            </SliderField>
            <SliderField label={t("shadow")} value={formatNumber(themeSettings.floor?.shadowOpacity ?? 0.45)}>
              <SliderInput
                value={themeSettings.floor?.shadowOpacity ?? 0.45}
                min={0}
                max={1}
                step={0.01}
                onChange={(nextValue) => setFloor({ shadowOpacity: nextValue })}
              />
            </SliderField>
            <SliderField label={t("backdropBlend")} value={formatNumber(themeSettings.floor?.horizonBlend ?? 0)}>
              <SliderInput
                value={themeSettings.floor?.horizonBlend ?? 0}
                min={0}
                max={1}
                step={0.01}
                onChange={(nextValue) => setFloor({ horizonBlend: nextValue })}
              />
            </SliderField>
          </>
        ) : null}
      </ControlSubsection>

      <ControlSubsection
        title={t("grid")}
        trailing={(
          <FileSheetBooleanToggle
            checked={themeSettings.floor?.grid?.enabled === true}
            onCheckedChange={(nextValue) => setFloorGrid({ enabled: nextValue })}
            ariaLabel={t("enableGrid")}
          />
        )}
      >
        {themeSettings.floor?.grid?.enabled === true ? (
          <>
            <ColorModeField
              label={t("floorColor")}
              path={["floor", "color"]}
              {...themeColorFieldProps}
            />
            <ColorModeField
              label={t("centerLine")}
              path={["floor", "grid", "centerColor"]}
              {...themeColorFieldProps}
            />
            <ColorModeField
              label={t("cellLine")}
              path={["floor", "grid", "cellColor"]}
              {...themeColorFieldProps}
            />
            <SliderField label={t("lineOpacity")} value={formatNumber(themeSettings.floor?.grid?.opacity ?? 0.18)}>
              <SliderInput
                value={themeSettings.floor?.grid?.opacity ?? 0.18}
                min={0}
                max={1}
                step={0.01}
                onChange={(nextValue) => setFloorGrid({ opacity: nextValue })}
              />
            </SliderField>
            <SliderField label={t("density")} value={formatNumber(themeSettings.floor?.grid?.density ?? 1)}>
              <SliderInput
                value={themeSettings.floor?.grid?.density ?? 1}
                min={0.25}
                max={4}
                step={0.05}
                onChange={(nextValue) => setFloorGrid({ density: nextValue })}
              />
            </SliderField>
          </>
        ) : null}
      </ControlSubsection>

      <ControlSubsection title={t("lighting")}>
        <ThemeToggleRow
          label={t("environmentLight")}
          checked={themeSettings.environment.enabled}
          onChange={(nextValue) => setEnvironment({ enabled: nextValue })}
        />
        <SliderField label={t("environmentIntensity")} value={formatNumber(themeSettings.environment.intensity)}>
          <SliderInput
            value={themeSettings.environment.intensity}
            min={0}
            max={4}
            step={0.01}
            onChange={(nextValue) => setEnvironment({ intensity: nextValue })}
          />
        </SliderField>

        <SliderField label={t("toneMapping")} value={formatNumber(themeSettings.lighting.toneMappingExposure)}>
          <SliderInput
            value={themeSettings.lighting.toneMappingExposure}
            min={0.05}
            max={6}
            step={0.01}
            onChange={(nextValue) => setLighting({ toneMappingExposure: nextValue })}
          />
        </SliderField>

        <NestedControlGroup title={t("primary")}>
          <Tabs value={activePrimaryLight} onValueChange={setActivePrimaryLight} className="gap-0">
            <div className="px-3 py-1">
              <TabsList className="grid h-7 w-full grid-cols-3 rounded-md p-0.5">
                {PRIMARY_LIGHT_OPTIONS.map((option) => (
                  <TabsTrigger key={option.value} value={option.value} className="text-[11px]">
                    {t(option.labelKey)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {PRIMARY_LIGHT_OPTIONS.map((option) => {
              const light = themeSettings.lighting[option.value];
              const supportsDistance = option.value !== "directional";
              return (
                <TabsContent
                  key={option.value}
                  value={option.value}
                  className={cn("mt-2", FILE_SHEET_ROW_STACK_CLASSES)}
                  data-file-sheet-row-stack=""
                >
                  <ThemeToggleRow
                    label={`${t(option.labelKey)} ${t("light")}`}
                    checked={light.enabled}
                    onChange={(nextValue) => setLightConfig(option.value, { enabled: nextValue })}
                  />
                  <ColorModeField
                    label={t("color")}
                    path={["lighting", option.value, "color"]}
                    {...themeColorFieldProps}
                  />
                  <SliderField label={t("intensity")} value={formatNumber(light.intensity)}>
                    <SliderInput
                      value={light.intensity}
                      min={0}
                      max={20}
                      step={0.01}
                      onChange={(nextValue) => setLightConfig(option.value, { intensity: nextValue })}
                    />
                  </SliderField>
                  {option.value === "spot" ? (
                    <SliderField label={t("angle")} value={formatNumber(light.angle)}>
                      <SliderInput
                        value={light.angle}
                        min={0.01}
                        max={1.57}
                        step={0.01}
                        onChange={(nextValue) => setLightConfig(option.value, { angle: nextValue })}
                      />
                    </SliderField>
                  ) : null}
                  {supportsDistance ? (
                    <SliderField label={t("distance")} value={formatNumber(light.distance, 0)}>
                      <SliderInput
                        value={light.distance}
                        min={0}
                        max={5000}
                        step={1}
                        onChange={(nextValue) => setLightConfig(option.value, { distance: nextValue })}
                      />
                    </SliderField>
                  ) : null}
                  <Field label={t("positionXZ")}>
                    <PositionPad
                      value={light.position}
                      onChange={(axis, nextValue) => setLightPosition(option.value, axis, nextValue)}
                    />
                  </Field>
                  <SliderField label={t("heightY")} value={formatNumber(light.position.y, 0)}>
                    <SliderInput
                      value={light.position.y}
                      min={-5000}
                      max={5000}
                      step={1}
                      onChange={(nextValue) => setLightPosition(option.value, "y", nextValue)}
                    />
                  </SliderField>
                </TabsContent>
              );
            })}
          </Tabs>
        </NestedControlGroup>

        <NestedControlGroup title={t("ambient")}>
          <ThemeToggleRow
            label={t("ambientLight")}
            checked={themeSettings.lighting.ambient.enabled}
            onChange={(nextValue) => setLightConfig("ambient", { enabled: nextValue })}
          />
          <ColorModeField
            label={t("ambientColor")}
            path={["lighting", "ambient", "color"]}
            {...themeColorFieldProps}
          />
          <SliderField label={t("ambientIntensity")} value={formatNumber(themeSettings.lighting.ambient.intensity)}>
            <SliderInput
              value={themeSettings.lighting.ambient.intensity}
              min={0}
              max={20}
              step={0.01}
              onChange={(nextValue) => setLightConfig("ambient", { intensity: nextValue })}
            />
          </SliderField>
        </NestedControlGroup>

        <NestedControlGroup title={t("hemisphere")}>
          <ThemeToggleRow
            label={t("hemisphereLight")}
            checked={themeSettings.lighting.hemisphere.enabled}
            onChange={(nextValue) => setLightConfig("hemisphere", { enabled: nextValue })}
          />
          <ColorModeField
            label={t("skyColor")}
            path={["lighting", "hemisphere", "skyColor"]}
            {...themeColorFieldProps}
          />
          <ColorModeField
            label={t("groundColor")}
            path={["lighting", "hemisphere", "groundColor"]}
            {...themeColorFieldProps}
          />
          <SliderField label={t("hemisphereIntensity")} value={formatNumber(themeSettings.lighting.hemisphere.intensity)}>
            <SliderInput
              value={themeSettings.lighting.hemisphere.intensity}
              min={0}
              max={20}
              step={0.01}
              onChange={(nextValue) => setLightConfig("hemisphere", { intensity: nextValue })}
            />
          </SliderField>
        </NestedControlGroup>
      </ControlSubsection>
    </Section>
  );
}

export default function ThemeSettingsPopover({
  open,
  isDesktop,
  width,
  onStartResize,
  themePresets = [],
  themeSettings,
  themePresetId = "",
  resolvedColorSchemeMode = THEME_COLOR_MODES.LIGHT,
  updateThemeSettings,
  handleResetThemeSettings,
  handleSaveCustomThemePreset,
  handleUpdateThemePresetSettings
}) {
  const { t } = useI18n();
  return (
    <FileSheet
      open={open}
      title={t("theme")}
      isDesktop={isDesktop}
      width={width}
      onStartResize={onStartResize}
    >
      <Accordion type="multiple" className="text-sm">
        <ThemeSettingsSections
          themePresets={themePresets}
          themeSettings={themeSettings}
          themePresetId={themePresetId}
          resolvedColorSchemeMode={resolvedColorSchemeMode}
          updateThemeSettings={updateThemeSettings}
          handleResetThemeSettings={handleResetThemeSettings}
          handleSaveCustomThemePreset={handleSaveCustomThemePreset}
          handleUpdateThemePresetSettings={handleUpdateThemePresetSettings}
        />
      </Accordion>
    </FileSheet>
  );
}
