import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { matchSocket } from '../lib/socket';

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   CONSTANTS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const SPORT_META = {
  cricket:      { icon: 'ðŸ', color: 'from-indigo-600 to-violet-700',   accent: 'indigo', label: 'Cricket' },
  football:     { icon: 'âš½', color: 'from-emerald-600 to-emerald-800', accent: 'emerald', label: 'Football' },
  basketball:   { icon: 'ðŸ€', color: 'from-orange-500 to-orange-700',   accent: 'orange', label: 'Basketball' },
  tennis:       { icon: 'ðŸŽ¾', color: 'from-lime-600 to-green-700',      accent: 'green', label: 'Tennis' },
  badminton:    { icon: 'ðŸ¸', color: 'from-blue-600 to-blue-800',       accent: 'blue', label: 'Badminton' },
  table_tennis: { icon: 'ðŸ“', color: 'from-purple-600 to-purple-800',   accent: 'purple', label: 'Table Tennis' },
  volleyball:   { icon: 'ðŸ', color: 'from-amber-500 to-amber-700',     accent: 'amber', label: 'Volleyball' },
};

const CRICKET_SHOT_AREAS = [
  { id: 'fine_leg', label: 'Fine Leg', x: 15, y: 80 },
  { id: 'square_leg', label: 'Square Leg', x: 10, y: 50 },
  { id: 'mid_wicket', label: 'Mid Wicket', x: 20, y: 30 },
  { id: 'mid_on', label: 'Mid On', x: 38, y: 15 },
  { id: 'mid_off', label: 'Mid Off', x: 62, y: 15 },
  { id: 'cover', label: 'Cover', x: 80, y: 30 },
  { id: 'point', label: 'Point', x: 90, y: 50 },
  { id: 'third_man', label: 'Third Man', x: 85, y: 80 },
  { id: 'long_on', label: 'Long On', x: 35, y: 5 },
  { id: 'long_off', label: 'Long Off', x: 65, y: 5 },
  { id: 'deep_mid_wicket', label: 'Deep Mid Wicket', x: 15, y: 15 },
  { id: 'deep_cover', label: 'Deep Cover', x: 85, y: 15 },
];

const WICKET_TYPES = [
  { id: 'bowled', label: 'Bowled', icon: 'ðŸ' },
  { id: 'caught', label: 'Caught', icon: 'ðŸ¤²' },
  { id: 'lbw', label: 'LBW', icon: 'ðŸ¦µ' },
  { id: 'run_out', label: 'Run Out', icon: 'ðŸƒ' },
  { id: 'stumped', label: 'Stumped', icon: 'ðŸ§¤' },
  { id: 'hit_wicket', label: 'Hit Wicket', icon: 'ðŸ’¥' },
];

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ANIMATION OVERLAYS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function BoundaryAnimation({ type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2200); return () => clearTimeout(t); }, [onDone]);
  const isSix = type === 'six';
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
    >
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.6, repeat: 2 }}
          className="text-center"
        >
          <div className={`text-[120px] leading-none ${isSix ? 'drop-shadow-[0_0_40px_rgba(168,85,247,0.8)]' : 'drop-shadow-[0_0_40px_rgba(59,130,246,0.8)]'}`}>
            {isSix ? '6ï¸âƒ£' : '4ï¸âƒ£'}
          </div>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`text-4xl font-black mt-2 ${isSix ? 'text-purple-400' : 'text-blue-400'}`}
          >
            {isSix ? 'MAXIMUM!' : 'BOUNDARY!'}
          </motion.p>
        </motion.div>
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{
              x: Math.cos((i * 30) * Math.PI / 180) * 150,
              y: Math.sin((i * 30) * Math.PI / 180) * 150,
              opacity: 0,
            }}
            transition={{ duration: 1.5, delay: 0.2 }}
            className={`absolute top-1/2 left-1/2 w-3 h-3 rounded-full ${isSix ? 'bg-purple-400' : 'bg-blue-400'}`}
          />
        ))}
      </div>
    </motion.div>
  );
}

