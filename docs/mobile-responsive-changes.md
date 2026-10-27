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

## Form action bar and pillar header

- Form buttons stack on a phone, open Create National and check Preview & Publish, Save Draft, then Cancel are full width. From 640px, Cancel is on the left and Save Draft with Preview & Publish are on the right. Button height stays 36px.
- Blocked-reason text is left aligned on a phone, check it sits on the left on a phone and on the right from 640px.
- Scoring toggle labels shortened on a phone, check Unweighted and Weighted. From 640px check Unweighted Pillar and Weighted Pillar.
- Scoring toggle stays on the right on a phone, check it sits under the pillars heading, aligned right. From 640px it stays on the right of that heading, on the same line.
- Pillar name no longer cut off by the recommendation note, check the full name on the first line and "Atleast 1 initiative is recommended" on the next line, lined up under the name. From 640px the name and the note are on one row.

## One-pager document, pillar board, and track dots

- One-pager details become a list on a phone, open View or Track and check Channel, Category, Market, and the rest each sit on their own line. From 640px they sit on one row again. More Options stays on the right.
- Business outcome uses the full content width on a phone, check it lines up with the fields and only the page padding remains on the sides.
- Five pillars stack on a phone and tablet, check one full-width card under 1024px on Preview, View, and Track. From 1024px the five-column board stays.
- Track status is a dot only, open Track and check there is no Clear / Red / Amber / Green label beside the dot. Tap the dot and check those names still appear in the menu. The tap area is a little larger under 1024px.
- Preview Edit and Publish are equal width on a narrow phone, open Preview and check both buttons share one row under 400px and stay 36px tall. From 400px they sit on the right at their usual width.

## Login card

- Login card starts below the Unilever mark on a phone, open /login and check the logo does not cover the card. From 640px the card is centered again.
- Login card side padding is 24px on a phone, check the sign-in button keeps space on a narrow screen and the button stays 44px tall. From 640px the card padding is 32px again.
- Short phone can scroll the login card, check the sign-in button is reachable when the screen is short. From 640px the page does not scroll.
