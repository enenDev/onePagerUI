import JSZip from "jszip";

import ApiBase from "@/components/auth/apiBase";
import {
  buildOnePagerPptBlob,
  composeTitle,
  safeFileName,
} from "@/services/exportOnePagerPpt";
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
    const blob = await buildOnePagerPptBlob({
      pagerType: record.pager_type,
      payload,
    });

    const fileName = safeFileName(
      composeTitle(record.pager_type, payload),
    );

    zip.file(fileName, blob);
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
