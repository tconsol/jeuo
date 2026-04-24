const mongoose = require("mongoose");
const Match = require("./src/models/Match");
const Event = require("./src/models/Event");
const CricketScoring = require("./src/services/scoring/cricket.scoring");
require("dotenv").config();
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/athleon";
mongoose.connect(uri).then(async () => {
  try {
    const match = await Match.findOne({ sport: "cricket", status: "completed" }).lean();
    if (!match) {
      console.log("No completed cricket match found.");
    } else {
      console.log("Match found:", match?.teams?.home?.name, "vs", match?.teams?.away?.name);
      const events = await Event.find({ match: match._id, isUndone: false }).sort({ sequence: 1 }).lean();
      console.log("Events count:", events.length);
      const mapped = events.map(e => ({ type: e.type, team: e.team, player: e.player?.toString(), payload: e.payload, isUndone: false }));
      const state = CricketScoring.deriveScoreFromEvents(mapped, match.format || {});
      console.log("Innings count:", state.innings.length);
      state.innings.forEach((inn, i) => {
        console.log("Innings", i+1, "| battingTeam:", inn.battingTeam, "| runs:", inn.runs, "| wickets:", inn.wickets, "| battingCard keys:", Object.keys(inn.battingCard || {}).length, "| overHistory:", inn.overHistory?.length);
      });
    }
  } catch (e) {
    console.error("ENGINE ERROR:", e.message);
  } finally {
    mongoose.disconnect();
  }
}).catch(err => { console.error("CONN ERROR:", err); process.exit(1); });
