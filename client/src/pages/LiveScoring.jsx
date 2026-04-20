import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { matchSocket } from '../lib/socket';
import {
  FiArrowLeft, FiPlay, FiFlag, FiRadio, FiBarChart2, FiMic, FiInfo, FiX,
  FiAlertTriangle, FiUser, FiMapPin, FiRotateCcw, FiTarget, FiTv, FiSquare, FiCheck,
} from 'react-icons/fi';
import {
  GiCricketBat, GiSoccerBall, GiBasketballBall, GiTennisBall,
  GiShuttlecock, GiVolleyballBall, GiPingPongBat, GiCoins,
} from 'react-icons/gi';
import { MdDirectionsRun } from 'react-icons/md';
import { BiSolidHandRight } from 'react-icons/bi';
import coinFlipMp3 from '../assets/freesound_community-coin-flip-88793.mp3';

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════ */

const SPORT_META = {
  cricket:      { icon: GiCricketBat,     color: 'from-indigo-600 to-violet-700',   accent: 'indigo',  label: 'Cricket' },
  football:     { icon: GiSoccerBall,     color: 'from-emerald-600 to-emerald-800', accent: 'emerald', label: 'Football' },
  basketball:   { icon: GiBasketballBall, color: 'from-orange-500 to-orange-700',   accent: 'orange',  label: 'Basketball' },
  tennis:       { icon: GiTennisBall,     color: 'from-lime-600 to-green-700',      accent: 'green',   label: 'Tennis' },
  badminton:    { icon: GiShuttlecock,      color: 'from-blue-600 to-blue-800',       accent: 'blue',    label: 'Badminton' },
  table_tennis: { icon: GiPingPongBat,    color: 'from-purple-600 to-purple-800',   accent: 'purple',  label: 'Table Tennis' },
  volleyball:   { icon: GiVolleyballBall, color: 'from-amber-500 to-amber-700',     accent: 'amber',   label: 'Volleyball' },
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
  { id: 'bowled',     label: 'Bowled',     icon: GiCricketBat },
  { id: 'caught',     label: 'Caught',     icon: BiSolidHandRight },
  { id: 'lbw',        label: 'LBW',        icon: FiTarget },
  { id: 'run_out',    label: 'Run Out',    icon: MdDirectionsRun },
  { id: 'stumped',    label: 'Stumped',    icon: FiSquare },
  { id: 'hit_wicket', label: 'Hit Wicket', icon: FiAlertTriangle },
];

/* ANIMATION OVERLAYS */

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
          <div className={`text-[120px] leading-none font-black ${isSix ? 'text-purple-400 drop-shadow-[0_0_40px_rgba(168,85,247,0.8)]' : 'text-blue-400 drop-shadow-[0_0_40px_rgba(59,130,246,0.8)]'}`}>
            {isSix ? '6' : '4'}
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
        <div className="flex justify-center mb-2"><GiCricketBat size={96} className="text-red-300" /></div>
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

/* COIN TOSS COMPONENT */

