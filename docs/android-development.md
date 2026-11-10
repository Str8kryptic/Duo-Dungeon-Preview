# Duo Dungeon Android Health Connect foundation

## Current state

- Account creation stores `step_platform=health_connect` in Supabase Auth user metadata.
- The Codex displays the selected platform and marks Android as coming soon.
- The Development home screen must never present the Apple Shortcut action to an Android-selected account.
- The shared `step-reward-sync` Supabase function remains the only reward authority. It verifies the signed-in user, local step date/timezone, daily baseline, save revision, duplicate protection, and reward cap.
- A Capacitor 8 app shell is now configured with package scripts and a static asset bundler (`npm run build:web`).
- GitHub Actions can generate a clean Android project, build a Development debug APK, and retain it as a downloadable workflow artifact.
- The browser-only GitHub Pages site cannot request Android Health Connect permissions. A native Android container/bridge is required.

## Target Android implementation

1. Use the Capacitor 8 shell (`capacitor.config.ts`) to package the existing web game without changing its game/save data model. The Android project is generated from this config during CI (`npx cap add android`) rather than committing generated Android Studio files yet.
2. Add a native Health Connect bridge backed by AndroidX Health Connect client APIs. Request only `READ_STEPS`; do not declare unrelated health scopes.
3. Request only the read permission for aggregate step records; show the system permission flow and handle denied/revoked permissions.
4. Query today's aggregate steps using the device's local date/timezone. Do not upload raw health records or request unrelated health types.
5. Pass the total, local date, and IANA timezone to the existing authenticated `step-reward-sync` endpoint. Do not calculate or grant rewards in the Android client.
6. Reuse the existing confirmation/reward UI and secure server response. Keep the 20,000-step daily reward cap and duplicate/revision safeguards unchanged.
7. Start with an explicit in-app sync action. Background sync is not guaranteed and must not be advertised until Android platform requirements and battery/permission behavior are tested.

## Release gates

- Android Health Connect permission can be granted, denied, and revoked safely.
- Missing Health Connect provider, unsupported Android version, and no-permission states show actionable messages.
- A signed-in Android test account can sync today's aggregate steps.
- Repeating the same reading grants no duplicate rewards; lower readings are rejected.
- Existing Apple Shortcut sync and all iOS account/save flows pass regression tests.
- Android changes ship to Development only until separately approved for Production.


## Build the Android Development shell

Requirements: Node.js 22, Android Studio, and an Android SDK installation.

From the repository root:

```bash
npm install
npm run android:add
```

For later web-code changes, use:

```bash
npm run android:sync
npm run android:open
```

The pull-request workflow also generates a fresh Android project and builds a debug APK on GitHub Actions. The APK is uploaded as the `duo-dungeon-android-development` artifact for 14 days. This is a Development test build, not a Play Store release.

The generated `www/` bundle and local Android build output are ignored by Git. The app's source web files remain the source of truth.
