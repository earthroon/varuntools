# Navigation UI Connection

Commit 129 connects the structured navigation SSOT from `src/navigation/pageIndex.ts` and `src/navigation/sectionNavigation.ts` to the visible site chrome.

## Source of truth

- Header uses `headerNavigation`.
- Footer uses `footerNavigation`.
- Utility navigation uses `utilityNavigation`.
- Desktop and mobile surfaces must keep the same navigation data source.

Do not reintroduce hardcoded Header/Footer link arrays as the primary source. Add a page to `pageIndex`, then let `sectionNavigation` expose the correct surface.

## Active link rules

`/` must use exact matching. Otherwise Home becomes active on every route.

Non-home links may use nested matching, so `/works` is active for `/works/varuntools-showroom`.

## Forbidden public navigation leaks

The following page classes can exist, but must not leak into Header/Footer/Utility navigation:

- hidden/private/draft pages
- `noindex` pages
- checkout result pages
- QA pages
- dummy catalog pages
- playground/spec pages
- editorial preview/showcase pages that are marked hidden/private

## Add a new navigation item

1. Make sure the page is public, active, and indexable.
2. Add or update the item in `src/navigation/pageIndex.ts`.
3. Select the correct `surface`: `header`, `footer`, `section`, or `utility`.
4. Run `npm run smoke:navigation-page-index`.
5. Run `npm run smoke:navigation-ui-connection`.
