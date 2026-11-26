# TaskMate logo and brand-green spec

Handoff contract for the engineer who integrates the logo (Gemini in Antigravity). This file is design only. Nothing in `resources/`, `public/`, `app/`, or `tests/` was changed when it was written. Open `docs/logo-preview.html` in a browser to see every concept on Light and Dark surfaces.

**Selected concept:** `TBD` (Kim fills this in with one of `1A`, `1B`, `1C`, `2A`). Until it says one of those four, implement only Section 2 (the `--brand` token change) and do not touch any logo file.

**Designer's recommendation:** `1C`. At 16×16 it is the only T-based mark whose letter and check both survive, and its badge holds up on light and dark browser tabs, app icons, and posters. `2A` is the runner-up if a non-letter mark is preferred.

## 1. Rules

1. Gold (`#E5A812`) appears only inside logo SVGs and print or booth assets. Never in buttons, links, text, badges, rings, or any CSS token.
2. Every logo keeps `role="img"` and `aria-label="TaskMate"` in the app (the sidebar also prints the name beside it).
3. Marks sit on a `32 × 32` grid (`viewBox="0 0 32 32"`). Never crop, rotate, outline, or add effects.
4. Minimum sizes: mark 16 px, lockup 96 px wide.
5. The app wordmark stays live text in Instrument Sans 600 (the existing `font-semibold` in `AppLogo`). The outlined wordmark exists only for the print lockup files.

## 2. Option A: `--brand` token (do this first, independent of the concept choice)

Edit `resources/css/app.css` only. Four values change in `:root` and four in `.dark`. Everything else, including `--brand-foreground`, `--success-*`, `--info-*`, and the print block, stays as it is.

```css
/* :root (Light) */
--brand: oklch(0.49 0.12 145);        /* was oklch(0.52 0.19 262) */
--ring: oklch(0.49 0.12 145);         /* was oklch(0.52 0.19 262) */
--sidebar-ring: oklch(0.49 0.12 145); /* was oklch(0.52 0.19 262) */
/* --brand-foreground stays oklch(0.985 0 0) */

/* .dark */
--brand: oklch(0.76 0.10 142);        /* was oklch(0.74 0.13 262) */
--ring: oklch(0.76 0.10 142);         /* was oklch(0.74 0.13 262) */
--sidebar-ring: oklch(0.76 0.10 142); /* was oklch(0.74 0.13 262) */
/* --brand-foreground stays oklch(0.16 0.005 260) */
```

| Check | Light | Dark |
| --- | --- | --- |
| `--brand` on `--background` | 5.58 : 1 on `oklch(0.978 0.004 95)` | 9.37 : 1 on `oklch(0.16 0.005 260)` |
| `--brand` on `--card` | 5.94 : 1 on `oklch(1 0 0)` | 8.65 : 1 on `oklch(0.205 0.006 260)` |
| `--brand-foreground` on `--brand` | 5.69 : 1 | 9.37 : 1 |
| sRGB equivalent | `#2B7132` | `#8CC186` |

All are at or above the 4.5 : 1 AA text threshold, and the focus ring clears the 3 : 1 non-text threshold.

**How it stays distinct from `--success`.** Success badges use hue 155 on a tinted fill (`oklch(0.96 0.05 155)` with text `oklch(0.38 0.1 155)` in Light) and always show an icon plus a text label. The brand uses hue 145 with a different lightness and chroma, and appears as a solid fill, link text, active navigation, or the focus ring, never as a tinted badge. The hue gap is small (10°), so the separation rests on that usage difference, not on color alone. Do not use `--brand` for status.

**After the change, search `resources/` for the old values** `oklch(0.52 0.19 262)` and `oklch(0.74 0.13 262)`. Any hit outside the `--status-info-*` tokens is a hard-coded copy of the old accent and should use `var(--brand)` instead.

## 3. Palette (print, Canva, booth)

| Name | Hex | Use |
| --- | --- | --- |
| CMU Forest Green | `#2B7132` | Mark on light backgrounds, badge, headings. Equals Light `--brand`. |
| Warm Gold | `#E5A812` | Check mark only. Logo and print only. |
| Off-White | `#F8F8F5` | Paper and page ground. Equals Light `--background`. |
| Charcoal | `#15140F` | Text and wordmark. Equals Light `--foreground`. |
| Forest on dark | `#8CC186` | Mark on dark backgrounds. Equals Dark `--brand`. |
| Badge on dark | `#337B3C` | The 1C badge fill and the 2A check square in Dark and reversed use. |
| Cream | `#FCFAF3` | The letter inside the 1C badge. |

