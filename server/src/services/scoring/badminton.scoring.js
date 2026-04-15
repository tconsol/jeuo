/**
 * BADMINTON / TABLE TENNIS SCORING ENGINE
 *
 * BWF (Badminton World Federation) rules:
 * - Rally point scoring to 21 per game
 * - Must win by 2 (if 20-20, first to gain 2-point lead)
 * - At 29-29, first to 30 wins
 * - Best of 3 games
 * - When leading score is 11, players change ends
 * - Service changes when receiving side wins a rally
 *
 * ITTF (International Table Tennis Federation) rules:
 * - Rally point scoring to 11 per game
 * - Must win by 2 (if 10-10, first to gain 2-point lead)
 * - Best of 5 or 7 games
 * - Service alternates every 2 points
 * - At deuce (10-10), service alternates every point
 * - Players change ends after each game and when a player reaches 5 in the final game
 */

class RacketScoring {
  static createInitialState(format) {
    const sport = format.sport || 'badminton'; // 'badminton' or 'table_tennis'
    const isBadminton = sport === 'badminton';

    return {
      sport,
      players: [null, null],
      games: [],               // completed games: [{points: [p1, p2]}]
      currentGame: {
        points: [0, 0],
      },
      server: 0,               // 0 or 1
      currentGameNumber: 1,
      gamesPerMatch: format.gamesPerMatch || (isBadminton ? 3 : (format.gamesPerMatch || 5)),
      pointsPerGame: isBadminton ? 21 : 11,
      maxPoint: isBadminton ? 30 : null,  // badminton: cap at 30; table tennis: no cap
      gamesWon: [0, 0],
      isMatchComplete: false,
      winner: null,
      // Table tennis: serve alternates every 2 points (or every 1 in deuce)
      // Badminton: serve goes to rally winner
      serveChangeInterval: isBadminton ? null : 2,
      totalPointsInGame: 0,
      rallies: [],             // [{winner, server, length?}]
    };
  }

  static processEvent(state, event) {
    if (state.isMatchComplete) return state;

    const p = event.payload;

    switch (event.type) {
      case 'rally_point':
        return this._processRallyPoint(state, p.winner);
      case 'service_fault':
        // In badminton, a service fault concedes the rally
        return this._processRallyPoint(state, 1 - state.server);
      case 'let':
        // Replay, no state change
        return state;
      default:
        return state;
    }
  }

  static _processRallyPoint(state, pointWinner) {
    state.currentGame.points[pointWinner] += 1;
    state.totalPointsInGame += 1;

    const pts = state.currentGame.points;

    // Check for game won
    if (this._isGameWon(state, pts)) {
      return this._gameWon(state, pointWinner);
    }

    // Handle service change
    this._updateServer(state, pointWinner);

    return state;
  }

  static _isGameWon(state, pts) {
    const target = state.pointsPerGame;
    const diff = Math.abs(pts[0] - pts[1]);
    const leader = pts[0] > pts[1] ? 0 : 1;

    if (state.sport === 'badminton') {
      // Badminton: win at target with 2-point lead, or first to 30
      if (pts[leader] >= target && diff >= 2) return true;
      if (state.maxPoint && pts[leader] >= state.maxPoint) return true;
      return false;
    } else {
      // Table tennis: win at target with 2-point lead
      if (pts[leader] >= target && diff >= 2) return true;
      return false;
    }
  }

  static _updateServer(state, pointWinner) {
    if (state.sport === 'badminton') {
      // In badminton, the rally winner gets to serve
      state.server = pointWinner;
    } else {
      // Table tennis: alternate every 2 points, at deuce every 1 point
      const pts = state.currentGame.points;
      const isDeuce = pts[0] >= state.pointsPerGame - 1 && pts[1] >= state.pointsPerGame - 1;
      const totalPts = pts[0] + pts[1];

      if (isDeuce) {
        // At deuce, alternate every point
        state.server = 1 - state.server;
      } else {
        // Normal: alternate every 2 points
        if (totalPts % state.serveChangeInterval === 0) {
          state.server = 1 - state.server;
        }
      }
    }
  }

  static _gameWon(state, gameWinner) {
    state.gamesWon[gameWinner] += 1;
    state.games.push({ points: [...state.currentGame.points] });

    const gamesToWin = Math.ceil(state.gamesPerMatch / 2);

    if (state.gamesWon[gameWinner] >= gamesToWin) {
      state.isMatchComplete = true;
      state.winner = gameWinner;
      return state;
    }

    // Start new game
    state.currentGameNumber += 1;
    state.currentGame = { points: [0, 0] };
    state.totalPointsInGame = 0;
    // Service alternates between games
    state.server = 1 - state.server;

    return state;
  }

  static getScoreDisplay(state) {
    const gameScores = state.games.map(g => `${g.points[0]}-${g.points[1]}`);
    const current = `${state.currentGame.points[0]}-${state.currentGame.points[1]}`;
    const allGames = [...gameScores, current];
    return `Games: ${state.gamesWon[0]}-${state.gamesWon[1]} | Current: ${current}`;
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

module.exports = RacketScoring;
