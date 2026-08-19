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

Edit dropdowns only show a value if it exists in this catalog. GET-by-id `market` / `channel` / `category` / `campaign_focus` / `retailer` must match these option values, or the Selects look empty.

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

- **File:** `frontend/src/services/onePagerApi.ts` — lines **65–72**
- **Replace:** `landingList.filter(...)`. After this is live, delete `landingListStore.ts`.
- **With:** `POST /api/one-pagers/search`
- **Body:** `{ market: string[], retailer: string[], channel: string[], category: string[], campaign: string[] }` — empty array = no filter
- **Serves:** Home cards, Submit, Clear all, Import From National picker
- **Data today:** in-memory `landingList` in `landingListStore.ts` (lines **16–18**), seeded from `mocks/landingOnePagers.json`
- **Keep:** `OnePagerListItem[]` with a real `cover_image_url` (not `blob:`)
- **Depends on:** `getMetadata` for dropdowns. Active/Drafts/Archive tabs are still filtered on the frontend.

---

## 5. `getOnePagerById`

- **File:** `frontend/src/services/onePagerApi.ts` — lines **151–160**
- **Mapper:** `frontend/src/services/mapGetOnePagerResponse.ts` — `mapGetOnePagerResponse`
- **Replace:** cloning mock JSON + stamping `pager_id` / `pager_type`. Stop importing `getOnePager.json`.
- **With:** `GET /api/one-pagers/:id` returning `GetOnePagerApiResponse` (flat body, no nested `payload`)
- **Serves:** Edit (`/edit/:id`), View (`/view/:id`), Track (`/track/:id`) — **same GET for all three**
- **Data today:** any id → `mocks/getOnePager.json`. Mock stamps URL `pager_id` and `pager_type` (`National` vs `Retailer` from the landing list). `created_by` in that JSON is `"user-001"` so local owner UX works.
- **Keep:** mapper output `{ id, status, created_by, list_status, published_at, pager_type, payload }`. Do not rewrite View / Edit / Track pages.
- **Depends on:** real save/publish data. Import From National does **not** use this — it uses `getNationalOnePager`.

Mapper rules (keep when swapping the GET):

- `pager_id` → `id`; `campaign_focus` → `payload.campaign`
- `image_url` / `image_urls[]` → `cover_image.blob_url` / `images[].blob_url`
- `status: "PUBLISHED"|"DRAFT"|"ARCHIVED"` → `list_status`; ISO `published_at` → `DD MMM YYYY, HH:MM`
- `pager_type: "National"|"Retailer"` → `"national"|"retailer"`. Retailer only: `retailer` → `target_retailer`. National does not show Target Retailer.
- Top-level `"track"` is a DB label — **ignore**. RAG is `pillar_track` / `initiative_track` (`null` = Clear, else `"red"|"amber"|"green"`).
- Copy `pillar_id` and `initiative_id` onto the payload. Track PATCH needs them. View/Edit ignore them.
- Strategy fields must match `getMetadata` option values, or Edit Selects render empty.

There is **no** separate GET for Track RAG. Dots come from this response via `trackStateFromPillars` in `trackApi.ts`.

---

## 6. `deleteOnePager`

- **File:** `frontend/src/services/onePagerApi.ts` — lines **175–188**
- **Replace:** `removeLandingCard(trimmed)`
- **With:** `DELETE /api/one-pagers/:id`
- **Serves:** card delete, view delete, preview delete
- **Data today:** removes the row from the in-memory landing list only
- **Keep:** `{ ok: true, pager_id }` or `{ ok: false, error }`
- **Depends on:** a real saved id. On success, Redux already drops the card. Server should 403 non-owners.

---

## 7. `saveNationalDraft`

- **File:** `frontend/src/services/createFormApi.ts` — lines **329–335**
- **Replace:** `delay` + `upsertNationalRecord`. Delete `nationalRecords` Map (line **286**) when done.
- **With:** `POST /api/national-one-pagers/draft`
- **Body:** `NationalOnePagerCreatePayload` + optional `id` if updating a draft
- **Serves:** National Save Draft (toast + go Home)
- **Data today:** browser `Map`. Lost on refresh. Also writes a Home card via `landingListStore`.
- **Keep:** `{ ok: true, id, status: "draft" }` or `{ ok: false, error }`
- **Depends on:** **image upload first**

---

## 8. `publishNationalOnePager`

- **File:** `frontend/src/services/createFormApi.ts` — lines **348–354**
- **Replace:** same in-memory upsert as draft
- **With:** `POST /api/national-one-pagers/publish`
- **Serves:** Preview → Confirm Publish. Stay on the preview page (do not redirect Home).
- **Data today:** same `nationalRecords` Map as draft
- **Keep:** `{ ok: true, id, status: "published" }`
- **Depends on:** **image upload first**

