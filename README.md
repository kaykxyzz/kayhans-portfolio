# Experimental Editorial UI/UX Portfolio — v3

A responsive, editorial-style portfolio with compact project cards on the homepage and two dedicated before/after case studies.

## Run locally

1. Extract the ZIP.
2. Open `index.html` in a browser. For best results, serve the folder:
   ```bash
   python -m http.server 8000
   ```
3. Visit `http://localhost:8000`.

## Case-study layout

- `index.html` — two compact project cards with one live page preview per project.
- `showcases/howvin.html` — one live Howvin redesign preview, plus original-site and redesign screenshot comparisons tied to analysis.
- `showcases/sidra.html` — one live Sidra redesign preview, plus original-site and redesign screenshot comparisons tied to analysis.
- `styles.css` — design system and responsive layout.
- `script.js` — menu and motion behavior.
- `showcase.js` — page-capture loading and fallbacks.

## About the comparison images

The before/after images are actual page captures requested from a public screenshot service when the case-study page is opened. They are not placeholder illustrations. This keeps the captures tied to the live original and redesign URLs, but it means **internet access is required**, screenshots can take a few seconds to appear, and they may update if a source site changes. If a capture endpoint fails, the page tries a second provider; if both are unavailable, a direct source link is shown.

The redesign screenshots use the live redesign home page and the known login/authentication routes. Full-page captures of the redesign homepage are cropped to show different sections; they are genuine views from that page, not separate live embeds. Each case-study page contains only one embedded live preview. The original inquiry form versus redesign account/login screen is intentionally described as two different entry points, not as identical functionality.

## Resume and experience note

The resume uses project-based/small-business experience descriptions rather than invented employer names. Replace or refine these with verified company/client names and responsibilities that match your actual work before sending the CV to employers. The 2022-2024 and 2024-2026 dates are an assumed timeline from the four years of experience stated here; verify the actual dates before use.

## Personalize before publishing

- A designed resume PDF is included at `assets/kayhan-resume.pdf` and linked for download from the homepage and case-study headers. Check the details before sharing.
- Verify your role, dates, responsibilities, and skills before presenting them as facts.
- Review the analysis text and add numbered annotations tied to specific elements once you've inspected the screenshot captures.
- Do not claim measurable usability, conversion, or business outcomes without evidence.
- Confirm all live routes and links.

## Notes

- No build step or package installation is required.
- Google Fonts, live previews, and screenshot captures need an internet connection.
- Motion respects `prefers-reduced-motion`.
- The current screenshot service captures the live sites on demand; this ZIP does not bundle static PNG files from the pages.


CampaignRider is case study 03: four saved section comparisons, source links, a live preview, and Sidra → CampaignRider → Howvin navigation. Open index.html to browse. Deploy this folder as a static website; no build needed. Live previews require internet access.
