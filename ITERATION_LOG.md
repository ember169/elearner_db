# Recommendation Engine Iteration Log

Tracks what was found and changed in each iteration, with commit hashes for rollback.

---

## Iteration 1 — `a06d7d4`
**Finding:** No project-to-challenge alignment existed. Root-me/HTB recs were generic, not linked to the user's 42 curriculum.
**Changes:**
- `engine.ts`: Added `PROJECT_CHALLENGE_ALIGNMENT` map linking completed 42 projects to offensive security challenges (libft -> buffer overflow, ft_printf -> format strings, born2beroot -> Linux privesc, etc.)
- `engine.ts`: Added Section 2.5 (alignment recommendations) to `generateRecommendations()`
- `rootme-challenge-catalog.ts`: Expanded catalog with App-Systeme, Web-Client, Web-Serveur challenges

## Iteration 2 — `a889ab3`
**Finding:** Silent bugs in area-name mismatches caused `pickHtbModuleForSkill()` to return `undefined`. SKILL_TO_HTB_AREA had "Crypto" instead of "Crypto & forensics basics", etc. Also 7/11 Root-me categories had zero catalog entries.
**Changes:**
- `engine.ts`: Fixed `SKILL_TO_HTB_AREA` values — "Crypto" -> "Crypto & forensics basics", "Reverse engineering & binary" -> "Low-level & C"
- `engine.ts`: Added `docker`, `system-administration` entries to `SKILL_TO_HTB_AREA`
- `rootme-challenge-catalog.ts`: Added Cryptanalyse (6), Reseau (5), Forensique (4) catalog entries
- `rootme-challenge-catalog.ts`: Added French<->English title aliases for authentication challenges

## Iteration 3 — `994f3e8`
**Finding:** HTB machines recommended to beginners with 0 box owns. No handler for "general" category goals.
**Changes:**
- `engine.ts`: Gated HTB machine recs behind `htbOwns > 0`
- `engine.ts`: Added `general` category handler in Section 3 with keyword-to-RM/HTB mapping

## Iteration 4 — `ef34f14`
**Finding:** Root-me title matching failed for French titles (user solved "ELF x86 - Basique" but catalog had "ELF x86 - Basic"). Skill-gap challenges were randomly picked, not skill-aware.
**Changes:**
- `rootme-challenge-catalog.ts`: Added `isRmTitleSolved()` with `RM_TITLE_ALIASES` for French<->English
- `rootme-challenge-catalog.ts`: Added `SKILL_TO_CHALLENGE_TAGS` and `pickRootmeChallengeForSkill()` for tag-based matching
- `engine.ts`: Section 4 now uses `pickRootmeChallengeForSkill()` instead of generic `pickRootmeChallenges()`

## Iteration 5 — `0b10ae8`
**Finding:** Duplicate recommendations across sections. Priority ordering inconsistent. Section 2.5 alignment titles didn't match catalog titles, causing dedup to miss them.
**Changes:**
- `engine.ts`: Updated alignment map titles to match catalog (e.g. "RM: Format string bug basic 1" -> "RM: ELF x86 - Format string bug basic 1")
- `engine.ts`: Added `recommendedHtbModuleIds` Set to prevent HTB module duplication across THM/HTB goal handlers
- `engine.ts`: Section 3 rootme now loops through `weakCategories` until picks found (was only trying first)

## Iteration 6 — `d196012`
**Finding:** Solved Root-me challenges stayed on board as backlog items. Board items had stale reason text ("needed needed" double-word). Briefing text was generic ("Fill with RM" instead of specific challenge names).
**Changes:**
- `store.ts`: Added auto-complete pass for solved RM backlog items using `isRmTitleSolved()`
- `store.ts`: Added RM dedup pass normalizing architecture prefixes (ELF x86, ELF x64, etc.)
- `store.ts`: Added "needed needed" regex fix pass
- `store.ts`: Added reason/priority refresh from current recommendations
- `store.ts`: Rewrote `generateBriefing()` to show specific challenge names in "Alongside:" and detect circle progression

## Iteration 7 — `278a958`
**Finding:** 42 milestone goals stuck at `currentValue=0` despite projects being validated (ft_skills table was empty). Circle/parent goals showing 0/N instead of counting completed children.
**Changes:**
- `metrics.ts`: Added auto-complete phase — builds `validatedSlugs` from ft_projects, marks matching ftSlug goals as completed
- `metrics.ts`: Added parent goal progress sync — counts completed children, updates `currentValue`, marks parent as completed when all children done

## Iteration 8 — `b9f894b`
**Finding:** Briefing `sidePicks` only searched non-high items, missing HTB recs for cadence goals. Skill-gap section had dedup leak where same challenge appeared in different project contexts.
**Changes:**
- `store.ts`: Changed `sidePicks` to search `[...high.slice(1), ...rest]` for cross-platform coverage
- `engine.ts`: Added `alreadyRecTitles.add(ch.title.toLowerCase())` after pushing RM rec in Section 4