Gold on Off-White is about 2.2 : 1. Logos are exempt from text contrast rules, and the check is always paired with a green shape, so the mark never depends on gold alone.

## 4. Integration steps (after "Selected concept" is filled in)

1. Replace `resources/js/components/app-logo-icon.tsx` with the TSX of the chosen concept (Sections 5 to 8).
2. Replace `resources/js/components/app-logo.tsx` so the mark is no longer wrapped in the dark `bg-sidebar-primary` tile (the new marks carry their own shape and color):

```tsx
import { usePage } from '@inertiajs/react';

import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <>
            <AppLogoIcon className="size-8 shrink-0" />
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    {name}
                </span>
            </div>
        </>
    );
}
```

3. Save the chosen concept's `favicon.svg` as `public/favicon.svg` and make sure the root Blade layout links it (`<link rel="icon" href="/favicon.svg" type="image/svg+xml">`). Keep any existing `favicon.ico` as the fallback.
4. Save the chosen concept's three print files in `public/brand/` (or `docs/brand/` if they should not ship): `taskmate-mark-light.svg`, `taskmate-mark-dark.svg`, `taskmate-lockup-light.svg`.
5. Verify in a browser: Light and Dark sidebar, collapsed sidebar, a dark browser tab, and a 16 px tab icon. Run the project's usual type check and build.

Browser note: the dark-tab switch inside `favicon.svg` works in Chrome, Edge, and Firefox. Safari ignores `prefers-color-scheme` inside favicons and shows the light version.

## 5. Concept 1A: Bold slanted T + gold check

A heavy T leaning 11° to the right with round terminals. The gold check sits in the empty lower-right space beside the stem.

**React component (`app-logo-icon.tsx`)**

```tsx
import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 32 32" role="img" aria-label="TaskMate" xmlns="http://www.w3.org/2000/svg">
            <g className="stroke-brand" transform="translate(3.1 0) skewX(-11)" fill="none" strokeWidth="6" strokeLinecap="round">
                <path d="M7 8H23" />
                <path d="M15 8V25" />
            </g>
            <path d="M20.6 20.4l3.2 3.2 4.6-6.2" fill="none" stroke="#E5A812" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
```

