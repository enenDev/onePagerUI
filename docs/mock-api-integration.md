# Mock API Integration

Swap **only the function body**. Keep the same name, args, and return type. Do not rewrite pages.

Axios is installed. Use `VITE_API_BASE_URL`. FastAPI has no real endpoints yet.

**Rule:** upload images first. Do not POST `blob:` URLs on save/publish.

---

## 1. `getMetadata`

- **File:** `frontend/src/services/metadataApi.ts` — lines **43–46**
- **Replace:** the `delay()` + JSON clone. Stop importing `homepageMetadata.json`.
- **With:** `GET /api/metadata`
- **Serves:** Home filters and create/edit dropdowns (Market, Retailer, Channel, Category, Campaign)
- **Data today:** `frontend/src/services/mocks/homepageMetadata.json`
- **Keep:** `{ market, optionsByMarket }`
- **Depends on:** none — load this first

---

## 2. `getCreateFormMetadata`

- **File:** `frontend/src/services/createFormApi.ts` — lines **100–103**
- **Replace:** the function body and helper `loadCreateFormExtras` (lines **47–57**). Stop importing `createFormMetadata.json`.
- **With:** `GET /api/create-form/metadata`
- **Serves:** Initiative modal only — department list + KPIs per pillar
- **Data today:** `frontend/src/services/mocks/createFormMetadata.json`
- **Keep:** `{ accountableDepartments, kpisByPillarNumber }` (not Market/Retailer/etc.)
- **Depends on:** `getMetadata` — both are merged in `useCreateFormCatalog.ts`

---

## 3. `addCampaign`

- **File:** `frontend/src/services/createFormApi.ts` — lines **116–143**
- **Replace:** the fake delay + local duplicate check
- **With:** `POST /api/campaigns` body `{ market, campaign_name }`
- **Serves:** “Add New Campaign” on National and Retailer forms
- **Data today:** fake success. New option is not saved. Lost on refresh.
- **Keep:** `{ ok: true, campaign: { label, value } }` or `{ ok: false, error }`
- **Depends on:** `getMetadata`. After success, FE already appends the option in Redux — do not refetch metadata.

---

## 4. `submitOnePagerSearch`

- **File:** `frontend/src/services/onePagerApi.ts` — lines **62–69**
- **Replace:** `landingList.filter(...)`. After this is live, delete `landingListStore.ts`.
- **With:** `POST /api/one-pagers/search`
- **Body:** `{ market: string[], retailer: string[], channel: string[], category: string[], campaign: string[] }` — empty array = no filter
- **Serves:** Home cards, Submit, Clear all, Import From National picker
- **Data today:** in-memory `landingList` in `landingListStore.ts` (lines **16–18**), seeded from `mocks/landingOnePagers.json`
- **Keep:** `OnePagerListItem[]` with a real `cover_image_url` (not `blob:`)
- **Depends on:** `getMetadata` for dropdowns. Active/Drafts/Archive tabs are still filtered on the frontend.

---

## 5. `getOnePagerById`

- **File:** `frontend/src/services/onePagerApi.ts` — lines **150–169**
- **Replace:** cloning mock JSON. Stop importing `nationalOnePager.json` / `retailerOnePager.json` here.
- **With:** `GET /api/one-pagers/:id`
- **Serves:** Edit (`/edit/:id`), View (`/view/:id`), Track (`/track/:id`)
- **Data today:** any national id → `mocks/nationalOnePager.json`; any retailer id → `mocks/retailerOnePager.json`. Only the URL id is stamped on.
- **Keep:** `{ id, status, created_by, list_status, published_at, pager_type, payload }`
- **Depends on:** real save/publish data. Import From National does **not** use this — it uses `getNationalOnePager`.

---

## 6. `deleteOnePager`

- **File:** `frontend/src/services/onePagerApi.ts` — lines **184–197**
- **Replace:** `removeLandingCard(trimmed)`
- **With:** `DELETE /api/one-pagers/:id`
- **Serves:** card delete, view delete, preview delete
- **Data today:** removes the row from the in-memory landing list only
- **Keep:** `{ ok: true, pager_id }` or `{ ok: false, error }`
- **Depends on:** a real saved id. On success, Redux already drops the card.

---

## 7. `saveNationalDraft`

