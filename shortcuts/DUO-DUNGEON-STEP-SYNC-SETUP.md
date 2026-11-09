# Duo Dungeon — Apple Health Step Sync

**Shortcut name:** Sync Duo Dungeon Steps

Create the following actions in Apple Shortcuts, in order:

1. **Find Health Samples** — Type: Steps; Start Date: Today.
2. **Calculate Statistics** — Operation: Sum; input: Health Samples from step 1.
3. **Format Date** — Current Date; Custom format: `yyyy-MM-dd`.
4. **Text** — Build this URL using the Magic Variables from steps 2 and 3:

   `https://str8kryptic.github.io/Duo-Dungeon-Preview/?duoSteps=[SUM]&duoDate=[DATE]`

5. **Open URLs** — Input: the Text action.
6. Run it and allow Apple Health access when prompted.

## Important account behavior

- Steps go to the Duo Dungeon account currently signed in on the device.
- The game asks you to confirm the account before rewards are applied.
- Health sync is blocked while signed out or using a guest session.
- The Shortcut does not store credentials or choose an account.
- On shared devices, sign out before another player uses the game.
- Re-running the Shortcut only rewards the increase since the last successful sync.

> This is an action-by-action setup guide, not an installable Apple-signed `.shortcut` package. Apple Shortcuts creates shareable iCloud install links from inside the Shortcuts app; we can add that one once the Shortcut has been created and shared.


> Testing note: use the Preview URL while testing. After the changes are approved and promoted, switch the Shortcut to `https://duodungeon.com/`.