**`favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <title>TaskMate</title>
  <style>
    .t { stroke: #2B7132; }
    @media (prefers-color-scheme: dark) { .t { stroke: #8CC186; } }
  </style>
  <g class="t" transform="translate(3.1 0) skewX(-11)" fill="none" stroke-width="6" stroke-linecap="round"><path d="M7 8H23"/><path d="M15 8V25"/></g>
  <path d="M20.6 20.4l3.2 3.2 4.6-6.2" fill="none" stroke="#E5A812" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**`taskmate-mark-light.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 32 32">
  <g transform="translate(3.1 0) skewX(-11)" fill="none" stroke="#2B7132" stroke-width="6" stroke-linecap="round"><path d="M7 8H23"/><path d="M15 8V25"/></g>
  <path d="M20.6 20.4l3.2 3.2 4.6-6.2" fill="none" stroke="#E5A812" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**`taskmate-mark-dark.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 32 32">
  <g transform="translate(3.1 0) skewX(-11)" fill="none" stroke="#8CC186" stroke-width="6" stroke-linecap="round"><path d="M7 8H23"/><path d="M15 8V25"/></g>
  <path d="M20.6 20.4l3.2 3.2 4.6-6.2" fill="none" stroke="#E5A812" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**`taskmate-lockup-light.svg`** (see Section 9 for the proportions)

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="568" height="128" viewBox="0 0 142 32">
  <g transform="translate(3.1 0) skewX(-11)" fill="none" stroke="#2B7132" stroke-width="6" stroke-linecap="round"><path d="M7 8H23"/><path d="M15 8V25"/></g>
  <path d="M20.6 20.4l3.2 3.2 4.6-6.2" fill="none" stroke="#E5A812" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path transform="translate(42 23.9) scale(0.022)" fill="#15140F" d="M267 0V-617H28V-720H636V-617H397V0ZM930 0Q925 -20 922.5 -44Q920 -68 920 -102H916V-344Q916 -384 893.5 -404.5Q871 -425 825 -425Q780 -425 753.5 -408.5Q727 -392 721 -361H600Q608 -432 668 -476Q728 -520 829 -520Q934 -520 988 -472.5Q1042 -425 1042 -333V-102Q1042 -78 1045.5 -53Q1049 -28 1056 0ZM753 10Q676 10 630.5 -28.5Q585 -67 585 -132Q585 -202 636 -243Q687 -284 780 -298L939 -322V-242L801 -221Q756 -214 733.5 -196Q711 -178 711 -146Q711 -117 732 -101.5Q753 -86 790 -86Q844 -86 880 -113Q916 -140 916 -179L930 -102Q910 -47 864.5 -18.5Q819 10 753 10ZM1355 10Q1249 10 1186 -34.5Q1123 -79 1117 -158H1232Q1237 -119 1269 -99Q1301 -79 1355 -79Q1404 -79 1428.5 -94.5Q1453 -110 1453 -139Q1453 -160 1439 -173.5Q1425 -187 1386 -196L1304 -215Q1220 -233 1179.5 -271.5Q1139 -310 1139 -368Q1139 -439 1193.5 -479.5Q1248 -520 1344 -520Q1439 -520 1496.5 -479.5Q1554 -439 1560 -368H1445Q1440 -399 1413.5 -415Q1387 -431 1341 -431Q1298 -431 1276 -417.5Q1254 -404 1254 -378Q1254 -358 1271 -344.5Q1288 -331 1328 -321L1416 -301Q1491 -284 1529.5 -242Q1568 -200 1568 -143Q1568 -70 1512 -30Q1456 10 1355 10ZM1654 0V-727H1780V0ZM1983 0 1751 -265 1976 -510H2128L1868 -242L1875 -289L2138 0ZM2207 0V-720H2409L2629 -26H2558L2778 -720H2981V0H2853V-677H2874L2660 0H2521L2309 -671H2329V0ZM3428 0Q3423 -20 3420.5 -44Q3418 -68 3418 -102H3414V-344Q3414 -384 3391.5 -404.5Q3369 -425 3323 -425Q3278 -425 3251.5 -408.5Q3225 -392 3219 -361H3098Q3106 -432 3166 -476Q3226 -520 3327 -520Q3432 -520 3486 -472.5Q3540 -425 3540 -333V-102Q3540 -78 3543.5 -53Q3547 -28 3554 0ZM3251 10Q3174 10 3128.5 -28.5Q3083 -67 3083 -132Q3083 -202 3134 -243Q3185 -284 3278 -298L3437 -322V-242L3299 -221Q3254 -214 3231.5 -196Q3209 -178 3209 -146Q3209 -117 3230 -101.5Q3251 -86 3288 -86Q3342 -86 3378 -113Q3414 -140 3414 -179L3428 -102Q3408 -47 3362.5 -18.5Q3317 10 3251 10ZM3869 10Q3775 10 3730.5 -34.5Q3686 -79 3686 -168V-626L3813 -673V-165Q3813 -128 3833 -110Q3853 -92 3896 -92Q3913 -92 3926.5 -94.5Q3940 -97 3952 -101V-3Q3940 3 3918 6.5Q3896 10 3869 10ZM3588 -411V-510H3952V-411ZM4259 10Q4178 10 4117.5 -24Q4057 -58 4023.5 -118Q3990 -178 3990 -256Q3990 -334 4023.5 -393.5Q4057 -453 4117 -486.5Q4177 -520 4257 -520Q4333 -520 4389 -488.5Q4445 -457 4476 -400Q4507 -343 4507 -267Q4507 -253 4506 -241Q4505 -229 4503 -217H4068V-305H4406L4380 -281Q4380 -353 4347 -389Q4314 -425 4255 -425Q4191 -425 4153.5 -381Q4116 -337 4116 -254Q4116 -172 4153.5 -128.5Q4191 -85 4260 -85Q4300 -85 4330 -100Q4360 -115 4374 -146H4493Q4468 -74 4408.5 -32Q4349 10 4259 10Z"/>
</svg>
```

## 6. Concept 1B: Architectural upright T + integrated check

A restrained upright T. The stem turns gold at the bottom and kicks into the check, so the lower-right stroke resolves into the checkmark.

**React component (`app-logo-icon.tsx`)**

```tsx
import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 32 32" role="img" aria-label="TaskMate" xmlns="http://www.w3.org/2000/svg">
            <path className="stroke-brand" d="M6.5 7H25.5M16 7V18" fill="none" strokeWidth="4.6" strokeLinecap="round" />
            <path d="M16 18l3.6 4 7.4-9" fill="none" stroke="#E5A812" strokeWidth="4.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
```

