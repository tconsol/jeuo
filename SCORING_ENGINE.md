# Cricket Scoring Engine — Complete Technical Reference

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Class: CricketScoring](#class-cricketscoring)
3. [State Initialization](#state-initialization)
4. [Event Processing Pipeline](#event-processing-pipeline)
5. [Delivery Processing](#delivery-processing)
6. [Wicket Processing](#wicket-processing)
7. [Over Completion](#over-completion)
8. [Innings Transitions](#innings-transitions)
9. [Penalty Runs](#penalty-runs)
10. [Players Set Event](#players-set-event)
11. [Strike Rate & Economy Rate](#strike-rate--economy-rate)
12. [Innings Completion Logic](#innings-completion-logic)
13. [Score Derivation from Events](#score-derivation-from-events)
14. [Class: ScoringService (Orchestrator)](#class-scoringservice-orchestrator)
15. [recordEvent — Full Flow](#recordevent--full-flow)
16. [undoLastEvent — Full Flow](#undolastevent--full-flow)
17. [Match Lifecycle](#match-lifecycle)
18. [Auto Match End Detection](#auto-match-end-detection)
19. [Commentary Generation](#commentary-generation)
20. [Real-Time Publishing](#real-time-publishing)
21. [Edge Cases & Rules](#edge-cases--rules)
22. [Complete Data Structures Reference](#complete-data-structures-reference)

---

## Architecture Overview

The scoring engine follows an **event-sourced** design pattern:

```
[Scorer UI] → POST /scoring/:matchId/events
                  ↓
         ScoringService.recordEvent()
                  ↓
         Event saved to MongoDB
                  ↓
         Replay ALL events via CricketScoring.deriveScoreFromEvents()
                  ↓
         New scoreSnapshot saved to Match document
                  ↓
         Redis pub/sub publishes update to all connected clients
```

**Key principle**: The `scoreSnapshot` in the Match document is always a **computed cache** derived by replaying every non-undone `Event` in sequence order. There is no mutable score — the truth is the event log.

**Files**:
- `server/src/services/scoring/cricket.scoring.js` — Pure scoring logic (no DB)
- `server/src/services/scoring/index.js` — DB + Redis orchestrator
- `server/src/models/Event.js` — Event persistence model
- `server/src/models/Match.js` — Match + scoreSnapshot storage

---

## Class: CricketScoring

A **pure static class** — no database access, no side effects. Receives a state object and an event, returns a new state object. Immutable input/output.

```js
const CricketScoring = require('./cricket.scoring');

// All methods are static
CricketScoring.createInitialState(format)
CricketScoring.processEvent(state, event)
CricketScoring.deriveScoreFromEvents(events, format)
CricketScoring.getScoreDisplay(inningsData)
```

All internal methods are prefixed with `_` (private convention):
`_processDelivery`, `_processWicket`, `_processEndOver`, `_processEndInnings`,
`_processPenaltyRun`, `_processPlayersSet`, `_completeOver`,
`_updateStrikeRates`, `_checkInningsComplete`, `_createInningsData`

---

## State Initialization

### `createInitialState(format)`

Called once when a match starts. `format` comes from `match.format`.

```js
CricketScoring.createInitialState({ overs: 20, innings: 1 })
// Returns:
{
  innings: [],                 // completed innings array
  currentInnings: 0,           // 0-based index
  totalInnings: 1,             // per team (1 = T20/ODI, 2 = Test)
  oversPerInnings: 20,         // null for Test (unlimited)
  currentInningsData: { ... }, // see _createInningsData()
}
```

### `_createInningsData()`

Creates a blank innings object:

```js
{
  battingTeam: null,       // 'home' | 'away'
  bowlingTeam: null,
  runs: 0,
  wickets: 0,
  overs: 0,                // completed overs count
  balls: 0,                // legal deliveries in current over (0–5)
  totalBalls: 0,           // all legal deliveries this innings
  extras: {
    wides: 0,
    noBalls: 0,
    byes: 0,
    legByes: 0,
    penalties: 0,
  },
  batsmen: {
    striker: null,         // player ID string
    nonStriker: null,
  },
  currentBowler: null,     // player ID string
  partnerships: [],
  overHistory: [],         // completed over summaries
  currentOver: [],         // ball objects for in-progress over
  fow: [],                 // fall of wickets entries
  battingCard: {},         // { playerId: stats }
  bowlingCard: {},         // { playerId: stats }
  isComplete: false,
  target: null,            // set for 2nd innings
}
```

---

## Event Processing Pipeline

### `processEvent(state, event)`

The central dispatch function. Routes events based on `event.type`.

```
processEvent(state, event)
  ├── innings.isComplete?
  │     ├── players_set  → _processPlayersSet()   (allowed after complete)
  │     ├── end_innings  → _processEndInnings()    (allowed after complete)
  │     ├── end_over     → return state (no-op)
  │     └── delivery/wicket → return state (ignored)
  │
  └── switch(event.type)
        ├── 'players_set'  → _processPlayersSet()
        ├── 'delivery'     → _processDelivery()
        ├── 'wicket'       → _processWicket()
        ├── 'end_over'     → _processEndOver()
        ├── 'end_innings'  → _processEndInnings()
        ├── 'penalty_run'  → _processPenaltyRun()
        └── default        → return state (no-op)
```

**Every handler returns a new state object** — the input `state` is never mutated. All handlers deep-clone `batting/bowlingCard`, `batsmen`, `extras`, `currentOver`, and `fow` before modifying them.

---

## Delivery Processing

### `_processDelivery(state, event)`

The most complex handler. Processes a single ball delivery.

#### Step 1 — Deep Clone

```js
const innings = { ...state.currentInningsData, ... };
innings.battingCard = deep clone of each entry
innings.bowlingCard = deep clone of each entry
```

#### Step 2 — Auto-set batting team (seed events)

If `innings.battingTeam` is null and `event.team` is set, assigns `battingTeam` and derives `bowlingTeam` as the opposite.

#### Step 3 — Determine striker and bowler

- If `event.player` is set and differs from `innings.batsmen.striker`, update striker (handles new batsman after wicket in seed data).
- If `event.payload.bowler` is set, update `innings.currentBowler` (handles over changes).
- Auto-initialise `battingCard[strikerId]` and `bowlingCard[bowlerId]` if not present.

#### Step 4 — Process by extra type

**Wide** (`extraType === 'wide'`):
```
totalRuns = 1 + extraRuns
extras.wides += totalRuns
isLegalDelivery = false
bowler.runs += totalRuns
bowler.wides += 1
// Batter does NOT face a ball (balls counter unchanged)
// Strike does NOT rotate
```

**No Ball** (`extraType === 'no_ball'`):
```
totalRuns = 1 + runs + extraRuns
extras.noBalls += 1 + extraRuns
isLegalDelivery = false
batter.runs += runs  (runs off bat credited to batter)
batter.fours/sixes updated if runs == 4/6
batter.balls += 1   (batter does face the ball on a no-ball)
bowler.runs += totalRuns
bowler.noBalls += 1
```

**Bye** (`extraType === 'bye'`):
```
totalRuns = runs || extraRuns
extras.byes += totalRuns
isLegalDelivery = true
batter.balls += 1    (legal delivery)
bowler.balls += 1
// Byes NOT added to bowler's runs
```

**Leg Bye** (`extraType === 'leg_bye'`):
```
totalRuns = runs || extraRuns
extras.legByes += totalRuns
isLegalDelivery = true
batter.balls += 1
bowler.balls += 1
// Leg byes NOT added to bowler's runs
```

**Normal Delivery** (no extra):
```
totalRuns = runs
batter.runs += runs
batter.balls += 1
batter.fours += 1  (if runs == 4)
batter.sixes += 1  (if runs == 6)
bowler.runs += runs
bowler.balls += 1
```

#### Step 5 — Update innings totals

```
innings.runs += totalRuns
if (isLegalDelivery):
  innings.balls += 1
  innings.totalBalls += 1
```

#### Step 6 — Append to currentOver

```js
innings.currentOver.push({
  runs: totalRuns,
  isExtra,
  extraType,
  isLegalDelivery,
  isWicket: false,
});
```

#### Step 7 — Strike rotation

```
if (totalRuns % 2 !== 0 && !payload.strikerSwap):
  swap striker ↔ nonStriker
```

Only odd runs rotate the strike. The `strikerSwap` override from payload can suppress this if the scorer manually controls it.

#### Step 8 — Check over completion

```
if (innings.balls >= 6):
  _completeOver(innings)
```

#### Step 9 — Check innings completion

```
_checkInningsComplete(state, innings)
```

---

## Wicket Processing

### `_processWicket(state, event)`

Handles a dismissal. A wicket is essentially a delivery that also dismisses a batter.

#### Key steps:

1. **Deep clone** all mutable objects (same pattern as delivery).

2. **Runs on wicket ball**: Any runs scored before/during the dismissal are added to `innings.runs`.

3. **Extras on wicket ball**:
   - If `extraType === 'no_ball'`: `extras.noBalls += 1`, `innings.runs += 1` (no-ball penalty). Only **run-out** is valid on a no-ball.

4. **Legal delivery check**:
   ```
   isLegalDelivery = !isExtra || (extraType !== 'wide' && extraType !== 'no_ball')
   ```

5. **Batter balls faced**: If legal delivery, `battingCard[strikerId].balls += 1`.

6. **Bowler credit**:
   ```
   Bowler gets wicket for: bowled, caught, lbw, stumped, hit_wicket
   Bowler does NOT get wicket for: run_out, retired, timed_out
   ```

7. **Increment wickets**: `innings.wickets += 1`

8. **Vacate striker**: `innings.batsmen.striker = null`
   - Next delivery's `event.player` will set the new batsman via the auto-set logic in `_processDelivery`.

9. **Fall of wicket record**:
   ```js
   innings.fow.push({
     wicket: innings.wickets,      // wicket number (1–10)
     runs: innings.runs,           // score at time of dismissal
     overs: `${Math.floor(innings.totalBalls/6)}.${innings.totalBalls%6}`,
     batter: strikerId,
     howOut: payload.wicketType,
     bowler: bowlerId,
     fielder: payload.fielder,
   });
   ```

10. **Append to currentOver** (with `isWicket: true`, `wicketType`).

11. **Check over and innings completion**.

---

## Over Completion

### `_completeOver(innings)` — internal, called automatically

Triggered when `innings.balls >= 6` (inside `_processDelivery` or `_processWicket`) **or** when an explicit `end_over` event arrives.

```
Step 1 — Calculate over runs (legal deliveries only):
  overRuns = sum of runs from balls where isLegalDelivery == true

Step 2 — Maiden over detection:
  isMaiden = (overRuns === 0) && (at least one legal delivery existed)
  // Extras like wides/no-balls don't count as "runs off bat" for maiden purposes

Step 3 — Push to overHistory:
  innings.overHistory.push({
    bowler: bowlerId,
    runs: sum of ALL ball runs (including extras),
    wickets: count of isWicket balls,
    balls: count of isLegalDelivery balls,
    maiden: isMaiden,
    detail: [...innings.currentOver],   // snapshot of all balls
  })

Step 4 — Update bowler's completed overs:
  bowler.overs = Math.floor(bowler.balls / 6)
  if (isMaiden): bowler.maidens += 1
  bowler.economy = (bowler.runs / bowler.balls) * 6

Step 5 — Swap strike (end of over):
  temp = innings.batsmen.striker
  innings.batsmen.striker = innings.batsmen.nonStriker
  innings.batsmen.nonStriker = temp

Step 6 — Reset:
  innings.overs += 1
  innings.balls = 0
  innings.currentOver = []
```

### `_processEndOver(state, event)` — explicit end_over event

Called when the scorer sends an `end_over` event. Only calls `_completeOver()` if `currentOver` still has balls (i.e., the over wasn't already auto-completed by the 6th legal delivery).

---

## Innings Transitions

### `_processEndInnings(state, event)`

Called when the innings is explicitly ended (scorer sends `end_innings` event) or auto-triggered.

```
Step 1 — Mark innings complete:
  innings.isComplete = true

Step 2 — Push to completed innings array:
  completedInnings = [...state.innings, innings]

Step 3 — Check if match is over:
  isMatchOver = completedInnings.length >= (state.totalInnings * 2)
  // For T20/ODI: totalInnings=1, so match over after 2 innings total (one per team)
  // For Test: totalInnings=2, so match over after 4 innings total

Step 4a — If match NOT over:
  nextInnings = _createInningsData()
  if (this is the 1st innings):
    nextInnings.target = innings.runs + 1
  return new state with:
    innings: completedInnings,
    currentInnings: state.currentInnings + 1,
    currentInningsData: nextInnings

Step 4b — If match IS over:
  return state with innings archived, match ends
```

---

## Penalty Runs

### `_processPenaltyRun(state, event)`

For rare field violations (fielder touches ball with helmet, deliberate time wasting, etc.).

```
runs = event.payload.runs || 5   // default 5 penalty runs (ICC standard)
innings.runs += runs
innings.extras.penalties += runs
```

Penalty runs are **not** credited to any batter or against any bowler. They go directly to the extras total.

---

## Players Set Event

### `_processPlayersSet(state, event)`

Sets the batting lineup for the start of an innings (or after a wicket when new batsman comes in).

```
payload.battingTeam  → innings.battingTeam
payload.bowlingTeam  → innings.bowlingTeam
payload.striker      → innings.batsmen.striker
payload.nonStriker   → innings.batsmen.nonStriker
payload.bowler       → innings.currentBowler
```

All player IDs are coerced to strings: `.toString()` called on each to ensure consistent dictionary key lookups in `battingCard` and `bowlingCard`.

---

## Strike Rate & Economy Rate

### `_updateStrikeRates(innings)` — called after every delivery and wicket

**Batter Strike Rate**:
```
strikeRate = (card.runs / card.balls) * 100
// Only calculated if card.balls > 0
// Stored as float with 2 decimal places: toFixed(2)
```

**Bowler Economy Rate**:
```
economy = (card.runs / card.balls) * 6
// Treats balls as a fraction of overs (6 balls = 1 over)
// Only calculated if card.balls > 0
// Stored as float with 2 decimal places: toFixed(2)
```

**Note on overs display**: `card.overs` is the count of completed overs (integer). The "X.Y" format shown in the UI (e.g., "4.3") is calculated on-the-fly in the frontend as:
```
overs = Math.floor(totalBalls / 6)
balls = totalBalls % 6
display = `${overs}.${balls}`
```

---

## Innings Completion Logic

### `_checkInningsComplete(state, innings)` — called after every delivery and wicket

Three completion conditions checked in order:

**1. All Out (10 wickets)**:
```
if (innings.wickets >= 10):
  innings.isComplete = true
  return
```

**2. Overs Limit Reached**:
```
if (state.oversPerInnings && innings.overs >= state.oversPerInnings && innings.balls === 0):
  innings.isComplete = true
  return
// innings.balls === 0 ensures the over was fully completed before ending
// The condition is met after _completeOver() resets innings.balls to 0
```

**3. Target Chased (2nd Innings)**:
```
if (innings.target && innings.runs >= innings.target):
  innings.isComplete = true
```

Note: Condition 3 means the match can end mid-over. The engine doesn't wait for the over to finish.

---

## Score Derivation from Events

### `deriveScoreFromEvents(events, format)`

The full replay function used by `ScoringService` to recompute the score from scratch on every API call:

```js
static deriveScoreFromEvents(events, format) {
  let state = this.createInitialState(format);
  for (const event of events) {
    if (!event.isUndone) {
      state = this.processEvent(state, event);
    }
  }
  return state;
}
```

- Events are sorted by `sequence` (ascending) before being passed in.
- `isUndone = true` events are **skipped** entirely — the score rolls back naturally.
- This is called every time a new event is recorded, and every time `GET /scoring/:matchId` is called.

**Performance**: For a 20-over T20 match with ~120–150 legal deliveries plus extras, replay takes <10ms. Not a bottleneck.

---

## Class: ScoringService (Orchestrator)

**File**: `server/src/services/scoring/index.js`

Wraps `CricketScoring` with database access, authorization, Redis pub/sub, and audit logging.

Multi-sport router — maps sport names to their engine:
```js
const ENGINES = {
  cricket: CricketScoring,
  football: FootballScoring,
  basketball: BasketballScoring,
  tennis: TennisScoring,
  badminton: RacketScoring,
  table_tennis: RacketScoring,
  volleyball: VolleyballScoring,
};
```

Cricket uses `deriveScoreFromEvents()`; other sports use `computeScore()`.

---

## recordEvent — Full Flow

### `ScoringService.recordEvent(matchId, eventData, scorerId)`

```
1. Load match from DB (populate team players for commentary)
   └── throw if not found
   └── throw if status !== 'live' | 'paused'
   └── throw if scorerId not in match.scorers[]

2. Get next sequence number:
   lastEvent = Event.findOne({match}).sort({sequence:-1})
   sequence = lastEvent ? lastEvent.sequence + 1 : 1

3. Create and save Event document:
   {
     match, sport, type, team, player,
     payload: eventData.data,
     scorer: scorerId,
     sequence,
     idempotencyKey: eventData.idempotencyKey || generated,
     clientTimestamp: eventData.offlineCreatedAt || null,
   }

4. Replay all non-undone events:
   allEvents = Event.find({match, isUndone: false}).sort({sequence: 1})
   newScore = CricketScoring.deriveScoreFromEvents(allEvents, match.format)

5. Auto-generate commentary (cricket only, delivery or wicket events):
   commentary = ScoringService.generateCommentary(match, event, newScore)
   Match.findByIdAndUpdate: $push commentary, $slice -200  (keep last 200)

6. Update match score snapshot:
   Match.findByIdAndUpdate:
     $set scoreSnapshot: newScore
     $inc scoringVersion: 1

7. Auto match end detection (see below)

8. Publish real-time update via Redis:
   redis.publish(`match:${matchId}:score`, {
     event, score, scoreVersion, commentary,
     animationType,   // 'wicket' | 'six' | 'four' | null
     dismissalType,   // e.g. 'bowled'
   })

9. Return { event, score, scoreVersion }
```

### Idempotency Handling

The `idempotencyKey` field has a **unique database index** on `(match, idempotencyKey)`. If the same key is submitted twice (network retry), MongoDB throws a duplicate key error before the event is processed. The server returns a 409 Conflict response.

---

## undoLastEvent — Full Flow

### `ScoringService.undoLastEvent(matchId, scorerId)`

```
1. Find last non-undone event:
   Event.findOne({match, isUndone: false}).sort({sequence: -1})
   └── throw if no events found

2. Mark as undone:
   lastEvent.isUndone = true
   lastEvent.undoneBy = scorerId
   lastEvent.save()

3. Write AuditLog:
   AuditLog.create({ actor, action: 'score_undo', entity, changes })

4. Replay all remaining non-undone events:
   newScore = CricketScoring.deriveScoreFromEvents(remaining, format)

5. Update match:
   $set scoreSnapshot: newScore
   $inc scoringVersion: 1
   if (undone event was delivery or wicket):
     $pop commentary: 1   // remove the last commentary entry it generated

6. Publish undo update:
   redis.publish(`match:${matchId}:score`, { type: 'undo', score, commentary })

7. Return { undoneEvent, score, commentary }
```

**Undo is always the most recent event**. There is no random-access undo — only a stack pop.

---

## Match Lifecycle

### Pre-match Validation (startMatch)

Before `status` can be set to `'live'`:

| Check | Error Message |
|-------|--------------|
| At least one scorer assigned | "At least one scorer must be assigned before starting" |
| requestingUser is a scorer | "Only an assigned scorer can start the match" |
| Both team names set | "Both teams must be set before starting" |
| **Cricket only**: Toss completed | "Toss must be completed before starting a cricket match" |
| Min players per team | Cricket requires 2 minimum |
| No duplicate match same day | "A match between these teams is already scheduled today" |

On success: `status = 'live'`, `startedAt = new Date()`, initial `scoreSnapshot` set.

### Toss System

**Step 1** — `recordToss(matchId, tossData, userId)`:
```
coinResult = random 'heads' | 'tails'
wonBy = callerChoice === coinResult ? callingTeam : opposite
match.toss = { wonBy, decision: null, coinResult, callingTeam, callerChoice }
```

**Step 2** — `setTossDecision(matchId, 'bat'|'bowl', userId)`:
```
match.toss.decision = decision
```

Both steps can be done in one call if `tossData.decision` is included in Step 1.

### Match Status Flow

```
scheduled → live → completed
              ↕
           paused
```

- Substitutions and scoring only allowed in `live` or `paused`.
- `endMatch()` auto-generates result summary (by runs or by wickets).

### Result Generation (endMatch)

```js
if (2nd innings team chased the target):
  wicketsLeft = 10 - ci.wickets
  result.summary = `${winner} won by ${wicketsLeft} wicket(s)`

else if (1st innings team defended):
  margin = prevInnings.runs - ci.runs
  result.summary = `${winner} won by ${margin} run(s)`
```

### Result Confirmation

`confirmResult()` requires a **team captain** (home or away). Marks `result.confirmed = true`. This is the "handshake" confirming the official result. Only captains can do this — scorers cannot.

### Rematch

`rematch()` clones a completed match into a new `scheduled` match with `scheduledAt = now + 24h`. Same teams, format, venue, and scorers.

---

## Auto Match End Detection

After every `recordEvent()`, the service checks if the match should end automatically:

```js
// 2nd innings: target chased
if (prevInnings && currentInnings.runs > prevInnings.runs) autoEnded = true

// All out
if (currentInnings.wickets >= 10) autoEnded = true

// Overs up in 2nd innings
if (currentInnings.overs >= totalOvers):
  if (currentInnings >= 2 OR (prevInnings exists AND currentInnings.overs >= totalOvers)):
    autoEnded = true

if (autoEnded):
  ScoringService.endMatch(matchId, scorerId)
```

This means scorers don't need to manually call "end match" — it happens automatically on the last ball.

---

## Commentary Generation

### `ScoringService.generateCommentary(match, event, scoreState)`

Called for every `delivery` and `wicket` event. Returns a commentary entry or `null`.

**Player Name Resolution**:
```js
const players = {};
[...home.players, ...away.players].forEach(p => {
  players[p._id.toString()] = p.name || 'Unknown';
});
const batsmanName = players[innings.batsmen?.striker] || 'Batsman';
const bowlerName = players[innings.currentBowler] || 'Bowler';
```

**Commentary text by event type**:

| Event | Condition | Type | Example Text |
|-------|-----------|------|-------------|
| delivery | runs == 0 | normal | "Dot ball." / "Tight bowling, dot." (random from 4 options) |
| delivery | runs == 1 | normal | "Sharma takes a quick single." |
| delivery | runs == 2 | normal | "Sharma pushes for two runs." |
| delivery | runs == 3 | normal | "Good running! Three runs taken by Sharma." |
| delivery | runs == 4 | boundary | "FOUR! Sharma finds the boundary through covers off Bumrah!" |
| delivery | runs == 6 | six | "SIX! Sharma smashes it towards long-on off Bumrah! What a shot!" |
| delivery | wide | extra | "Wide ball!" |
| delivery | no_ball | extra | "No ball! Sharma scores 0 off the free hit." |
| delivery | bye | extra | "Bye! 1 run taken." |
| delivery | leg_bye | extra | "Leg bye! 1 run." |
| wicket | bowled | wicket | "BOWLED! Bumrah knocks over the stumps! Sharma has to walk." |
| wicket | caught | wicket | "CAUGHT! Sharma is out caught by Kohli! Bumrah strikes!" |
| wicket | lbw | wicket | "LBW! Bumrah traps Sharma in front of the wickets!" |
| wicket | run_out | wicket | "RUN OUT! Sharma is caught short of the crease!" |
| wicket | stumped | wicket | "STUMPED! Quick work behind the stumps! Sharma is out!" |
| wicket | other | wicket | "WICKET! Sharma is dismissed!" |

**Over number format**: `"${Math.floor(innings.totalBalls / 6)}.${innings.totalBalls % 6}"`

**Commentary is stored** with `$push { $each: [entry], $slice: -200 }` — MongoDB keeps the last 200 entries automatically.

---

## Real-Time Publishing

### Redis Channel

Every event publishes to: `match:{matchId}:score`

**Payload structure**:
```json
{
  "event": { "...full event object..." },
  "score": { "...full scoreSnapshot..." },
  "scoreVersion": 42,
  "commentary": [ "...last 200 entries..." ],
  "animationType": "six",
  "dismissalType": null
}
```

### Animation Type Logic

```
Wicket event              → animationType = 'wicket', dismissalType = wicketType
Delivery, runs == 6       → animationType = 'six'
Delivery, runs == 4       → animationType = 'four'
No-ball delivery, runs == 6 → animationType = 'six'
No-ball delivery, runs == 4 → animationType = 'four'
Everything else           → animationType = null
```

### Undo Publish

```json
{
  "type": "undo",
  "score": { "...updated score..." },
  "commentary": [ "...updated commentary (last entry removed)..." ]
}
```

### Match Status Channel

`match:{matchId}:status` is published when:
- Match starts: `{ status: 'live', startedAt }`
- Match ends: `{ status: 'completed', completedAt, finalScore, result }`

---

## Edge Cases & Rules

### No-ball Wickets

Only **run-out** is valid on a no-ball. All other dismissal types (bowled, caught, lbw, stumped) on a no-ball are invalid under ICC rules.

The engine enforces this by:
1. The 1 no-ball penalty run is always added (`extras.noBalls += 1`)
2. The batter faces the ball (`batter.balls += 1`)
3. The wicket (`innings.wickets += 1`) is still recorded if the scorer submits a wicket event — the UI layer must enforce the no-ball-only-run-out rule

### Wide Deliveries

- 1 penalty run always added.
- Ball is not legal — does NOT advance toward over completion.
- Batter does NOT face the ball (`batter.balls` unchanged).
- Strike does NOT rotate.
- If batter runs additional runs on a wide, `extraRuns` captures those.

### Maiden Over Calculation

```
isMaiden = (overRuns === 0) && (at least one legal delivery existed)
```

`overRuns` is calculated from **legal deliveries only**:
```js
const overRuns = innings.currentOver
  .filter(b => b.isLegalDelivery)
  .reduce((sum, b) => sum + b.runs, 0);
```

Wides and no-balls are not legal deliveries, so their penalty runs do NOT disqualify a maiden. A bowler can give 3 wides in an over and still be credited a maiden if 0 runs came off the 6 legal balls.

### Target Chased Mid-Over

The innings is marked `isComplete = true` the moment `innings.runs >= innings.target`. The match ends even if there are balls remaining in the current over.

### Strike Rotation Override

`payload.strikerSwap = true` suppresses the automatic odd-run strike rotation. Used by the scorer UI when they've manually confirmed the batsmen did not cross (e.g., batsman called for a run but turned back).

### Seed Data / Missing players_set Events

If a delivery arrives with `event.player` set but `innings.batsmen.striker` is unset (or different), `_processDelivery` auto-corrects the striker. This handles legacy data or events replayed without a prior `players_set`.

---

## Complete Data Structures Reference

### Event Document (MongoDB)

```js
{
  _id: ObjectId,
  match: ObjectId,               // ref Match
  sport: 'cricket',
  type: 'delivery|wicket|end_over|end_innings|players_set|penalty_run',
  team: 'home|away',
  player: ObjectId,              // primary player (striker for delivery)
  secondaryPlayer: ObjectId,     // fielder or 2nd batter
  payload: {
    runs: Number,                // 0–6
    isExtra: Boolean,
    extraType: String,           // 'wide'|'no_ball'|'bye'|'leg_bye'
    extraRuns: Number,
    wicketType: String,          // 'bowled'|'caught'|'lbw'|'run_out'|'stumped'|'hit_wicket'
    bowler: ObjectId,
    fielder: ObjectId,
    strikerSwap: Boolean,
    shotArea: String,            // optional, used in commentary ('covers', 'long-on')
    battingTeam: String,         // for players_set
    bowlingTeam: String,         // for players_set
    striker: ObjectId,           // for players_set
    nonStriker: ObjectId,        // for players_set
  },
  scorer: ObjectId,              // ref User
  sequence: Number,              // monotonically increasing per match
  idempotencyKey: String,        // unique per (match, key)
  clientTimestamp: Date,         // optional, for offline sync ordering
  isUndone: Boolean,             // default false
  undoneBy: ObjectId,            // ref User who undid it
  createdAt: Date,
}
```

### battingCard Entry

```js
{
  runs: 0,
  balls: 0,
  fours: 0,
  sixes: 0,
  strikeRate: 0.00,     // (runs/balls)*100, 2dp float
  out: Boolean,         // set on dismissal (not stored in engine, derived in UI)
  outDesc: String,      // e.g. "c Smith b Jones" (derived in UI)
}
```

### bowlingCard Entry

```js
{
  overs: 0,             // completed overs integer
  balls: 0,             // total balls bowled (including in current over)
  runs: 0,              // runs conceded (excl. byes/leg-byes)
  wickets: 0,
  maidens: 0,
  economy: 0.00,        // (runs/balls)*6, 2dp float
  wides: 0,             // count of wide balls
  noBalls: 0,           // count of no balls
}
```

### overHistory Entry

```js
{
  bowler: String,        // player ID
  runs: Number,          // ALL runs in the over (bat + extras)
  wickets: Number,
  balls: Number,         // legal deliveries only
  maiden: Boolean,
  detail: [              // ball-by-ball array
    {
      runs: Number,
      isExtra: Boolean,
      extraType: String,
      isLegalDelivery: Boolean,
      isWicket: Boolean,
      wicketType: String,
    }
  ]
}
```

### Fall of Wicket Entry

```js
{
  wicket: Number,        // 1st, 2nd... 10th wicket
  runs: Number,          // innings total at dismissal
  overs: String,         // "12.3" format
  batter: String,        // player ID
  howOut: String,        // wicket type
  bowler: String,        // player ID (null for run-out)
  fielder: String,       // player ID (catch/stumping/run-out)
}
```

### Commentary Entry

```js
{
  over: String,          // "12.3"
  text: String,          // human-readable description
  type: String,          // 'boundary'|'six'|'wicket'|'extra'|'milestone'|'normal'|'info'
  timestamp: Date,
  eventId: ObjectId,     // linked Event (removed on undo)
}
```

---

*Generated: 2026-04-25 | File: server/src/services/scoring/cricket.scoring.js + index.js*
