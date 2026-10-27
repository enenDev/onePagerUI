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

- Login card is vertically centered on a phone, open /login and check the white card sits in the middle and the Unilever mark does not cover it. From 640px it stays centered.
- Login card side padding is 24px on a phone, check the sign-in button keeps space on a narrow screen and the button stays 44px tall. From 640px the card padding is 32px again.
- Short phone can scroll the login card, check the sign-in button is reachable when the screen is short. From 640px the page does not scroll.

## Adoption chart market names

- Long market names wrap on a phone, open /user-adoption and check a long market name breaks onto more than one line beside the bars. A short name stays on one line. From 640px every market name is one line again. Chart row height is unchanged.

## Create popup and import filters

- Phone header title is commented out, check the header still has no title on a phone and the usual title from 640px.
- Create New options fully visible on a phone, open Create New and check National One-Pager and Retailer One-Pager both show. Open Retailer and check Build from Scratch and Import From National both show. From 640px the dialog stays the same height with the two options side by side.
- Import filters collapsed into a Filters button under 1024px, open Create New → Retailer → Import and check the button sits on the right above the list.
- Filter count shown on the button, select one field and check the label reads Filters (1).
- Filters open from the bottom of the import popup, check the six fields and Clear all stay inside the popup. There is no Submit in that sheet. A choice filters the list right away. Clear all resets and closes the sheet.
- Import Submit still imports the selected one-pager, check it stays at the bottom of the popup.
- Desktop import filters unchanged from 1024px, check Market through Year still sit on one row with Clear all.