**`favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <title>TaskMate</title>
  <style>
    .t { stroke: #2B7132; }
    @media (prefers-color-scheme: dark) { .t { stroke: #8CC186; } }
  </style>
  <path class="t" d="M6.5 7H25.5M16 7V18" fill="none" stroke-width="4.6" stroke-linecap="round"/>
  <path d="M16 18l3.6 4 7.4-9" fill="none" stroke="#E5A812" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**`taskmate-mark-light.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 32 32">
  <path d="M6.5 7H25.5M16 7V18" fill="none" stroke="#2B7132" stroke-width="4.6" stroke-linecap="round"/>
  <path d="M16 18l3.6 4 7.4-9" fill="none" stroke="#E5A812" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**`taskmate-mark-dark.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 32 32">
  <path d="M6.5 7H25.5M16 7V18" fill="none" stroke="#8CC186" stroke-width="4.6" stroke-linecap="round"/>
  <path d="M16 18l3.6 4 7.4-9" fill="none" stroke="#E5A812" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**`taskmate-lockup-light.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="568" height="128" viewBox="0 0 142 32">
  <path d="M6.5 7H25.5M16 7V18" fill="none" stroke="#2B7132" stroke-width="4.6" stroke-linecap="round"/>
  <path d="M16 18l3.6 4 7.4-9" fill="none" stroke="#E5A812" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/>
  <path transform="translate(42 23.9) scale(0.022)" fill="#15140F" d="M267 0V-617H28V-720H636V-617H397V0ZM930 0Q925 -20 922.5 -44Q920 -68 920 -102H916V-344Q916 -384 893.5 -404.5Q871 -425 825 -425Q780 -425 753.5 -408.5Q727 -392 721 -361H600Q608 -432 668 -476Q728 -520 829 -520Q934 -520 988 -472.5Q1042 -425 1042 -333V-102Q1042 -78 1045.5 -53Q1049 -28 1056 0ZM753 10Q676 10 630.5 -28.5Q585 -67 585 -132Q585 -202 636 -243Q687 -284 780 -298L939 -322V-242L801 -221Q756 -214 733.5 -196Q711 -178 711 -146Q711 -117 732 -101.5Q753 -86 790 -86Q844 -86 880 -113Q916 -140 916 -179L930 -102Q910 -47 864.5 -18.5Q819 10 753 10ZM1355 10Q1249 10 1186 -34.5Q1123 -79 1117 -158H1232Q1237 -119 1269 -99Q1301 -79 1355 -79Q1404 -79 1428.5 -94.5Q1453 -110 1453 -139Q1453 -160 1439 -173.5Q1425 -187 1386 -196L1304 -215Q1220 -233 1179.5 -271.5Q1139 -310 1139 -368Q1139 -439 1193.5 -479.5Q1248 -520 1344 -520Q1439 -520 1496.5 -479.5Q1554 -439 1560 -368H1445Q1440 -399 1413.5 -415Q1387 -431 1341 -431Q1298 -431 1276 -417.5Q1254 -404 1254 -378Q1254 -358 1271 -344.5Q1288 -331 1328 -321L1416 -301Q1491 -284 1529.5 -242Q1568 -200 1568 -143Q1568 -70 1512 -30Q1456 10 1355 10ZM1654 0V-727H1780V0ZM1983 0 1751 -265 1976 -510H2128L1868 -242L1875 -289L2138 0ZM2207 0V-720H2409L2629 -26H2558L2778 -720H2981V0H2853V-677H2874L2660 0H2521L2309 -671H2329V0ZM3428 0Q3423 -20 3420.5 -44Q3418 -68 3418 -102H3414V-344Q3414 -384 3391.5 -404.5Q3369 -425 3323 -425Q3278 -425 3251.5 -408.5Q3225 -392 3219 -361H3098Q3106 -432 3166 -476Q3226 -520 3327 -520Q3432 -520 3486 -472.5Q3540 -425 3540 -333V-102Q3540 -78 3543.5 -53Q3547 -28 3554 0ZM3251 10Q3174 10 3128.5 -28.5Q3083 -67 3083 -132Q3083 -202 3134 -243Q3185 -284 3278 -298L3437 -322V-242L3299 -221Q3254 -214 3231.5 -196Q3209 -178 3209 -146Q3209 -117 3230 -101.5Q3251 -86 3288 -86Q3342 -86 3378 -113Q3414 -140 3414 -179L3428 -102Q3408 -47 3362.5 -18.5Q3317 10 3251 10ZM3869 10Q3775 10 3730.5 -34.5Q3686 -79 3686 -168V-626L3813 -673V-165Q3813 -128 3833 -110Q3853 -92 3896 -92Q3913 -92 3926.5 -94.5Q3940 -97 3952 -101V-3Q3940 3 3918 6.5Q3896 10 3869 10ZM3588 -411V-510H3952V-411ZM4259 10Q4178 10 4117.5 -24Q4057 -58 4023.5 -118Q3990 -178 3990 -256Q3990 -334 4023.5 -393.5Q4057 -453 4117 -486.5Q4177 -520 4257 -520Q4333 -520 4389 -488.5Q4445 -457 4476 -400Q4507 -343 4507 -267Q4507 -253 4506 -241Q4505 -229 4503 -217H4068V-305H4406L4380 -281Q4380 -353 4347 -389Q4314 -425 4255 -425Q4191 -425 4153.5 -381Q4116 -337 4116 -254Q4116 -172 4153.5 -128.5Q4191 -85 4260 -85Q4300 -85 4330 -100Q4360 -115 4374 -146H4493Q4468 -74 4408.5 -32Q4349 10 4259 10Z"/>
