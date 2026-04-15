/**
 * VOLLEYBALL SCORING ENGINE
 *
 * Based on FIVB (Fédération Internationale de Volleyball) rules.
 *
 * Rally point scoring:
 * - Sets 1-4: first to 25 points, win by 2 (no cap)
 * - Set 5 (deciding): first to 15 points, win by 2
 * - Best of 5 sets
 * - Rotation: when receiving team wins rally and gains serve, they rotate clockwise
 * - Each team gets 2 timeouts per set, 6 substitutions per set
 * - Libero: defensive specialist, unlimited replacements (not counted as subs)
 * - Teams change ends after each set, and at 8 points in the 5th set
 */

class VolleyballScoring {
  static createInitialState(format) {
    const setsToWin = format.setsToWin || 3;
    const totalSets = format.totalSets || 5;
    const pointsPerSet = format.pointsPerSet || 25;
    const decidingSetPoints = format.decidingSetPoints || 15;
    const maxSubsPerSet = format.maxSubsPerSet || 6;
    const timeoutsPerSet = format.timeoutsPerSet || 2;

    return {
      home: this._createTeamState(timeoutsPerSet, maxSubsPerSet),
      away: this._createTeamState(timeoutsPerSet, maxSubsPerSet),
      sets: [],                // [{points: [home, away]}]
      currentSet: { points: [0, 0] },
      currentSetNumber: 1,
      totalSets,
      setsToWin,
      pointsPerSet,
      decidingSetPoints,
      setsWon: [0, 0],        // [home, away]
      server: 0,               // 0 = home, 1 = away
      isMatchComplete: false,
      winner: null,
      // Rotation tracking: position 1 = server
      rotation: {
        home: [1, 2, 3, 4, 5, 6], // player positions (clockwise from server)
        away: [1, 2, 3, 4, 5, 6],
      },
    };
  }

  static _createTeamState(timeoutsPerSet, maxSubsPerSet) {
    return {
      points: 0,
      kills: 0,
      attackErrors: 0,
      attackAttempts: 0,
      aces: 0,
      serviceErrors: 0,
      blocks: 0,
      digs: 0,
      assists: 0,
      receptionErrors: 0,
      timeoutsRemaining: timeoutsPerSet,
      substitutionsRemaining: maxSubsPerSet,
      playerStats: {},  // {playerId: {kills, errors, blocks, aces, digs, assists, points}}
    };
  }

  static _getPlayerStats(teamData, playerId) {
    if (!teamData.playerStats[playerId]) {
      teamData.playerStats[playerId] = {
        kills: 0, attackErrors: 0, aces: 0, serviceErrors: 0,
        blocks: 0, digs: 0, assists: 0, receptionErrors: 0, points: 0,
      };
    }
    return teamData.playerStats[playerId];
  }

  static processEvent(state, event) {
    if (state.isMatchComplete) return state;

    const p = event.payload;

    switch (event.type) {
      case 'rally_point':
        return this._processRallyPoint(state, p);
      case 'timeout': {
        const team = p.team;
        const teamKey = team === 0 ? 'home' : 'away';
        if (state[teamKey].timeoutsRemaining > 0) {
          state[teamKey].timeoutsRemaining -= 1;
        }
        return state;
      }
      case 'substitution': {
        const teamKey = p.team === 0 ? 'home' : 'away';
        if (state[teamKey].substitutionsRemaining > 0) {
          state[teamKey].substitutionsRemaining -= 1;
        }
        return state;
      }
      case 'rotation': {
        const teamKey = p.team === 0 ? 'home' : 'away';
        this._rotate(state.rotation[teamKey]);
        return state;
      }
      default:
        return state;
    }
  }

  static _processRallyPoint(state, payload) {
    const scoringTeam = payload.winner; // 0 = home, 1 = away
    const teamKey = scoringTeam === 0 ? 'home' : 'away';
    const otherKey = scoringTeam === 0 ? 'away' : 'home';

    state.currentSet.points[scoringTeam] += 1;
    state[teamKey].points += 1;

    // Track stat type
    if (payload.type === 'kill' && payload.player) {
      const ps = this._getPlayerStats(state[teamKey], payload.player);
      ps.kills += 1;
      ps.points += 1;
      state[teamKey].kills += 1;
      if (payload.assistBy) {
        const as = this._getPlayerStats(state[teamKey], payload.assistBy);
        as.assists += 1;
        state[teamKey].assists += 1;
      }
    } else if (payload.type === 'ace' && payload.player) {
      const ps = this._getPlayerStats(state[teamKey], payload.player);
      ps.aces += 1;
      ps.points += 1;
      state[teamKey].aces += 1;
    } else if (payload.type === 'block' && payload.player) {
      const ps = this._getPlayerStats(state[teamKey], payload.player);
      ps.blocks += 1;
      ps.points += 1;
      state[teamKey].blocks += 1;
    } else if (payload.type === 'opponent_error') {
      if (payload.errorType === 'attack_error') state[otherKey].attackErrors += 1;
      else if (payload.errorType === 'service_error') state[otherKey].serviceErrors += 1;
      else if (payload.errorType === 'reception_error') state[otherKey].receptionErrors += 1;
    }

    // Check set win
    const pts = state.currentSet.points;
    const isDecidingSet = state.currentSetNumber === state.totalSets;
    const targetPoints = isDecidingSet ? state.decidingSetPoints : state.pointsPerSet;
    const diff = Math.abs(pts[0] - pts[1]);

    if (pts[scoringTeam] >= targetPoints && diff >= 2) {
      return this._setWon(state, scoringTeam);
    }

    // Handle serve: if receiving team won the rally, they now serve and rotate
    if (scoringTeam !== state.server) {
      const newServerKey = scoringTeam === 0 ? 'home' : 'away';
      this._rotate(state.rotation[newServerKey]);
      state.server = scoringTeam;
    }

    return state;
  }

  static _rotate(positions) {
    // Clockwise rotation: [1,2,3,4,5,6] → [6,1,2,3,4,5]
    const last = positions.pop();
    positions.unshift(last);
  }

  static _setWon(state, setWinner) {
    state.setsWon[setWinner] += 1;
    state.sets.push({ points: [...state.currentSet.points] });

    if (state.setsWon[setWinner] >= state.setsToWin) {
      state.isMatchComplete = true;
      state.winner = setWinner;
      return state;
    }

    // Start new set
    state.currentSetNumber += 1;
    state.currentSet = { points: [0, 0] };
    state.home.timeoutsRemaining = 2;
    state.away.timeoutsRemaining = 2;
    state.home.substitutionsRemaining = 6;
    state.away.substitutionsRemaining = 6;
    // Alternate initial serve
    state.server = 1 - state.server;

    return state;
  }

  static getScoreDisplay(state) {
    const setScores = state.sets.map(s => `${s.points[0]}-${s.points[1]}`);
    const current = `${state.currentSet.points[0]}-${state.currentSet.points[1]}`;
    return `Sets: ${state.setsWon[0]}-${state.setsWon[1]} | Current: ${current}`;
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

module.exports = VolleyballScoring;
