# How Lofty actually behaves

Discovered the hard way on 2026-09-01. Every one of these cost real time.

## The Script area mangles script tags

Lofty wraps whatever you put in the page Script area inside:

    function runPageScript(){  ...your content...  };

If you paste a <script> tag in there, your closing </script> ends the wrapper
early and Lofty's own  };  lands INSIDE your block. JSON-LD then fails to parse
and Google discards the whole thing silently.

This is not fixable by editing. Emptying the box and re-pasting reproduces it
every time, because Lofty adds the wrapper on save.

RULE: JSON-LD goes in a PAGE CONTENT block, never the Script area.
A page content block passes HTML through untouched. This is proven.

## The SEO panel overrides the page

These fields come from Lofty's SEO panel and IGNORE whatever is in the pasted HTML:

  - <title>
  - <meta name="description">
  - og:description
  - twitter:description
  - og:image

Writing them into the HTML file is decorative. They must be set per page in the
panel. Budget for that: seven pages means seven panel visits, not just seven pastes.

og:description and twitter:description are GENERATED from the meta description,
so editing that one field fixes all three.

## Trailing slashes are significant and inconsistent

Top-level pages 404 WITH a slash. Nested pages 404 WITHOUT one. There is no
single rule; check every link. See archive-index.md for the verified list.

## Never inherit from a live page

Live pages are not a source of truth. Confirmed errors found by copying them:

  - "Top 5% U.S. Realtor" on 7 pages, when the brand profile says top 3% SCWMLS,
    South-Central Wisconsin, and explicitly forbids restating it as national
  - DeForest's og:image was Waunakee's photo, which then propagated
  - Waunakee and Sun Prairie both published a 2018 median of $265,005,
    identical to the dollar, so at least one is wrong
  - A homepage hero button pointing at a URL that has never existed

Data comes from Airtable. Brand claims come from the brand profile. Images come
from an explicit list John supplies. Copy nothing from what is already published.
