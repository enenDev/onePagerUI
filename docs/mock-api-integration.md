# Mock API Integration

Swap **only the function body**. Keep the same name, args, and return type. Do not rewrite pages.

Axios is installed. Use `VITE_API_BASE_URL`. FastAPI has no real endpoints yet.

**Rule:** upload images first. Do not POST `blob:` URLs on save/publish.

---

## 1. `getCurrentUser`

- **File:** `frontend/src/services/userApi.ts` — lines **12–16**
- **Thunk:** `frontend/src/redux/userSlice.ts` — `fetchCurrentUser` (calls `getCurrentUser`)
- **Store:** `state.user.currentUser` (`frontend/src/redux/store.ts`)
- **Boot:** `MainLayout` dispatches `fetchCurrentUser` once on mount
- **Replace:** the `delay()` + `userSlice.getInitialState().currentUser`. Do not add a second copy of id / name / email / initials / user_type in `userApi.ts`.
- **With:** `GET /api/me` (or the auth session after login)
- **Serves:** header avatar + profile menu (name, email, role badge), Home “My” tab, owner checks (Edit / Delete / Archive / Track dots), Track PATCH `updated_by`, preview owner label, create/role gates via `user_type`
- **Data today:** mock user lives **only** in `userSlice` `initialState` (`id: "user-001"`, `name: "Nitesh"`, `email: "nitesh@example.com"`, `initials: "NN"`, `user_type: "user_type_1"`). No `CURRENT_USER_*` constants. Header works before fetch returns because of that seed. Change `user_type` in the slice to locally test roles (`user_type_1` full / `user_type_2` retailer-only / `user_type_3` read-only).
- **Keep:** `{ id, name, email, initials, user_type }`. `id` is `created_by` / owner checks. `name` is the profile-menu display name. `email` is profile menu + Track `updated_by`. `initials` are the header avatar. `user_type` drives Create button, National option, My/Drafts tabs, FE create-route redirects, and the profile role badge via `userTypeLabel` (`CSP` / `Retailer` / `Read-only`) — map server role → these three until names are final.
- **Depends on:** none — load this on app boot
- **Owner helper:** `isCurrentUserOwner(createdBy, userId)` in `userSlice.ts` — compare pager `created_by` to `state.user.currentUser.id`. Keep visible-but-disabled Edit/Delete/Track for non-owners.
- **Role helpers:** `canCreateAnyOnePager` / `canCreateNationalOnePager` / `canCreateRetailerOnePager` / `canSeeMyOnePagersTab` / `canSeeDraftsTab` / `userTypeLabel` in `userSlice.ts`. FE create routes wrap with `RequireUserCreateAccess` — still enforce the same rules on FastAPI later.

Mock save/publish still stamps Home-card `created_by` from `userSlice.getInitialState().currentUser.id` in `landingListStore.ts`. Delete that upsert when the list API returns `created_by` (section 5).

---

## 2. `getMetadata`

- **File:** `frontend/src/services/metadataApi.ts` — lines **43–46**
- **Replace:** the `delay()` + JSON clone. Stop importing `homepageMetadata.json`.
- **With:** `GET /api/metadata`
- **Serves:** Home filters and create/edit dropdowns (Market, Retailer, Channel, Category, Campaign)
- **Data today:** `frontend/src/services/mocks/homepageMetadata.json`
- **Keep:** `{ market, optionsByMarket }`
- **Depends on:** none — load this first for catalogs

Edit dropdowns only show a value if it exists in this catalog. GET-by-id `market` / `channel` / `category` / `campaign_focus` / `retailer` must match these option values, or the Selects look empty.

---

## 3. `getCreateFormMetadata`

- **File:** `frontend/src/services/createFormApi.ts` — lines **100–103**
- **Replace:** the function body and helper `loadCreateFormExtras` (lines **47–57**). Stop importing `createFormMetadata.json`.
- **With:** `GET /api/create-form/metadata`
- **Serves:** Initiative modal only — department list + KPIs per pillar
- **Data today:** `frontend/src/services/mocks/createFormMetadata.json`
- **Keep:** `{ accountableDepartments, kpisByPillarNumber }` (not Market/Retailer/etc.)
- **Depends on:** `getMetadata` — both are merged in `useCreateFormCatalog.ts`

