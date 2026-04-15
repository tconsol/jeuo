const { Tournament, Match, User } = require('../models');
const { getQueue } = require('../config/queue');
const logger = require('../config/logger');

class TournamentService {
  static async create(data, creatorId) {
    const tournament = new Tournament({
      ...data,
      creator: creatorId,
      status: 'draft',
    });
    await tournament.save();
    logger.info({ tournamentId: tournament._id }, 'Tournament created');
    return tournament;
  }

  static async findById(id) {
    return Tournament.findById(id)
      .populate('creator', 'name avatar')
      .populate('teams.captain', 'name avatar')
      .populate('fixtures.match');
  }

  static async search({ sport, status, page = 1, limit = 20 }) {
    const filter = {};
    if (sport) filter.sport = sport;
    if (status) filter.status = status;
    else filter.status = { $in: ['registration_open', 'registration_closed', 'in_progress'] };

    const skip = (page - 1) * limit;
    const [tournaments, total] = await Promise.all([
      Tournament.find(filter)
        .populate('creator', 'name avatar')
        .skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
      Tournament.countDocuments(filter),
    ]);

    return { tournaments, total, page, pages: Math.ceil(total / limit) };
  }

  static async registerTeam(tournamentId, teamData) {
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) throw new Error('Tournament not found');
    if (tournament.status !== 'registration_open') throw new Error('Registration is closed');
    if (tournament.teams.length >= tournament.maxTeams) throw new Error('Tournament is full');

    const existing = tournament.teams.find(t =>
      t.captain.toString() === teamData.captain.toString()
    );
    if (existing) throw new Error('Team already registered');

    tournament.teams.push(teamData);
    await tournament.save();

    return tournament;
  }

  static async generateFixtures(tournamentId, creatorId) {
    const tournament = await Tournament.findOne({ _id: tournamentId, creator: creatorId });
    if (!tournament) throw new Error('Tournament not found or not authorized');

    const teams = tournament.teams;
    let fixtures = [];

    switch (tournament.format) {
      case 'knockout':
        fixtures = this._generateKnockoutFixtures(teams);
        break;
      case 'league':
        fixtures = this._generateLeagueFixtures(teams);
        break;
      case 'group_knockout':
        fixtures = this._generateGroupKnockoutFixtures(teams, tournament.groups);
        break;
      default:
        throw new Error('Invalid tournament format');
    }

    tournament.fixtures = fixtures;
    tournament.status = 'ongoing';
    await tournament.save();

    // Create match documents for each fixture
    for (const fixture of fixtures) {
      if (fixture.teamA && fixture.teamB) {
        const match = new Match({
          tournament: tournament._id,
          sport: tournament.sport,
          teams: [
            { name: fixture.teamAName, players: [], color: '' },
            { name: fixture.teamBName, players: [], color: '' },
          ],
          status: 'upcoming',
          config: tournament.rules || {},
        });
        await match.save();
        fixture.match = match._id;
      }
    }

    await tournament.save();
    return tournament;
  }

  static _generateKnockoutFixtures(teams) {
    const fixtures = [];
    const rounds = Math.ceil(Math.log2(teams.length));
    let matchNumber = 1;

    // First round
    for (let i = 0; i < teams.length; i += 2) {
      fixtures.push({
        round: 1,
        matchNumber: matchNumber++,
        teamA: teams[i]?._id,
        teamAName: teams[i]?.name || 'TBD',
        teamB: teams[i + 1]?._id,
        teamBName: teams[i + 1]?.name || 'BYE',
      });
    }

    // Subsequent rounds (matches TBD)
    for (let round = 2; round <= rounds; round++) {
      const matchesInRound = Math.pow(2, rounds - round);
      for (let i = 0; i < matchesInRound; i++) {
        fixtures.push({
          round,
          matchNumber: matchNumber++,
          teamA: null,
          teamAName: 'TBD',
          teamB: null,
          teamBName: 'TBD',
        });
      }
    }

    return fixtures;
  }

  static _generateLeagueFixtures(teams) {
    const fixtures = [];
    let matchNumber = 1;
    let round = 1;

    // Round-robin: each team plays every other team
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        fixtures.push({
          round,
          matchNumber: matchNumber++,
          teamA: teams[i]._id,
          teamAName: teams[i].name,
          teamB: teams[j]._id,
          teamBName: teams[j].name,
        });
      }
      round++;
    }

    return fixtures;
  }

  static _generateGroupKnockoutFixtures(teams, groups) {
    // Group stage: round-robin within groups, then knockout from group toppers
    const fixtures = [];
    // Group assignment logic would go here based on seeding/random draw
    return fixtures;
  }

  static async updatePointsTable(tournamentId, matchResult) {
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) throw new Error('Tournament not found');

    const { winner, loser, isDraw, teamAId, teamBId } = matchResult;

    const updateTeam = (teamId, won, lost, draw) => {
      let entry = tournament.pointsTable.find(e => e.team?.toString() === teamId?.toString());
      if (!entry) {
        entry = {
          team: teamId,
          played: 0, won: 0, lost: 0, drawn: 0,
          points: 0, netRunRate: 0,
        };
        tournament.pointsTable.push(entry);
      }
      entry.played += 1;
      if (won) { entry.won += 1; entry.points += tournament.rules?.pointsForWin || 2; }
      if (lost) entry.lost += 1;
      if (draw) { entry.drawn += 1; entry.points += tournament.rules?.pointsForDraw || 1; }
    };

    if (isDraw) {
      updateTeam(teamAId, false, false, true);
      updateTeam(teamBId, false, false, true);
    } else {
      updateTeam(winner, true, false, false);
      updateTeam(loser, false, true, false);
    }

    // Sort points table
    tournament.pointsTable.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.netRunRate - a.netRunRate;
    });

    await tournament.save();
    return tournament;
  }
}

module.exports = TournamentService;
