# Cricket Features — Jeuo App

## Table of Contents

1. [Overview](#overview)
2. [Scoring Engine](#scoring-engine)
3. [Event System](#event-system)
4. [Innings Management](#innings-management)
5. [Batting](#batting)
6. [Bowling](#bowling)
7. [Extras](#extras)
8. [Wickets & Dismissals](#wickets--dismissals)
9. [Over Management](#over-management)
10. [Match Completion & Results](#match-completion--results)
11. [Overthrow Handling](#overthrow-handling)
12. [Toss System](#toss-system)
13. [Commentary](#commentary)
14. [Real-Time Updates](#real-time-updates)
15. [Tournament System](#tournament-system)
16. [Frontend UI Tabs](#frontend-ui-tabs)
17. [API Reference](#api-reference)
18. [Data Structures](#data-structures)

---

## Overview

Jeuo implements a full ICC-compliant cricket scoring system supporting:

- **Formats**: T20, ODI, Test, and custom over/innings configurations
- **Match types**: Standalone matches and tournament fixtures
- **Live scoring**: Real-time ball-by-ball updates via WebSocket (Socket.io) + Redis pub/sub
- **Full statistics**: Batting cards, bowling cards, fall of wickets, over history, extras breakdown
- **Commentary**: Auto-generated live text commentary per delivery
- **Undo**: Any event can be undone with full score recomputation
- **Tournaments**: Round-robin, single/double elimination, group knockout, league formats

---

## Scoring Engine

### Architecture

The scoring engine is **event-sourced** — every ball, wicket, and over is stored as an immutable `Event` record. The current score is always computed by **replaying all events** in sequence. This means:

- Any event can be undone by marking it `isUndone = true` and replaying
- Full audit trail of every action
- Score is always consistent and reproducible

**File**: `server/src/services/scoring/cricket.scoring.js`

### Score State

The top-level score object (`scoreSnapshot`) contains:

```
{
  innings[],              // Array of completed innings objects
  currentInnings,         // Index of active innings (0-based)
  totalInnings,           // Total innings per team (1 for T20/ODI, 2 for Test)
  oversPerInnings,        // Over limit (20, 50, or null for Test)
  currentInningsData,     // Active innings object (see Innings Data below)
}
```

---

## Event System

### Event Types

Every scoring action creates an `Event` record in the database:

| Type | Description |
|------|-------------|
| `players_set` | Initialize batting/bowling teams, set striker, non-striker, bowler |
| `delivery` | A ball bowled (runs, extras, wide, no-ball, bye, leg-bye) |
| `wicket` | A batter dismissed |
| `end_over` | Over completed (6 legal deliveries) |
| `end_innings` | Innings closed (all out / overs done / target chased) |
| `penalty_run` | 5-run penalty for field violations |

### Event Payload

```
{
  match,           // Match ID
  scorer,          // User ID of scorer
  sequence,        // Ordered delivery number
  type,            // Event type (above)
  team,            // 'home' | 'away'
  player,          // Primary player (batter for delivery/wicket, bowler for end_over)
  secondaryPlayer, // Fielder, or second batter for run-out
  payload: {
    runs,          // Runs scored (0–6)
    isExtra,       // Boolean
    extraType,     // 'wide' | 'no_ball' | 'bye' | 'leg_bye'
    extraRuns,     // Penalty runs for wide/no-ball (usually 1)
    wicketType,    // 'bowled' | 'caught' | 'lbw' | 'run_out' | 'stumped' | 'hit_wicket'
    bowler,        // Bowler ID (for deliveries)
    fielder,       // Fielder ID (for catches/stumpings/run-outs)
    strikerSwap,   // Boolean — whether batsmen crossed
  }
}
```

### Idempotency

Each event carries a unique `idempotencyKey` (client-generated timestamp + user ID). If the same key is submitted twice (network retry), the server ignores the duplicate. This prevents double-counting on unstable connections.

### Rate Limiting

Scoring endpoints are rate-limited to **300 events per 60 seconds** per user to prevent accidental rapid-fire submissions.

---

## Innings Management

### Innings Object Structure

```
{
  battingTeam,         // 'home' | 'away'
  bowlingTeam,         // Opposite
  runs,                // Total runs
  wickets,             // Wickets fallen
  overs,               // Completed overs count
  balls,               // Legal deliveries in current over (0–5)
  totalBalls,          // All legal deliveries bowled this innings
  extras: {
    wides, noBalls, byes, legByes, penalties
  },
  batsmen: {
    striker,           // Player ID
    nonStriker,        // Player ID
  },
  currentBowler,       // Player ID
  battingCard,         // { playerId: { runs, balls, fours, sixes, out, outDesc } }
  bowlingCard,         // { playerId: { overs, maidens, runs, wickets, balls } }
  overHistory[],       // Completed overs: { bowler, runs, wickets, balls, maiden, detail[] }
  currentOver[],       // Ball objects for in-progress over
  fow[],               // Fall of wickets
  target,              // Set for 2nd innings (1st innings runs + 1)
  isComplete,          // Boolean
}
```

### Innings Transitions

1. **1st Innings**: Started when `players_set` event is recorded. Batting team, bowling team, striker, non-striker, and bowler are all set.
2. **End of 1st Innings**: Triggered by `end_innings` event. Completed innings is pushed to `score.innings[]`. A new `currentInningsData` is created for the 2nd innings, with `target` set to `(1st innings runs + 1)`.
3. **End of 2nd Innings**: Match is automatically completed. Winner determined.

### Formats

| Format | Overs | Innings per Team |
|--------|-------|-----------------|
| T20 | 20 | 1 |
| ODI | 50 | 1 |
| Test | Unlimited | 2 |
| Custom | Configurable | Configurable |

---

## Batting

### Batting Card

For each batter who has faced a delivery, `battingCard[playerId]` tracks:

| Field | Description |
|-------|-------------|
| `runs` | Runs scored |
| `balls` | Legal deliveries faced |
| `fours` | Number of boundaries (4s) |
| `sixes` | Number of sixes (6s) |
| `out` | Boolean — dismissed |
| `outDesc` | Dismissal text (e.g., "c Smith b Jones") |
| `strikeRate` | `(runs / balls) × 100` |

### Strike Rotation

Batsmen swap ends (striker ↔ non-striker) when:
- Odd number of runs are scored on a delivery (1, 3, 5)
- At the **end of every over** (automatic swap regardless of runs on the last ball)

Wides and no-balls do **not** rotate the strike.

### Current Striker

The active striker is tracked in `innings.batsmen.striker`. In the UI, the current striker is marked with an asterisk `*` in the batting table.

---

## Bowling

### Bowling Card

For each bowler who has bowled, `bowlingCard[playerId]` tracks:

| Field | Description |
|-------|-------------|
| `overs` | Complete overs bowled |
| `balls` | Deliveries in the current over (for this bowler) |
| `runs` | Runs conceded (excluding byes and leg-byes) |
| `wickets` | Wickets taken |
| `maidens` | Maiden overs bowled |
| `economy` | `runs / overs` (decimal overs) |

### Bowler Crediting Rules

- **Bowled**: Bowler gets wicket
- **Caught**: Bowler gets wicket
- **LBW**: Bowler gets wicket
- **Stumped**: Bowler gets wicket
- **Hit Wicket**: Bowler gets wicket
- **Run Out**: Bowler does **NOT** get wicket
- **Byes / Leg-byes**: Runs are NOT added to bowler's runs conceded

### Economy Rate

Economy = total runs conceded / total overs bowled (decimal).

Example: 24 runs in 4 overs = 6.00 economy. Overs are stored in decimal format where 4.3 = 4 overs and 3 balls = 27 balls total.

---

## Extras

Extras are tracked separately from batting runs and stored in `innings.extras`:

| Type | Description | Counts toward over? | Counts against bowler? |
|------|-------------|---------------------|------------------------|
| **Wide** | Ball outside batter's reach | No | Yes (penalty run added) |
| **No Ball** | Bowler oversteps crease | No | Yes (penalty run + any runs) |
| **Bye** | Runs scored off body / ground with no bat contact | Yes | No |
| **Leg Bye** | Runs off pads while attempting to play shot | Yes | No |
| **Penalty** | 5-run field violation penalty | No | No |

**Wide and No-ball**: Add 1 penalty run automatically. Ball is not counted toward the 6-ball over — the batter faces another delivery.

**Byes and Leg-byes**: Are legal deliveries (count toward the over). Runs credited to extras, not the batter or bowler.

---

## Wickets & Dismissals

### Dismissal Types

| Type | Bowler Credit | Description |
|------|--------------|-------------|
| `bowled` | Yes | Ball hits the stumps directly |
| `caught` | Yes | Fielder catches ball before it bounces |
| `lbw` | Yes | Ball would have hit stumps but hit pad |
| `stumped` | Yes | Wicket-keeper breaks stumps with batter out of crease |
| `hit_wicket` | Yes | Batter knocks own stumps off |
| `run_out` | No | Batter fails to make crease; fielder breaks stumps |
| `retired` | No | Batter voluntarily retires |
| `timed_out` | No | Batter fails to take position within time limit |

### Fall of Wickets (FOW)

Each wicket dismissal is recorded in `innings.fow[]`:

```
{
  wicket,    // Wicket number (1–10)
  runs,      // Innings total at the time of dismissal
  overs,     // "X.Y" format
  batter,    // Dismissed batter's player ID
  howOut,    // Dismissal type
  bowler,    // Bowler's player ID (null for run-out)
  fielder,   // Fielder's player ID (for catch/stumping/run-out)
}
```

### No-ball Wickets

A batter CAN be dismissed on a no-ball via **run-out** only. All other dismissal types on a no-ball are invalid — the delivery stands as a no-ball and the wicket is not counted.

---

## Over Management

### Ball-by-Ball Objects

Each delivery is stored as an object in `currentOver[]` and `overHistory[over].detail[]`:

```
{
  runs,              // Runs scored (0–6)
  isExtra,           // Boolean
  extraType,         // 'wide' | 'no_ball' | 'bye' | 'leg_bye' | null
  isLegalDelivery,   // Boolean (false for wide/no-ball)
  isWicket,          // Boolean
  wicketType,        // Dismissal type or null
}
```

### Over Completion

An over is complete when **6 legal deliveries** have been bowled (wides and no-balls don't count). On completion:

1. `overHistory[]` is updated with a summary: `{ bowler, runs, wickets, balls, maiden, detail[] }`
2. **Maiden over** detection: 0 runs off legal deliveries (extras do not count as runs off bat for maiden purposes)
3. `currentOver[]` is reset to `[]`
4. Batsmen automatically swap ends
5. Bowler's overs count increments

### Over History Display

The Overs tab shows each over with:
- Over number
- Bowler name
- Runs conceded, wickets taken
- Cumulative score at end of over
- Ball-by-ball detail row with color-coded circles

---

## Match Completion & Results

### Automatic End Conditions

The scoring engine automatically ends the innings (and match) when:

1. **All out**: 10 wickets have fallen
2. **Overs done**: Reached `oversPerInnings` limit with 0 balls pending
3. **Target chased** (2nd innings): Batting team's runs ≥ target

### Result Calculation

Results are determined by `determineResult(match)`:

| Scenario | Result Description |
|----------|-------------------|
| 1st innings team wins | "Team A won by X runs" |
| 2nd innings team wins | "Team B won by X wickets" (10 − wickets fallen) |
| Both innings equal | "Match tied" |
| Abandoned | "Match abandoned" |

### Result Confirmation

After the match ends automatically, an admin/scorer can call `POST /scoring/:matchId/confirm-result` to officially confirm the result. The match can also have a **Player of the Match** set at this point.

---

## Overthrow Handling

**File**: `client/src/components/scoring/CricketOverthrowHandler.jsx`

Overthrows occur when a fielder's throw goes to the boundary or past other fielders, giving extra runs.

### ICC Overthrow Rule

If the ball reaches the boundary on an overthrow, the batting team scores **4 runs** for the boundary plus the runs the batters ran before the throw.

### Overthrow Types

| Type | Description | Credited to Batter? |
|------|-------------|---------------------|
| `normal` | Overthrow runs added to delivery | Yes |
| `boundary` | Overthrow goes to boundary (auto 4 runs) | Yes |
| `bye` | Overthrow is a bye (no bat contact) | No |

### Overthrow Attribution

The scorer can credit the runs to:
- **Striker** (most common)
- **Non-striker** (if they crossed and threw would have been to striker's end)

The fielder who threw can also be recorded (optional).

**Important**: Overthrow runs do **not** create a new ball event — they are additional runs credited to the same delivery.

---

## Toss System

Before a cricket match can start, the toss must be completed:

1. `POST /scoring/:matchId/toss` — Record which team won the toss
   - Payload: `{ wonBy: 'home'|'away', coinResult: 'heads'|'tails', callingTeam: 'home'|'away' }`
2. `POST /scoring/:matchId/toss-decision` — Record the winning team's decision
   - Payload: `{ decision: 'bat'|'bowl' }`

The toss result is shown in the **Summary tab** as: _"Thunder Strikers won the toss and elected to bat"_.

---

## Commentary

### Auto-Generated Commentary

The server auto-generates commentary text for every delivery and wicket. Commentary is stored in `match.commentary[]` (last 200 entries) and returned with every score update.

### Commentary Entry Structure

```
{
  over,       // "X.Y" format (e.g., "3.4")
  text,       // Human-readable commentary text
  type,       // 'boundary' | 'six' | 'wicket' | 'extra' | 'milestone' | 'normal' | 'info'
  timestamp,  // ISO date
  eventId,    // Linked Event ID (removed when event is undone)
}
```

### Commentary Types & Colors

| Type | Badge | Color | Example |
|------|-------|-------|---------|
| `boundary` | `4` | Blue | "FOUR! Sharma drives through covers" |
| `six` | `6` | Purple | "SIX! Over long-on" |
| `wicket` | `W` | Red | "WICKET! Bowled for 45" |
| `extra` | `EXTRA` | Amber | "Wide ball, 1 run added" |
| `milestone` | `★` | Emerald | "FIFTY! Sharma reaches 50" |
| `info` | `ℹ` | Indigo | "Over 12 complete" |
| `normal` | — | Gray | "Pushed to mid-on, 1 run" |

### Commentary & Undo

When an event is undone, its corresponding commentary entry is removed from `match.commentary[]`. The UI updates live via socket.

---

## Real-Time Updates

### Socket.io Events

**Client subscribes to**: `match:${matchId}` room

**Server emits on every scoring event**:
```
channel: 'score:update'
payload: {
  score,           // Full updated score state
  commentary,      // Full commentary array (last 200)
  event,           // The event that just happened
  scoreVersion,    // Incremented version number
  animationType,   // 'wicket' | 'six' | 'four' | null (triggers UI animation)
  dismissalType,   // Wicket type for animation (e.g., 'bowled', 'caught')
}
```

### Animation Types

When `animationType` is received, the UI shows a full-screen animation:
- `wicket` — Red dismissal overlay with wicket type
- `six` — Purple six animation
- `four` — Blue boundary animation

### Score Versioning

`scoreVersion` is an integer that increments with every event. The client compares versions to detect missed updates and can re-fetch if needed.

---

## Tournament System

### Tournament Formats

| Format | Description |
|--------|-------------|
| `round_robin` | Every team plays every other team |
| `single_elimination` | Straight knockout |
| `double_elimination` | Two-loss elimination |
| `group_knockout` | Group stage → knockout rounds |
| `league` | Points-based league table |

### Tournament Lifecycle

```
draft → registration_open → registration_closed → in_progress → completed
```

### Team Registration

Two flows are supported:

1. **Direct Registration**: Team is immediately added to the tournament. Used when the organizer adds teams manually.
2. **Request Flow**: Team submits a join request. Tournament admin reviews and approves/rejects via:
   - `POST /tournaments/:id/team-requests/:index/approve`
   - `POST /tournaments/:id/team-requests/:index/reject`

### Points Table

Each team entry in `tournament.pointsTable[]`:

```
{
  teamName,
  played,
  won,
  lost,
  drawn,
  points,
  netRunRate,   // NRR — cricket-only tiebreaker
}
```

**Points**: Win = 4 pts, Tie/Draw = 2 pts, Loss = 0 pts

### Net Run Rate (NRR)

NRR is the primary tiebreaker for equal-points teams in cricket tournaments.

```
NRR = (Total Runs Scored / Overs Faced) − (Total Runs Conceded / Overs Bowled)
```

- Positive NRR means scoring faster than conceding
- Displayed with a ▲ (green) or ▼ (red) arrow in the Points Table

### Fixture Generation

`POST /tournaments/:id/fixtures` generates all match fixtures for the chosen format:
- Round-robin: Generates `n*(n-1)/2` matches
- Single elimination: Seeded bracket
- Group + Knockout: Group fixtures then knockout bracket based on group standings

---

## Frontend UI Tabs

The match detail page (`/matches/:id`) shows sport-specific tabs.

### Tab List (Cricket)

| Tab | Key | Description |
|-----|-----|-------------|
| Summary | `summary` | Toss, result, top performers, match info |
| Scorecard | `scorecard` | Full innings batting + bowling tables |
| Commentary | `commentary` | Live ball-by-ball commentary feed |
| Stats | `stats` | FOW, extras breakdown, scoring analysis |
| Overs | `overs` | Over-by-over table with ball detail |
| Table | `table` | Tournament standings (only if match has a tournament) |
| Teams | `teams` | Team rosters |

### Summary Tab

**File**: `client/src/components/match/MatchSummaryTab.jsx`

- **Result Banner**: Highlighted result with winner and margin
- **Toss Info**: Which team won the toss and decision (bat/bowl)
- **Top Performers**:
  - Best Batsman: Highest run scorer across all innings (name, runs, balls)
  - Best Bowler: Most wickets (tiebreak: lowest economy) (name, wickets/runs, overs)
- **Match Info Card**: Format, venue, date, start time, status

### Scorecard Tab

**File**: `client/src/components/scoring/CricketScoreboard.jsx`

Shows a live score hero + full batting/bowling tables for all innings:

- **Score Hero**: Large animated runs/wickets/overs display
- **Target Display** (2nd innings): "Target: X · Need Y more" or "Won!"
- **CRR**: Current Run Rate = `(runs / totalBalls) × 6`
- **This Over**: Color-coded ball circles for the current over in progress
- **Batting Table**: Name, runs, balls, 4s, 6s, SR — striker marked with `*`
- **Extras Row**: Wides, no-balls, byes, leg-byes breakdown
- **Total Row**: Final score `runs/wickets (overs.balls ov)`
- **Bowling Table**: Name, O, M, R, W, ER — current bowler marked with `*`
- **Fall of Wickets**: `runs/wicket (overs ov, batter)` format

### Commentary Tab

**File**: `client/src/components/match/CommentaryTab.jsx`

- Latest commentary shown first (reverse chronological)
- Color-coded rows: wickets (red), sixes (purple), fours (blue), extras (amber), milestones (emerald)
- Each row: over number · colored dot · optional badge · commentary text
- Live updates via socket

### Stats Tab

**File**: `client/src/components/match/CricketStatsTab.jsx`

Per innings:

- **Fall of Wickets Table**: Numbered wickets with batter name, dismissal description, score/over at fall
- **Extras Breakdown**: 6-cell grid (Wides, No Balls, Byes, Leg Byes, Penalties, Total)
- **Scoring Breakdown**: Fours (count + runs), Sixes (count + runs), Dot Balls, Boundary%

Boundary% = boundary runs / total innings runs × 100

### Overs Tab

**File**: `client/src/components/match/CricketOversTab.jsx`

Per innings over-by-over table:

- Columns: Over, Bowler, Runs, Wkt, Cumulative Score
- Maiden overs highlighted in green
- Expandable ball-by-ball detail row under each over
- Horizontally scrollable on small screens

### Table Tab

**File**: `client/src/components/match/TournamentTableTab.jsx`

- Fetches live standings from `/tournaments/:id/standings`
- Columns: Rank, Team, P, W, L, D, Pts
- Top 3 highlighted with gold/silver/bronze medal colors
- Link to full tournament page

---

## API Reference

### Scoring Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/scoring/:matchId` | Get full score state |
| `GET` | `/scoring/:matchId/events` | Get event timeline |
| `GET` | `/scoring/:matchId/commentary` | Get commentary array |
| `POST` | `/scoring/:matchId/events` | Record a scoring event |
| `POST` | `/scoring/:matchId/undo` | Undo last event |
| `POST` | `/scoring/:matchId/start` | Start the match |
| `POST` | `/scoring/:matchId/end` | End the match |
| `POST` | `/scoring/:matchId/toss` | Record toss result |
| `POST` | `/scoring/:matchId/toss-decision` | Record batting/bowling decision |
| `POST` | `/scoring/:matchId/players` | Set batting team, bowler, striker |
| `POST` | `/scoring/:matchId/scorer` | Add a scorer |
| `DELETE` | `/scoring/:matchId/scorer/:scorerId` | Remove a scorer |
| `POST` | `/scoring/:matchId/confirm-result` | Confirm match result |
| `POST` | `/scoring/:matchId/rematch` | Create a rematch |

### Match Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/matches/live` | All live matches |
| `GET` | `/matches/my` | User's matches (scorer or player) |
| `GET` | `/matches?sport=cricket&status=completed` | Filtered list |
| `GET` | `/matches/:id` | Full match detail with commentary |

### Tournament Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/tournaments?sport=cricket` | Search tournaments |
| `POST` | `/tournaments` | Create tournament |
| `GET` | `/tournaments/:id` | Tournament detail |
| `GET` | `/tournaments/:id/standings` | Points table with NRR |
| `GET` | `/tournaments/:id/fixtures` | Match fixtures |
| `POST` | `/tournaments/:id/register` | Register a team |
| `POST` | `/tournaments/:id/team-request` | Request to join |
| `POST` | `/tournaments/:id/team-requests/:i/approve` | Approve request |
| `POST` | `/tournaments/:id/team-requests/:i/reject` | Reject request |
| `POST` | `/tournaments/:id/fixtures` | Generate fixture schedule |

---

## Data Structures

### Ball Object (in currentOver[] and overHistory[].detail[])

```json
{
  "runs": 1,
  "isExtra": false,
  "extraType": null,
  "isLegalDelivery": true,
  "isWicket": false,
  "wicketType": null
}
```

### Wicket Event Payload

```json
{
  "type": "wicket",
  "team": "home",
  "player": "<batterId>",
  "payload": {
    "wicketType": "caught",
    "bowler": "<bowlerId>",
    "fielder": "<fielderId>",
    "runs": 0
  }
}
```

### Commentary Entry

```json
{
  "over": "12.3",
  "text": "FOUR! Driven through extra cover",
  "type": "boundary",
  "timestamp": "2025-04-25T10:30:00Z",
  "eventId": "<eventId>"
}
```

### Tournament Standings Row

```json
{
  "name": "Thunder Strikers",
  "played": 4,
  "won": 3,
  "lost": 1,
  "drawn": 0,
  "points": 12,
  "netRunRate": 0.642
}
```

---