function WicketAnimation({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-red-900/30 backdrop-blur-sm pointer-events-none"
    >
      <motion.div
        initial={{ scale: 0.2, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 8 }}
        className="text-center"
      >
        <div className="text-[100px] leading-none">ðŸŽ³</div>
        <motion.p
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-5xl font-black text-red-400 mt-3"
        >OUT!</motion.p>
      </motion.div>
    </motion.div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   COIN TOSS COMPONENT
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function TossFlow({ match, onTossComplete }) {
  const [step, setStep] = useState('call');
  const [callingTeam, setCallingTeam] = useState('home');
  const [callerChoice, setCallerChoice] = useState('heads');
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState(null);

  const doFlip = async () => {
    setFlipping(true);
    try {
      const { data } = await api.post(`/scoring/${match._id}/toss`, {
        callingTeam,
        call: callerChoice,
      });
      const toss = data.data;
      setTimeout(() => {
        setResult(toss);
        setFlipping(false);
        setStep('decision');
      }, 2000);
    } catch {
      setFlipping(false);
    }
  };

  const setDecision = async (decision) => {
    try {
      await api.post(`/scoring/${match._id}/toss-decision`, { decision });
      onTossComplete({ ...result.toss, decision });
    } catch (err) {
      console.error('Toss decision failed', err);
    }
  };

  const homeName = match.teams?.home?.name || 'Home';
  const awayName = match.teams?.away?.name || 'Away';

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">ðŸª™ Coin Toss</h3>
      </div>
      <div className="p-6">
        <AnimatePresence mode="wait">
          {step === 'call' && !flipping && (
            <motion.div key="call" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-3">Who calls the toss?</p>
                <div className="grid grid-cols-2 gap-3">
                  {[['home', homeName], ['away', awayName]].map(([key, name]) => (
                    <button key={key} onClick={() => setCallingTeam(key)}
                      className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                        callingTeam === key ? 'bg-indigo-600 text-white shadow ring-2 ring-indigo-300' : 'bg-gray-100 text-gray-600 hover:bg-indigo-50'
                      }`}>{name}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-3">Call</p>
                <div className="grid grid-cols-2 gap-3">
                  {['heads', 'tails'].map((c) => (
                    <button key={c} onClick={() => setCallerChoice(c)}
                      className={`py-3 rounded-xl text-sm font-semibold capitalize transition-all ${
                        callerChoice === c ? 'bg-amber-500 text-white shadow ring-2 ring-amber-300' : 'bg-gray-100 text-gray-600 hover:bg-amber-50'
                      }`}>{c === 'heads' ? 'ðŸª™ Heads' : 'ðŸª™ Tails'}</button>
                  ))}
                </div>
              </div>
              <button onClick={doFlip}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold text-sm hover:shadow-lg transition active:scale-95">
                Flip Coin ðŸª™
              </button>
            </motion.div>
          )}

          {flipping && (
            <motion.div key="flip" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-8">
              <motion.div animate={{ rotateY: [0, 1800] }} transition={{ duration: 2, ease: 'easeInOut' }} className="text-8xl">ðŸª™</motion.div>
              <p className="text-gray-500 text-sm mt-4 animate-pulse">Flipping...</p>
            </motion.div>
          )}

          {step === 'decision' && result && (
            <motion.div key="decision" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="text-center py-4">
                <div className="text-6xl mb-3">ðŸª™</div>
                <p className="text-lg font-bold text-gray-900">It's <span className="text-amber-600 capitalize">{result.coinResult}</span>!</p>
                <p className="text-sm text-gray-500 mt-1">
                  <span className="font-semibold text-indigo-600">{result.toss.wonBy === 'home' ? homeName : awayName}</span> won the toss!
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-3">Choose to</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setDecision('bat')}
                    className="py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition active:scale-95 shadow">ðŸ Bat First</button>
                  <button onClick={() => setDecision('bowl')}
                    className="py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition active:scale-95 shadow">ðŸŽ¯ Bowl First</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PLAYER SELECTION (cricket)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function PlayerSelection({ match, toss, onConfirm }) {
  const [striker, setStriker] = useState('');
  const [nonStriker, setNonStriker] = useState('');
  const [bowler, setBowler] = useState('');

  const battingTeamKey = toss.wonBy === 'home'
    ? (toss.decision === 'bat' ? 'home' : 'away')
    : (toss.decision === 'bat' ? 'away' : 'home');
  const bowlingTeamKey = battingTeamKey === 'home' ? 'away' : 'home';

  const battingPlayers = match.teams?.[battingTeamKey]?.players || [];
  const bowlingPlayers = match.teams?.[bowlingTeamKey]?.players || [];
  const battingTeamName = match.teams?.[battingTeamKey]?.name || 'Batting Team';
  const bowlingTeamName = match.teams?.[bowlingTeamKey]?.name || 'Bowling Team';

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4">
        <h3 className="text-lg font-bold text-white">ðŸ‘¤ Select Opening Players</h3>
        <p className="text-indigo-200 text-xs mt-0.5">Choose opening batsmen and bowler</p>
      </div>
      <div className="p-6 space-y-5">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">ðŸ Striker ({battingTeamName})</label>
          <select value={striker} onChange={(e) => setStriker(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400">
            <option value="">Select striker...</option>
            {battingPlayers.map((p) => (
              <option key={p._id} value={p._id} disabled={p._id === nonStriker}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">ðŸ Non-Striker ({battingTeamName})</label>
          <select value={nonStriker} onChange={(e) => setNonStriker(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400">
            <option value="">Select non-striker...</option>
            {battingPlayers.map((p) => (
              <option key={p._id} value={p._id} disabled={p._id === striker}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">ðŸŽ¯ Opening Bowler ({bowlingTeamName})</label>
          <select value={bowler} onChange={(e) => setBowler(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400">
            <option value="">Select bowler...</option>
            {bowlingPlayers.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => onConfirm({
            striker: striker || battingPlayers[0]?._id,
            nonStriker: nonStriker || battingPlayers[1]?._id,
            bowler: bowler || bowlingPlayers[0]?._id,
            battingTeam: battingTeamKey,
            bowlingTeam: bowlingTeamKey,
          })}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm hover:shadow-lg transition active:scale-95"
        >Start Innings â–¶ï¸</button>
      </div>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SHOT AREA GROUND MAP
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function ShotAreaPicker({ onSelect, onCancel }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-800 text-sm">Select Shot Area</h4>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-xs">âœ• Skip</button>
      </div>
      <div className="relative w-full aspect-square max-w-[280px] mx-auto">
        <div className="absolute inset-0 rounded-full bg-gradient-to-b from-green-200 to-green-400 border-2 border-green-500/30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[30%] w-3 h-20 bg-amber-200 rounded-sm border border-amber-400/50" />
        {CRICKET_SHOT_AREAS.map((area) => (
          <button key={area.id} onClick={() => onSelect(area.id)}
            style={{ left: `${area.x}%`, top: `${area.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 group">
            <div className="w-7 h-7 rounded-full bg-white/80 border-2 border-indigo-400 flex items-center justify-center text-[8px] font-bold text-indigo-700 hover:bg-indigo-500 hover:text-white hover:scale-125 transition-all shadow-sm cursor-pointer">
              {area.label.split(' ').map(w => w[0]).join('')}
            </div>
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-gray-600 whitespace-nowrap opacity-0 group-hover:opacity-100 transition font-medium">
              {area.label}
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   CRICKET SCORER PANEL
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function CricketScorerPanel({ onEvent, match, score }) {
  const [extras, setExtras] = useState(null);
  const [showWicket, setShowWicket] = useState(false);
  const [showShotArea, setShowShotArea] = useState(false);
  const [pendingRuns, setPendingRuns] = useState(null);
  const [wicketType, setWicketType] = useState('');
  const [fielder, setFielder] = useState('');

  const innings = score?.currentInningsData;
  const bowlingTeamKey = innings?.bowlingTeam || 'away';
  const bowlingPlayers = match?.teams?.[bowlingTeamKey]?.players || [];
  const currentOverBalls = innings?.currentOver || [];

  const submitBall = (runs, shotArea) => {
    const payload = { type: 'delivery', data: { runs } };
    if (extras) {
      payload.data.isExtra = true;
      payload.data.extraType = extras;
      payload.data.extraRuns = runs;
    }
    if (shotArea) payload.data.shotArea = shotArea;
    onEvent(payload);
    setExtras(null);
    setShowShotArea(false);
    setPendingRuns(null);
  };

  const handleRunClick = (runs) => {
    if (runs >= 4 && !extras) {
      setPendingRuns(runs);
      setShowShotArea(true);
    } else {
      submitBall(runs);
    }
  };

  const submitWicket = () => {
    if (!wicketType) return;
    onEvent({ type: 'wicket', data: { wicketType, fielder: fielder || undefined, runs: 0 } });
    setShowWicket(false);
    setWicketType('');
    setFielder('');
  };

  const oversDisplay = innings
    ? `${Math.floor((innings.totalBalls || 0) / 6)}.${(innings.totalBalls || 0) % 6}`
    : '0.0';

  return (
    <div className="space-y-4">
      {/* Current state bar */}
      <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
        <div className="text-sm">
          <span className="text-gray-500">Over:</span>{' '}
          <span className="font-bold text-gray-900">{oversDisplay}</span>
        </div>
        <div className="flex gap-1.5">
          {currentOverBalls.map((ball, i) => (
            <span key={i}
              className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                ball.isWicket ? 'bg-red-500 text-white' :
                !ball.isLegalDelivery ? 'bg-amber-400 text-amber-900' :
                ball.runs === 4 ? 'bg-blue-500 text-white' :
                ball.runs === 6 ? 'bg-purple-500 text-white' :
                ball.runs === 0 ? 'bg-gray-200 text-gray-600' :
                'bg-indigo-100 text-indigo-700'
              }`}>
              {ball.isWicket ? 'W' : !ball.isLegalDelivery ? (ball.extraType?.[0]?.toUpperCase() || 'E') : ball.runs}
            </span>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showShotArea && (
          <ShotAreaPicker
            onSelect={(area) => submitBall(pendingRuns, area)}
            onCancel={() => submitBall(pendingRuns)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWicket && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 rounded-xl p-4 border border-red-200 space-y-3">
            <p className="text-sm font-semibold text-red-700">ðŸŽ³ How Out?</p>
            <div className="grid grid-cols-3 gap-2">
              {WICKET_TYPES.map((wt) => (
                <button key={wt.id} onClick={() => setWicketType(wt.id)}
                  className={`py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                    wicketType === wt.id ? 'bg-red-500 text-white ring-2 ring-red-300' : 'bg-white text-gray-700 hover:bg-red-100 border border-red-200'
                  }`}>{wt.icon} {wt.label}</button>
              ))}
            </div>
            {(wicketType === 'caught' || wicketType === 'run_out' || wicketType === 'stumped') && (
              <div>
                <label className="text-xs font-medium text-red-600 mb-1 block">
                  {wicketType === 'caught' ? 'Caught by' : wicketType === 'run_out' ? 'Run out by' : 'Stumped by'}
                </label>
                <select value={fielder} onChange={(e) => setFielder(e.target.value)}
                  className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm">
                  <option value="">Select player...</option>
                  {bowlingPlayers.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={submitWicket} disabled={!wicketType}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold disabled:opacity-40 transition active:scale-95">Confirm Wicket</button>
              <button onClick={() => { setShowWicket(false); setWicketType(''); }}
                className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showWicket && !showShotArea && (
        <>
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-widest">Runs</p>
            <div className="grid grid-cols-7 gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map((r) => (
                <button key={r} onClick={() => handleRunClick(r)}
                  className={`py-3.5 rounded-xl text-lg font-bold transition-all active:scale-95 shadow-sm ${
                    r === 4 ? 'bg-blue-500 hover:bg-blue-600 text-white' :
                    r === 6 ? 'bg-purple-500 hover:bg-purple-600 text-white' :
                    'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>{r}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-widest">Extras</p>
            <div className="flex gap-2 flex-wrap">
              {['wide', 'no_ball', 'bye', 'leg_bye'].map((e) => (
                <button key={e} onClick={() => setExtras(extras === e ? null : e)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                    extras === e ? 'bg-amber-400 text-amber-900 shadow-sm ring-2 ring-amber-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>{e.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowWicket(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 transition active:scale-95">ðŸŽ³ Wicket</button>
            <button onClick={() => onEvent({ type: 'end_over' })}
              className="px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition active:scale-95">End Over</button>
            <button onClick={() => onEvent({ type: 'end_innings' })}
              className="px-4 py-2.5 rounded-xl text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition active:scale-95">End Innings</button>
          </div>
        </>
      )}
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   OTHER SPORT SCORER PANELS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function FootballScorerPanel({ onEvent, match }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5">
        {['home', 'away'].map((team) => (
          <div key={team} className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 text-center">{match?.teams?.[team]?.name || team}</p>
            <button onClick={() => onEvent({ type: 'goal', team, data: {} })}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-sm font-bold transition active:scale-95">âš½ Goal</button>
            <button onClick={() => onEvent({ type: 'yellow_card', team, data: {} })}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 py-2.5 rounded-xl text-xs font-bold transition active:scale-95">ðŸŸ¨ Yellow</button>
            <button onClick={() => onEvent({ type: 'red_card', team, data: {} })}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-xs font-bold transition active:scale-95">ðŸŸ¥ Red</button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-3 border-t">
        <button onClick={() => onEvent({ type: 'half_time' })} className="px-4 py-2 rounded-xl text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition">Half Time</button>
        <button onClick={() => onEvent({ type: 'full_time' })} className="px-4 py-2 rounded-xl text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition">Full Time</button>
      </div>
    </div>
  );
}

function BasketballScorerPanel({ onEvent, match }) {
  return (
    <div className="space-y-4">
      {['home', 'away'].map((team) => (
        <div key={team}>
          <p className="text-xs font-semibold text-gray-500 mb-2">{match?.teams?.[team]?.name || team}</p>
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => onEvent({ type: 'field_goal_2pt', team, data: { made: true } })}
              className="bg-orange-500 text-white py-3 rounded-xl text-lg font-bold transition active:scale-95">+2</button>
            <button onClick={() => onEvent({ type: 'field_goal_3pt', team, data: { made: true } })}
              className="bg-indigo-500 text-white py-3 rounded-xl text-lg font-bold transition active:scale-95">+3</button>
            <button onClick={() => onEvent({ type: 'free_throw', team, data: { made: true } })}
              className="bg-amber-400 text-amber-900 py-3 rounded-xl text-lg font-bold transition active:scale-95">FT</button>
          </div>
        </div>
      ))}
      <button onClick={() => onEvent({ type: 'quarter_end' })}
        className="w-full px-4 py-2 rounded-xl text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition">End Quarter</button>
    </div>
  );
}

function GenericScorerPanel({ onEvent, match }) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Point Won By</p>
      <div className="grid grid-cols-2 gap-3">
        {['home', 'away'].map((team) => (
          <button key={team} onClick={() => onEvent({ type: 'rally_point', team, data: { winner: team } })}
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl text-base font-bold transition active:scale-95">
            {match?.teams?.[team]?.name || team}
          </button>
        ))}
      </div>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SCORECARD
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function CricketScorecard({ score, match }) {
  const innings = score?.currentInningsData;
  const allInnings = [...(score?.innings || [])];
  if (innings && !innings.isComplete) allInnings.push(innings);
  if (allInnings.length === 0) return <p className="text-center text-gray-400 text-sm py-8">No innings data yet</p>;

  const playerName = (id) => {
    const all = [...(match?.teams?.home?.players || []), ...(match?.teams?.away?.players || [])];
    const p = all.find(x => (x._id || x) === id || (x._id || x)?.toString?.() === id?.toString?.());
    return p?.name || id?.toString?.()?.slice(-6) || 'â€”';
  };

  return (
    <div className="space-y-6">
      {allInnings.map((inn, idx) => (
        <div key={idx} className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-gray-800">
              {inn.battingTeam === 'home' ? match?.teams?.home?.name : inn.battingTeam === 'away' ? match?.teams?.away?.name : `Innings ${idx + 1}`}
            </h4>
            <span className="text-sm font-bold text-indigo-600">
              {inn.runs}/{inn.wickets} ({Math.floor((inn.totalBalls || 0) / 6)}.{(inn.totalBalls || 0) % 6} ov)
            </span>
          </div>
          {Object.keys(inn.battingCard || {}).length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="text-left py-2 pr-2">Batter</th>
                    <th className="text-right px-2">R</th>
                    <th className="text-right px-2">B</th>
                    <th className="text-right px-2">4s</th>
                    <th className="text-right px-2">6s</th>
                    <th className="text-right pl-2">SR</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(inn.battingCard).map(([pid, card]) => (
                    <tr key={pid} className="border-b border-gray-50">
                      <td className="py-2 pr-2 font-medium text-gray-800">{playerName(pid)}</td>
                      <td className="text-right px-2 font-bold">{card.runs}</td>
                      <td className="text-right px-2 text-gray-500">{card.balls}</td>
                      <td className="text-right px-2 text-blue-600">{card.fours}</td>
                      <td className="text-right px-2 text-purple-600">{card.sixes}</td>
                      <td className="text-right pl-2 text-gray-500">{card.strikeRate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {Object.keys(inn.bowlingCard || {}).length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-100">
                    <th className="text-left py-2 pr-2">Bowler</th>
                    <th className="text-right px-2">O</th>
                    <th className="text-right px-2">M</th>
                    <th className="text-right px-2">R</th>
                    <th className="text-right px-2">W</th>
                    <th className="text-right pl-2">Econ</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(inn.bowlingCard).map(([pid, card]) => (
                    <tr key={pid} className="border-b border-gray-50">
                      <td className="py-2 pr-2 font-medium text-gray-800">{playerName(pid)}</td>
                      <td className="text-right px-2">{card.overs}.{card.balls % 6}</td>
                      <td className="text-right px-2 text-gray-500">{card.maidens}</td>
                      <td className="text-right px-2">{card.runs}</td>
                      <td className="text-right px-2 font-bold text-red-600">{card.wickets}</td>
                      <td className="text-right pl-2 text-gray-500">{card.economy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {inn.extras && (
            <p className="text-xs text-gray-500">
              Extras: {inn.extras.wides || 0}w, {inn.extras.noBalls || 0}nb, {inn.extras.byes || 0}b, {inn.extras.legByes || 0}lb
            </p>
          )}
          {inn.fow?.length > 0 && (
            <div className="text-xs text-gray-500">
              <span className="font-medium">FOW: </span>
              {inn.fow.map((f, i) => (
                <span key={i}>{f.runs}/{f.wicket} ({f.overs} ov){i < inn.fow.length - 1 ? ', ' : ''}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function GenericScorecard({ score, match, sport }) {
  if (!score) return <p className="text-center text-gray-400 text-sm py-8">No score data</p>;
  return (
    <div className="grid grid-cols-2 gap-4">
      {['home', 'away'].map((team) => (
        <div key={team} className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">{match?.teams?.[team]?.name || team}</p>
          <p className="text-3xl font-bold text-gray-900">
            {sport === 'football' ? (score?.[team]?.goals ?? 0) :
             sport === 'basketball' ? (score?.[team]?.points ?? 0) :
             (score?.[team]?.points ?? score?.[team]?.score ?? 0)}
          </p>
        </div>
      ))}
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   COMMENTARY FEED
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function CommentaryFeed({ matchId, commentary: initial }) {
  const [commentary, setCommentary] = useState(initial || []);
  useEffect(() => { setCommentary(initial || []); }, [initial]);

  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const { data } = await api.get(`/scoring/${matchId}/commentary`);
        if (data?.data?.commentary) setCommentary(data.data.commentary);
      } catch { /* ignore */ }
    }, 10000);
    return () => clearInterval(iv);
  }, [matchId]);

  if (!commentary.length) return <p className="text-center text-gray-400 text-sm py-8">Commentary will appear here once the match starts</p>;

  const styles = {
    boundary: 'bg-blue-50 border-blue-200 text-blue-800',
    six: 'bg-purple-50 border-purple-200 text-purple-800',
    wicket: 'bg-red-50 border-red-200 text-red-800',
    extra: 'bg-amber-50 border-amber-200 text-amber-800',
    milestone: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    normal: 'bg-gray-50 border-gray-200 text-gray-700',
    info: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  };

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {[...commentary].reverse().map((c, i) => (
        <div key={i} className={`rounded-xl px-4 py-2.5 border text-sm ${styles[c.type] || styles.normal}`}>
          {c.over && <span className="font-mono font-bold text-xs mr-2 opacity-60">{c.over}</span>}
          {c.text}
        </div>
      ))}
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MATCH INFO TAB
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function MatchInfo({ match }) {
  const homeName = match?.teams?.home?.name || 'Home';
  const awayName = match?.teams?.away?.name || 'Away';

  return (
    <div className="space-y-4">
      {match?.toss?.wonBy && (
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <p className="text-sm font-semibold text-amber-800">ðŸª™ Toss</p>
          <p className="text-sm text-amber-700 mt-1">
            {match.toss.wonBy === 'home' ? homeName : awayName} won the toss and chose to{' '}
            <span className="font-bold">{match.toss.decision}</span> first
          </p>
        </div>
      )}
      {['home', 'away'].map((team) => (
        <div key={team} className="bg-white rounded-xl p-4 border border-gray-100">
          <h4 className="text-sm font-bold text-gray-800 mb-3">{match?.teams?.[team]?.name || team}</h4>
          <div className="flex flex-wrap gap-2">
            {(match?.teams?.[team]?.players || []).map((p) => (
              <span key={p._id} className="inline-flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1 text-xs text-gray-700 border border-gray-100">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">{p.name?.[0]?.toUpperCase()}</span>
                {p.name}
              </span>
            ))}
          </div>
        </div>
      ))}
      <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-2 text-sm">
        {match?.venue?.name && <div className="flex justify-between"><span className="text-gray-500">Venue</span><span className="font-medium text-gray-800">ðŸ“ {match.venue.name}</span></div>}
        {match?.sport && <div className="flex justify-between"><span className="text-gray-500">Sport</span><span className="font-medium text-gray-800 capitalize">{match.sport.replace('_', ' ')}</span></div>}
        {match?.format?.overs && <div className="flex justify-between"><span className="text-gray-500">Format</span><span className="font-medium text-gray-800">{match.format.overs} overs</span></div>}
        {match?.scheduledAt && <div className="flex justify-between"><span className="text-gray-500">Scheduled</span><span className="font-medium text-gray-800">{new Date(match.scheduledAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>}
        {match?.result?.summary && <div className="flex justify-between"><span className="text-gray-500">Result</span><span className="font-medium text-emerald-700">{match.result.summary}</span></div>}
      </div>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN LIVE SCORING PAGE
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export default function LiveScoring() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [match, setMatch] = useState(null);
  const [score, setScore] = useState(null);
  const [events, setEvents] = useState([]);
  const [commentary, setCommentary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('live');
  const [animation, setAnimation] = useState(null);
  const [matchPhase, setMatchPhase] = useState('loading');

  const isScorer = match?.scorers?.some(
    s => (s._id || s)?.toString() === user?._id
  );

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(`/scoring/${matchId}`);
        const payload = data.data || data;
        const m = payload.match;
        setMatch(m);
        setScore(payload.score);
        setEvents(payload.events || []);
        setCommentary(m?.commentary || []);

        if (m.status === 'completed') setMatchPhase('completed');
        else if (m.status === 'live') {
          const sc = payload.score;
          const innings = sc?.currentInningsData;
          if (!innings?.battingTeam && !innings?.batsmen?.striker) setMatchPhase('player_select');
          else setMatchPhase('scoring');
        } else if (m.status === 'scheduled') {
          if (m.toss?.wonBy && m.toss?.decision) setMatchPhase('player_select');
          else setMatchPhase('toss');
        } else {
          setMatchPhase('scoring');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load match');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [matchId]);

  useEffect(() => {
    if (!matchId) return;
    matchSocket.connect();
    matchSocket.emit('match:join', matchId);
    const onScoreUpdate = (data) => {
      setScore(data.score);
      if (data.event) setEvents((prev) => [...prev, data.event]);
    };
    matchSocket.on('score:update', onScoreUpdate);
    return () => {
      matchSocket.emit('match:leave', matchId);
      matchSocket.off('score:update', onScoreUpdate);
    };
  }, [matchId]);

  const handleEvent = useCallback(async (event) => {
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await api.post(`/scoring/${matchId}/events`, event);
      const result = data.data;
      if (result?.score) setScore(result.score);
      if (result?.event) setEvents(prev => [...prev, result.event]);

      const runs = event.data?.runs;
      if (event.type === 'wicket') setAnimation({ type: 'wicket' });
      else if (runs === 6) setAnimation({ type: 'six' });
      else if (runs === 4) setAnimation({ type: 'four' });

      try {
        const { data: cData } = await api.get(`/scoring/${matchId}/commentary`);
        if (cData?.data?.commentary) setCommentary(cData.data.commentary);
      } catch { /* ignore */ }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record event');
    } finally {
      setSubmitting(false);
    }
  }, [matchId]);

  const handleUndo = useCallback(async () => {
    try {
      const { data } = await api.post(`/scoring/${matchId}/undo`);
      if (data.data?.score) setScore(data.data.score);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to undo');
    }
  }, [matchId]);

  const handleStartMatch = useCallback(async () => {
    try {
      await api.post(`/scoring/${matchId}/start`);
      const { data } = await api.get(`/scoring/${matchId}`);
      const payload = data.data || data;
      setMatch(payload.match);
      setScore(payload.score);
      setMatchPhase('player_select');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start match');
    }
  }, [matchId]);

  const handleEndMatch = useCallback(async () => {
    try {
      const { data } = await api.post(`/scoring/${matchId}/end`);
      setMatch(data.data?.match);
      setMatchPhase('completed');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to end match');
    }
  }, [matchId]);

  const handleTossComplete = (toss) => {
    setMatch(prev => ({ ...prev, toss }));
    setMatchPhase('player_select');
  };

  const handlePlayerConfirm = async (playerData) => {
    try {
      if (match.status === 'scheduled') await api.post(`/scoring/${matchId}/start`);
      await api.post(`/scoring/${matchId}/players`, playerData);
      const { data } = await api.get(`/scoring/${matchId}`);
      const payload = data.data || data;
      setMatch(payload.match);
      setScore(payload.score);
      setMatchPhase('scoring');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set players');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading matchâ€¦</p>
      </div>
    );
  }

  if (error && !match) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-3xl">âš ï¸</div>
        <p className="text-red-600 font-medium">{error}</p>
        <button onClick={() => navigate(-1)} className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition text-sm font-medium">â† Go Back</button>
      </div>
    );
  }

  if (!match) return null;

  const meta = SPORT_META[match.sport] || SPORT_META.cricket;
  const teamAName = match.teams?.home?.name || 'Team A';
  const teamBName = match.teams?.away?.name || 'Team B';
  const innings = score?.currentInningsData;

  const getHeaderScore = () => {
    if (!score) return null;
    if (match.sport === 'cricket' && innings) {
      return {
        home: innings.battingTeam === 'home' ? `${innings.runs}/${innings.wickets}` : (score.innings?.[0]?.runs !== undefined ? `${score.innings[0].runs}/${score.innings[0].wickets}` : 'â€”'),
        away: innings.battingTeam === 'away' ? `${innings.runs}/${innings.wickets}` : (score.innings?.[0]?.runs !== undefined ? `${score.innings[0].runs}/${score.innings[0].wickets}` : 'â€”'),
        overs: `${Math.floor((innings.totalBalls || 0) / 6)}.${(innings.totalBalls || 0) % 6} ov`,
      };
    }
    return null;
  };
  const headerScore = getHeaderScore();

  const TABS = [
    { id: 'live', label: 'Live', icon: 'ðŸ“º' },
    { id: 'scorecard', label: 'Scorecard', icon: 'ðŸ“Š' },
    { id: 'commentary', label: 'Commentary', icon: 'ðŸŽ™ï¸' },
    { id: 'info', label: 'Info', icon: 'â„¹ï¸' },
  ];

  const getScorerPanel = () => {
    switch (match.sport) {
      case 'cricket': return <CricketScorerPanel onEvent={handleEvent} match={match} score={score} />;
      case 'football': return <FootballScorerPanel onEvent={handleEvent} match={match} />;
      case 'basketball': return <BasketballScorerPanel onEvent={handleEvent} match={match} />;
      default: return <GenericScorerPanel onEvent={handleEvent} match={match} />;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      className="max-w-2xl mx-auto pt-4 pb-28 space-y-4 px-4">

      <AnimatePresence>
        {animation?.type === 'four' && <BoundaryAnimation type="four" onDone={() => setAnimation(null)} />}
        {animation?.type === 'six' && <BoundaryAnimation type="six" onDone={() => setAnimation(null)} />}
        {animation?.type === 'wicket' && <WicketAnimation onDone={() => setAnimation(null)} />}
      </AnimatePresence>

      {/* Hero Header */}
      <div className={`bg-gradient-to-br ${meta.color} rounded-2xl p-5 text-white shadow-lg relative overflow-hidden`}>
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
        <div className="flex items-center justify-between mb-3 relative z-10">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-sm">â† Back</button>
          <div className="flex items-center gap-2">
            {match.status === 'live' && (
              <span className="flex items-center gap-1.5 text-xs font-semibold bg-red-500 px-3 py-1 rounded-full animate-pulse">
                <span className="w-1.5 h-1.5 bg-white rounded-full" /> LIVE
              </span>
            )}
            {match.status === 'scheduled' && <span className="text-xs font-semibold bg-white/15 px-3 py-1 rounded-full">Scheduled</span>}
            {match.status === 'completed' && <span className="text-xs font-semibold bg-emerald-500 px-3 py-1 rounded-full">Completed</span>}
          </div>
        </div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex-1 text-center">
            <p className="text-white/60 text-xs mb-1">{teamAName}</p>
            <p className="text-3xl font-black">{headerScore?.home || 'â€”'}</p>
          </div>
          <div className="px-4">
            <div className="text-3xl">{meta.icon}</div>
            {headerScore?.overs && <p className="text-white/50 text-xs text-center mt-1">{headerScore.overs}</p>}
          </div>
          <div className="flex-1 text-center">
            <p className="text-white/60 text-xs mb-1">{teamBName}</p>
            <p className="text-3xl font-black">{headerScore?.away || 'â€”'}</p>
          </div>
        </div>
        {innings?.target && (
          <p className="text-center text-white/70 text-xs mt-2">
            Target: {innings.target} | Need {innings.target - innings.runs} from {((score?.oversPerInnings || match.format?.overs || 20) * 6 - (innings.totalBalls || 0))} balls
          </p>
        )}
        {match.result?.summary && (
          <div className="mt-3 bg-white/15 rounded-xl px-4 py-2 text-center">
            <p className="text-sm font-bold">{match.result.summary}</p>
          </div>
        )}
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700 ml-2 font-bold">âœ•</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toss (scorer only) */}
      {matchPhase === 'toss' && isScorer && <TossFlow match={match} onTossComplete={handleTossComplete} />}

      {/* Player selection (scorer, cricket) */}
      {matchPhase === 'player_select' && isScorer && match.sport === 'cricket' && (
        <PlayerSelection match={match} toss={match.toss || {}} onConfirm={handlePlayerConfirm} />
      )}

      {/* Non-cricket: skip player selection */}
      {matchPhase === 'player_select' && isScorer && match.sport !== 'cricket' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center space-y-4">
          <div className="text-4xl">{meta.icon}</div>
          <h3 className="text-lg font-bold text-gray-900">Ready to start?</h3>
          <button onClick={async () => {
            if (match.status === 'scheduled') await api.post(`/scoring/${matchId}/start`);
            const { data } = await api.get(`/scoring/${matchId}`);
            setMatch(data.data?.match);
            setScore(data.data?.score);
            setMatchPhase('scoring');
          }} className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition active:scale-95">
            Start Scoring â–¶ï¸
          </button>
        </div>
      )}

      {/* Waiting screen for non-scorers */}
      {match.status === 'scheduled' && !isScorer && (
        <div className="bg-gray-50 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">{meta.icon}</div>
          <h3 className="text-lg font-bold text-gray-900">Match Not Started</h3>
          <p className="text-sm text-gray-500 mt-1">Waiting for the scorer to start this match</p>
        </div>
      )}

      {/* Tabs */}
      {(matchPhase === 'scoring' || matchPhase === 'completed') && (
        <>
          <div className="flex bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {TABS.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-xs font-semibold transition-all ${
                  activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-50'
                }`}>
                <span className="mr-1">{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'live' && (
              <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {match.status === 'live' && isScorer && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50/50">
                      <div className="flex items-center gap-2">
                        <span>{meta.icon}</span>
                        <span className="text-sm font-semibold text-gray-700">Scorer Panel</span>
                      </div>
                      <button onClick={handleUndo} disabled={events.length === 0}
                        className="flex items-center gap-1.5 text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 disabled:opacity-30 transition">â†© Undo</button>
                    </div>
                    <div className={`p-5 ${submitting ? 'opacity-50 pointer-events-none' : ''}`}>
                      {submitting && (
                        <div className="flex items-center justify-center gap-2 mb-3 text-xs text-indigo-500">
                          <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /> Savingâ€¦
                        </div>
                      )}
                      {getScorerPanel()}
                    </div>
                  </div>
                )}
                {match.status === 'live' && !isScorer && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
                    <p className="text-gray-500 text-sm">ðŸ“º Watching live â€” only authorized scorers can update the score</p>
                  </div>
                )}
                {match.status === 'live' && isScorer && (
                  <button onClick={handleEndMatch}
                    className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition active:scale-95">ðŸ End Match</button>
                )}
                {commentary.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                      <p className="text-sm font-semibold text-gray-700">ðŸŽ™ï¸ Latest</p>
                    </div>
                    <div className="p-4 space-y-2">
                      {[...commentary].reverse().slice(0, 5).map((c, i) => (
                        <div key={i} className="text-sm text-gray-600">
                          {c.over && <span className="font-mono text-xs text-gray-400 mr-2">{c.over}</span>}
                          {c.text}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
            {activeTab === 'scorecard' && (
              <motion.div key="scorecard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  {match.sport === 'cricket' ? <CricketScorecard score={score} match={match} /> : <GenericScorecard score={score} match={match} sport={match.sport} />}
                </div>
              </motion.div>
            )}
            {activeTab === 'commentary' && (
              <motion.div key="commentary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <CommentaryFeed matchId={matchId} commentary={commentary} />
                </div>
              </motion.div>
            )}
            {activeTab === 'info' && (
              <motion.div key="info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <MatchInfo match={match} />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}
