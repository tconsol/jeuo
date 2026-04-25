import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { tournamentService } from '../../services/tournament.service';
import { SportIcon } from '../../utils/sportIcons';
import {
  FiArrowLeft, FiArrowRight, FiCalendar, FiUsers,
  FiMapPin, FiDollarSign, FiAward, FiCheck,
} from 'react-icons/fi';

const FORMATS = [
  { value: 'round_robin',        label: 'Round Robin',        desc: 'Every team plays every other team — best for leagues' },
  { value: 'single_elimination', label: 'Single Elimination', desc: 'Lose once and you\'re out — quick knockout format' },
  { value: 'double_elimination', label: 'Double Elimination', desc: 'Lose twice to be eliminated — gives a second chance' },
  { value: 'group_knockout',     label: 'Group + Knockout',   desc: 'Group stage followed by knockout rounds' },
];

const SPORTS = [
  { value: 'cricket',      label: 'Cricket'      },
  { value: 'football',     label: 'Football'     },
  { value: 'basketball',   label: 'Basketball'   },
  { value: 'tennis',       label: 'Tennis'       },
  { value: 'badminton',    label: 'Badminton'    },
  { value: 'volleyball',   label: 'Volleyball'   },
  { value: 'table_tennis', label: 'Table Tennis' },
];

const STEPS = [
  { n: 1, label: 'Basic Info'   },
  { n: 2, label: 'Format'      },
  { n: 3, label: 'Schedule'    },
];