---

## 9. `getNationalOnePager`

- **File:** `frontend/src/services/createFormApi.ts` — lines **370–379**
- **Replace:** cloning `nationalOnePager.json`
- **With:** `GET /api/national-one-pagers/:id`
- **Serves:** Import From National → prefill the retailer form (new retailer draft, `recordId` stays null)
- **Data today:** **any** id returns the same `mocks/nationalOnePager.json`
- **Keep:** `{ id, status, payload }`
- **Depends on:** list API (picker) + a real published national record. Edit/View/Track use `getOnePagerById`, not this.

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

## 12. Tracking

Track uses **2** functions. There is no `getTrackStatuses` and no in-memory RAG Map.

| When                      | Function            | File             | Real API (example)                              |
| ------------------------- | ------------------- | ---------------- | ----------------------------------------------- |
| Track page **open**       | `getOnePagerById`   | `onePagerApi.ts` | `GET /api/one-pagers/:id` (content **and** RAG) |
| Each **status-dot click** | `updateTrackStatus` | `trackApi.ts`    | `PATCH /api/one-pagers/:id/track`               |

On open: **1 GET**. On each click: **1 PATCH**.

Anyone can open `/track/:id` (published only). Only the owner can change dots. Server should still 403 non-owners on PATCH.

### Where to change

1. **`onePagerApi.ts` → `getOnePagerById`** (section 5)  
   Swap the mock GET. Keep `mapGetOnePagerResponse`. Track reads `pillar_track` / `initiative_track` via `trackStateFromPillars`.

2. **`trackApi.ts` → `updateTrackStatus`** (section 13)  
   Replace `delay` + `{ ok: true }` with the real PATCH. Build `UpdateTrackPayload` from the function args.

Leave `initiativeTrackKey` and `trackStateFromPillars` in place — the UI uses them to map dots.

### Do not change

`TrackOnePager.tsx`, `PillarBoard`, and `TrackStatusDot`. The page already looks up `pillar_id` / `initiative_id` from the mapped GET record and passes them into `updateTrackStatus`. View/Preview do not pass `track`, so they show no dots.

---

## 13. `updateTrackStatus`

- **File:** `frontend/src/services/trackApi.ts` — lines **70–83**
- **Type:** `UpdateTrackPayload` in the same file (lines **14–21**)
- **Replace:** `delay` then `{ ok: true }`
- **With:** `PATCH /api/one-pagers/:id/track` (or the agreed track endpoint)
- **Body:**

```json
{
  "table": "pager",
  "pager_id": "string",
  "pillar_id": "string",
  "initiative_id": "string",
  "track": "red | amber | green | null",
  "updated_by": "string"
}
```

- `table` is always `"pager"`.
- Pillar-only: send `pager_id` + `pillar_id`; **`initiative_id` is `""`** (still send the field).
- Initiative: send all three IDs from GET.
- `track`: `"red"` | `"amber"` | `"green"`. **Clear → `null`** (same as GET). Do not send `""`.
- `updated_by`: logged-in email (`CURRENT_USER_EMAIL` until real auth).
- **Serves:** owner clicking a RAG dot. UI already disables non-owners; server should still 403.
- **Data today:** delay, no persistence. Refresh reloads RAG from GET mock (`null` = Clear).
- **Keep:** `{ ok: true }` or `{ ok: false, error }`
- **Depends on:** `getOnePagerById` (IDs + current dots). FE call shape: `{ pagerId, pillarId, initiativeId, status }` where `status` is `clear | red | amber | green`. Map `clear` → `track: null` in the PATCH body.

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

- **Export** — card ⋯ / preview More Options → `GET /api/one-pagers/:id/export` (anyone)
- **Archive** — published cards → `POST /api/one-pagers/:id/archive` (**owner only**; menu is disabled for non-owners on Home and View)
- **Restore** — archived cards → `POST /api/one-pagers/:id/restore` (**owner only**; Home card ⋯)

---

## Current user (mock auth)

Hardcoded in `frontend/src/types/onePager.ts`:

- `CURRENT_USER_ID = "user-001"` — owner checks (`isCurrentUserOwner`), Home “My” tab, `created_by` on save/publish
- `CURRENT_USER_EMAIL = "nitesh@example.com"` — header + Track PATCH `updated_by`
- `CURRENT_USER_INITIALS = "NN"` — header avatar

Swap these for the real session / JWT. Keep `isCurrentUserOwner(created_by)` comparing to the logged-in **user id**.