</svg>
```

## 7. Concept 1C: Rounded badge emblem

A forest-green rounded square holding a cream T and the gold check. The badge keeps its own fill in both themes, a deeper green in Light and a slightly lifted green in Dark, so it stays visible on dark tabs without changing the cream letter.

**React component (`app-logo-icon.tsx`)**

```tsx
import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 32 32" role="img" aria-label="TaskMate" xmlns="http://www.w3.org/2000/svg">
            <rect className="fill-[#2B7132] dark:fill-[#337B3C]" width="32" height="32" rx="8" />
            <path d="M8.5 9.5H21M14.75 9.5V24" fill="none" stroke="#FCFAF3" strokeWidth="4.2" strokeLinecap="round" />
            <path d="M19.4 21l2.8 2.8 4.8-6" fill="none" stroke="#E5A812" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
```

**`favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <title>TaskMate</title>
  <style>
    .bd { fill: #2B7132; }
    @media (prefers-color-scheme: dark) { .bd { fill: #337B3C; } }
  </style>
  <rect class="bd" width="32" height="32" rx="8"/>
  <path d="M8.5 9.5H21M14.75 9.5V24" fill="none" stroke="#FCFAF3" stroke-width="4.2" stroke-linecap="round"/>
  <path d="M19.4 21l2.8 2.8 4.8-6" fill="none" stroke="#E5A812" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**`taskmate-mark-light.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="8" fill="#2B7132"/>
  <path d="M8.5 9.5H21M14.75 9.5V24" fill="none" stroke="#FCFAF3" stroke-width="4.2" stroke-linecap="round"/>
  <path d="M19.4 21l2.8 2.8 4.8-6" fill="none" stroke="#E5A812" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**`taskmate-mark-dark.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="8" fill="#337B3C"/>
  <path d="M8.5 9.5H21M14.75 9.5V24" fill="none" stroke="#FCFAF3" stroke-width="4.2" stroke-linecap="round"/>
  <path d="M19.4 21l2.8 2.8 4.8-6" fill="none" stroke="#E5A812" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**`taskmate-lockup-light.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="568" height="128" viewBox="0 0 142 32">
  <rect width="32" height="32" rx="8" fill="#2B7132"/>
  <path d="M8.5 9.5H21M14.75 9.5V24" fill="none" stroke="#FCFAF3" stroke-width="4.2" stroke-linecap="round"/>
  <path d="M19.4 21l2.8 2.8 4.8-6" fill="none" stroke="#E5A812" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <path transform="translate(42 23.9) scale(0.022)" fill="#15140F" d="M267 0V-617H28V-720H636V-617H397V0ZM930 0Q925 -20 922.5 -44Q920 -68 920 -102H916V-344Q916 -384 893.5 -404.5Q871 -425 825 -425Q780 -425 753.5 -408.5Q727 -392 721 -361H600Q608 -432 668 -476Q728 -520 829 -520Q934 -520 988 -472.5Q1042 -425 1042 -333V-102Q1042 -78 1045.5 -53Q1049 -28 1056 0ZM753 10Q676 10 630.5 -28.5Q585 -67 585 -132Q585 -202 636 -243Q687 -284 780 -298L939 -322V-242L801 -221Q756 -214 733.5 -196Q711 -178 711 -146Q711 -117 732 -101.5Q753 -86 790 -86Q844 -86 880 -113Q916 -140 916 -179L930 -102Q910 -47 864.5 -18.5Q819 10 753 10ZM1355 10Q1249 10 1186 -34.5Q1123 -79 1117 -158H1232Q1237 -119 1269 -99Q1301 -79 1355 -79Q1404 -79 1428.5 -94.5Q1453 -110 1453 -139Q1453 -160 1439 -173.5Q1425 -187 1386 -196L1304 -215Q1220 -233 1179.5 -271.5Q1139 -310 1139 -368Q1139 -439 1193.5 -479.5Q1248 -520 1344 -520Q1439 -520 1496.5 -479.5Q1554 -439 1560 -368H1445Q1440 -399 1413.5 -415Q1387 -431 1341 -431Q1298 -431 1276 -417.5Q1254 -404 1254 -378Q1254 -358 1271 -344.5Q1288 -331 1328 -321L1416 -301Q1491 -284 1529.5 -242Q1568 -200 1568 -143Q1568 -70 1512 -30Q1456 10 1355 10ZM1654 0V-727H1780V0ZM1983 0 1751 -265 1976 -510H2128L1868 -242L1875 -289L2138 0ZM2207 0V-720H2409L2629 -26H2558L2778 -720H2981V0H2853V-677H2874L2660 0H2521L2309 -671H2329V0ZM3428 0Q3423 -20 3420.5 -44Q3418 -68 3418 -102H3414V-344Q3414 -384 3391.5 -404.5Q3369 -425 3323 -425Q3278 -425 3251.5 -408.5Q3225 -392 3219 -361H3098Q3106 -432 3166 -476Q3226 -520 3327 -520Q3432 -520 3486 -472.5Q3540 -425 3540 -333V-102Q3540 -78 3543.5 -53Q3547 -28 3554 0ZM3251 10Q3174 10 3128.5 -28.5Q3083 -67 3083 -132Q3083 -202 3134 -243Q3185 -284 3278 -298L3437 -322V-242L3299 -221Q3254 -214 3231.5 -196Q3209 -178 3209 -146Q3209 -117 3230 -101.5Q3251 -86 3288 -86Q3342 -86 3378 -113Q3414 -140 3414 -179L3428 -102Q3408 -47 3362.5 -18.5Q3317 10 3251 10ZM3869 10Q3775 10 3730.5 -34.5Q3686 -79 3686 -168V-626L3813 -673V-165Q3813 -128 3833 -110Q3853 -92 3896 -92Q3913 -92 3926.5 -94.5Q3940 -97 3952 -101V-3Q3940 3 3918 6.5Q3896 10 3869 10ZM3588 -411V-510H3952V-411ZM4259 10Q4178 10 4117.5 -24Q4057 -58 4023.5 -118Q3990 -178 3990 -256Q3990 -334 4023.5 -393.5Q4057 -453 4117 -486.5Q4177 -520 4257 -520Q4333 -520 4389 -488.5Q4445 -457 4476 -400Q4507 -343 4507 -267Q4507 -253 4506 -241Q4505 -229 4503 -217H4068V-305H4406L4380 -281Q4380 -353 4347 -389Q4314 -425 4255 -425Q4191 -425 4153.5 -381Q4116 -337 4116 -254Q4116 -172 4153.5 -128.5Q4191 -85 4260 -85Q4300 -85 4330 -100Q4360 -115 4374 -146H4493Q4468 -74 4408.5 -32Q4349 10 4259 10Z"/>
</svg>
```

## 8. Concept 2A: Simplified schedule + check

Four large rounded squares form a schedule grid. The bottom-right square is the deep badge green and holds the gold check, so the check never sits on the pale Dark-mode green.

**React component (`app-logo-icon.tsx`)**

```tsx
import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 32 32" role="img" aria-label="TaskMate" xmlns="http://www.w3.org/2000/svg">
            <rect className="fill-brand" x="2" y="2" width="12" height="12" rx="3.5" />
            <rect className="fill-brand" x="18" y="2" width="12" height="12" rx="3.5" />
            <rect className="fill-brand" x="2" y="18" width="12" height="12" rx="3.5" />
            <rect className="fill-[#2B7132] dark:fill-[#337B3C]" x="18" y="18" width="12" height="12" rx="3.5" />
            <path d="M21.4 24.3l2.6 2.6 4-5" fill="none" stroke="#E5A812" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
```

**`favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <title>TaskMate</title>
  <style>
    .b { fill: #2B7132; }
    .bd { fill: #2B7132; }
    @media (prefers-color-scheme: dark) { .b { fill: #8CC186; } .bd { fill: #337B3C; } }
  </style>
  <rect class="b" x="2" y="2" width="12" height="12" rx="3.5"/>
  <rect class="b" x="18" y="2" width="12" height="12" rx="3.5"/>
  <rect class="b" x="2" y="18" width="12" height="12" rx="3.5"/>
  <rect class="bd" x="18" y="18" width="12" height="12" rx="3.5"/>
  <path d="M21.4 24.3l2.6 2.6 4-5" fill="none" stroke="#E5A812" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**`taskmate-mark-light.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 32 32">
  <g fill="#2B7132"><rect x="2" y="2" width="12" height="12" rx="3.5"/><rect x="18" y="2" width="12" height="12" rx="3.5"/><rect x="2" y="18" width="12" height="12" rx="3.5"/><rect x="18" y="18" width="12" height="12" rx="3.5"/></g>
  <path d="M21.4 24.3l2.6 2.6 4-5" fill="none" stroke="#E5A812" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**`taskmate-mark-dark.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 32 32">
  <g fill="#8CC186"><rect x="2" y="2" width="12" height="12" rx="3.5"/><rect x="18" y="2" width="12" height="12" rx="3.5"/><rect x="2" y="18" width="12" height="12" rx="3.5"/></g>
  <rect x="18" y="18" width="12" height="12" rx="3.5" fill="#337B3C"/>
  <path d="M21.4 24.3l2.6 2.6 4-5" fill="none" stroke="#E5A812" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

**`taskmate-lockup-light.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="568" height="128" viewBox="0 0 142 32">
  <g fill="#2B7132"><rect x="2" y="2" width="12" height="12" rx="3.5"/><rect x="18" y="2" width="12" height="12" rx="3.5"/><rect x="2" y="18" width="12" height="12" rx="3.5"/><rect x="18" y="18" width="12" height="12" rx="3.5"/></g>
  <path d="M21.4 24.3l2.6 2.6 4-5" fill="none" stroke="#E5A812" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
  <path transform="translate(42 23.9) scale(0.022)" fill="#15140F" d="M267 0V-617H28V-720H636V-617H397V0ZM930 0Q925 -20 922.5 -44Q920 -68 920 -102H916V-344Q916 -384 893.5 -404.5Q871 -425 825 -425Q780 -425 753.5 -408.5Q727 -392 721 -361H600Q608 -432 668 -476Q728 -520 829 -520Q934 -520 988 -472.5Q1042 -425 1042 -333V-102Q1042 -78 1045.5 -53Q1049 -28 1056 0ZM753 10Q676 10 630.5 -28.5Q585 -67 585 -132Q585 -202 636 -243Q687 -284 780 -298L939 -322V-242L801 -221Q756 -214 733.5 -196Q711 -178 711 -146Q711 -117 732 -101.5Q753 -86 790 -86Q844 -86 880 -113Q916 -140 916 -179L930 -102Q910 -47 864.5 -18.5Q819 10 753 10ZM1355 10Q1249 10 1186 -34.5Q1123 -79 1117 -158H1232Q1237 -119 1269 -99Q1301 -79 1355 -79Q1404 -79 1428.5 -94.5Q1453 -110 1453 -139Q1453 -160 1439 -173.5Q1425 -187 1386 -196L1304 -215Q1220 -233 1179.5 -271.5Q1139 -310 1139 -368Q1139 -439 1193.5 -479.5Q1248 -520 1344 -520Q1439 -520 1496.5 -479.5Q1554 -439 1560 -368H1445Q1440 -399 1413.5 -415Q1387 -431 1341 -431Q1298 -431 1276 -417.5Q1254 -404 1254 -378Q1254 -358 1271 -344.5Q1288 -331 1328 -321L1416 -301Q1491 -284 1529.5 -242Q1568 -200 1568 -143Q1568 -70 1512 -30Q1456 10 1355 10ZM1654 0V-727H1780V0ZM1983 0 1751 -265 1976 -510H2128L1868 -242L1875 -289L2138 0ZM2207 0V-720H2409L2629 -26H2558L2778 -720H2981V0H2853V-677H2874L2660 0H2521L2309 -671H2329V0ZM3428 0Q3423 -20 3420.5 -44Q3418 -68 3418 -102H3414V-344Q3414 -384 3391.5 -404.5Q3369 -425 3323 -425Q3278 -425 3251.5 -408.5Q3225 -392 3219 -361H3098Q3106 -432 3166 -476Q3226 -520 3327 -520Q3432 -520 3486 -472.5Q3540 -425 3540 -333V-102Q3540 -78 3543.5 -53Q3547 -28 3554 0ZM3251 10Q3174 10 3128.5 -28.5Q3083 -67 3083 -132Q3083 -202 3134 -243Q3185 -284 3278 -298L3437 -322V-242L3299 -221Q3254 -214 3231.5 -196Q3209 -178 3209 -146Q3209 -117 3230 -101.5Q3251 -86 3288 -86Q3342 -86 3378 -113Q3414 -140 3414 -179L3428 -102Q3408 -47 3362.5 -18.5Q3317 10 3251 10ZM3869 10Q3775 10 3730.5 -34.5Q3686 -79 3686 -168V-626L3813 -673V-165Q3813 -128 3833 -110Q3853 -92 3896 -92Q3913 -92 3926.5 -94.5Q3940 -97 3952 -101V-3Q3940 3 3918 6.5Q3896 10 3869 10ZM3588 -411V-510H3952V-411ZM4259 10Q4178 10 4117.5 -24Q4057 -58 4023.5 -118Q3990 -178 3990 -256Q3990 -334 4023.5 -393.5Q4057 -453 4117 -486.5Q4177 -520 4257 -520Q4333 -520 4389 -488.5Q4445 -457 4476 -400Q4507 -343 4507 -267Q4507 -253 4506 -241Q4505 -229 4503 -217H4068V-305H4406L4380 -281Q4380 -353 4347 -389Q4314 -425 4255 -425Q4191 -425 4153.5 -381Q4116 -337 4116 -254Q4116 -172 4153.5 -128.5Q4191 -85 4260 -85Q4300 -85 4330 -100Q4360 -115 4374 -146H4493Q4468 -74 4408.5 -32Q4349 10 4259 10Z"/>
</svg>
```

## 9. Lockup proportions (exact)

| Property | Value |
| --- | --- |
| Artboard | `viewBox="0 0 142 32"`, exported at `568 × 128` |
| Mark | 32 × 32, at x = 0, y = 0 |
| Gap between mark and wordmark | 10 |
| Wordmark origin | `translate(42 23.9)`, `scale(0.022)` (font units are 1000 per em) |
| Wordmark size | Cap height 15.84, x-height 11.22, width about 99.7 (equal to a 22 px font) |
| Vertical alignment | The cap-height center sits on the mark's center line, y = 16 |
| Clear space | 8 units on every side (a quarter of the mark's height) |
| Wordmark source | Instrument Sans SemiBold (600), SIL Open Font License, with pair kerning applied, converted to a single path |

**Dark-background lockup** (no file requested, but the same file with two changes): use the concept's `taskmate-mark-dark.svg` shapes and set the wordmark `fill` to `#F8F8F5`.

## 10. Acceptance checklist

- [ ] Light and Dark `--brand` match Section 2, including `--ring` and `--sidebar-ring`, with no other token touched.
- [ ] No hex gold (`#E5A812`) exists anywhere except logo SVGs and the print files.
- [ ] Focus ring, links, and active nav show green in both themes. Success badges still read as success (icon plus label).
- [ ] Sidebar mark is crisp at expanded and collapsed sizes in both themes.
- [ ] `public/favicon.svg` is crisp at 16 × 16 and brightens in a dark browser tab.
- [ ] The three print files open in Canva and Illustrator without a missing font prompt (the wordmark is outlined).
- [ ] The type check, tests, and build the project already uses all pass.

## 11. Notes on how these were made

- The concept image referenced in the brief was not available when this was drafted, so 01 and 08 were interpreted from the written descriptions (slanted forest-green T with gold check; calendar with gold check). Compare against the image and tell the designer what to adjust.
- All four marks were rendered in Chromium at 16, 28, and 140 px on the Light and Dark surfaces. Safari, Firefox, and a real browser tab were not checked.
- `docs/logo-preview.html` loads Instrument Sans from Google Fonts for the lockup text. Offline, it falls back to the system sans.