---

## 4. `addCampaign`

- **File:** `frontend/src/services/createFormApi.ts` — lines **116–143**
- **Replace:** the fake delay + local duplicate check
- **With:** `POST /api/campaigns` body `{ market, campaign_name }`
- **Serves:** “Add New Campaign” on National and Retailer forms
- **Data today:** fake success. New option is not saved. Lost on refresh.
- **Keep:** `{ ok: true, campaign: { label, value } }` or `{ ok: false, error }`
- **Depends on:** `getMetadata`. After success, FE already appends the option in Redux — do not refetch metadata.

---

## 5. `submitOnePagerSearch`

- **File:** `frontend/src/services/onePagerApi.ts` — lines **65–72**
- **Replace:** `landingList.filter(...)`. After this is live, delete `landingListStore.ts`.
- **With:** `POST /api/one-pagers/search`
- **Body:** `{ market: string[], retailer: string[], channel: string[], category: string[], campaign: string[] }` — empty array = no filter
- **Serves:** Home cards, Submit, Clear all, Import From National picker
- **Data today:** in-memory `landingList` in `landingListStore.ts` (lines **16–18**), seeded from `mocks/landingOnePagers.json`. Mock save/publish upserts a card with `created_by` from `userSlice` initial `id`.
- **Keep:** `OnePagerListItem[]` with a real `cover_image_url` (not `blob:`) and server `created_by`
- **Depends on:** `getMetadata` for dropdowns. `getCurrentUser` for Home “My” (`item.created_by === currentUser.id`). Active/Drafts/Archive tabs are still filtered on the frontend.

---

## 6. `getOnePagerById`

- **File:** `frontend/src/services/onePagerApi.ts` — lines **151–160**
- **Mapper:** `frontend/src/services/mapGetOnePagerResponse.ts` — `mapGetOnePagerResponse`
- **Replace:** cloning mock JSON + stamping `pager_id` / `pager_type`. Stop importing `getOnePager.json`.
- **With:** `GET /api/one-pagers/:id` returning `GetOnePagerApiResponse` (flat body, no nested `payload`)
- **Serves:** Edit (`/edit/:id`), View (`/view/:id`), Track (`/track/:id`) — **same GET for all three**
- **Data today:** any id → `mocks/getOnePager.json`. Mock stamps URL `pager_id` and `pager_type` (`National` vs `Retailer` from the landing list). `created_by` in that JSON is `"user-001"` so it matches `userSlice` initial `id`.
- **Keep:** mapper output `{ id, status, created_by, list_status, published_at, pager_type, payload }`. Do not rewrite View / Edit / Track pages.
- **Depends on:** real save/publish data. Import From National does **not** use this — it uses `getNationalOnePager`. Owner UX compares `created_by` to `state.user.currentUser.id`.

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

## 7. `deleteOnePager`

- **File:** `frontend/src/services/onePagerApi.ts` — lines **175–188**
- **Replace:** `removeLandingCard(trimmed)`
- **With:** `DELETE /api/one-pagers/:id`
- **Serves:** card delete, View / Track / Preview More Options → Delete
- **Data today:** removes the row from the in-memory landing list only
- **Keep:** `{ ok: true, pager_id }` or `{ ok: false, error }`
- **Depends on:** a real saved id. On success, Redux already drops the card and View / Track / Preview navigate to `/home`. Server should 403 non-owners.

---

## 8. `saveNationalDraft`

- **File:** `frontend/src/services/createFormApi.ts` — lines **329–335**
- **Replace:** `delay` + `upsertNationalRecord`. Delete `nationalRecords` Map (line **286**) when done.
- **With:** `POST /api/national-one-pagers/draft`
- **Body:** `NationalOnePagerCreatePayload` + optional `id` if updating a draft
- **Serves:** National Save Draft (toast + go Home)
- **Data today:** browser `Map`. Lost on refresh. Also writes a Home card via `landingListStore` (`created_by` = slice initial user id).
- **Keep:** `{ ok: true, id, status: "draft" }` or `{ ok: false, error }`
- **Depends on:** **image upload first**. Backend should set `created_by` from the session.

---

