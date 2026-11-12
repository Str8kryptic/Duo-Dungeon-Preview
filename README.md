# Duo Dungeon — Development Preview

Public playable preview for testing.

## Source of truth

The live Preview site is built directly from the private repository
`Str8kryptic/Duo-Dungeon`, branch `promotion/development-latest`.

The GitHub Pages workflow checks out that branch, stages its web app files,
runs validation, and deploys the staged result. This repository's root app
files are not the source of truth and must not be edited to make game changes.

## Keeping Preview current

- A push to this repository's `main` branch triggers a Preview deployment.
- The workflow can be run manually for an immediate refresh.
- A scheduled sync runs every 15 minutes as a safety net.
- The deployment validates the live AI orb module and its script wiring before publishing.

## Live avatar deployment check

The AI avatar is a canvas-rendered live module (`assistant-orb.js`) loaded from the Development branch. The Pages workflow verifies the module, its script include, and its mount call before deployment. If the live site still shows an older avatar, rerun **Deploy Duo Dungeon Preview** from the Actions tab to rebuild the Pages artifact from the current Development branch.


The legacy prerecorded avatar presentation has been removed from Development. Preview now uses only the live Canvas-rendered AI avatar; the old avatar styling is removed and stale GIF images are hidden.
