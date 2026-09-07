# Dated market report URLs: what they actually are

Verified 2026-09-01 by fetching each URL in a real browser and inspecting the
response body for a client-side redirect. An earlier pass that only read the
HTML was WRONG: these pages carry per-month H1s in markup that a real visitor
never sees, because the page redirects before rendering.

## Do not link to these from the permanent report

26 of the 28 dated URLs are JS redirect stubs that send the visitor straight to
that city's permanent report. Linking to them from the permanent report is
circular: the reader clicks "January 2026" and lands back where they started.
They must NOT appear in an archive list, and must NOT be published in an
ItemList as past reports, because they are not readable reports.

The redirects themselves are doing useful work and should stay. Nothing should
point AT them.

## Redirect stubs (26)

All redirect via location.replace() to /market-reports/{city}-wisconsin/:

Madison: january-2026/, february-2026/, march-2026/, april-2026, june-2026/
Waunakee: january-2026/, march-2026/, may-2026/, june-2026/
Sun Prairie: february-2026, march-2026/, april-2026/, may-2026/, june-2026/
Verona: january-2026/, march-2026/, june-2026/
Middleton: january-2026/, february-2026, march-2026/, april-2026/, may-2026/
DeForest: january-2026/, february-2026, march-2026/, may-2026/

## BUG: one redirect points at the wrong city

/market-reports/middleton-wisconsin/april-2026/
  redirects to /market-reports/deforest-wisconsin/
  should redirect to /market-reports/middleton-wisconsin/

## Genuine readable archive pages (2)

Real content, self-canonical, no redirect:
- /market-reports/waunakee-wisconsin/april-2026/      (~36,000 chars)
- /market-reports/sun-prairie-wisconsin/january-2026/ (~31,500 chars)

Both lack a redirect, which is the same condition as the three deleted pages
below. Treat them as at risk.

## Deleted, still ranking (3)

404 as of 2026-09-01. All were live in the Web Pages table on 2026-08-17.
None had a redirect installed. Two had a Redirect Target recorded and no method.

| URL | Impressions | Clicks | Avg position | Est. upside |
|---|---|---|---|---|
| /market-reports/madison-wisconsin/madison-wisconsin-real-estate-market-update-december-2025 | 14,506 | 14 | 7.0 | 856 |
| /market-reports/madison-wisconsin/october-2025 | 5,626 | 6 | 10.3 | 332 |
| /market-reports/madison-wi/november-2025 | 4,680 | 8 | 7.1 | 273 |

28 clicks over 16 months, so this is not a traffic emergency. But they held
page-one positions and a combined 1,461 estimated click upside.

## The pattern

Redirect installed -> page survives. No redirect -> either deleted (3) or
still standing as real content (2). Install the redirect when a dated report
is retired.

## Known-dead paths, never link

/market-reports/  /market-reports/dane-county-wisconsin/  /dane-county/
/mls-disclaimer  /in-the-media (use /media)  /homes-for-sale/ (use no slash)
/about/ /contact/ /evaluation/ (drop the slash)
/homes-for-sale/waunakee-wi/  /homes-for-sale/sun-prairie-wi/  /homes-for-sale/madison-wi/
all *-real-estate-market-update-december-2025

The Dane County hub is /wisco-hub.