## 9. `publishNationalOnePager`

- **File:** `frontend/src/services/createFormApi.ts` — lines **348–354**
- **Replace:** same in-memory upsert as draft
- **With:** `POST /api/national-one-pagers/publish`
- **Serves:** Preview → Confirm Publish. Stay on the preview page (do not redirect Home).
- **Data today:** same `nationalRecords` Map as draft
- **Keep:** `{ ok: true, id, status: "published" }`
- **Depends on:** **image upload first**

---

## 10. `getNationalOnePager`

- **File:** `frontend/src/services/createFormApi.ts` — lines **370–379**
- **Replace:** cloning `nationalOnePager.json`
- **With:** `GET /api/national-one-pagers/:id`
- **Serves:** Import From National → prefill the retailer form (new retailer draft, `recordId` stays null)
- **Data today:** **any** id returns the same `mocks/nationalOnePager.json`
- **Keep:** `{ id, status, payload }`
- **Depends on:** list API (picker) + a real published national record. Edit/View/Track use `getOnePagerById`, not this.

---

## 11. `saveRetailerDraft`

- **File:** `frontend/src/services/retailerCreateFormApi.ts` — lines **149–155**
- **Replace:** `delay` + `upsertRetailerRecord`. Delete `retailerRecords` Map (line **109**) when done.
- **With:** `POST /api/retailer-one-pagers/draft`
- **Body:** same as national, plus `target_retailer`. Optional `id` if updating a draft.
- **Serves:** Retailer Save Draft
- **Data today:** browser `Map`. Lost on refresh.
- **Keep:** `{ ok: true, id, status: "draft" }`
- **Depends on:** **image upload first**. Import path also needs `getNationalOnePager`. Backend should set `created_by` from the session.

---

## 12. `publishRetailerOnePager`

- **File:** `frontend/src/services/retailerCreateFormApi.ts` — lines **163–169**
- **Replace:** same in-memory upsert as retailer draft
- **With:** `POST /api/retailer-one-pagers/publish`
- **Serves:** Retailer preview → Confirm Publish. Stay on the page.
- **Data today:** same `retailerRecords` Map as draft
- **Keep:** `{ ok: true, id, status: "published" }`
- **Depends on:** **image upload first**

---

## 13. Tracking

Track uses **2** functions. There is no `getTrackStatuses` and no in-memory RAG Map.

| When                      | Function            | File             | Real API (example)                              |
| ------------------------- | ------------------- | ---------------- | ----------------------------------------------- |
| Track page **open**       | `getOnePagerById`   | `onePagerApi.ts` | `GET /api/one-pagers/:id` (content **and** RAG) |
| Each **status-dot click** | `updateTrackStatus` | `trackApi.ts`    | `PATCH /api/one-pagers/:id/track`               |

On open: **1 GET**. On each click: **1 PATCH**.

Anyone can open `/track/:id` (published only). Only the owner can change dots (`created_by === state.user.currentUser.id`). Server should still 403 non-owners on PATCH.

### Where to change

1. **`onePagerApi.ts` → `getOnePagerById`** (section 6)  
   Swap the mock GET. Keep `mapGetOnePagerResponse`. Track reads `pillar_track` / `initiative_track` via `trackStateFromPillars`.

2. **`trackApi.ts` → `updateTrackStatus`** (section 14)  
   Replace `delay` + `{ ok: true }` with the real PATCH. Build `UpdateTrackPayload` from the function args.

Leave `initiativeTrackKey` and `trackStateFromPillars` in place — the UI uses them to map dots.

### Do not change

Leave RAG wiring alone: `TrackOnePager` still looks up `pillar_id` / `initiative_id` from the mapped GET record and passes them into `updateTrackStatus` with `updated_by: currentUser.email`. Keep `PillarBoard` / `TrackStatusDot` for dots.

Track **More Options** mirrors published View (Export / Archive / Edit / Delete; Track omitted because you are already on `/track/:id`). Do not remove that menu when swapping APIs — only swap the underlying mock calls. View/Preview without `track` still show no RAG dots.

---

## 14. `updateTrackStatus`

