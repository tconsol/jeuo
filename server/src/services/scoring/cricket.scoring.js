/**
 * CRICKET SCORING ENGINE
 *
 * Implements real-world cricket scoring based on ICC Laws of Cricket (MCC 2017 code).
 *
 * Key rules implemented:
 * - Ball-by-ball scoring with run values: 0, 1, 2, 3, 4 (boundary), 6 (over boundary)
 * - Extras: Wide (1 + any runs, does NOT count as legal delivery),
 *   No-ball (1 + any runs, does NOT count as legal delivery),
 *   Bye (runs off body, counts as legal delivery),
 *   Leg-bye (runs off pads while playing shot, counts as legal delivery)
 * - Over = 6 legal deliveries. Wides and no-balls are re-bowled.
 * - Wickets: bowled, caught, lbw, run_out, stumped, hit_wicket, retired, etc.
 * - Run out can happen on no-ball (batter on strike cannot be out bowled/lbw/caught/stumped on no-ball,
 *   but CAN be run out, stumped off no-ball, or hit wicket)
 * - Strike rotation: batsmen swap ends on odd runs, at end of over
 * - Strike Rate = (runs / balls faced) × 100
 * - Economy Rate = runs conceded / overs bowled (overs as decimal: 4.3 = 4 overs 3 balls = 27 balls)
 * - Net Run Rate = (total runs scored / overs faced) - (total runs conceded / overs bowled)
 * - Maiden over: over with 0 runs conceded (extras don't count as runs off the bat)
 */

class CricketScoring {
  static createInitialState(format) {
    return {
      innings: [],
      currentInnings: 0,
      totalInnings: format.innings || 2,
      oversPerInnings: format.overs || null, // null = unlimited (Test)
      currentInningsData: this._createInningsData(),
    };
  }

