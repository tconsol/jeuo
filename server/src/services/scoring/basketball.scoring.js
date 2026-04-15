/**
 * BASKETBALL SCORING ENGINE
 *
 * Based on NBA / FIBA rules.
 *
 * Scoring:
 * - 2-point field goal (inside the arc)
 * - 3-point field goal (beyond the arc)
 * - Free throw: 1 point
 *
 * Periods: 4 quarters (12 min NBA / 10 min FIBA) + 5-min overtimes.
 * Each team has limited timeouts per half.
 * Personal fouls tracked (foul out at 6 NBA / 5 FIBA).
 * Team fouls per quarter trigger bonus free throws.
 */

class BasketballScoring {
  static createInitialState(format) {
    const quarters = format.quarters || 4;
    const quarterDuration = format.quarterDuration || 12;
    const overtimeDuration = format.overtimeDuration || 5;
    const foulLimit = format.foulLimit || 6; // 6 NBA, 5 FIBA
    const teamFoulBonusThreshold = format.teamFoulBonusThreshold || 5; // 5th team foul per quarter -> bonus

    return {
      home: this._createTeamState(),
      away: this._createTeamState(),
      period: 1,
      totalPeriods: quarters,
      quarterDuration,
      overtimeDuration,
      foulLimit,
      teamFoulBonusThreshold,
      scoreByPeriod: {
        home: new Array(quarters).fill(0),
        away: new Array(quarters).fill(0),
      },
      overtime: 0,
      isOvertime: false,
      clock: null,
    };
  }

  static _createTeamState() {
    return {
      points: 0,
      fieldGoalsMade: 0,
      fieldGoalsAttempted: 0,
      threePointersMade: 0,
      threePointersAttempted: 0,
      freeThrowsMade: 0,
      freeThrowsAttempted: 0,
      offensiveRebounds: 0,
      defensiveRebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      personalFouls: 0,
      teamFoulsPerPeriod: 0,
      timeoutsRemaining: 7, // NBA: 7 per game
      playerStats: {},       // {playerId: {points, rebounds, assists, steals, blocks, turnovers, fouls, fgm, fga, 3pm, 3pa, ftm, fta, minutes}}
    };
  }

  static _getPlayerStats(teamData, playerId) {
    if (!teamData.playerStats[playerId]) {
      teamData.playerStats[playerId] = {
        points: 0, rebounds: 0, offRebounds: 0, defRebounds: 0,
        assists: 0, steals: 0, blocks: 0, turnovers: 0, fouls: 0,
        fgm: 0, fga: 0, threepm: 0, threepa: 0, ftm: 0, fta: 0,
        minutes: 0, plusMinus: 0,
      };
    }
    return teamData.playerStats[playerId];
  }

