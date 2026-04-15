/**
 * TENNIS SCORING ENGINE
 *
 * Based on ITF Rules of Tennis.
 *
 * Point sequence: 0 → 15 → 30 → 40 → Game
 * Deuce at 40-40 → Advantage → Game (must win by 2 clear points)
 * Set: first to 6 games with 2-game lead
 * Tiebreak at 6-6: first to 7 points, win by 2 (no cap)
 * Match: Best of 3 sets (standard) or 5 sets (Grand Slam)
 * Final set rules vary by tournament (10-point super tiebreak, or standard play)
 *
 * Serve alternates every game. In tiebreak, serve alternates every 2 points
 * after the first point.
 */

const POINT_NAMES = ['0', '15', '30', '40'];

class TennisScoring {
  static createInitialState(format) {
    const totalSets = format.sets || 3; // best of 3 or 5
    const gamesPerSet = format.gamesPerSet || 6;
    const tiebreakAt = format.tiebreakAt || 6;
    const finalSetTiebreak = format.finalSetTiebreak !== false; // default true
    const finalSetSuperTiebreak = format.finalSetSuperTiebreak || false; // 10-pt tiebreak

    return {
      players: [null, null], // [player1, player2]
      sets: [],              // [{games: [p1Games, p2Games], tiebreak: null | {points: [p1,p2]}}]
      currentSet: { games: [0, 0], tiebreak: null },
      currentGame: { points: [0, 0], isDeuce: false, advantage: null },
      isTiebreak: false,
      tiebreakPoints: [0, 0],
      server: 0,             // 0 or 1 (index of serving player)
      currentSetNumber: 1,
      totalSets,
      gamesPerSet,
      tiebreakAt,
      finalSetTiebreak,
      finalSetSuperTiebreak,
      setsWon: [0, 0],
      isMatchComplete: false,
      winner: null,
      aces: [0, 0],
      doubleFaults: [0, 0],
      winners: [0, 0],
      unforcedErrors: [0, 0],
      firstServeIn: [0, 0],
      firstServeTotal: [0, 0],
      pointsWon: [0, 0],
    };
  }

  static processEvent(state, event) {
    if (state.isMatchComplete) return state;

    const p = event.payload;

    switch (event.type) {
      case 'point':
        return this._processPoint(state, p.winner, p);
      case 'ace':
        state.aces[state.server] += 1;
        return this._processPoint(state, state.server, p);
      case 'double_fault':
        state.doubleFaults[state.server] += 1;
        return this._processPoint(state, 1 - state.server, p);
      case 'winner_shot':
        state.winners[p.player] += 1;
        return this._processPoint(state, p.player, p);
      case 'unforced_error':
        state.unforcedErrors[p.player] += 1;
        return this._processPoint(state, 1 - p.player, p);
      default:
        return state;
    }
  }

  static _processPoint(state, pointWinner, payload) {
    state.pointsWon[pointWinner] += 1;

    if (state.isTiebreak) {
      return this._processTiebreakPoint(state, pointWinner);
    }

    return this._processRegularPoint(state, pointWinner);
  }

  static _processRegularPoint(state, pointWinner) {
    const game = state.currentGame;

    // Handle deuce/advantage
    if (game.points[0] >= 3 && game.points[1] >= 3) {
      if (game.advantage === null) {
        if (game.points[0] === game.points[1] || (game.points[0] >= 3 && game.points[1] >= 3)) {
          // Deuce state — set advantage
          game.advantage = pointWinner;
          game.isDeuce = true;
          return state;
        }
      } else if (game.advantage === pointWinner) {
        // Advantage player wins → game won
        return this._gameWon(state, pointWinner);
      } else {
        // Other player wins → back to deuce
        game.advantage = null;
        game.isDeuce = true;
        return state;
      }
    }

    // Regular point progression
    game.points[pointWinner] += 1;

    // Check if game won (point value reached 4, i.e., past 40)
    if (game.points[pointWinner] >= 4) {
      return this._gameWon(state, pointWinner);
    }

    // Check if entering deuce
    if (game.points[0] === 3 && game.points[1] === 3) {
      game.isDeuce = true;
    }

    return state;
  }