## Iteration 9 — `33a5701`
**Finding:** Skill profile only showed 2 skills (ft_skills table empty, only rootme-derived). HTB machine items on board despite `htbOwns=0` (legacy from before gating).
**Changes:**
- `engine.ts`: Added project-derived skills in `buildSkillProfile()` using `FT_COMMON_CORE` skill lists
- `store.ts`: Added HTB machine backlog purge when `htbOwns=0`

## Iteration 10 — `ff1b46c`
**Finding:** `pickRootmeChallengeForSkill()` fell back to first unsolved when tagged match was excluded, picking irrelevant challenges (e.g. buffer overflow for concurrency skill). Generic "Root-me: App-Systeme challenges" noise when a specific rec already covered the category.
**Changes:**
- `rootme-challenge-catalog.ts`: Changed fallback — returns `undefined` when tags exist but no tagged match found (only falls back to `unsolved[0]` when NO tags for the skill)
- `engine.ts`: Added `hasRelatedRec` check before adding generic fallback rec

## Iteration 11 — `cd614cd`
**Finding:** Three issues: (1) THM goal handler recommends HTB modules with misleading reason "2 more needed for THM rooms/week" — HTB modules don't count toward THM cadence metric. (2) Stale auto-generated board items persist despite no longer being in current recommendations (e.g. "HTB: Windows Fundamentals", "RM: ELF x64 - bof basic" with wrong concurrency reason). (3) Goal 7 "Improve C++ & OOP" shows "~0.0/day" required pace — unhelpful for slow-burn goals.
**Changes:**
- `engine.ts`: THM goal handler now uses honest reason "Networking — deeper alternative to THM rooms." instead of referencing THM metric
- `engine.ts`: Fixed pace formatting — when perDay < 0.1, shows "2 more in 13 weeks" instead of "~0.0/day"
- `store.ts`: Added stale auto-generated item pruning pass — removes backlog items matching rec patterns (RM:/HTB:/THM:/Root-me:) that are no longer in current recommendations

## Iteration 12 — `7fe4093`
**Finding:** (1) Briefing claimed "it completes Circle 2 and unlocks the next" when the user is 3/7 in Circle 2 — completing one project doesn't complete the circle. (2) Shell skill mapped to "Linux & systems" HTB area, picking "File Transfers" (file transfer techniques during pentesting) instead of the much more relevant "Introduction to Bash Scripting" in "Scripting & automation".
**Changes:**
- `store.ts`: Changed briefing circle text from "it completes Circle N and unlocks the next" to "it moves you forward in Circle N"
- `engine.ts`: Changed `SKILL_TO_HTB_AREA["shell"]` from "Linux & systems" to "Scripting & automation" — now picks "Introduction to Bash Scripting" for upcoming Minishell

## Iteration 13 — `845c9e9`
**Finding:** (1) Briefing said "Then Philosophers" but Philosophers was already in the "done" column on the board — engine doesn't check board state. (2) Board items from old recs had stale `goalId: null` even when current recs carry goalIds (e.g. HTB networking items should link to THM cadence goal).
**Changes:**
- `store.ts`: Briefing generation now excludes recs matching items already "done" on the board — "Then Philosophers" becomes "Then Minishell"
- `store.ts`: Reason/priority refresh pass now also syncs `goalId` from current recommendations to existing board items

## Iteration 14 — `718841f`
**Finding:** Goals page shows "35 active · 2 behind" — the count walks ALL children including every individual 42 project milestone. Showing "3 active · 3 behind" (top-level only) is much more useful. Same issue in mobile view.
**Changes:**
- `goals-tree.tsx`: `flatCount()` now only counts top-level goals (from the `goals` array root) instead of recursively walking children
- `goals-mobile.tsx`: Same fix for `activeCount` and `behindGoals` — only counts/filters top-level goals

## Iteration 15 — `8dfbf3e`
**Finding:** Two issues: (1) Board backlog order didn't match briefing priority — Minishell appeared above Exam Rank 02 even though briefing says "Finish Exam Rank 02 first." Items kept their creation-time sortOrder forever. (2) `behindGoals` in goals-tree.tsx still used a recursive walk with `children.length === 0` filter, inconsistent with the `flatCount()` fix from iter 14.
**Changes:**
- `store.ts`: Added backlog re-sort pass after cleanup — sets `sortOrder` on all backlog items to match recommendation priority order from the engine
- `goals-tree.tsx`: Replaced recursive `behindGoals` walk with simple `goals.filter()` matching `flatCount()` logic

## Iteration 16 — `26c9f63`
**Finding:** 11 of 15 recommendations had no `goalId`, meaning board items couldn't link back to their parent goal. 42 project recommendations (Sections 1 & 2) should link to their milestone goals (e.g. Exam Rank 02 → goal 30, Philosophers → goal 32, Minishell → goal 33).
**Changes:**
- `engine.ts`: Built `slugToGoalId` map from `goalsWithPacing` using `ftSlug`. Set `goalId` on Section 1 (in-progress) and Section 2 (next available) 42 project recommendations. Reduced unlinked recs from 11 to 8.
