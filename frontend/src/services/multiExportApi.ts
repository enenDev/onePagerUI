import JSZip from "jszip";

import ApiBase from "@/components/auth/apiBase";
import { USE_DYNAMIC_PPT_EXPORT } from "@/config/dynamicPPTExport";
import {
  buildOnePagerPptBlob,
  composeTitle,
  safeFileName,
} from "@/services/exportOnePagerPpt";
import { buildDynamicOnePagerPptBlob } from "@/services/exportOnePagerPptDynamic";
import { logPagerActivity } from "@/services/pagerActivityApi";
import {
  mapGetOnePagerResponse,
  type GetOnePagerApiResponse,
} from "@/services/mapGetOnePagerResponse";

export async function exportMultipleOnePagersAsZip(pagerIds: string[]) {
  if (!pagerIds.length) return;

  const { data } = await ApiBase.post<GetOnePagerApiResponse[]>(
    "api/v1/pagers/export-bulk",
    { pager_ids: pagerIds },
  );

  const zip = new JSZip();
  const exportedIds: string[] = [];

  for (const item of data) {
    const record = mapGetOnePagerResponse(item);
    if (record.id) exportedIds.push(record.id);
    const payload = record.payload;
    const exportInput = {
      pagerType: record.pager_type,
      payload,
    };
    // Same switch as exportOnePagerPpt: dynamic column-fit fonts when the flag is on.
    const blob = USE_DYNAMIC_PPT_EXPORT
      ? await buildDynamicOnePagerPptBlob(exportInput)
      : await buildOnePagerPptBlob(exportInput);

    const baseFileName = safeFileName(composeTitle(record.pager_type, payload));

    // Ensure unique filenames inside the zip when multiple one-pagers share the same title.
    // JSZip will overwrite entries with the same name, so append a numeric suffix
    // when a collision is detected (e.g., "Title.pptx", "Title (1).pptx", ...).
    let uniqueName = baseFileName;
    let counter = 1;
    while (zip.file(uniqueName)) {
      // Use underscore suffix (e.g., Title_1.pptx) for uniqueness — more standard for file systems.
      uniqueName = baseFileName.replace(/\.pptx$/i, `_${counter}.pptx`);
      counter += 1;
    }

    zip.file(uniqueName, blob);
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const zipUrl = URL.createObjectURL(zipBlob);
  const anchor = document.createElement("a");
  anchor.href = zipUrl;
  anchor.download = "one-pagers-export.zip";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(zipUrl);

  for (const pagerId of exportedIds) {
    logPagerActivity({ pager_id: pagerId, action: "export" });
  }
}
