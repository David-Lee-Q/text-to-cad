import {
  Accordion
} from "../ui/accordion";
import FileSheet from "./FileSheet";
import FileMetadataSection from "./FileMetadataSection";
import FileStatusSection from "./FileStatusSection";
import ImplicitGraphicsSection from "./ImplicitGraphicsSection";
import ParameterControlsSection from "./ParameterControlsSection";
import { useI18n } from "@/i18n";

export default function ImplicitFileSheet({
  open,
  title,
  isDesktop,
  width,
  selectedEntry = null,
  onOpenChange,
  onStartResize,
  parameterRuntime = null,
  graphicsRuntime = null,
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
  return (
    <FileSheet
      open={open}
      title={title ?? t("implicitCad")}
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
        <ParameterControlsSection
          runtime={parameterRuntime}
          label={t("implicitParameter")}
          loadingLabel={t("loadingImplicitParameters")}
          noParametersLabel={t("noImplicitParameters")}
          hideWhenEmpty
          animationAriaLabel={t("implicitAnimation")}
          copyTitle={t("copyImplicitParameterJson")}
          pasteTitle={t("pasteImplicitParameterJson")}
        />
        <ImplicitGraphicsSection runtime={graphicsRuntime} />
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
