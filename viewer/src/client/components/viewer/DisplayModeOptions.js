import {
  Contrast,
  Eye,
  EyeOff,
  Layers,
  Paintbrush,
  Spline,
  SquareDashed
} from "lucide-react";
import { CAD_DISPLAY_MODE } from "cadjs/lib/displaySettings";

export const DISPLAY_MODE_OPTIONS = Object.freeze([
  Object.freeze({ value: CAD_DISPLAY_MODE.SOLID, label: "Solid", labelKey: "displaySolid", title: "Shaded with CAD edges", titleKey: "displaySolidTitle", Icon: Layers }),
  Object.freeze({ value: CAD_DISPLAY_MODE.RENDERED, label: "Rendered", labelKey: "displayRendered", title: "Shaded material appearance without edge overlay", titleKey: "displayRenderedTitle", Icon: Paintbrush }),
  Object.freeze({ value: CAD_DISPLAY_MODE.TRANSPARENT, label: "X-Ray", labelKey: "displayXRay", title: "Transparent solids with visible CAD edges", titleKey: "displayXRayTitle", Icon: Eye }),
  Object.freeze({ value: CAD_DISPLAY_MODE.HIDDEN_EDGES, label: "Hidden", labelKey: "displayHidden", title: "Shaded with hidden edges visible", titleKey: "displayHiddenTitle", Icon: EyeOff }),
  Object.freeze({ value: CAD_DISPLAY_MODE.HIDDEN_LINES_REMOVED, label: "Lines", labelKey: "displayLines", title: "Visible lines with hidden lines removed", titleKey: "displayLinesTitle", Icon: SquareDashed }),
  Object.freeze({ value: CAD_DISPLAY_MODE.UNSHADED, label: "Flat", labelKey: "displayFlat", title: "Unshaded flat color", titleKey: "displayFlatTitle", Icon: Contrast }),
  Object.freeze({ value: CAD_DISPLAY_MODE.WIREFRAME, label: "Wire", labelKey: "displayWire", title: "Full wireframe", titleKey: "displayWireTitle", Icon: Spline })
]);

export function displayModeOptionForValue(value) {
  return DISPLAY_MODE_OPTIONS.find((option) => option.value === value) || DISPLAY_MODE_OPTIONS[0];
}
