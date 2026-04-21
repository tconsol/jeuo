import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { matchSocket, connectMatchSocket, disconnectMatchSocket } from '../lib/socket';
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

function CricketScorerPanel({ onEvent, match, score, undoSignal }) {
  const [showWicket, setShowWicket] = useState(false);
  const [showShotArea, setShowShotArea] = useState(false);
  const [showExtrasModal, setShowExtrasModal] = useState(null); // 'wide'|'no_ball'|'bye'|'leg_bye'
  const [pendingRuns, setPendingRuns] = useState(null);
  const [wicketType, setWicketType] = useState('');
  const [fielder, setFielder] = useState('');
  const [runOutRuns, setRunOutRuns] = useState(0);
  const [showNextBowler, setShowNextBowler] = useState(false);
  const [nextBowler, setNextBowler] = useState('');

  // Reset all modal states when undo is triggered
  useEffect(() => {
    if (undoSignal > 0) {
      setShowWicket(false);
      setShowShotArea(false);
      setShowExtrasModal(null);
      setPendingRuns(null);
      setWicketType('');
      setFielder('');
      setRunOutRuns(0);
      setShowNextBowler(false);
      setNextBowler('');
    }
  }, [undoSignal]);

  const innings = score?.currentInningsData;
  const bowlingTeamKey = innings?.bowlingTeam || 'away';
  const battingTeamKey = innings?.battingTeam || 'home';
  const bowlingPlayers = match?.teams?.[bowlingTeamKey]?.players || [];
  const allPlayers = [...(match?.teams?.home?.players || []), ...(match?.teams?.away?.players || [])];
  const currentOverBalls = innings?.currentOver || [];

  // Auto-detect when over completes (after 6 balls) — prompt for next bowler
  const prevOversRef = useRef(innings?.overs ?? 0);
  useEffect(() => {
    const currentOvers = innings?.overs ?? 0;
    if (currentOvers > prevOversRef.current && !showNextBowler) {
      setShowNextBowler(true);
    }
    prevOversRef.current = currentOvers;
  }, [innings?.overs, showNextBowler]);

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
      {(striker || nonStriker || currentBowler) && (
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
            <div className={`grid ${showExtrasModal === 'no_ball' ? 'grid-cols-6' : 'grid-cols-5'} gap-2`}>
              {(showExtrasModal === 'no_ball' ? [0, 1, 2, 3, 4, 6] : [0, 1, 2, 3, 4]).map((r) => (
                <button key={r} onClick={() => handleExtrasRun(r)}
                  className={`py-3 rounded-xl text-base font-bold transition active:scale-95 shadow-sm
                    ${r >= 4 ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-amber-400 text-amber-900 hover:bg-amber-500'}`}>
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

      {/* Next Bowler Selection (End Over) */}
      <AnimatePresence>
        {showNextBowler && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 space-y-4"
          >
            <p className="text-sm font-bold text-indigo-800">
              {innings?.currentOver?.length > 0 ? 'End Over — Select Next Bowler' : 'Over Complete — Select Next Bowler'}
            </p>
            <CustomSelect
              value={nextBowler}
              onChange={setNextBowler}
              options={bowlingPlayers.filter(p => (p._id || p)?.toString() !== currentBowler?.toString())}
              placeholder="Select next bowler..."
              disabled={[]}
            />
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (!nextBowler) return;
                  // Only send end_over if the over hasn't already auto-completed
                  if (innings?.currentOver?.length > 0) {
                    await onEvent({ type: 'end_over' });
                  }
                  await onEvent({ type: 'players_set', data: { bowler: nextBowler } });
                  setShowNextBowler(false);
                  setNextBowler('');
                }}
                disabled={!nextBowler}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold disabled:opacity-40 transition active:scale-95"
              >
                <FiCheck size={15} /> Confirm
              </button>
              <button
                onClick={() => { setShowNextBowler(false); setNextBowler(''); }}
                className="px-5 py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showWicket && !showShotArea && !showExtrasModal && !showNextBowler && (
        <>
          {/* Run buttons */}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-widest">Runs</p>
            <div className="grid grid-cols-6 gap-2">
              {[0, 1, 2, 3, 4, 6].map((r) => (
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
            <button onClick={() => setShowNextBowler(true)}
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
  const allInnings = [...(score?.innings || [])];
  const current = score?.currentInningsData;
  if (current && !current.isComplete) allInnings.push(current);
  if (allInnings.length === 0) return <p className="text-center text-gray-400 text-sm py-8">No innings data yet</p>;

  const allPlayers = [...(match?.teams?.home?.players || []), ...(match?.teams?.away?.players || [])];
  const pn = (id) => {
    if (!id) return '-';
    const p = allPlayers.find(x => (x._id || x)?.toString() === id?.toString());
    return p?.name || '—';
  };

  return (
    <div className="space-y-6">
      {allInnings.map((inn, idx) => {
        const teamKey = inn.battingTeam;
        const teamName = teamKey === 'home' ? match?.teams?.home?.name : teamKey === 'away' ? match?.teams?.away?.name : `Innings ${idx + 1}`;
        const ov = `${Math.floor((inn.totalBalls || 0) / 6)}.${(inn.totalBalls || 0) % 6}`;
        const totalExtras = (inn.extras?.wides || 0) + (inn.extras?.noBalls || 0) + (inn.extras?.byes || 0) + (inn.extras?.legByes || 0);
        const striker = inn.batsmen?.striker?.toString?.() || inn.batsmen?.striker;
        const nonStriker = inn.batsmen?.nonStriker?.toString?.() || inn.batsmen?.nonStriker;

        // Include batsmen at crease even if they haven't faced a ball yet
        const battingEntries = { ...(inn.battingCard || {}) };
        if (striker && !battingEntries[striker]) battingEntries[striker] = { runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 };
        if (nonStriker && !battingEntries[nonStriker]) battingEntries[nonStriker] = { runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 };

        return (
          <div key={idx}>
            {/* Innings header */}
            <div className="flex items-center justify-between bg-gray-900 text-white rounded-t-xl px-4 py-3">
              <h4 className="text-sm font-bold">{teamName}</h4>
              <span className="text-sm font-bold">{inn.runs}/{inn.wickets} <span className="text-white/60 font-normal">({ov} ov)</span></span>
            </div>

            {/* Batting Table */}
            {Object.keys(battingEntries).length > 0 && (
              <div className="overflow-x-auto border-x border-gray-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 border-b border-gray-200">
                      <th className="text-left py-2.5 pl-4 pr-2 font-semibold">Batter</th>
                      <th className="text-left px-2 font-normal text-[11px]"></th>
                      <th className="text-right px-2 font-semibold">R</th>
                      <th className="text-right px-2 font-semibold">B</th>
                      <th className="text-right px-2 font-semibold">4s</th>
                      <th className="text-right px-2 font-semibold">6s</th>
                      <th className="text-right pr-4 pl-2 font-semibold">SR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(battingEntries).map(([pid, card]) => {
                      const fow = inn.fow?.find(f => f.batter?.toString() === pid?.toString());
                      const isOut = !!fow;
                      const isOnStrike = pid === striker;
                      const isAtCrease = pid === striker || pid === nonStriker;
                      let dismissal = '';
                      if (fow) {
                        if (fow.howOut === 'bowled') dismissal = `b ${pn(fow.bowler)}`;
                        else if (fow.howOut === 'caught') dismissal = `c ${pn(fow.fielder)} b ${pn(fow.bowler)}`;
                        else if (fow.howOut === 'lbw') dismissal = `lbw b ${pn(fow.bowler)}`;
                        else if (fow.howOut === 'run_out') dismissal = `run out (${pn(fow.fielder)})`;
                        else if (fow.howOut === 'stumped') dismissal = `st ${pn(fow.fielder)} b ${pn(fow.bowler)}`;
                        else if (fow.howOut === 'hit_wicket') dismissal = `hit wicket b ${pn(fow.bowler)}`;
                        else dismissal = fow.howOut?.replace('_', ' ') || 'out';
                      }
                      return (
                        <tr key={pid} className={`border-b border-gray-100 ${isOnStrike ? 'bg-green-50' : ''}`}>
                          <td className="py-2.5 pl-4 pr-1">
                            <span className={`font-medium ${isOut ? 'text-gray-500' : 'text-gray-900'}`}>
                              {pn(pid)}
                              {isOnStrike && <span className="text-green-600 ml-1">*</span>}
                            </span>
                          </td>
                          <td className="px-1 text-[11px] text-gray-400 max-w-[120px] truncate">
                            {isOut ? dismissal : isAtCrease ? <span className="text-green-600 font-medium">NOT OUT</span> : ''}
                          </td>
                          <td className={`text-right px-2 font-bold ${isOut ? 'text-gray-600' : 'text-gray-900'}`}>{card.runs}</td>
                          <td className="text-right px-2 text-gray-500">{card.balls}</td>
                          <td className="text-right px-2 text-blue-600">{card.fours}</td>
                          <td className="text-right px-2 text-purple-600">{card.sixes}</td>
                          <td className="text-right pr-4 pl-2 text-gray-500">{card.strikeRate?.toFixed?.(2) || card.strikeRate}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Extras */}
            <div className="px-4 py-2 bg-gray-50 border-x border-b border-gray-200 flex justify-between text-xs text-gray-600">
              <span>Extras</span>
              <span className="font-medium">
                {totalExtras} <span className="text-gray-400">(b {inn.extras?.byes || 0}, w {inn.extras?.wides || 0}, nb {inn.extras?.noBalls || 0}, lb {inn.extras?.legByes || 0})</span>
              </span>
            </div>

            {/* Total */}
            <div className="px-4 py-2.5 bg-gray-900 text-white flex justify-between text-xs font-bold">
              <span>Total</span>
              <span>{inn.runs}/{inn.wickets} ({ov} ov)</span>
            </div>

            {/* Bowling Table */}
            {Object.keys(inn.bowlingCard || {}).length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 px-1">Bowling</p>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 border-b border-gray-200">
                        <th className="text-left py-2.5 pl-4 pr-2 font-semibold">Bowler</th>
                        <th className="text-right px-2 font-semibold">O</th>
                        <th className="text-right px-2 font-semibold">M</th>
                        <th className="text-right px-2 font-semibold">R</th>
                        <th className="text-right px-2 font-semibold">W</th>
                        <th className="text-right pr-4 pl-2 font-semibold">ER</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(inn.bowlingCard).map(([pid, card]) => (
                        <tr key={pid} className="border-b border-gray-100">
                          <td className="py-2.5 pl-4 pr-2 font-medium text-gray-900">{pn(pid)}</td>
                          <td className="text-right px-2 font-bold text-gray-900">{card.overs}.{card.balls % 6}</td>
                          <td className="text-right px-2 font-bold text-gray-900">{card.maidens}</td>
                          <td className="text-right px-2 font-bold text-gray-900">{card.runs}</td>
                          <td className="text-right px-2 font-bold text-red-600">{card.wickets}</td>
                          <td className="text-right pr-4 pl-2 text-gray-500">{card.economy?.toFixed?.(2) || card.economy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Fall of Wickets */}
            {inn.fow?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 px-1">Fall of Wickets</p>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 border-b border-gray-200">
                        <th className="text-left py-2 pl-4 font-semibold">Batter</th>
                        <th className="text-right px-3 font-semibold">Score</th>
                        <th className="text-right pr-4 font-semibold">Overs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inn.fow.map((f, i) => (
                        <tr key={i} className="border-b border-gray-100">
                          <td className="py-2 pl-4 font-medium text-gray-800">{pn(f.batter)}</td>
                          <td className="text-right px-3 font-bold">{f.runs}-{f.wicket}</td>
                          <td className="text-right pr-4 text-gray-500">{f.overs}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {idx < allInnings.length - 1 && <hr className="my-6 border-gray-200" />}
          </div>
        );
      })}
    </div>
  );
}

/* GENERIC SCORECARD FOR OTHER SPORTS */

function GenericScorecard({ score, match, sport }) {
  if (!score) return <p className="text-center text-gray-400 text-sm py-8">No score data</p>;

  const getStats = (team) => {
    const s = score?.[team] || {};
    if (sport === 'football') return { main: s.goals ?? 0, label: 'Goals', extra: [{ k: 'Yellow', v: s.yellowCards ?? 0 }, { k: 'Red', v: s.redCards ?? 0 }, { k: 'Shots', v: s.shots ?? '-' }] };
    if (sport === 'basketball') return { main: s.points ?? 0, label: 'Points', extra: [{ k: 'FG', v: s.fieldGoals ?? '-' }, { k: '3PT', v: s.threePointers ?? '-' }, { k: 'FT', v: s.freeThrows ?? '-' }] };
    if (sport === 'tennis' || sport === 'badminton' || sport === 'table_tennis') return { main: s.sets ?? s.games ?? s.points ?? 0, label: 'Sets', extra: (s.setsDetail || []).map((sd, i) => ({ k: `Set ${i + 1}`, v: sd })) };
    if (sport === 'volleyball') return { main: s.sets ?? 0, label: 'Sets', extra: (s.setsDetail || []).map((sd, i) => ({ k: `Set ${i + 1}`, v: sd })) };
    return { main: s.points ?? s.score ?? 0, label: 'Score', extra: [] };
  };

  return (
    <div className="space-y-4">
      {['home', 'away'].map((team) => {
        const stats = getStats(team);
        return (
          <div key={team} className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
              <span className="font-bold text-sm">{match?.teams?.[team]?.name || team}</span>
              <span className="text-2xl font-black">{stats.main}</span>
            </div>
            {stats.extra?.length > 0 && (
              <div className="px-4 py-3 grid grid-cols-3 gap-2">
                {stats.extra.map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-xs text-gray-400">{s.k}</p>
                    <p className="text-sm font-bold text-gray-900">{s.v}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      {score?.period && <p className="text-center text-xs text-gray-500">Period: {score.period}</p>}
    </div>
  );
}

/* COMMENTARY FEED */

function CommentaryFeed({ matchId, commentary: initial, match, score }) {
  const [commentary, setCommentary] = useState(initial || []);
  useEffect(() => { setCommentary(initial || []); }, [initial]);

  // Build player name lookup
  const allPlayers = [...(match?.teams?.home?.players || []), ...(match?.teams?.away?.players || [])];
  const pn = (id) => { const p = allPlayers.find(x => (x._id || x)?.toString() === id?.toString()); return p?.name || null; };

  const innings = score?.currentInningsData;
  const strikerName = pn(innings?.batsmen?.striker);
  const nonStrikerName = pn(innings?.batsmen?.nonStriker);
  const bowlerName = pn(innings?.currentBowler);

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

  const styleMap = {
    boundary: 'border-l-blue-500 bg-blue-50',
    six: 'border-l-purple-500 bg-purple-50',
    wicket: 'border-l-red-500 bg-red-50',
    extra: 'border-l-amber-500 bg-amber-50',
    milestone: 'border-l-emerald-500 bg-emerald-50',
    normal: 'border-l-gray-300 bg-white',
    info: 'border-l-indigo-500 bg-indigo-50',
  };

  return (
    <div className="space-y-3">
      {/* Current batsman & bowler header */}
      {(strikerName || bowlerName) && (
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
          <div className="flex items-center gap-2 text-sm">
            <GiCricketBat size={14} className="text-indigo-500" />
            <span className="text-gray-500">Batting:</span>
            {strikerName && <span className="font-semibold text-gray-900">{strikerName}*</span>}
            {strikerName && nonStrikerName && <span className="text-gray-400">&</span>}
            {nonStrikerName && <span className="font-medium text-gray-700">{nonStrikerName}</span>}
          </div>
          {bowlerName && (
            <div className="flex items-center gap-2 text-sm">
              <FiTarget size={14} className="text-red-500" />
              <span className="text-gray-500">Bowling:</span>
              <span className="font-semibold text-gray-900">{bowlerName}</span>
            </div>
          )}
        </div>
      )}
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {[...commentary].reverse().map((c, i) => (
          <div key={i} className={`border-l-4 rounded-r-lg px-4 py-3 text-sm ${styleMap[c.type] || styleMap.normal}`}>
            <div className="flex items-start gap-3">
              {c.over && (
                <span className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center text-[11px] font-bold">{c.over}</span>
              )}
              <div className="flex-1 min-w-0">
                <p className={`${c.type === 'wicket' ? 'text-red-800 font-bold' : c.type === 'six' ? 'text-purple-800 font-semibold' : c.type === 'boundary' ? 'text-blue-800 font-semibold' : 'text-gray-700'}`}>
                  {c.text}
                </p>
              </div>
              {c.type === 'wicket' && <span className="flex-shrink-0 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">W</span>}
              {c.type === 'boundary' && <span className="flex-shrink-0 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">4</span>}
              {c.type === 'six' && <span className="flex-shrink-0 bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">6</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* MATCH INFO TAB */

function MatchInfo({ match, score }) {
  const homeName = match?.teams?.home?.name || 'Home';
  const awayName = match?.teams?.away?.name || 'Away';
  const homePlayers = match?.teams?.home?.players || [];
  const awayPlayers = match?.teams?.away?.players || [];

  return (
    <div className="space-y-4">
      {/* Toss */}
      {match?.toss?.wonBy && (
        <div className="bg-amber-50 rounded-xl px-4 py-3 border border-amber-200 flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center text-amber-900 text-xs font-bold">T</span>
          <p className="text-sm text-amber-800">
            <span className="font-bold">{match.toss.wonBy === 'home' ? homeName : awayName}</span> won the toss and elected to{' '}
            <span className="font-bold">{match.toss.decision}</span> first
          </p>
        </div>
      )}

      {/* Match Details Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-900 text-white px-4 py-3">
          <p className="font-bold text-sm">Match Details</p>
        </div>
        <div className="divide-y divide-gray-100">
          {match?.sport && (
            <div className="flex justify-between px-4 py-3 text-sm">
              <span className="text-gray-500">Sport</span>
              <span className="font-medium text-gray-900 capitalize">{match.sport.replace('_', ' ')}</span>
            </div>
          )}
          {match?.format?.overs && (
            <div className="flex justify-between px-4 py-3 text-sm">
              <span className="text-gray-500">Format</span>
              <span className="font-medium text-gray-900">{match.format.overs} Overs</span>
            </div>
          )}
          {match?.venue?.name && (
            <div className="flex justify-between px-4 py-3 text-sm">
              <span className="text-gray-500">Venue</span>
              <span className="font-medium text-gray-900 text-right">
                <span className="flex items-center gap-1"><FiMapPin size={12} /> {match.venue.name}</span>
                {match.venue.location?.city && <span className="text-xs text-gray-400 block">{match.venue.location.city}{match.venue.location.state ? `, ${match.venue.location.state}` : ''}</span>}
              </span>
            </div>
          )}
          {match?.scheduledAt && (
            <div className="flex justify-between px-4 py-3 text-sm">
              <span className="text-gray-500">Date & Time</span>
              <span className="font-medium text-gray-900">{new Date(match.scheduledAt).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
          {match?.result?.summary && (
            <div className="flex justify-between px-4 py-3 text-sm">
              <span className="text-gray-500">Result</span>
              <span className="font-bold text-emerald-700">{match.result.summary}</span>
            </div>
          )}
        </div>
      </div>

      {/* Playing XI */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-900 text-white px-4 py-3">
          <p className="font-bold text-sm">Playing XI</p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-gray-200">
          {/* Home */}
          <div>
            <div className="px-3 py-2 bg-indigo-50 border-b border-gray-200">
              <p className="text-xs font-bold text-indigo-800">{homeName}</p>
            </div>
            <div className="divide-y divide-gray-50">
              {homePlayers.map((p, i) => (
                <div key={p._id} className="flex items-center gap-2 px-3 py-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">{p.name?.[0]?.toUpperCase()}</span>
                  <span className="text-xs text-gray-800 truncate">{p.name}</span>
                  {match?.teams?.home?.captain?.toString() === p._id?.toString() && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold flex-shrink-0">C</span>}
                </div>
              ))}
              {homePlayers.length === 0 && <p className="px-3 py-4 text-xs text-gray-400 text-center">No players</p>}
            </div>
          </div>
          {/* Away */}
          <div>
            <div className="px-3 py-2 bg-rose-50 border-b border-gray-200">
              <p className="text-xs font-bold text-rose-800">{awayName}</p>
            </div>
            <div className="divide-y divide-gray-50">
              {awayPlayers.map((p, i) => (
                <div key={p._id} className="flex items-center gap-2 px-3 py-2">
                  <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">{p.name?.[0]?.toUpperCase()}</span>
                  <span className="text-xs text-gray-800 truncate">{p.name}</span>
                  {match?.teams?.away?.captain?.toString() === p._id?.toString() && <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold flex-shrink-0">C</span>}
                </div>
              ))}
              {awayPlayers.length === 0 && <p className="px-3 py-4 text-xs text-gray-400 text-center">No players</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Scorers */}
      {match?.scorers?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Scorers</p>
          <div className="flex flex-wrap gap-2">
            {match.scorers.map((s) => (
              <span key={s._id || s} className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-700">
                <FiUser size={11} /> {s.name || 'Scorer'}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* LIVE BATTING/BOWLING SUMMARY (shown for everyone on live tab) */

function LiveBattingSummary({ score, match }) {
  if (!score?.currentInningsData) return null;
  const innings = score.currentInningsData;
  const allPlayers = [...(match?.teams?.home?.players || []), ...(match?.teams?.away?.players || [])];
  const pn = (id) => { const p = allPlayers.find(x => (x._id || x)?.toString() === id?.toString()); return p?.name || '—'; };

  const striker = innings.batsmen?.striker?.toString?.() || innings.batsmen?.striker;
  const nonStriker = innings.batsmen?.nonStriker?.toString?.() || innings.batsmen?.nonStriker;
  const bowler = innings.currentBowler?.toString?.() || innings.currentBowler;
  const sCard = striker && (innings.battingCard?.[striker] || { runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 });
  const nsCard = nonStriker && (innings.battingCard?.[nonStriker] || { runs: 0, balls: 0, fours: 0, sixes: 0, strikeRate: 0 });
  const bCard = bowler && (innings.bowlingCard?.[bowler] || { overs: 0, maidens: 0, runs: 0, wickets: 0, economy: 0, balls: 0 });
  const lastFow = innings.fow?.length > 0 ? innings.fow[innings.fow.length - 1] : null;
  const runRate = innings.totalBalls > 0 ? ((innings.runs / innings.totalBalls) * 6).toFixed(2) : '0.00';
  const ov = `${Math.floor((innings.totalBalls || 0) / 6)}.${(innings.totalBalls || 0) % 6}`;
  const currentOverBalls = innings.currentOver || [];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Batsmen */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-1.5 mb-2">
          <GiCricketBat size={12} className="text-indigo-500" />
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Batting</p>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400">
              <th className="text-left font-medium pb-1">Batter</th>
              <th className="text-right font-medium pb-1 px-1">R</th>
              <th className="text-right font-medium pb-1 px-1">B</th>
              <th className="text-right font-medium pb-1 px-1">4s</th>
              <th className="text-right font-medium pb-1 px-1">6s</th>
              <th className="text-right font-medium pb-1">SR</th>
            </tr>
          </thead>
          <tbody>
            {striker && sCard && (
              <tr>
                <td className="py-1 font-bold text-gray-900">{pn(striker)} <span className="text-green-600">*</span></td>
                <td className="text-right px-1 font-bold text-gray-900">{sCard.runs}</td>
                <td className="text-right px-1 text-gray-500">{sCard.balls}</td>
                <td className="text-right px-1 text-blue-600">{sCard.fours}</td>
                <td className="text-right px-1 text-purple-600">{sCard.sixes}</td>
                <td className="text-right text-gray-500">{sCard.strikeRate?.toFixed?.(2) || sCard.strikeRate}</td>
              </tr>
            )}
            {nonStriker && nsCard && (
              <tr>
                <td className="py-1 text-gray-700">{pn(nonStriker)}</td>
                <td className="text-right px-1 font-bold text-gray-700">{nsCard.runs}</td>
                <td className="text-right px-1 text-gray-500">{nsCard.balls}</td>
                <td className="text-right px-1 text-blue-600">{nsCard.fours}</td>
                <td className="text-right px-1 text-purple-600">{nsCard.sixes}</td>
                <td className="text-right text-gray-500">{nsCard.strikeRate?.toFixed?.(2) || nsCard.strikeRate}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bowler */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-1.5 mb-2">
          <FiTarget size={12} className="text-red-500" />
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Bowling</p>
        </div>
        {bowler && bCard ? (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400">
                <th className="text-left font-medium pb-1">Bowler</th>
                <th className="text-right font-medium pb-1 px-1">O</th>
                <th className="text-right font-medium pb-1 px-1">M</th>
                <th className="text-right font-medium pb-1 px-1">R</th>
                <th className="text-right font-medium pb-1 px-1">W</th>
                <th className="text-right font-medium pb-1">ER</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-1 font-bold text-gray-900">{pn(bowler)}</td>
                <td className="text-right px-1 font-bold text-gray-900">{bCard.overs}.{bCard.balls % 6}</td>
                <td className="text-right px-1 font-bold text-gray-900">{bCard.maidens}</td>
                <td className="text-right px-1 font-bold text-gray-900">{bCard.runs}</td>
                <td className="text-right px-1 font-bold text-red-600">{bCard.wickets}</td>
                <td className="text-right text-gray-500">{bCard.economy?.toFixed?.(2) || bCard.economy}</td>
              </tr>
            </tbody>
          </table>
        ) : <p className="text-xs text-gray-400">—</p>}
      </div>

      {/* Current Over + CRR + Last Wicket */}
      <div className="px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        <div>
          <span className="text-gray-400 mr-1.5">CRR:</span>
          <span className="font-bold text-gray-900">{runRate}</span>
        </div>
        {innings.target && (
          <div>
            <span className="text-gray-400 mr-1.5">RRR:</span>
            <span className="font-bold text-gray-900">
              {((innings.target - innings.runs) / Math.max(1, ((match.format?.overs || 20) * 6 - innings.totalBalls) / 6)).toFixed(2)}
            </span>
          </div>
        )}
        {lastFow && (
          <div>
            <span className="text-gray-400 mr-1.5">Last Wkt:</span>
            <span className="font-bold text-red-600">{pn(lastFow.batter)}</span>
            <span className="text-gray-500 ml-1">{lastFow.runs}-{lastFow.wicket} ({lastFow.overs} ov)</span>
          </div>
        )}
      </div>

      {/* This Over */}
      <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-bold text-gray-400 uppercase mr-1">Over {ov}</span>
        {currentOverBalls.map((ball, i) => (
          <span key={i}
            className={`w-7 h-7 rounded-full text-[11px] font-bold flex items-center justify-center ${
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
    // Initialize match socket with auth token
    const token = localStorage.getItem('accessToken');
    if (token) connectMatchSocket(token);
    matchSocket.emit('join:match', matchId);
    const onScoreUpdate = (data) => {
      if (data.score) setScore(data.score);
      if (data.event) setEvents((prev) => [...prev, data.event]);
      // commentary is always replaced (handles both new entries and undo removal)
      if (data.commentary !== undefined) setCommentary(data.commentary);
    };
    matchSocket.on('score:update', onScoreUpdate);
    return () => {
      matchSocket.emit('leave:match', matchId);
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

      // Always refresh full score from server to ensure consistency
      try {
        const { data: freshData } = await api.get(`/scoring/${matchId}`);
        const fresh = freshData.data || freshData;
        if (fresh.score) setScore(fresh.score);
        if (fresh.match?.commentary) setCommentary(fresh.match.commentary);
      } catch { /* use the inline response */ }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record event');
    } finally {
      setSubmitting(false);
    }
  }, [matchId]);

  const [undoSignal, setUndoSignal] = useState(0);
  const [showUndoConfirm, setShowUndoConfirm] = useState(false);
  const [pendingUndoEvent, setPendingUndoEvent] = useState(null);

  // Helper to format event details for display
  const formatEventDetails = (event) => {
    if (!event) return 'Unknown event';
    const allPlayers = [...(match?.teams?.home?.players || []), ...(match?.teams?.away?.players || [])];
    const pn = (id) => {
      if (!id) return null;
      const p = allPlayers.find(x => (x._id || x)?.toString() === id?.toString());
      return p?.name;
    };

    const innings = score?.currentInningsData;
    const currentStriker = pn(innings?.batsmen?.striker);
    const currentBowler = pn(innings?.currentBowler);
    
    // Get over/ball from event payload or derive from score
    let overNum = event.payload?.overNumber;
    let ballNum = event.payload?.ballInOver;
    
    // If not in payload, try to calculate from score (current over/balls represent state AFTER event)
    if (!overNum && innings) {
      overNum = Math.floor((innings.totalBalls - 1) / 6) + 1;
      ballNum = ((innings.totalBalls - 1) % 6) + 1;
    }
    
    overNum = overNum ?? '?';
    ballNum = ballNum ?? '?';

    switch (event.type) {
      case 'delivery': {
        const runs = event.payload?.runs ?? 0;
        const isExtra = event.payload?.isExtra;
        const extraType = event.payload?.extraType;
        
        let desc = `Over ${overNum}, Ball ${ballNum}: `;
        
        if (isExtra) {
          desc += `${extraType?.toUpperCase() || 'EXTRA'}`;
          if (event.payload?.extraRuns) desc += ` +${event.payload.extraRuns}`;
        } else {
          if (runs === 0) desc += 'Dot ball';
          else if (runs === 1) desc += '1 run';
          else if (runs === 4) desc += '4 RUNS';
          else if (runs === 6) desc += '6 RUNS';
          else desc += `${runs} runs`;
        }
        
        if (currentStriker || currentBowler) {
          desc += ` | ${currentStriker || 'Striker'}* vs ${currentBowler || 'Bowler'}`;
        }
        
        return desc;
      }
      case 'wicket': {
        const howOut = event.payload?.wicketType?.replace('_', ' ').toUpperCase();
        return `WICKET! Over ${overNum} - ${howOut}${currentBowler ? ` (${currentBowler})` : ''}`;
      }
      case 'end_over':
        return `Over ${event.payload?.overNumber || overNum} completed`;
      default:
        return `${event.type} event`;
    }
  };

  const handleUndo = useCallback(async () => {
    try {
      // Show modal with last event details
      if (events.length === 0) {
        setError('No events to undo');
        return;
      }
      const lastEvent = events[events.length - 1];
      setPendingUndoEvent(lastEvent);
      setShowUndoConfirm(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch last event');
    }
  }, [events]);

  const confirmUndo = useCallback(async () => {
    try {
      const { data } = await api.post(`/scoring/${matchId}/undo`);
      const result = data.data;
      if (result?.score) setScore(result.score);
      // Use commentary directly from undo response if present
      if (result?.commentary) setCommentary(result.commentary);
      // Signal CricketScorerPanel to reset all modal states
      setUndoSignal(prev => prev + 1);
      setShowUndoConfirm(false);
      setPendingUndoEvent(null);
      // Also refresh full data to ensure consistency
      try {
        const { data: freshData } = await api.get(`/scoring/${matchId}`);
        const fresh = freshData.data || freshData;
        if (fresh.score) setScore(fresh.score);
        if (fresh.match) {
          setMatch(fresh.match);
          setCommentary(fresh.match.commentary || []);
        }
      } catch { /* use inline response */ }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to undo');
      setShowUndoConfirm(false);
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
      // Build innings score for both teams
      let homeInn = innings.battingTeam === 'home' ? innings : score.innings?.find(i => i.battingTeam === 'home');
      let awayInn = innings.battingTeam === 'away' ? innings : score.innings?.find(i => i.battingTeam === 'away');
      // Fallback: if battingTeam not set, show current innings score for the team that's likely batting
      if (!homeInn && !awayInn && innings.runs !== undefined) {
        // Show the current innings score on the away side by default (most common for 1st match)
        awayInn = innings;
      }
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
      case 'cricket': return <CricketScorerPanel onEvent={handleEvent} match={match} score={score} undoSignal={undoSignal} />;
      case 'football': return <FootballScorerPanel onEvent={handleEvent} match={match} />;
      case 'basketball': return <BasketballScorerPanel onEvent={handleEvent} match={match} />;
      default: return <GenericScorerPanel onEvent={handleEvent} match={match} />;
    }
  };

  return (
    <>
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
      className="max-w-4xl mx-auto pt-4 pb-28 space-y-4 px-4">

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
              <motion.div key="scorecard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {match.sport === 'cricket' && score?.currentInningsData && (
                  <LiveBattingSummary score={score} match={match} />
                )}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  {match.sport === 'cricket' ? <CricketScorecard score={score} match={match} /> : <GenericScorecard score={score} match={match} sport={match.sport} />}
                </div>
              </motion.div>
            )}
            {activeTab === 'commentary' && (
              <motion.div key="commentary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <CommentaryFeed matchId={matchId} commentary={commentary} match={match} score={score} />
                </div>
              </motion.div>
            )}
            {activeTab === 'info' && (
              <motion.div key="info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <MatchInfo match={match} score={score} />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Undo Confirmation Modal - rendered via portal to escape motion.div transform containment */}
    </motion.div>
    {createPortal(
      <AnimatePresence>
        {showUndoConfirm && (
          <motion.div
            key="undo-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]"
            onClick={() => { setShowUndoConfirm(false); setPendingUndoEvent(null); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-4 text-white">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <FiAlertTriangle size={20} /> Confirm Undo
                </h3>
              </div>

              {/* Content */}
              <div className="px-6 py-5 space-y-4">
                <p className="text-gray-600 text-sm">
                  Are you sure you want to undo the last delivery? This action will revert the score and commentary.
                </p>

                {/* Event Details Box - Larger, Bolder, Colored */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-5">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-2.5">Previous Delivery</p>
                  <p className="text-gray-900 font-black text-lg leading-relaxed break-words">
                    {(() => {
                      const text = formatEventDetails(pendingUndoEvent);
                      // Highlight runs/wicket info in blue
                      if (text.includes('RUNS')) {
                        return text.split('|')[0].includes('RUNS') 
                          ? <><span className="text-blue-700 text-xl">{text.split('|')[0].trim()}</span> {text.includes('|') ? `| ${text.split('|')[1]}` : ''}</>
                          : text;
                      }
                      if (text.includes('WICKET')) {
                        return <span className="text-red-700 text-xl">{text}</span>;
                      }
                      return text;
                    })()}
                  </p>
                </div>

                <p className="text-xs text-gray-500 italic">
                  After undo, all scoring buttons will be available for you to re-enter the correct information.
                </p>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
                <button
                  onClick={() => { setShowUndoConfirm(false); setPendingUndoEvent(null); }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmUndo}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition active:scale-95 flex items-center gap-1.5"
                >
                  <FiRotateCcw size={14} /> Confirm Undo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    , document.body)}
    </>
  );
}



