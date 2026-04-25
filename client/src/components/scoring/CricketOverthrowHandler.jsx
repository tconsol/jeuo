import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertCircle, FiCheck, FiX } from 'react-icons/fi';

/**
 * Cricket Overthrow Handler
 *
 * ICC Rule: If the ball after being hit (or missed) goes to a fielder and the
 * fielder's throw reaches the boundary, 4 overthrow runs are added.  The batters
 * are credited according to which end they had crossed at the moment the ball was
 * released by the fielder.
 *
 * This component handles:
 *  - Base runs (scored before the overthrow occurred, 0-3)
 *  - Overthrow type: normal | boundary (4 auto) | bye
 *  - Overthrow extra runs (1-4 or 4-fixed for boundary)
 *  - Which batter receives the overthrow credit
 *
 * IMPORTANT: This is NOT a new ball — it is extra credit on the CURRENT delivery.
 * The parent scorer must NOT call addBall() again after this.
 */
export default function CricketOverthrowHandler({
  isOpen,
  onClose,
  onSubmit,
  batsmen = { striker: null, nonStriker: null },
  ballNumber = 1,
  over = 1,
}) {
  const [baseRuns,       setBaseRuns]       = useState(1);
  const [overthrowType,  setOverthrowType]  = useState('normal');   // 'normal' | 'boundary' | 'bye'
  const [overthrowRuns,  setOverthrowRuns]  = useState(4);
  const [creditTo,       setCreditTo]       = useState('striker');  // 'striker' | 'nonStriker'
  const [fielderName,    setFielderName]    = useState('');

  // Boundary overthrow always adds 4
  const effectiveOvertrowRuns = overthrowType === 'boundary' ? 4 : overthrowRuns;
  const totalRuns = baseRuns + effectiveOvertrowRuns;

  const handleTypeChange = (type) => {
    setOverthrowType(type);
    if (type === 'boundary') setOverthrowRuns(4);
    if (type === 'normal')   setOverthrowRuns(4);
    if (type === 'bye')      setOverthrowRuns(4);  // bye overthrow boundary = 4 byes
  };

  const handleSubmit = () => {
    // Fielder name is helpful but not mandatory — ICC doesn't require it for scoring
    onSubmit({
      type:          'delivery',
      runs:          overthrowType === 'bye' ? baseRuns : totalRuns,  // if bye, only base runs credited to batter
      extras:        overthrowType === 'bye' ? effectiveOvertrowRuns : 0,
      extraType:     overthrowType === 'bye' ? 'bye' : 'overthrow',
      overthrowRuns: effectiveOvertrowRuns,
      isBoundaryOverthrow: overthrowType === 'boundary',
      totalRuns,
      runnedBy:      creditTo === 'striker' ? batsmen.striker : batsmen.nonStriker,
      fielder:       fielderName || undefined,
      // IMPORTANT: newBall = false — this credit goes on the same ball
      newBall:       false,
    });

    // reset
    setBaseRuns(1);
    setOverthrowType('normal');
    setOverthrowRuns(4);
    setCreditTo('striker');
    setFielderName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          exit={{    opacity: 0, y: 20, scale: 0.96 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* ── Header ─────────────────────────────── */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <FiAlertCircle size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">Over-Throw</h2>
                <p className="text-amber-100 text-xs">Over {over}.{ballNumber} — same ball, extra credit</p>
              </div>
            </div>
            <button onClick={onClose}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition">
              <FiX size={18} className="text-white" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-5">

            {/* ── Base Runs ────────────────────────── */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2.5">
                Base Runs <span className="text-gray-400 font-normal">(scored before throw)</span>
              </label>
              <div className="flex gap-2">
                {[0, 1, 2, 3].map((r) => (
                  <button key={r} onClick={() => setBaseRuns(r)}
                    className={`flex-1 py-2.5 rounded-xl font-black text-sm transition active:scale-95 ${
                      baseRuns === r
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Overthrow Type ───────────────────── */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2.5">
                Overthrow Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'normal',   label: 'Overthrow',   sub: 'credited to batter',  color: 'indigo' },
                  { key: 'boundary', label: 'Boundary',    sub: '4 runs auto',          color: 'emerald' },
                  { key: 'bye',      label: 'Bye',         sub: 'not credited to batter', color: 'amber' },
                ].map(({ key, label, sub, color }) => (
                  <button key={key} onClick={() => handleTypeChange(key)}
                    className={`p-3 rounded-xl border-2 text-left transition active:scale-95 ${
                      overthrowType === key
                        ? `border-${color}-500 bg-${color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <p className={`text-xs font-bold ${overthrowType === key ? `text-${color}-700` : 'text-gray-700'}`}>{label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{sub}</p>
                  </button>
                ))}
              </div>

              {overthrowType === 'bye' && (
                <div className="mt-2 px-3 py-2 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-xs text-amber-700 font-medium">
                    ICC Rule: Overthrow byes are NOT credited to the batter — they are extras. The base runs are the only batter credit.
                  </p>
                </div>
              )}
            </div>

            {/* ── Overthrow Runs (only if not boundary) ── */}
            {overthrowType !== 'boundary' && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2.5">
                  {overthrowType === 'bye' ? 'Bye Overthrow Runs' : 'Overthrow Runs'}
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((r) => (
                    <button key={r} onClick={() => setOverthrowRuns(r)}
                      className={`flex-1 py-2.5 rounded-xl font-black text-sm transition active:scale-95 ${
                        overthrowRuns === r
                          ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Total display ────────────────────── */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Total runs this ball</p>
                  <p className="text-3xl font-black text-indigo-700">{totalRuns}</p>
                </div>
                <div className="text-right text-xs text-gray-400 space-y-0.5">
                  <p>Base: {baseRuns}</p>
                  <p>+ {overthrowType === 'bye' ? 'Byes' : 'OT'}: {effectiveOvertrowRuns}</p>
                  {overthrowType === 'bye' && (
                    <p className="text-amber-600 font-semibold">Batter credited: {baseRuns}</p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Batter Credit (not needed for bye) ── */}
            {overthrowType !== 'bye' && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2.5">
                  Credit overthrow runs to…
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'striker',    label: 'Striker',     player: batsmen.striker },
                    { key: 'nonStriker', label: 'Non-Striker', player: batsmen.nonStriker },
                  ].map(({ key, label, player }) => (
                    <button key={key} onClick={() => setCreditTo(key)}
                      className={`relative p-3.5 rounded-xl border-2 text-left transition active:scale-95 ${
                        creditTo === key
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <p className={`text-xs font-bold ${creditTo === key ? 'text-indigo-700' : 'text-gray-700'}`}>{label}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{player?.name || 'Not set'}</p>
                      {creditTo === key && (
                        <FiCheck size={14} className="absolute top-3 right-3 text-indigo-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Fielder (optional) ───────────────── */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                Fielder who threw over <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={fielderName}
                onChange={(e) => setFielderName(e.target.value)}
                placeholder="e.g. Mid-on, Wicket-keeper…"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>
          </div>

          {/* ── Footer ───────────────────────────── */}
          <div className="px-6 pb-6 flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition">
              Cancel
            </button>
            <button onClick={handleSubmit}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-sm hover:from-amber-600 hover:to-orange-600 transition active:scale-95 shadow-lg shadow-orange-200">
              Record {totalRuns} Runs
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
