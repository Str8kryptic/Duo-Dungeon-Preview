# Duo Dungeon Android Health Connect foundation

## Current state

- Account creation stores `step_platform=health_connect` in Supabase Auth user metadata.
- The Codex displays the selected platform and marks Android as coming soon.
- The Development home screen must never present the Apple Shortcut action to an Android-selected account.
- The shared `step-reward-sync` Supabase function remains the only reward authority. It verifies the signed-in user, local step date/timezone, daily baseline, save revision, duplicate protection, and reward cap.
- The browser-only GitHub Pages site cannot request Android Health Connect permissions. A native Android container/bridge is required.

## Target Android implementation

1. Package the existing web game in a Capacitor Android application without changing its game/save data model.
2. Add a native Health Connect bridge backed by AndroidX Health Connect client APIs.
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