- **File:** `frontend/src/services/trackApi.ts` — lines **70–84**
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
- `updated_by`: logged-in email from `state.user.currentUser.email` (`TrackOnePager` already passes it). Comes from `getCurrentUser` / `GET /api/me`.
- **Serves:** owner clicking a RAG dot. UI already disables non-owners; server should still 403.
- **Data today:** delay, no persistence. Refresh reloads RAG from GET mock (`null` = Clear).
- **Keep:** `{ ok: true }` or `{ ok: false, error }`
- **Depends on:** `getOnePagerById` (IDs + current dots) and `getCurrentUser` (email). FE call shape: `{ pagerId, pillarId, initiativeId, status, updated_by }` where `status` is `clear | red | amber | green`. Map `clear` → `track: null` in the PATCH body.

---

## 15. Image upload — not mocked yet

No function exists. Cover and initiative images are local `File`s. Preview URLs are `blob:` and die on refresh.

- **Add:** e.g. `uploadImage(file)` → permanent URL
- **When:** before save/publish (or on file pick)
- **Put the URL in:** `cover_image.blob_url` and initiative `images[].blob_url`
- **Blocks:** APIs 8, 9, 11, 12, and Home card covers

---

## Not wired (UI only)

No mock function (or handler is UI-only until auth). Attach a handler when the API exists.

- **Export** — client-side PPT (`exportOnePagerPpt` in `frontend/src/services/exportOnePagerPpt.ts`). Home ⋯ and View / Track / Preview More Options. Uses GET-by-id payload + `image_urls`. Optional later: `GET /api/one-pagers/:id/export` if the server should generate the file.
- **Archive** — `archiveOnePager` in `onePagerApi.ts` (mock → `landingListStore.updateLandingCardStatus`). Redux thunk `landing/archiveOnePager`. UI: `ArchiveOnePagerModal`. Swap body for `POST /api/one-pagers/:id/archive`. Keep `{ ok, pager_id, status: "ARCHIVED" }`. Owner-only. On success from View / Track / Preview, FE navigates to `/home` (Home card menu already stays on Home).
- **Restore** — `restoreOnePager` → status **DRAFT** (not Active). Redux thunk `landing/restoreOnePager`. UI: `RestoreOnePagerModal`. Swap for `POST /api/one-pagers/:id/restore`. Keep `{ ok, pager_id, status: "DRAFT" }`. Owner-only. On success from View, FE navigates to `/home`.
- **Edit published** — `EditPublishedOnePagerModal` (Archive & Edit / Keep Active & Edit) from View / Track / Preview More Options (and Home ⋯). Both open `/edit/:id` with `createAsNew: true` so Save Draft / Publish create a **new** id. Archive & Edit calls archive first. Draft Edit still updates the same id.
- **Logout** — header profile menu item is UI only. No mock function. Profile header (icon + name + email + role badge) already reads `state.user.currentUser` from `getCurrentUser` / seed.

---

## Form character limits (PPT fit)

Limits live in `frontend/src/components/form/fieldLimits.ts` (`FIELD_LIMITS`). The form uses `maxLength` plus a `12/100` counter.

They match one widescreen PPT slide: a pillar column is about **40 characters per line**. Dropdowns (Market, Channel, Category, KPI, Department) and dates are not limited.

| Field                   | Limit | Why                                                                                                |
| ----------------------- | ----- | -------------------------------------------------------------------------------------------------- |
| Title                   | 100   | Auto from strategy dropdowns (National/Retailer-Market-…); still editable. Truncated if longer.   |
| Business Outcome        | 120   | Header subtitle, about 2 lines.                                                                    |
| Campaign name (Add New) | 30    | Header pill + a segment of the composed title.                                                     |
| Pillar description      | 80    | About 2 lines under the pillar name.                                                               |
| Initiative description  | 80    | About 2 lines.                                                                                     |
| Success Target          | 10    | Short value (`95`, `500`).                                                                         |
| Unit                    | 10    | `%`, `Outlets`, `ACV%`. Allows `%`, not only digits.                                               |
| Guidelines              | 80    | About 2 lines.                                                                                     |
| Checklist notes         | 60    | Caption under the photo strip.                                                                     |

Keep these lengths when validating on FastAPI, or the PPT will clip. Change the numbers in `FIELD_LIMITS` if the export layout boxes change.