  static _processTiebreakPoint(state, pointWinner) {
    const isFinalSet = state.currentSetNumber === state.totalSets;
    const isSuperTiebreak = isFinalSet && state.finalSetSuperTiebreak;
    const targetPoints = isSuperTiebreak ? 10 : 7;

    state.tiebreakPoints[pointWinner] += 1;
    const tp = state.tiebreakPoints;

    // Check tiebreak winner
    if (tp[pointWinner] >= targetPoints && (tp[pointWinner] - tp[1 - pointWinner]) >= 2) {
      // Tiebreak won
      state.currentSet.tiebreak = { points: [...tp] };
      state.currentSet.games[pointWinner] += 1; // tiebreak counts as 1 game
      return this._setWon(state, pointWinner);
    }

    // Change serve in tiebreak: after first point, then every 2 points
    const totalTBPoints = tp[0] + tp[1];
    if (totalTBPoints === 1 || (totalTBPoints > 1 && (totalTBPoints - 1) % 2 === 0)) {
      state.server = 1 - state.server;
    }

    // Change ends every 6 points in tiebreak
    return state;
  }

  static _gameWon(state, gameWinner) {
    state.currentSet.games[gameWinner] += 1;
    const g = state.currentSet.games;

    // Check if set won
    const setTarget = state.gamesPerSet;
    if (g[gameWinner] >= setTarget && (g[gameWinner] - g[1 - gameWinner]) >= 2) {
      return this._setWon(state, gameWinner);
    }

    // Check for tiebreak
    if (g[0] === state.tiebreakAt && g[1] === state.tiebreakAt) {
      const isFinalSet = state.currentSetNumber === state.totalSets;
      if (!isFinalSet || state.finalSetTiebreak) {
        state.isTiebreak = true;
        state.tiebreakPoints = [0, 0];
      }
    }

    // Reset game, alternate server
    state.currentGame = { points: [0, 0], isDeuce: false, advantage: null };
    state.server = 1 - state.server;

    return state;
  }

  static _setWon(state, setWinner) {
    state.setsWon[setWinner] += 1;

    // Save completed set
    state.sets.push({ ...state.currentSet });

    // Check match won
    const setsToWin = Math.ceil(state.totalSets / 2);
    if (state.setsWon[setWinner] >= setsToWin) {
      state.isMatchComplete = true;
      state.winner = setWinner;
      return state;
    }

    // Start new set
    state.currentSetNumber += 1;
    state.currentSet = { games: [0, 0], tiebreak: null };
    state.currentGame = { points: [0, 0], isDeuce: false, advantage: null };
    state.isTiebreak = false;
    state.tiebreakPoints = [0, 0];
    state.server = 1 - state.server;

    return state;
  }

  static getPointDisplay(state) {
    if (state.isTiebreak) {
      return `TB: ${state.tiebreakPoints[0]}-${state.tiebreakPoints[1]}`;
    }

    const game = state.currentGame;
    if (game.isDeuce) {
      if (game.advantage === null) return 'Deuce';
      return `Advantage ${game.advantage === 0 ? 'P1' : 'P2'}`;
    }

    const p1Display = POINT_NAMES[Math.min(game.points[0], 3)];
    const p2Display = POINT_NAMES[Math.min(game.points[1], 3)];
    return `${p1Display}-${p2Display}`;
  }

  static getSetDisplay(state) {
    const sets = state.sets.map(s => `${s.games[0]}-${s.games[1]}`);
    const current = `${state.currentSet.games[0]}-${state.currentSet.games[1]}`;
    return [...sets, current].join(' | ');
  }

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

module.exports = TennisScoring;
