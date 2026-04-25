/**
 * CRICKET SCORING UTILITIES
 * 
 * Handles cricket-specific scoring logic including:
 * - Over-throw handling (bowler throws and ball goes over the batsman)
 * - Run calculations for regular deliveries and extras
 * - Wicket recording
 * - Innings management
 */

class CricketScoringUtils {
  /**
   * Process a cricket delivery with all possible scenarios
   * Including over-throws, no-balls, wides, and regular runs
   */
  static processDelivery(payload) {
    const {
      runs = 0,
      isWicket = false,
      isExtra = false,
      extraType = null, // 'wide', 'no_ball', 'bye', 'leg_bye', 'penalty', 'overthrow'
      overthrowRuns = 0,
      wicketType = null,
      bowler,
      batsmanAtStrike,
      fieldingTeam,
    } = payload;

    let event = {
      type: 'delivery',
      baseRuns: runs,
      totalRuns: runs,
      isWicket,
      isExtra,
      extraType,
      bowler,
      batsman: batsmanAtStrike,
    };

    // Handle extras
    if (isExtra) {
      if (extraType === 'wide') {
        event.runsFromExtra = 1 + (runs || 0);
        event.totalRuns = 1 + (runs || 0);
        event.countAsBall = false; // Wide doesn't count as a ball bowled
      } else if (extraType === 'no_ball') {
        event.runsFromExtra = 1 + (runs || 0);
        event.totalRuns = 1 + (runs || 0);
        event.countAsBall = false; // No-ball doesn't count as a ball bowled
      } else if (extraType === 'bye') {
        event.runsFromExtra = runs || 0;
        event.totalRuns = runs || 0;
        event.runnedBy = 'byRuns'; // Runs not credited to batter
        event.countAsBall = true; // Counts as a ball
      } else if (extraType === 'leg_bye') {
        event.runsFromExtra = runs || 0;
        event.totalRuns = runs || 0;
        event.runnedBy = 'legByeRuns'; // Runs credited to batter but not counted as runs scored
        event.countAsBall = true;
      }
    }

    // Handle over-throws
    if (extraType === 'overthrow') {
      event.overthrownBy = fieldingTeam; // The fielding team that threw over
      event.baseRuns = runs; // Original runs from the delivery
      event.overthrowRuns = overthrowRuns; // Additional runs from the overthrow
      event.totalRuns = runs + overthrowRuns;
      event.runnedBy = 'overthrowRuns';
      event.countAsBall = true; // Overthrow ball counts as bowled
      
      // Note: For overthrows, you might allow batsmen selection if multiple batsmen scored
      // This would be handled in the UI
      event.requiresBatterSelection = overthrowRuns > 1; // If 2+ overthrow runs, might need selection
    }

    // Handle wickets
    if (isWicket) {
      event.wicketType = wicketType;
      event.dismissalRuns = runs; // Runs scored on dismissal
    }

    return event;
  }

  /**
   * Calculate Net Run Rate (NRR) for cricket tournament
   * NRR = (Runs scored / Overs bowled) - (Runs conceded / Overs bowled)
   */
  static calculateNRR(teamStats) {
    const {
      runsScored = 0,
      runsConceded = 0,
      oversPlayed = 0,
      oversBowled = 0,
    } = teamStats;

    const runsPerOverScored = oversPlayed > 0 ? runsScored / oversPlayed : 0;
    const runsPerOverConceded = oversBowled > 0 ? runsConceded / oversBowled : 0;

    return runsPerOverScored - runsPerOverConceded;
  }

  /**
   * Determine wicket by runs (if there's an over-throw and runs become more than needed)
   * Used in specific situations where dismissal happens due to run-out
   */
  static checkRunOut(currentRuns, targetRuns, isRunOutScenario) {
    return isRunOutScenario && currentRuns >= targetRuns;
  }

  /**
   * Build cricket innings object with proper structure
   */
  static createInnings(teamName, teamId) {
    return {
      team: teamId,
      teamName,
      runs: 0,
      wickets: 0,
      overs: 0,
      balls: 0, // Ball number within the over (0-5)
      extras: {
        wides: 0,
        noBalls: 0,
        byes: 0,
        legByes: 0,
        penalties: 0,
      },
      deliveries: [], // All ball-by-ball data
      fall: [], // Wicket fall list with cumulative runs
      currentBatsmen: {
        striker: null,
        nonStriker: null,
      },
      bowler: null,
      completed: false,
    };
  }

  /**
   * Format overs and balls for display
   * E.g., 12 balls = 2 overs 0 balls = 2.0
   */
  static formatOvers(totalBalls) {
    const overs = Math.floor(totalBalls / 6);
    const balls = totalBalls % 6;
    return `${overs}.${balls}`;
  }

  /**
   * Parse formatted overs to total balls
   * E.g., "2.3" = 15 balls
   */
  static parseOvers(oversStr) {
    if (!oversStr) return 0;
    const [overs, balls] = oversStr.split('.').map(Number);
    return (overs * 6) + balls;
  }

  /**
   * Build wicket fall text
   * E.g., "Rohit b Bumrah 45 (34)" = Rohit dismissed by Bumrah for 45 runs off 34 balls
   */
  static buildWicketText(batter, bowler, runs, balls, wicketType) {
    const wicketTypeMap = {
      bowled: 'b',
      caught: 'c',
      lbw: 'lbw',
      run_out: 'run out',
      stumped: 'st',
      hit_wicket: 'hit wicket',
    };

    const typeStr = wicketTypeMap[wicketType] || wicketType;
    return `${batter} ${typeStr} ${bowler} ${runs} (${balls})`;
  }

  /**
   * Check if match can have super over (tie situation)
   */
  static canHaveSuperOver(match) {
    if (match.sport !== 'cricket') return false;
    
    const innings1Runs = match.scoreSnapshot?.innings?.[0]?.runs || 0;
    const innings2Runs = match.scoreSnapshot?.innings?.[1]?.runs || 0;
    
    return innings1Runs === innings2Runs && match.scoreSnapshot?.innings?.[1]?.completed;
  }

  /**
   * Calculate required run rate
   * RRR = (Runs to win) / (Balls remaining / 6)
   */
  static calculateRRR(runsNeeded, ballsRemaining) {
    if (ballsRemaining === 0) return Infinity;
    const oversRemaining = ballsRemaining / 6;
    return runsNeeded / oversRemaining;
  }

  /**
   * Determine match result based on cricket rules
   */
  static determineResult(match) {
    if (!match.scoreSnapshot?.innings?.[0] || !match.scoreSnapshot?.innings?.[1]) {
      return null;
    }

    const innings1 = match.scoreSnapshot.innings[0];
    const innings2 = match.scoreSnapshot.innings[1];

    if (innings1.runs > innings2.runs) {
      const wickets = innings2.wickets;
      const overs = this.formatOvers(innings2.balls);
      return {
        winner: 'home',
        margin: `${innings1.runs - innings2.runs} runs`,
        summary: `${innings1.teamName} won by ${innings1.runs - innings2.runs} runs`,
      };
    } else if (innings2.runs > innings1.runs) {
      const wickets = 10 - innings2.wickets; // Wickets remaining
      const overs = this.formatOvers(innings2.balls);
      return {
        winner: 'away',
        margin: `${wickets} wickets`,
        summary: `${innings2.teamName} won by ${wickets} wicket${wickets !== 1 ? 's' : ''}`,
      };
    } else {
      return {
        winner: 'draw',
        margin: 'Tie',
        summary: 'Match tied',
      };
    }
  }
}

module.exports = CricketScoringUtils;
