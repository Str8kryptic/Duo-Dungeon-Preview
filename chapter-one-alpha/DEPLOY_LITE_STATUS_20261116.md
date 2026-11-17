# Chapter One Lite deployment

The verified Lite v9.4 Release attachment was confirmed on 2026-11-16. This non-runtime documentation commit starts a fresh Preview Pages workflow run, avoiding the duplicate Pages artifacts created by rerunning a previous failed job. The deployment verifies SHA-256 and gameplay tests before staging `/chapter-one-alpha/`. Legacy Preview and production Supabase remain unchanged.

## v9.5 approved Warden Enforcer release handoff

The independently verified Chapter One Lite v9.5 Warden Enforcer package `Duo_Dungeon_Chapter_One_Playable_Lite_v9_5_Warden_Integrated.zip` (2,922,411 bytes) is attached to the Dev release `chapter-one-sci-fi-v9.4-lite`. The isolated Preview workflow selects and checksum-verifies v9.5 and checks Floor 9 artwork, then runs existing gameplay and campaign tests. This documentation-only commit requests a fresh complete Preview run after attachment; it does not alter game data, legacy routes, or production.