export default function CreateTournament() {
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const [step, setStep] = useState(1);
  const [sport,  setSport]  = useState('cricket');
  const [format, setFormat] = useState('round_robin');

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name:                 '',
      description:          '',
      sport:                'cricket',
      format:               'round_robin',
      maxTeams:             8,
      playersPerTeam:       11,
      startDate:            '',
      registrationDeadline: '',
      entryFee:             0,
      prizePool:            0,
      city:                 '',
      state:                '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => tournamentService.create({
      ...data,
      creator:  user._id,
      location: { city: data.city, state: data.state },
      status:   'registration_open',
    }),
    onSuccess: (res) => {
      const t = res.data?.data?.tournament;
      navigate(t?._id ? `/tournaments/${t._id}` : '/tournaments');
    },
  });

  const nextStep = async () => {
    const fields = step === 1
      ? ['name', 'sport']
      : step === 2
      ? ['format', 'maxTeams']
      : ['startDate'];
    const ok = await trigger(fields);
    if (ok) setStep((s) => s + 1);
  };

  const onSubmit = (data) => {
    createMutation.mutate({ ...data, sport, format });
  };

  const selectSport = (val) => {
    setSport(val);
    setValue('sport', val);
  };

  const selectFormat = (val) => {
    setFormat(val);
    setValue('format', val);
  };

  const inputCls = (err) =>
    `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition ${
      err ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-indigo-200 focus:border-indigo-400'
    }`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-700 to-purple-700 text-white px-4 pt-5 pb-10">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/70 hover:text-white text-sm mb-5 transition">
            <FiArrowLeft size={16} /> Back
          </button>
          <h1 className="text-2xl font-black">Create Tournament</h1>
          <p className="text-white/60 text-sm mt-1">Set up your competition in 3 simple steps</p>

          {/* Step progress */}
          <div className="flex items-center gap-3 mt-6">
            {STEPS.map(({ n, label }) => (
              <div key={n} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                  n < step  ? 'bg-emerald-400 text-white' :
                  n === step ? 'bg-white text-indigo-700' :
                               'bg-white/20 text-white/50'
                }`}>
                  {n < step ? <FiCheck size={13} /> : n}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${n === step ? 'text-white' : 'text-white/50'}`}>
                  {label}
                </span>
                {n < STEPS.length && (
                  <div className={`flex-1 h-0.5 w-8 rounded-full ${n < step ? 'bg-emerald-400' : 'bg-white/20'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Card ──────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 -mt-6 pb-16">
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">

              {/* Step 1 — Basic Info */}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }} className="p-7 space-y-5">
                  <div>
                    <h2 className="font-black text-gray-900 text-lg">Basic Information</h2>
                    <p className="text-gray-400 text-sm mt-0.5">Tell players what this tournament is about</p>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tournament Name *</label>
                    <input
                      {...register('name', { required: 'Tournament name is required' })}
                      placeholder="e.g. City Cricket Cup 2025"
                      className={inputCls(errors.name)}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                    <textarea
                      {...register('description')}
                      placeholder="Tell players about the tournament, rules, prizes…"
                      rows={3}
                      className={inputCls(false) + ' resize-none'}
                    />
                  </div>

                  {/* Sport */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Sport *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {SPORTS.map(({ value, label }) => (
                        <button key={value} type="button" onClick={() => selectSport(value)}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition active:scale-95 ${
                            sport === value
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}>
                          <SportIcon sport={value} size={16} />
                          <span className={`text-sm font-semibold ${sport === value ? 'text-indigo-700' : 'text-gray-700'}`}>
                            {label}
                          </span>
                          {sport === value && <FiCheck size={13} className="ml-auto text-indigo-600" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2 — Format */}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }} className="p-7 space-y-5">
                  <div>
                    <h2 className="font-black text-gray-900 text-lg">Format & Rules</h2>
                    <p className="text-gray-400 text-sm mt-0.5">How will teams compete?</p>
                  </div>

                  {/* Format */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tournament Format *</label>
                    <div className="space-y-2">
                      {FORMATS.map(({ value, label, desc }) => (
                        <button key={value} type="button" onClick={() => selectFormat(value)}
                          className={`w-full p-4 rounded-xl border-2 text-left transition active:scale-[0.99] ${
                            format === value
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}>
                          <div className="flex items-center justify-between">
                            <p className={`font-bold text-sm ${format === value ? 'text-indigo-700' : 'text-gray-800'}`}>{label}</p>
                            {format === value && <FiCheck size={15} className="text-indigo-600 flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Team size */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        <FiUsers size={13} className="inline mr-1.5" />Max Teams *
                      </label>
                      <input type="number"
                        {...register('maxTeams', { required: true, min: 2, valueAsNumber: true })}
                        className={inputCls(errors.maxTeams)}
                        min={2} max={128}
                      />
                      {errors.maxTeams && <p className="text-red-500 text-xs mt-1">Min 2 teams required</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Players / Team</label>
                      <input type="number"
                        {...register('playersPerTeam', { valueAsNumber: true })}
                        className={inputCls(false)}
                        min={1} max={50}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3 — Schedule & Prizes */}
              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }} className="p-7 space-y-5">
                  <div>
                    <h2 className="font-black text-gray-900 text-lg">Schedule & Details</h2>
                    <p className="text-gray-400 text-sm mt-0.5">When and where?</p>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        <FiCalendar size={13} className="inline mr-1.5" />Start Date *
                      </label>
                      <input type="date"
                        {...register('startDate', { required: 'Start date is required' })}
                        className={inputCls(errors.startDate)}
                      />
                      {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reg. Deadline</label>
                      <input type="date"
                        {...register('registrationDeadline')}
                        className={inputCls(false)}
                      />
                    </div>
                  </div>

                  {/* Prize & Entry */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        <FiDollarSign size={13} className="inline mr-1.5" />Entry Fee (₹)
                      </label>
                      <input type="number" min={0}
                        {...register('entryFee', { valueAsNumber: true, min: 0 })}
                        className={inputCls(false)}
                        placeholder="0 = Free"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        <FiAward size={13} className="inline mr-1.5" />Prize Pool (₹)
                      </label>
                      <input type="number" min={0}
                        {...register('prizePool', { valueAsNumber: true, min: 0 })}
                        className={inputCls(false)}
                        placeholder="0 = No prize"
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      <FiMapPin size={13} className="inline mr-1.5" />Location
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <input {...register('city')} placeholder="City" className={inputCls(false)} />
                      <input {...register('state')} placeholder="State" className={inputCls(false)} />
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 space-y-2">
                    <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-2">Summary</p>
                    <div className="flex items-center gap-2 text-sm">
                      <SportIcon sport={sport} size={14} />
                      <span className="font-semibold text-gray-800 capitalize">{sport.replace('_', ' ')}</span>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-600">{FORMATS.find(f => f.value === format)?.label}</span>
                    </div>
                    <p className="text-xs text-gray-500">Registration opens immediately after creation</p>
                  </div>

                  {createMutation.isError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      <p className="text-red-600 text-sm font-medium">
                        {createMutation.error?.response?.data?.message || 'Failed to create tournament'}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>

            {/* ── Footer Nav ────────────────────── */}
            <div className="px-7 pb-7 flex gap-3">
              {step > 1 && (
                <button type="button" onClick={() => setStep((s) => s - 1)}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition">
                  <FiArrowLeft size={15} /> Back
                </button>
              )}
              {step < 3 ? (
                <button type="button" onClick={nextStep}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition active:scale-95 shadow-lg shadow-indigo-200">
                  Next <FiArrowRight size={15} />
                </button>
              ) : (
                <button type="submit" disabled={createMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-sm transition active:scale-95 shadow-lg shadow-indigo-200 disabled:opacity-60">
                  {createMutation.isPending ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating…</>
                  ) : (
                    <><FiCheck size={16} /> Create Tournament</>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
