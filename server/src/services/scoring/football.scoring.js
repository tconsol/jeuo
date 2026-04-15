/**
 * FOOTBALL (SOCCER) SCORING ENGINE
 *
 * Based on FIFA Laws of the Game.
 *
 * Match: 2 halves × 45 minutes + stoppage time.
 * Extra time (optional): 2 × 15 minutes.
 * Penalty shootout (optional).
 *
 * Events tracked:
 * - Goals (regular, penalty, own goal, free kick)
 * - Assists
 * - Fouls
 * - Yellow cards (2 yellows = red = ejection)
 * - Red cards (immediate ejection)
 * - Substitutions (max 5 per match in most competitions, 3 windows + half-time)
 * - Corners, offsides (statistics)
 */

class FootballScoring {
  static createInitialState(format) {
    return {
      home: {
        goals: 0,
        shots: 0,
        shotsOnTarget: 0,
        corners: 0,
        fouls: 0,
        offsides: 0,
        possession: 50,
        yellowCards: 0,
        redCards: 0,
        substitutions: 0,
        goalScorers: [],      // [{player, minute, type: 'open_play'|'penalty'|'free_kick'|'own_goal', assistBy}]
        cards: [],             // [{player, minute, type: 'yellow'|'red'|'second_yellow'}]
        subs: [],              // [{in, out, minute}]
        playerCards: {},       // {playerId: {yellows: 0, reds: 0}}
      },
      away: {
        goals: 0,
        shots: 0,
        shotsOnTarget: 0,
        corners: 0,
        fouls: 0,
        offsides: 0,
        possession: 50,
        yellowCards: 0,
        redCards: 0,
        substitutions: 0,
        goalScorers: [],
        cards: [],
        subs: [],
        playerCards: {},
      },
      period: 'first_half',   // first_half, second_half, extra_first, extra_second, penalties
      minute: 0,
      halfDuration: format.halfDuration || 45,
      maxSubstitutions: 5,
      isExtraTime: format.extraTime || false,
      isPenalties: format.penalties || false,
      penaltyShootout: null,
    };
  }

  static processEvent(state, event) {
    const team = event.team; // 'home' or 'away'
    const p = event.payload;

    switch (event.type) {
      case 'goal':
        return this._processGoal(state, team, p);
      case 'foul':
        return this._processFoul(state, team, p);
      case 'yellow_card':
        return this._processCard(state, team, p, 'yellow');
      case 'red_card':
        return this._processCard(state, team, p, 'red');
      case 'second_yellow':
        return this._processCard(state, team, p, 'second_yellow');
      case 'substitution':
        return this._processSubstitution(state, team, p);
      case 'corner':
        state[team].corners += 1;
        return state;
      case 'offside':
        state[team].offsides += 1;
        return state;
      case 'shot':
        state[team].shots += 1;
        if (p.onTarget) state[team].shotsOnTarget += 1;
        return state;
      case 'half_time':
        state.period = 'second_half';
        return state;
      case 'full_time':
        state.period = 'full_time';
        return state;
      case 'extra_time_start':
        state.period = 'extra_first';
        return state;
      case 'extra_half_time':
        state.period = 'extra_second';
        return state;
      case 'penalty_shootout_start':
        state.period = 'penalties';
        state.penaltyShootout = { home: [], away: [], currentRound: 1 };
        return state;
      case 'penalty_kick':
        return this._processPenaltyKick(state, team, p);
      default:
        return state;
    }
  }

  static _processGoal(state, team, payload) {
    const teamData = state[team];

    if (payload.isOwnGoal) {
      // Own goal: credited to the OTHER team
      const otherTeam = team === 'home' ? 'away' : 'home';
      state[otherTeam].goals += 1;
      state[otherTeam].goalScorers.push({
        player: payload.player || event.player,
        minute: payload.minute,
        type: 'own_goal',
        assistBy: null,
      });
    } else {
      teamData.goals += 1;
      teamData.goalScorers.push({
        player: event.player,
        minute: payload.minute,
        type: payload.isPenalty ? 'penalty' : 'open_play',
        assistBy: payload.assistBy || null,
      });
    }

    return state;
  }

  static _processFoul(state, team, payload) {
    state[team].fouls += 1;
    return state;
  }

  static _processCard(state, team, payload, cardType) {
    const teamData = state[team];
    const playerId = payload.player || event.player;

    if (!teamData.playerCards[playerId]) {
      teamData.playerCards[playerId] = { yellows: 0, reds: 0 };
    }

    if (cardType === 'yellow') {
      teamData.yellowCards += 1;
      teamData.playerCards[playerId].yellows += 1;
      teamData.cards.push({ player: playerId, minute: payload.minute, type: 'yellow' });

      // Two yellows = automatic red
      if (teamData.playerCards[playerId].yellows >= 2) {
        teamData.redCards += 1;
        teamData.playerCards[playerId].reds += 1;
        teamData.cards.push({ player: playerId, minute: payload.minute, type: 'second_yellow' });
      }
    } else if (cardType === 'red' || cardType === 'second_yellow') {
      teamData.redCards += 1;
      teamData.playerCards[playerId].reds += 1;
      teamData.cards.push({ player: playerId, minute: payload.minute, type: cardType });
    }

    return state;
  }

  static _processSubstitution(state, team, payload) {
    const teamData = state[team];
    if (teamData.substitutions >= state.maxSubstitutions) {
      throw new Error('Maximum substitutions reached');
    }

    teamData.substitutions += 1;
    teamData.subs.push({
      in: payload.substitutedIn,
      out: payload.substitutedOut,
      minute: payload.minute,
    });

    return state;
  }

  static _processPenaltyKick(state, team, payload) {
    if (!state.penaltyShootout) return state;

    state.penaltyShootout[team].push({
      player: payload.player,
      scored: payload.scored || false,
      round: state.penaltyShootout.currentRound,
    });

    // Check if both teams have taken this round
    const homeRound = state.penaltyShootout.home.filter(p => p.round === state.penaltyShootout.currentRound);
    const awayRound = state.penaltyShootout.away.filter(p => p.round === state.penaltyShootout.currentRound);
    if (homeRound.length > 0 && awayRound.length > 0) {
      state.penaltyShootout.currentRound += 1;
    }

    return state;
  }

  static getScoreDisplay(state) {
    return `${state.home.goals} - ${state.away.goals}`;
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

module.exports = FootballScoring;