- **File:** `frontend/src/services/createFormApi.ts` — lines **321–327**
- **Replace:** `delay` + `upsertNationalRecord`. Delete `nationalRecords` Map (line **278**) when done.
- **With:** `POST /api/national-one-pagers/draft`
- **Body:** `NationalOnePagerCreatePayload` + optional `id` if updating a draft
- **Serves:** National Save Draft (toast + go Home)
- **Data today:** browser `Map`. Lost on refresh. Also writes a Home card via `landingListStore`.
- **Keep:** `{ ok: true, id, status: "draft" }` or `{ ok: false, error }`
- **Depends on:** **image upload first**

---

## 8. `publishNationalOnePager`

- **File:** `frontend/src/services/createFormApi.ts` — lines **340–346**
- **Replace:** same in-memory upsert as draft
- **With:** `POST /api/national-one-pagers/publish`
- **Serves:** Preview → Confirm Publish. Stay on the preview page (do not redirect Home).
- **Data today:** same `nationalRecords` Map as draft
- **Keep:** `{ ok: true, id, status: "published" }`
- **Depends on:** **image upload first**

---

## 9. `getNationalOnePager`

- **File:** `frontend/src/services/createFormApi.ts` — lines **362–371**
- **Replace:** cloning `nationalOnePager.json`
- **With:** `GET /api/national-one-pagers/:id`
- **Serves:** Import From National → prefill the retailer form (new retailer draft, `recordId` stays null)
- **Data today:** **any** id returns the same `mocks/nationalOnePager.json`
- **Keep:** `{ id, status, payload }`
- **Depends on:** list API (picker) + a real published national record. Edit/View use `getOnePagerById`, not this.

---

## 10. `saveRetailerDraft`

- **File:** `frontend/src/services/retailerCreateFormApi.ts` — lines **149–155**
- **Replace:** `delay` + `upsertRetailerRecord`. Delete `retailerRecords` Map (line **109**) when done.
- **With:** `POST /api/retailer-one-pagers/draft`
- **Body:** same as national, plus `target_retailer`. Optional `id` if updating a draft.
- **Serves:** Retailer Save Draft
- **Data today:** browser `Map`. Lost on refresh.
- **Keep:** `{ ok: true, id, status: "draft" }`
- **Depends on:** **image upload first**. Import path also needs `getNationalOnePager`.

---

## 11. `publishRetailerOnePager`

- **File:** `frontend/src/services/retailerCreateFormApi.ts` — lines **163–169**
- **Replace:** same in-memory upsert as retailer draft
- **With:** `POST /api/retailer-one-pagers/publish`
- **Serves:** Retailer preview → Confirm Publish. Stay on the page.
- **Data today:** same `retailerRecords` Map as draft
- **Keep:** `{ ok: true, id, status: "published" }`
- **Depends on:** **image upload first**

---

## 12. `getTrackStatuses`

- **File:** `frontend/src/services/trackApi.ts` — lines **43–49**
- **Replace:** reading `trackByPager` Map
- **With:** `GET /api/one-pagers/:id/track`
- **Serves:** RAG dots on Track (`/track/:id`). Missing keys = Clear.
- **Data today:** empty unless the user clicked dots in this same session
- **Keep:** `{ pillars, initiatives }` with status `clear | red | amber | green`
- **Depends on:** `getOnePagerById` (page loads content first)

---

## 13. `updateTrackStatus`

- **File:** `frontend/src/services/trackApi.ts` — lines **56–80**
- **Replace:** writing `trackByPager`. Delete that Map (line **19**) when both track APIs are live.
- **With:** `PATCH /api/one-pagers/:id/track`
- **Body:** `{ kind: "pillar" | "initiative", pillar_number, initiative_number?, status }`
- **Serves:** owner clicking a RAG dot. UI already disables non-owners; server should still 403.
- **Data today:** same session Map as `getTrackStatuses`
- **Keep:** `{ ok: true }` or `{ ok: false, error }`
- **Depends on:** `getTrackStatuses`

---

## 14. Image upload — not mocked yet

No function exists. Cover and initiative images are local `File`s. Preview URLs are `blob:` and die on refresh.

- **Add:** e.g. `uploadImage(file)` → permanent URL
- **When:** before save/publish (or on file pick)
- **Put the URL in:** `cover_image.blob_url` and initiative `images[].blob_url`
- **Blocks:** APIs 7, 8, 10, 11, and Home card covers

---

## Not wired (UI only)

No mock function. Attach a handler when the API exists.

- **Export** — card ⋯ / preview More Options → `GET /api/one-pagers/:id/export`
- **Archive** — published cards → `POST /api/one-pagers/:id/archive`
- **Restore** — archived cards → `POST /api/one-pagers/:id/restore`

Current user is hardcoded: `CURRENT_USER_ID = "user-001"` in `frontend/src/types/onePager.ts`.
