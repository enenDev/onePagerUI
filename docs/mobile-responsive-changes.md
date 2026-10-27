# Mobile responsive UI — change log

Each line says what changed and what to check. Phone means under 640px unless the line says otherwise. Desktop layout stays from the width named in the line.

## 7580e7a — Shared header, page padding, and dialogs

- Header brand icon and app icon reduced, check the reduced size in mobile view and the original size from 640px up.
- Header title hidden on mobile, check "CATEGORY ONE-PAGER APP" is hidden on a phone and visible from 640px up.
- Header bar height unchanged, check the blue bar is still the same height on phone and desktop.
- Page side padding reduced on mobile, check 16px on a phone, 24px from 640px, and 32px from 1024px.
- Adoption dashboard background still edge to edge, check /user-adoption on a phone and on desktop.
- Dialogs inset on a phone, open Add Campaign, a delete confirm, Create, and Add Initiative and check they stay inside the screen.
- Dialog widths unchanged from 640px up, check those same dialogs on desktop.
- Dialog close button larger, check the X on any dialog on phone and desktop.
- Profile menu tap rows taller, open the avatar menu and check Help, Logout, and Usage Tracking Dashboard.

## a5f1539 — Home filters, cards, and import picker

- Home filters collapsed into a Filters button under 1024px, check the button sits under Active / Drafts / Archive and above My One-Pagers.
- Filter count shown on the button, select two filter fields and check the label reads Filters (2).
- Filters open in a bottom sheet, check the same seven fields, then Submit and Clear all. Submit applies and closes. Clear all resets and closes.
- Desktop filter row unchanged from 1024px, check Market through Year still sit on one row with Submit and Clear all.
- My / All row and action buttons split on a phone, check My One-Pagers and All One-Pagers on the first row, Export and Create New on the next row, and one row again from 640px.
- Status pill side padding reduced on a phone, check Active, Drafts, and Archive stay on one line and the pill height is unchanged.
- One-pager cards stack by screen width, check 1 column on a phone, 2 from 640px, 3 from 1024px, and 4 from 1280px.
- Import filters stack on a phone, open Create New → Retailer → Import and check one column on a phone, two columns from 640px, and one row from 1024px.
- Import Submit full width only on a phone, check it is full width under 640px and the usual width from 640px. Dialog height is unchanged.