  static processEvent(state, event) {
    const team = event.team;
    const teamData = state[team];
    const p = event.payload;
    const periodIdx = state.isOvertime
      ? state.totalPeriods + state.overtime - 1
      : state.period - 1;

    switch (event.type) {
      case 'field_goal_2pt': {
        const playerStats = this._getPlayerStats(teamData, p.player);
        teamData.fieldGoalsAttempted += 1;
        playerStats.fga += 1;
        if (p.made) {
          teamData.points += 2;
          teamData.fieldGoalsMade += 1;
          playerStats.points += 2;
          playerStats.fgm += 1;
          if (!state.scoreByPeriod.home[periodIdx] && !state.scoreByPeriod.away[periodIdx]) {
            state.scoreByPeriod.home[periodIdx] = state.scoreByPeriod.home[periodIdx] || 0;
            state.scoreByPeriod.away[periodIdx] = state.scoreByPeriod.away[periodIdx] || 0;
          }
          state.scoreByPeriod[team][periodIdx] = (state.scoreByPeriod[team][periodIdx] || 0) + 2;
          if (p.assistBy) {
            const assistStats = this._getPlayerStats(teamData, p.assistBy);
            teamData.assists += 1;
            assistStats.assists += 1;
          }
        }
        return state;
      }

      case 'field_goal_3pt': {
        const playerStats = this._getPlayerStats(teamData, p.player);
        teamData.fieldGoalsAttempted += 1;
        teamData.threePointersAttempted += 1;
        playerStats.fga += 1;
        playerStats.threepa += 1;
        if (p.made) {
          teamData.points += 3;
          teamData.fieldGoalsMade += 1;
          teamData.threePointersMade += 1;
          playerStats.points += 3;
          playerStats.fgm += 1;
          playerStats.threepm += 1;
          state.scoreByPeriod[team][periodIdx] = (state.scoreByPeriod[team][periodIdx] || 0) + 3;
          if (p.assistBy) {
            const assistStats = this._getPlayerStats(teamData, p.assistBy);
            teamData.assists += 1;
            assistStats.assists += 1;
          }
        }
        return state;
      }

      case 'free_throw': {
        const playerStats = this._getPlayerStats(teamData, p.player);
        teamData.freeThrowsAttempted += 1;
        playerStats.fta += 1;
        if (p.made) {
          teamData.points += 1;
          teamData.freeThrowsMade += 1;
          playerStats.points += 1;
          playerStats.ftm += 1;
          state.scoreByPeriod[team][periodIdx] = (state.scoreByPeriod[team][periodIdx] || 0) + 1;
        }
        return state;
      }

      case 'rebound': {
        const playerStats = this._getPlayerStats(teamData, p.player);
        playerStats.rebounds += 1;
        if (p.offensive) {
          teamData.offensiveRebounds += 1;
          playerStats.offRebounds += 1;
        } else {
          teamData.defensiveRebounds += 1;
          playerStats.defRebounds += 1;
        }
        return state;
      }

      case 'steal': {
        const playerStats = this._getPlayerStats(teamData, p.player);
        teamData.steals += 1;
        playerStats.steals += 1;
        return state;
      }

      case 'block': {
        const playerStats = this._getPlayerStats(teamData, p.player);
        teamData.blocks += 1;
        playerStats.blocks += 1;
        return state;
      }

      case 'turnover': {
        const playerStats = this._getPlayerStats(teamData, p.player);
        teamData.turnovers += 1;
        playerStats.turnovers += 1;
        return state;
      }

      case 'foul': {
        const playerStats = this._getPlayerStats(teamData, p.player);
        teamData.personalFouls += 1;
        teamData.teamFoulsPerPeriod += 1;
        playerStats.fouls += 1;
        const fouledOut = playerStats.fouls >= state.foulLimit;
        return { ...state, _lastFoulOut: fouledOut ? p.player : null };
      }

      case 'timeout': {
        if (teamData.timeoutsRemaining > 0) {
          teamData.timeoutsRemaining -= 1;
        }
        return state;
      }

      case 'quarter_end': {
        if (state.isOvertime) {
          // Check if scores still tied — another OT
          if (state.home.points === state.away.points) {
            state.overtime += 1;
            const newPeriodIdx = state.totalPeriods + state.overtime - 1;
            if (!state.scoreByPeriod.home[newPeriodIdx]) {
              state.scoreByPeriod.home[newPeriodIdx] = 0;
              state.scoreByPeriod.away[newPeriodIdx] = 0;
            }
          }
        } else {
          state.period += 1;
          state.home.teamFoulsPerPeriod = 0;
          state.away.teamFoulsPerPeriod = 0;
          if (state.period > state.totalPeriods) {
            // Regulation ended. Check if tied.
            if (state.home.points === state.away.points) {
              state.isOvertime = true;
              state.overtime = 1;
              const newPeriodIdx = state.totalPeriods;
              state.scoreByPeriod.home[newPeriodIdx] = 0;
              state.scoreByPeriod.away[newPeriodIdx] = 0;
            }
          }
        }
        return state;
      }

      default:
        return state;
    }
  }

  static getScoreDisplay(state) {
    return `${state.home.points} - ${state.away.points}`;
  }

  static getTeamFGPercentage(teamData) {
    if (teamData.fieldGoalsAttempted === 0) return 0;
    return ((teamData.fieldGoalsMade / teamData.fieldGoalsAttempted) * 100).toFixed(1);
  }

  static getTeam3PPercentage(teamData) {
    if (teamData.threePointersAttempted === 0) return 0;
    return ((teamData.threePointersMade / teamData.threePointersAttempted) * 100).toFixed(1);
  }

  static getTeamFTPercentage(teamData) {
    if (teamData.freeThrowsAttempted === 0) return 0;
    return ((teamData.freeThrowsMade / teamData.freeThrowsAttempted) * 100).toFixed(1);
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

module.exports = BasketballScoring;