  static _createInningsData() {
    return {
      battingTeam: null,
      bowlingTeam: null,
      runs: 0,
      wickets: 0,
      overs: 0,
      balls: 0, // legal deliveries in current over
      totalBalls: 0,
      extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0, penalties: 0 },
      batsmen: {
        striker: null,
        nonStriker: null,
      },
      currentBowler: null,
      partnerships: [],
      overHistory: [],     // [{bowler, runs, wickets, balls, maiden}]
      currentOver: [],     // ball-by-ball for current over
      fow: [],             // fall of wickets [{wicket, runs, overs, batter}]
      battingCard: {},      // {playerId: {runs, balls, fours, sixes, strikeRate}}
      bowlingCard: {},      // {playerId: {overs, maidens, runs, wickets, economy, balls, wides, noBalls}}
      isComplete: false,
      target: null,         // set for 2nd innings
    };
  }

  /**
   * Process a delivery event and return updated state
   */
  static processEvent(state, event) {
    const innings = state.currentInningsData;
    const payload = event.payload;

    if (innings.isComplete) {
      throw new Error('Innings is already complete');
    }

    switch (event.type) {
      case 'delivery':
        return this._processDelivery(state, event);
      case 'wicket':
        return this._processWicket(state, event);
      case 'end_over':
        return this._processEndOver(state, event);
      case 'end_innings':
        return this._processEndInnings(state, event);
      case 'penalty_run':
        return this._processPenaltyRun(state, event);
      default:
        return state;
    }
  }

  static _processDelivery(state, event) {
    const innings = { ...state.currentInningsData };
    const p = event.payload;
    const isExtra = p.isExtra || false;
    const extraType = p.extraType;
    const runs = p.runs || 0;
    const extraRuns = p.extraRuns || 0;

    let totalRuns = 0;
    let isLegalDelivery = true;

    // Initialize batting card for striker
    const strikerId = innings.batsmen.striker;
    if (strikerId && !innings.battingCard[strikerId]) {
      innings.battingCard[strikerId] = { runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 };
    }

    // Initialize bowling card for bowler
    const bowlerId = innings.currentBowler;
    if (bowlerId && !innings.bowlingCard[bowlerId]) {
      innings.bowlingCard[bowlerId] = { overs: 0, maidens: 0, runs: 0, wickets: 0, economy: 0, balls: 0, wides: 0, noBalls: 0 };
    }

    if (isExtra) {
      switch (extraType) {
        case 'wide':
          // Wide: 1 penalty + any additional runs. Not a legal delivery.
          totalRuns = 1 + extraRuns;
          innings.extras.wides += totalRuns;
          isLegalDelivery = false;
          if (bowlerId) {
            innings.bowlingCard[bowlerId].runs += totalRuns;
            innings.bowlingCard[bowlerId].wides += 1;
          }
          break;

        case 'no_ball':
          // No-ball: 1 penalty + runs scored by batsman + any extra runs
          totalRuns = 1 + runs + extraRuns;
          innings.extras.noBalls += 1 + extraRuns;
          isLegalDelivery = false;
          // Runs scored off bat on no-ball credited to batsman
          if (strikerId && runs > 0) {
            innings.battingCard[strikerId].runs += runs;
            if (runs === 4) innings.battingCard[strikerId].fours += 1;
            if (runs === 6) innings.battingCard[strikerId].sixes += 1;
          }
          if (bowlerId) {
            innings.bowlingCard[bowlerId].runs += totalRuns;
            innings.bowlingCard[bowlerId].noBalls += 1;
          }
          // Batsman faces the ball on no-ball
          if (strikerId) innings.battingCard[strikerId].balls += 1;
          break;

        case 'bye':
          // Bye: runs scored, credited to extras, legal delivery
          totalRuns = runs || extraRuns;
          innings.extras.byes += totalRuns;
          isLegalDelivery = true;
          if (strikerId) innings.battingCard[strikerId].balls += 1;
          if (bowlerId) {
            innings.bowlingCard[bowlerId].balls += 1;
            // Byes don't count against bowler's figures
          }
          break;

        case 'leg_bye':
          // Leg bye: runs scored off pads, credited to extras, legal delivery
          totalRuns = runs || extraRuns;
          innings.extras.legByes += totalRuns;
          isLegalDelivery = true;
          if (strikerId) innings.battingCard[strikerId].balls += 1;
          if (bowlerId) {
            innings.bowlingCard[bowlerId].balls += 1;
            // Leg byes don't count against bowler's figures
          }
          break;
      }
    } else {
      // Normal delivery
      totalRuns = runs;
      if (strikerId) {
        innings.battingCard[strikerId].runs += runs;
        innings.battingCard[strikerId].balls += 1;
        if (runs === 4) innings.battingCard[strikerId].fours += 1;
        if (runs === 6) innings.battingCard[strikerId].sixes += 1;
      }
      if (bowlerId) {
        innings.bowlingCard[bowlerId].runs += runs;
        innings.bowlingCard[bowlerId].balls += 1;
      }
    }

    // Update innings totals
    innings.runs += totalRuns;

    if (isLegalDelivery) {
      innings.balls += 1;
      innings.totalBalls += 1;
    }

    // Add to current over history
    innings.currentOver.push({
      runs: totalRuns,
      isExtra,
      extraType,
      isLegalDelivery,
      isWicket: false,
    });

    // Strike rotation: batsmen swap on odd runs
    if (totalRuns % 2 !== 0 && !p.strikerSwap) {
      const temp = innings.batsmen.striker;
      innings.batsmen.striker = innings.batsmen.nonStriker;
      innings.batsmen.nonStriker = temp;
    }

    // Update strike rates
    this._updateStrikeRates(innings);

    // Check if over is complete (6 legal deliveries)
    if (innings.balls >= 6) {
      this._completeOver(innings);
    }

    // Check if innings is complete
    this._checkInningsComplete(state, innings);

    return { ...state, currentInningsData: innings };
  }

  static _processWicket(state, event) {
    const innings = { ...state.currentInningsData };
    const p = event.payload;

    // A wicket is essentially a delivery that also dismisses a batter
    // First process any runs
    const runs = p.runs || 0;
    innings.runs += runs;

    const isLegalDelivery = !p.isExtra || (p.extraType !== 'wide' && p.extraType !== 'no_ball');

    // Handle extras on wicket ball
    if (p.isExtra) {
      if (p.extraType === 'no_ball') {
        // On no-ball, only run-out is possible
        innings.extras.noBalls += 1;
        innings.runs += 1;
      }
    }

    if (isLegalDelivery) {
      innings.balls += 1;
      innings.totalBalls += 1;
    }

    const strikerId = innings.batsmen.striker;
    if (strikerId) {
      if (!innings.battingCard[strikerId]) {
        innings.battingCard[strikerId] = { runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 };
      }
      if (isLegalDelivery || p.extraType === 'no_ball') {
        innings.battingCard[strikerId].balls += 1;
      }
    }

    const bowlerId = innings.currentBowler;
    if (bowlerId) {
      if (!innings.bowlingCard[bowlerId]) {
        innings.bowlingCard[bowlerId] = { overs: 0, maidens: 0, runs: 0, wickets: 0, economy: 0, balls: 0, wides: 0, noBalls: 0 };
      }
      if (isLegalDelivery) innings.bowlingCard[bowlerId].balls += 1;
      // Bowler gets wicket credit for: bowled, caught, lbw, stumped, hit_wicket
      const bowlerWickets = ['bowled', 'caught', 'lbw', 'stumped', 'hit_wicket'];
      if (bowlerWickets.includes(p.wicketType)) {
        innings.bowlingCard[bowlerId].wickets += 1;
      }
    }

    innings.wickets += 1;

    // Fall of wicket record
    const oversStr = `${Math.floor(innings.totalBalls / 6)}.${innings.totalBalls % 6}`;
    innings.fow.push({
      wicket: innings.wickets,
      runs: innings.runs,
      overs: oversStr,
      batter: strikerId,
      howOut: p.wicketType,
      bowler: bowlerId,
      fielder: p.fielder,
    });

    innings.currentOver.push({
      runs,
      isExtra: !!p.isExtra,
      extraType: p.extraType,
      isLegalDelivery,
      isWicket: true,
      wicketType: p.wicketType,
    });

    // Check if over complete
    if (innings.balls >= 6) {
      this._completeOver(innings);
    }

    this._updateStrikeRates(innings);
    this._checkInningsComplete(state, innings);

    return { ...state, currentInningsData: innings };
  }

  static _processEndOver(state, event) {
    const innings = { ...state.currentInningsData };
    this._completeOver(innings);
    return { ...state, currentInningsData: innings };
  }

  static _completeOver(innings) {
    const bowlerId = innings.currentBowler;
    const overRuns = innings.currentOver
      .filter(b => b.isLegalDelivery)
      .reduce((sum, b) => sum + b.runs, 0);
    const isMaiden = overRuns === 0 && innings.currentOver.some(b => b.isLegalDelivery);

    innings.overHistory.push({
      bowler: bowlerId,
      runs: innings.currentOver.reduce((sum, b) => sum + b.runs, 0),
      wickets: innings.currentOver.filter(b => b.isWicket).length,
      balls: innings.currentOver.filter(b => b.isLegalDelivery).length,
      maiden: isMaiden,
      detail: [...innings.currentOver],
    });

    if (bowlerId && innings.bowlingCard[bowlerId]) {
      innings.bowlingCard[bowlerId].overs = Math.floor(innings.bowlingCard[bowlerId].balls / 6);
      if (isMaiden) innings.bowlingCard[bowlerId].maidens += 1;
      // Economy = runs / overs (decimal)
      const bowlerBalls = innings.bowlingCard[bowlerId].balls;
      if (bowlerBalls > 0) {
        innings.bowlingCard[bowlerId].economy =
          parseFloat(((innings.bowlingCard[bowlerId].runs / bowlerBalls) * 6).toFixed(2));
      }
    }

    // Swap strike at end of over
    const temp = innings.batsmen.striker;
    innings.batsmen.striker = innings.batsmen.nonStriker;
    innings.batsmen.nonStriker = temp;

    innings.overs += 1;
    innings.balls = 0;
    innings.currentOver = [];
  }

  static _processEndInnings(state, event) {
    const innings = { ...state.currentInningsData };
    innings.isComplete = true;

    // Save completed innings
    const completedInnings = [...state.innings, { ...innings }];

    // Check if match is over
    const isMatchOver = completedInnings.length >= state.totalInnings * 2;

    if (!isMatchOver && completedInnings.length < state.totalInnings * 2) {
      // Start next innings
      const nextInnings = this._createInningsData();
      if (completedInnings.length === 1) {
        // Set target for 2nd innings
        nextInnings.target = innings.runs + 1;
      }
      return {
        ...state,
        innings: completedInnings,
        currentInnings: state.currentInnings + 1,
        currentInningsData: nextInnings,
      };
    }

    return {
      ...state,
      innings: completedInnings,
      currentInningsData: innings,
    };
  }

  static _processPenaltyRun(state, event) {
    const innings = { ...state.currentInningsData };
    const runs = event.payload.runs || 5;
    innings.runs += runs;
    innings.extras.penalties += runs;
    return { ...state, currentInningsData: innings };
  }

  static _updateStrikeRates(innings) {
    for (const [id, card] of Object.entries(innings.battingCard)) {
      if (card.balls > 0) {
        card.strikeRate = parseFloat(((card.runs / card.balls) * 100).toFixed(2));
      }
    }
    for (const [id, card] of Object.entries(innings.bowlingCard)) {
      if (card.balls > 0) {
        card.economy = parseFloat(((card.runs / card.balls) * 6).toFixed(2));
      }
    }
  }

  static _checkInningsComplete(state, innings) {
    // All out (10 wickets in standard cricket)
    if (innings.wickets >= 10) {
      innings.isComplete = true;
      return;
    }

    // Overs limit reached
    if (state.oversPerInnings && innings.overs >= state.oversPerInnings && innings.balls === 0) {
      innings.isComplete = true;
      return;
    }

    // Target chased in 2nd innings
    if (innings.target && innings.runs >= innings.target) {
      innings.isComplete = true;
    }
  }

  /**
   * Compute score display string
   */
  static getScoreDisplay(inningsData) {
    const overs = `${Math.floor(inningsData.totalBalls / 6)}.${inningsData.totalBalls % 6}`;
    return `${inningsData.runs}/${inningsData.wickets} (${overs} ov)`;
  }

  /**
   * Derive full score from events list
   */
  static deriveScoreFromEvents(events, format) {
    let state = this.createInitialState(format);
    for (const event of events) {
      if (!event.isUndone) {
        state = this.processEvent(state, event);
      }
    }
    return state;
  }
}

module.exports = CricketScoring;