function TossFlow({ match, onTossComplete }) {
  const [step, setStep] = useState('call');
  const [callingTeam, setCallingTeam] = useState('home');
  const [callerChoice, setCallerChoice] = useState('heads');
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const playCoinSound = () => {
    try {
      const audio = new Audio(coinFlipMp3);
      audio.play().catch(() => {});
    } catch { /* ignore */ }
  };

  const doFlip = async () => {
    setFlipping(true);
    playCoinSound();
    try {
      const { data } = await api.post(`/scoring/${match._id}/toss`, {
        callingTeam,
        call: callerChoice,
      });
      const toss = data.data;
      setTimeout(() => {
        setResult(toss);
        setFlipping(false);
        setShowResult(true);
      }, 2600);
    } catch {
      setFlipping(false);
    }
  };

  const proceedToDecision = () => { setShowResult(false); setStep('decision'); };

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
  const isHeads = result?.coinResult === 'heads';

  const CoinHeads = ({ style = {} }) => (
    <div style={{ backfaceVisibility: 'hidden', borderRadius: '50%', position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #fde68a 0%, #f59e0b 45%, #b45309 100%)', boxShadow: 'inset 0 4px 8px rgba(255,255,200,0.5), inset 0 -4px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(245,158,11,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '4px solid rgba(180,83,9,0.3)', ...style }}>
      <span style={{ fontSize: 36, fontWeight: 900, color: '#78350f', lineHeight: 1 }}>H</span>
      <span style={{ fontSize: 10, fontWeight: 700, color: '#92400e', letterSpacing: 2, marginTop: 2 }}>HEADS</span>
    </div>
  );

  const CoinTails = ({ style = {} }) => (
    <div style={{ backfaceVisibility: 'hidden', transform: 'rotateX(180deg)', borderRadius: '50%', position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 45%, #475569 100%)', boxShadow: 'inset 0 4px 8px rgba(255,255,255,0.4), inset 0 -4px 8px rgba(0,0,0,0.2), 0 8px 32px rgba(100,116,139,0.4)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '4px solid rgba(71,85,105,0.3)', ...style }}>
      <span style={{ fontSize: 36, fontWeight: 900, color: '#1e293b', lineHeight: 1 }}>T</span>
      <span style={{ fontSize: 10, fontWeight: 700, color: '#334155', letterSpacing: 2, marginTop: 2 }}>TAILS</span>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-amber-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-yellow-400 px-6 py-4 flex items-center gap-3">
        <div>
          <h3 className="text-base font-bold text-white">Coin Toss</h3>
          <p className="text-xs text-amber-100">Decide who bats first</p>
        </div>
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {/* Step 1: pick team + call */}
          {step === 'call' && !flipping && !showResult && (
            <motion.div key="call" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              {/* Live coin preview flips on selection */}
              <div className="flex justify-center py-2">
                <div style={{ perspective: '800px' }}>
                  <div style={{ transformStyle: 'preserve-3d', width: 112, height: 112, position: 'relative', transition: 'transform 0.6s cubic-bezier(0.4,0,0.2,1)', transform: `rotateX(${callerChoice === 'heads' ? 0 : 180}deg)` }}>
                    <CoinHeads />
                    <CoinTails />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Who calls the toss?</p>
                <div className="grid grid-cols-2 gap-3">
                  {[['home', homeName], ['away', awayName]].map(([key, name]) => (
                    <button key={key} onClick={() => setCallingTeam(key)}
                      className={`py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                        callingTeam === key ? 'bg-primary-600 text-white shadow-md ring-2 ring-primary-300' : 'bg-gray-100 text-gray-600 hover:bg-primary-50 hover:text-primary-700'
                      }`}>{name}</button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Call</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setCallerChoice('heads')}
                    className={`py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      callerChoice === 'heads' ? 'bg-amber-400 text-amber-900 shadow-md ring-2 ring-amber-300' : 'bg-gray-100 text-gray-600 hover:bg-amber-50'
                    }`}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#fde68a,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#78350f' }}>H</span>
                    Heads
                  </button>
                  <button onClick={() => setCallerChoice('tails')}
                    className={`py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      callerChoice === 'tails' ? 'bg-slate-400 text-white shadow-md ring-2 ring-slate-300' : 'bg-gray-100 text-gray-600 hover:bg-slate-50'
                    }`}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#cbd5e1,#64748b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#1e293b' }}>T</span>
                    Tails
                  </button>
                </div>
              </div>

              <button onClick={doFlip}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-amber-900 font-black text-base hover:from-amber-600 hover:to-yellow-500 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2">
                Flip Coin
              </button>
            </motion.div>
          )}

          {/* Flipping animation */}
          {flipping && (
            <motion.div key="flip" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-10 gap-6">
              <div style={{ perspective: '800px' }}>
                <motion.div
                  style={{ transformStyle: 'preserve-3d', width: 128, height: 128, position: 'relative' }}
                  animate={{ rotateX: [0, 360 * 7], y: [0, -70, 0, -50, 0, -25, 0, -10, 0] }}
                  transition={{ duration: 2.4, ease: [0.22, 0.8, 0.5, 1] }}
                >
                  <CoinHeads />
                  <CoinTails />
                </motion.div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <motion.div key={i} animate={{ scale: [1,1.4,1], opacity: [0.4,1,0.4] }} transition={{ duration: 0.6, delay: i*0.2, repeat: Infinity }} className="w-2 h-2 rounded-full bg-amber-400" />
                  ))}
                </div>
                <p className="text-amber-600 font-semibold text-sm">Flipping the coin...</p>
              </div>
            </motion.div>
          )}

          {/* Result reveal */}
          {showResult && result && !flipping && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', damping: 12 }} className="flex flex-col items-center py-6 gap-5">
              <motion.div
                style={{ perspective: '800px', transformStyle: 'preserve-3d', position: 'relative', width: 136, height: 136 }}
                animate={{ rotateX: isHeads ? 0 : 180 }}
                transition={{ duration: 0.5 }}
              >
                <CoinHeads />
                <CoinTails />
              </motion.div>

              <div className="text-center">
                <p className="text-3xl font-black text-gray-900 capitalize">{result.coinResult}!</p>
                <p className="text-gray-500 text-sm mt-1.5">
                  <span className="font-bold text-primary-600">{result.toss.wonBy === 'home' ? homeName : awayName}</span>
                  {' '}won the toss
                </p>
              </div>

              <button onClick={proceedToDecision}
                className="px-8 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm transition active:scale-95 shadow-lg shadow-primary-500/25 flex items-center gap-2">
                Choose to bat or bowl <span>→</span>
              </button>
            </motion.div>
          )}

          {/* Decision step */}
          {step === 'decision' && result && !showResult && (
            <motion.div key="decision" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              <div className="text-center py-2">
                <p className="text-sm text-gray-500">
                  <span className="font-bold text-primary-600">{result.toss.wonBy === 'home' ? homeName : awayName}</span>
                  {' '}won the toss — choose to
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setDecision('bat')}
                  className="py-6 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white font-bold text-sm transition active:scale-95 shadow-xl shadow-primary-500/25 flex flex-col items-center gap-3">
                  <GiCricketBat size={28} />
                  <span className="text-base">Bat First</span>
                </button>
                <button onClick={() => setDecision('bowl')}
                  className="py-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white font-bold text-sm transition active:scale-95 shadow-xl shadow-emerald-500/25 flex flex-col items-center gap-3">
                  <FiTarget size={26} />
                  <span className="text-base">Bowl First</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* CUSTOM DROPDOWN SELECT */

function CustomSelect({ value, onChange, options, placeholder, disabled = [], label, icon: Icon }) {
  const [open, setOpen] = useState(false);
  const selectedOption = options.find(o => o._id === value);

  return (
    <div className="relative">
      {label && (
        <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
          {Icon && <Icon size={14} />} {label}
        </label>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left border border-indigo-300 rounded-xl px-4 py-2.5 text-sm bg-white hover:bg-indigo-50 transition flex items-center justify-between"
      >
        <span className={selectedOption ? 'text-gray-900 font-medium' : 'text-gray-400'}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <FiPlay size={14} className={`transition transform ${open ? 'rotate-90' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-indigo-300 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="max-h-56 overflow-y-auto">
              {options.map((opt) => {
                const isDisabled = disabled.includes(opt._id);
                const isSelected = value === opt._id;
                return (
                  <button
                    key={opt._id}
                    onClick={() => {
                      if (!isDisabled) {
                        onChange(opt._id);
                        setOpen(false);
                      }
                    }}
                    disabled={isDisabled}
                    className={`w-full text-left px-4 py-2.5 text-sm transition flex items-center gap-3 ${
                      isSelected
                        ? 'bg-indigo-100 text-indigo-900 font-semibold'
                        : isDisabled
                        ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'hover:bg-indigo-50 text-gray-700'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-indigo-600' : 'bg-gray-300'}`} />
                    {opt.name}
                    {isDisabled && <span className="text-xs ml-auto text-gray-400">(unavailable)</span>}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* PLAYER SELECTION (cricket) */

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
        <h3 className="text-lg font-bold text-white flex items-center gap-2"><FiUser size={18} /> Select Opening Players</h3>
        <p className="text-indigo-200 text-xs mt-0.5">Choose opening batsmen and bowler</p>
      </div>
      <div className="p-6 space-y-5">
        <CustomSelect
          value={striker}
          onChange={setStriker}
          options={battingPlayers}
          placeholder="Select striker..."
          disabled={[nonStriker].filter(Boolean)}
          label={`Striker (${battingTeamName})`}
          icon={GiCricketBat}
        />

        <CustomSelect
          value={nonStriker}
          onChange={setNonStriker}
          options={battingPlayers}
          placeholder="Select non-striker..."
          disabled={[striker].filter(Boolean)}
          label={`Non-Striker (${battingTeamName})`}
          icon={GiCricketBat}
        />

        <CustomSelect
          value={bowler}
          onChange={setBowler}
          options={bowlingPlayers}
          placeholder="Select bowler..."
          disabled={[]}
          label={`Opening Bowler (${bowlingTeamName})`}
          icon={FiTarget}
        />

        <button
          onClick={() => onConfirm({
            striker: striker || battingPlayers[0]?._id,
            nonStriker: nonStriker || battingPlayers[1]?._id,
            bowler: bowler || bowlingPlayers[0]?._id,
            battingTeam: battingTeamKey,
            bowlingTeam: bowlingTeamKey,
          })}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm hover:shadow-lg transition active:scale-95 mt-2"
        ><FiPlay size={15} /> Start Innings</button>
      </div>
    </div>
  );
}

/* SHOT AREA GROUND MAP */

function ShotAreaPicker({ onSelect, onCancel }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-800 text-sm">Select Shot Area</h4>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-xs flex items-center gap-1"><FiX size={12} /> Skip</button>
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

/* CRICKET SCORER PANEL */

function CricketScorerPanel({ onEvent, match, score }) {
  const [showWicket, setShowWicket] = useState(false);
  const [showShotArea, setShowShotArea] = useState(false);
  const [showExtrasModal, setShowExtrasModal] = useState(null); // 'wide'|'no_ball'|'bye'|'leg_bye'
  const [pendingRuns, setPendingRuns] = useState(null);
  const [wicketType, setWicketType] = useState('');
  const [fielder, setFielder] = useState('');
  const [runOutRuns, setRunOutRuns] = useState(0);

  const innings = score?.currentInningsData;
  const bowlingTeamKey = innings?.bowlingTeam || 'away';
  const battingTeamKey = innings?.battingTeam || 'home';
  const bowlingPlayers = match?.teams?.[bowlingTeamKey]?.players || [];
  const allPlayers = [...(match?.teams?.home?.players || []), ...(match?.teams?.away?.players || [])];
  const currentOverBalls = innings?.currentOver || [];

  const playerName = (id) => {
    if (!id) return '-';
    const p = allPlayers.find(x => (x._id || x)?.toString() === id?.toString());
    return p?.name || '—';
  };

  const striker = innings?.batsmen?.striker;
  const nonStriker = innings?.batsmen?.nonStriker;
  const currentBowler = innings?.currentBowler;
  const strikerCard = striker && innings?.battingCard?.[striker];
  const bowlerCard = currentBowler && innings?.bowlingCard?.[currentBowler];

  const submitBall = (runs, extraType = null, shotArea = null) => {
    const payload = { type: 'delivery', data: { runs } };
    if (extraType) {
      payload.data.isExtra = true;
      payload.data.extraType = extraType;
      payload.data.extraRuns = runs;
    }
    if (shotArea) payload.data.shotArea = shotArea;
    onEvent(payload);
    setShowShotArea(false);
    setPendingRuns(null);
    setShowExtrasModal(null);
  };

  const handleRunClick = (runs) => {
    if (runs >= 4) {
      setPendingRuns(runs);
      setShowShotArea(true);
    } else {
      submitBall(runs);
    }
  };

  const handleExtrasRun = (runs) => {
    submitBall(runs, showExtrasModal);
  };

  const submitWicket = () => {
    if (!wicketType) return;
    onEvent({
      type: 'wicket',
      data: {
        wicketType,
        fielder: fielder || undefined,
        runs: wicketType === 'run_out' ? runOutRuns : 0,
      },
    });
    setShowWicket(false);
    setWicketType('');
    setFielder('');
    setRunOutRuns(0);
  };

  const oversDisplay = innings
    ? `${Math.floor((innings.totalBalls || 0) / 6)}.${(innings.totalBalls || 0) % 6}`
    : '0.0';

  const EXTRA_LABELS = { wide: 'Wide', no_ball: 'No Ball', bye: 'Bye', leg_bye: 'Leg Bye' };

  return (
    <div className="space-y-4">

      {/* Now Batting / Bowling bar */}
      {innings?.battingTeam && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 space-y-2">
          <div className="flex gap-3 text-xs">
            <div className="flex-1">
              <p className="text-indigo-400 font-semibold uppercase tracking-wider mb-1">Batting</p>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                <span className="font-bold text-gray-900">{playerName(striker)}</span>
                {strikerCard && <span className="text-gray-500 ml-1">{strikerCard.runs}({strikerCard.balls})</span>}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
                <span className="text-gray-600">{playerName(nonStriker)}</span>
                {nonStriker && innings?.battingCard?.[nonStriker] && (
                  <span className="text-gray-400 ml-1">{innings.battingCard[nonStriker].runs}({innings.battingCard[nonStriker].balls})</span>
                )}
              </div>
            </div>
            <div className="w-px bg-indigo-200" />
            <div className="flex-1">
              <p className="text-indigo-400 font-semibold uppercase tracking-wider mb-1">Bowling</p>
              <div className="flex items-center gap-1">
                <span className="font-bold text-gray-900">{playerName(currentBowler)}</span>
                {bowlerCard && (
                  <span className="text-gray-500 ml-1">
                    {bowlerCard.overs}.{bowlerCard.balls % 6}-{bowlerCard.runs}-{bowlerCard.wickets}
                  </span>
                )}
              </div>
              <p className="text-gray-400 mt-0.5">Over {oversDisplay}</p>
            </div>
          </div>
          {/* This over balls */}
          <div className="flex gap-1.5 flex-wrap pt-1 border-t border-indigo-100">
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
            {currentOverBalls.length === 0 && <span className="text-xs text-indigo-300">No balls bowled yet</span>}
          </div>
        </div>
      )}

      {/* Extras run-selector modal */}
      <AnimatePresence>
        {showExtrasModal && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-amber-800">
                {EXTRA_LABELS[showExtrasModal]} — How many extra runs?
              </p>
              <button onClick={() => setShowExtrasModal(null)}
                className="text-amber-400 hover:text-amber-700 transition">
                <FiX size={16} />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[0, 1, 2, 3, 4].map((r) => (
                <button key={r} onClick={() => handleExtrasRun(r)}
                  className={`py-3 rounded-xl text-base font-bold transition active:scale-95 shadow-sm
                    ${r === 4 ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-amber-400 text-amber-900 hover:bg-amber-500'}`}>
                  {r}
                </button>
              ))}
            </div>
            <p className="text-xs text-amber-600">
              {showExtrasModal === 'wide' || showExtrasModal === 'no_ball'
                ? '1 extra run is added automatically'
                : 'These runs count as extras for the team'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shot area picker */}
      <AnimatePresence>
        {showShotArea && (
          <ShotAreaPicker
            onSelect={(area) => submitBall(pendingRuns, null, area)}
            onCancel={() => submitBall(pendingRuns)}
          />
        )}
      </AnimatePresence>

      {/* Wicket dialog */}
      <AnimatePresence>
        {showWicket && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="bg-red-50 rounded-2xl p-5 border border-red-200 space-y-4"
          >
            <p className="text-sm font-bold text-red-700 flex items-center gap-2">
              <GiCricketBat size={15} /> How Out?
            </p>

            <div className="grid grid-cols-3 gap-2">
              {WICKET_TYPES.map((wt) => (
                <button key={wt.id} onClick={() => setWicketType(wt.id)}
                  className={`py-3 px-2 rounded-xl text-xs font-semibold transition-all active:scale-95 flex flex-col items-center gap-1.5 ${
                    wicketType === wt.id
                      ? 'bg-red-500 text-white ring-2 ring-red-300'
                      : 'bg-white text-gray-700 hover:bg-red-100 border border-red-200'
                  }`}>
                  <wt.icon size={16} />
                  {wt.label}
                </button>
              ))}
            </div>

            {/* Fielder picker — native select replaced with CustomSelect */}
            {(wicketType === 'caught' || wicketType === 'stumped') && (
              <CustomSelect
                value={fielder}
                onChange={setFielder}
                options={bowlingPlayers}
                placeholder={wicketType === 'caught' ? 'Caught by...' : 'Stumped by...'}
                disabled={[]}
              />
            )}

            {wicketType === 'run_out' && (
              <div className="space-y-2">
                <CustomSelect
                  value={fielder}
                  onChange={setFielder}
                  options={allPlayers.filter(p =>
                    (match?.teams?.[bowlingTeamKey]?.players || []).some(bp => bp._id === p._id)
                  )}
                  placeholder="Run out by..."
                  disabled={[]}
                />
                <div>
                  <p className="text-xs font-medium text-red-600 mb-1.5">Runs scored on this ball</p>
                  <div className="flex gap-2">
                    {[0, 1, 2, 3].map(r => (
                      <button key={r} onClick={() => setRunOutRuns(r)}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${
                          runOutRuns === r ? 'bg-red-500 text-white' : 'bg-white border border-red-200 text-gray-700 hover:bg-red-50'
                        }`}>{r}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button onClick={submitWicket} disabled={!wicketType}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold disabled:opacity-40 transition active:scale-95">
                <FiCheck size={15} /> Confirm Wicket
              </button>
              <button onClick={() => { setShowWicket(false); setWicketType(''); setFielder(''); setRunOutRuns(0); }}
                className="px-5 py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition">
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showWicket && !showShotArea && !showExtrasModal && (
        <>
          {/* Run buttons */}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-widest">Runs</p>
            <div className="grid grid-cols-7 gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map((r) => (
                <button key={r} onClick={() => handleRunClick(r)}
                  className={`py-3.5 rounded-xl text-lg font-bold transition-all active:scale-95 shadow-sm ${
                    r === 4 ? 'bg-blue-500 hover:bg-blue-600 text-white' :
                    r === 6 ? 'bg-purple-500 hover:bg-purple-600 text-white' :
                    'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}>{r}</button>
              ))}
            </div>
          </div>

          {/* Extras */}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-widest">Extras</p>
            <div className="grid grid-cols-4 gap-2">
              {(['wide', 'no_ball', 'bye', 'leg_bye'] ).map((e) => (
                <button key={e} onClick={() => setShowExtrasModal(e)}
                  className="py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-amber-100 hover:text-amber-800 transition active:scale-95 border border-gray-200">
                  {EXTRA_LABELS[e]}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowWicket(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 transition active:scale-95">
              <GiCricketBat size={15} /> Wicket
            </button>
            <button onClick={() => onEvent({ type: 'end_over' })}
              className="px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition active:scale-95">
              End Over
            </button>
            <button onClick={() => onEvent({ type: 'end_innings' })}
              className="px-4 py-2.5 rounded-xl text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100 transition active:scale-95">
              End Innings
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* OTHER SPORT SCORER PANELS */

function FootballScorerPanel({ onEvent, match }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2.5">
        {['home', 'away'].map((team) => (
          <div key={team} className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 text-center">{match?.teams?.[team]?.name || team}</p>
            <button onClick={() => onEvent({ type: 'goal', team, data: {} })}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-sm font-bold transition active:scale-95 flex items-center justify-center gap-2"><GiSoccerBall size={16} /> Goal</button>
            <button onClick={() => onEvent({ type: 'yellow_card', team, data: {} })}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 py-2.5 rounded-xl text-xs font-bold transition active:scale-95 flex items-center justify-center gap-1"><FiAlertTriangle size={13} /> Yellow</button>
            <button onClick={() => onEvent({ type: 'red_card', team, data: {} })}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-xs font-bold transition active:scale-95 flex items-center justify-center gap-1"><FiSquare size={13} /> Red</button>
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

/* SCORECARD */

function CricketScorecard({ score, match }) {
  const innings = score?.currentInningsData;
  const allInnings = [...(score?.innings || [])];
  if (innings && !innings.isComplete) allInnings.push(innings);
  if (allInnings.length === 0) return <p className="text-center text-gray-400 text-sm py-8">No innings data yet</p>;

  const playerName = (id) => {
    const all = [...(match?.teams?.home?.players || []), ...(match?.teams?.away?.players || [])];
    const p = all.find(x => (x._id || x) === id || (x._id || x)?.toString?.() === id?.toString?.());
    return p?.name || id?.toString?.()?.slice(-6) || '-';
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

/* COMMENTARY FEED */

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

/* MATCH INFO TAB */

function MatchInfo({ match }) {
  const homeName = match?.teams?.home?.name || 'Home';
  const awayName = match?.teams?.away?.name || 'Away';

  return (
    <div className="space-y-4">
      {match?.toss?.wonBy && (
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <p className="text-sm font-semibold text-amber-800 flex items-center gap-1.5"><GiCoins size={15} /> Toss</p>
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
        {match?.venue?.name && <div className="flex justify-between"><span className="text-gray-500">Venue</span><span className="font-medium text-gray-800 flex items-center gap-1"><FiMapPin size={12} />{match.venue.name}</span></div>}
        {match?.sport && <div className="flex justify-between"><span className="text-gray-500">Sport</span><span className="font-medium text-gray-800 capitalize">{match.sport.replace('_', ' ')}</span></div>}
        {match?.format?.overs && <div className="flex justify-between"><span className="text-gray-500">Format</span><span className="font-medium text-gray-800">{match.format.overs} overs</span></div>}
        {match?.scheduledAt && <div className="flex justify-between"><span className="text-gray-500">Scheduled</span><span className="font-medium text-gray-800">{new Date(match.scheduledAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>}
        {match?.result?.summary && <div className="flex justify-between"><span className="text-gray-500">Result</span><span className="font-medium text-emerald-700">{match.result.summary}</span></div>}
      </div>
    </div>
  );
}

/* MAIN LIVE SCORING PAGE */

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
          // Only check battingTeam — striker can be null mid-innings after wicket
          if (!innings?.battingTeam) setMatchPhase('player_select');
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
        <p className="text-gray-400 text-sm">Loading match...</p>
      </div>
    );
  }

  if (error && !match) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center"><FiAlertTriangle size={28} className="text-red-500" /></div>
        <p className="text-red-600 font-medium">{error}</p>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition text-sm font-medium"><FiArrowLeft size={16} /> Back</button>
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
      const homeInn = innings.battingTeam === 'home' ? innings : score.innings?.find(i => i.battingTeam === 'home');
      const awayInn = innings.battingTeam === 'away' ? innings : score.innings?.find(i => i.battingTeam === 'away');
      return {
        home: homeInn ? `${homeInn.runs}/${homeInn.wickets}` : '-',
        away: awayInn ? `${awayInn.runs}/${awayInn.wickets}` : '-',
        overs: `${Math.floor((innings.totalBalls || 0) / 6)}.${(innings.totalBalls || 0) % 6} ov`,
      };
    }
    if (match.sport === 'football') {
      return { home: String(score.home?.goals ?? 0), away: String(score.away?.goals ?? 0) };
    }
    if (match.sport === 'basketball') {
      return { home: String(score.home?.points ?? 0), away: String(score.away?.points ?? 0) };
    }
    return {
      home: String(score.home?.points ?? score.home?.score ?? 0),
      away: String(score.away?.points ?? score.away?.score ?? 0),
    };
  };
  const headerScore = getHeaderScore();

  const TABS = [
    { id: 'live',       label: 'Live',        icon: FiRadio },
    { id: 'scorecard',  label: 'Scorecard',   icon: FiBarChart2 },
    { id: 'commentary', label: 'Commentary',  icon: FiMic },
    { id: 'info',       label: 'Info',        icon: FiInfo },
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
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition"><FiArrowLeft size={18} /></button>
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
            <p className="text-3xl font-black">{headerScore?.home || '-'}</p>
          </div>
          <div className="px-4">
            <div className="flex justify-center"><meta.icon size={36} /></div>
            {headerScore?.overs && <p className="text-white/50 text-xs text-center mt-1">{headerScore.overs}</p>}
          </div>
          <div className="flex-1 text-center">
            <p className="text-white/60 text-xs mb-1">{teamBName}</p>
            <p className="text-3xl font-black">{headerScore?.away || '-'}</p>
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
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-700 ml-2 font-bold"><FiX size={14} /></button>
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
          <div className="flex justify-center"><meta.icon size={44} /></div>
          <h3 className="text-lg font-bold text-gray-900">Ready to start?</h3>
          <button onClick={async () => {
            if (match.status === 'scheduled') await api.post(`/scoring/${matchId}/start`);
            const { data } = await api.get(`/scoring/${matchId}`);
            setMatch(data.data?.match);
            setScore(data.data?.score);
            setMatchPhase('scoring');
          }} className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition active:scale-95">
            <FiPlay size={15} className="mr-1" /> Start Scoring
          </button>
        </div>
      )}

      {/* Waiting screen for non-scorers */}
      {match.status === 'scheduled' && !isScorer && (
        <div className="bg-gray-50 rounded-2xl p-8 text-center">
          <div className="flex justify-center mb-3"><meta.icon size={44} /></div>
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
                <tab.icon size={14} className="mr-1 inline" /> {tab.label}
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
                        <meta.icon size={16} />
                        <span className="text-sm font-semibold text-gray-700">Scorer Panel</span>
                      </div>
                      <button onClick={handleUndo} disabled={events.length === 0}
                        className="flex items-center gap-1.5 text-xs font-semibold bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 disabled:opacity-30 transition"><FiRotateCcw size={13} /> Undo</button>
                    </div>
                    <div className={`p-5 ${submitting ? 'opacity-50 pointer-events-none' : ''}`}>
                      {submitting && (
                        <div className="flex items-center justify-center gap-2 mb-3 text-xs text-indigo-500">
                          <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /> Saving...</div>
                      )}
                      {getScorerPanel()}
                    </div>
                  </div>
                )}
                {match.status === 'live' && !isScorer && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
                    <p className="text-gray-500 text-sm flex items-center justify-center gap-1.5"><FiTv size={15} /> Watching live – only authorized scorers can update the score</p>
                  </div>
                )}
                {match.status === 'live' && isScorer && (
                  <button onClick={handleEndMatch}
                    className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition active:scale-95 flex items-center justify-center gap-2"><FiFlag size={15} /> End Match</button>
                )}
                {commentary.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                      <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><FiMic size={14} /> Latest</p>
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



