const { Worker } = require('bullmq');
const { getRedis } = require('../config/redis');
const logger = require('../config/logger');
const Match = require('../models/Match');
const Event = require('../models/Event');
const ScoringService = require('../services/scoring');

let scoreRecalcWorker = null;

function createScoreRecalcWorker() {
  const redis = getRedis();

  // Score recalculation worker — replays all events to rebuild score
  scoreRecalcWorker = new Worker(
    'score-recalculation',
    async (job) => {
      const { matchId } = job.data;
      logger.info({ matchId }, 'Recalculating score');

      const match = await Match.findById(matchId);
      if (!match) throw new Error(`Match ${matchId} not found`);

      const events = await Event.find({ match: matchId, isUndone: { $ne: true } }).sort({ sequence: 1 });

      const engine = ScoringService.getEngine(match.sport);
      let score = engine.createInitialScore(match.sportConfig || {});

      for (const event of events) {
        score = engine.processEvent(score, { type: event.type, data: event.data });
      }

      await Match.findByIdAndUpdate(matchId, {
        liveScore: score,
        $inc: { scoreVersion: 1 },
      });

      logger.info({ matchId, eventCount: events.length }, 'Score recalculated');
    },
    { connection: redis, concurrency: 2 }
  );

  scoreRecalcWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, matchId: job?.data?.matchId, err: err.message }, 'Score recalculation failed');
  });

  return scoreRecalcWorker;
}

module.exports = { createScoreRecalcWorker, getWorker: () => scoreRecalcWorker };
