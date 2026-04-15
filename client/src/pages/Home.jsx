import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiMapPin, FiUsers, FiTv, FiAward, FiArrowRight, FiChevronRight, FiStar, FiCalendar, FiCheck } from 'react-icons/fi';
import api from '../lib/api';

const features = [
  { icon: FiMapPin, title: 'Book Venues', desc: 'Find and book sports venues near you instantly', to: '/venues', gradient: 'from-primary-500 to-primary-600', bg: 'bg-primary-50' },
  { icon: FiUsers, title: 'Join Games', desc: 'Connect with players and join pickup activities', to: '/activities', gradient: 'from-accent-500 to-accent-600', bg: 'bg-accent-50' },
  { icon: FiTv, title: 'Live Scoring', desc: 'Score matches ball-by-ball in real-time', to: '/matches/live', gradient: 'from-coral-500 to-coral-600', bg: 'bg-coral-50' },
  { icon: FiAward, title: 'Tournaments', desc: 'Organize and compete in tournaments', to: '/tournaments', gradient: 'from-amber-500 to-amber-600', bg: 'bg-amber-50' },
];

const sports = [
  { emoji: '🏏', name: 'Cricket', color: 'bg-green-50 hover:bg-green-100', players: '22K+' },
  { emoji: '⚽', name: 'Football', color: 'bg-emerald-50 hover:bg-emerald-100', players: '18K+' },
  { emoji: '🏀', name: 'Basketball', color: 'bg-orange-50 hover:bg-orange-100', players: '12K+' },
  { emoji: '🎾', name: 'Tennis', color: 'bg-lime-50 hover:bg-lime-100', players: '8K+' },
  { emoji: '🏸', name: 'Badminton', color: 'bg-blue-50 hover:bg-blue-100', players: '15K+' },
  { emoji: '🏐', name: 'Volleyball', color: 'bg-yellow-50 hover:bg-yellow-100', players: '6K+' },
  { emoji: '🏓', name: 'Table Tennis', color: 'bg-red-50 hover:bg-red-100', players: '5K+' },
];

const steps = [
  { num: '01', title: 'Choose a Sport', desc: 'Pick from cricket, football, badminton, and more' },
  { num: '02', title: 'Find & Book', desc: 'Search nearby venues and reserve your slot instantly' },
  { num: '03', title: 'Play & Score', desc: 'Show up, play, and track scores live on the platform' },
];

const stats = [
  { value: '500+', label: 'Sports Venues' },
  { value: '50K+', label: 'Active Players' },
  { value: '10K+', label: 'Monthly Bookings' },
  { value: '200+', label: 'Tournaments' },
];

export default function Home() {
  const { data: venuesData } = useQuery({
    queryKey: ['featured-venues'],
    queryFn: () => api.get('/venues', { params: { limit: 4 } }).then((r) => r.data),
  });

  const { data: tournamentsData } = useQuery({
    queryKey: ['upcoming-tournaments'],
    queryFn: () => api.get('/tournaments', { params: { status: 'registration_open', limit: 3 } }).then((r) => r.data),
  });

  const featuredVenues = venuesData?.data?.venues?.slice(0, 4) || [];
  const upcomingTournaments = tournamentsData?.data?.tournaments?.slice(0, 3) || [];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.08),transparent)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-28 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-medium mb-6 ring-1 ring-primary-100">
              <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
              Live matches happening now
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold leading-tight text-gray-900">
              Your Sports{' '}
              <span className="bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 bg-clip-text text-transparent">
                Ecosystem
              </span>
            </h1>
            <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Book venues, find players, score matches live, and compete in tournaments — all in one beautifully crafted platform.
            </p>
            <div className="mt-10 flex flex-wrap gap-3 justify-center">
              <Link to="/venues" className="btn-primary text-base px-8 py-3.5 flex items-center gap-2 shadow-lg shadow-primary-500/25">
                Explore Venues <FiArrowRight />
              </Link>
              <Link to="/activities" className="btn-secondary text-base px-8 py-3.5">
                Find a Game
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((s) => (
              <motion.div key={s.label} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
                <p className="text-2xl md:text-3xl font-bold text-white">{s.value}</p>
                <p className="text-sm text-gray-400 mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Sports carousel */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-gray-900">Popular Sports</h2>
              <p className="text-gray-500 text-sm mt-1">Choose your game and find venues nearby</p>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {sports.map((sport) => (
              <Link
                key={sport.name}
                to={`/venues?sport=${sport.name.toLowerCase().replace(' ', '_')}`}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl ${sport.color} transition-all duration-300 group`}
              >
                <span className="text-3xl group-hover:scale-110 transition-transform duration-200">{sport.emoji}</span>
                <span className="text-sm font-medium text-gray-700">{sport.name}</span>
                <span className="text-xs text-gray-400">{sport.players}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Venues */}
      {featuredVenues.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-gray-900">Featured Venues</h2>
                <p className="text-gray-500 text-sm mt-1">Top-rated sports facilities near you</p>
              </div>
              <Link to="/venues" className="flex items-center gap-1 text-primary-600 font-medium text-sm hover:text-primary-700">
                View all <FiChevronRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredVenues.map((venue, i) => (
                <motion.div key={venue._id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
                  <Link to={`/venues/${venue._id}`}
                    className="block bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover border border-gray-100 transition-all duration-300 group">
                    <div className="h-36 bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center overflow-hidden">
                      {venue.images?.[0] ? (
                        <img src={venue.images[0]} alt={venue.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <FiMapPin size={32} className="text-primary-300" />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{venue.name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <FiMapPin size={12} /> {venue.address?.area || venue.address?.city}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex gap-1.5">
                          {venue.sports?.slice(0, 2).map((s) => (
                            <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">{s}</span>
                          ))}
                        </div>
                        {venue.rating > 0 && (
                          <div className="flex items-center gap-1 text-amber-500">
                            <FiStar size={12} fill="currentColor" />
                            <span className="text-xs font-semibold">{venue.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-gray-900">Everything You Need</h2>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto">One platform for all your sports activities — from booking to competing.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Link to={f.to} className="block bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 group border border-gray-100">
                  <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                    <f.icon size={22} className="text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{f.title}</h3>
                  <p className="text-gray-500 text-sm mt-2 leading-relaxed">{f.desc}</p>
                  <span className="inline-flex items-center gap-1 text-primary-600 text-sm font-medium mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore <FiChevronRight size={14} />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-gray-900">How It Works</h2>
            <p className="text-gray-500 mt-3">Get playing in 3 simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div key={step.num} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }} viewport={{ once: true }}
                className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-primary-700">{step.num}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                <p className="text-gray-500 text-sm mt-2">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Tournaments */}
      {upcomingTournaments.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-gray-900">Upcoming Tournaments</h2>
                <p className="text-gray-500 text-sm mt-1">Register now and compete with the best</p>
              </div>
              <Link to="/tournaments" className="flex items-center gap-1 text-primary-600 font-medium text-sm hover:text-primary-700">
                View all <FiChevronRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {upcomingTournaments.map((t, i) => (
                <motion.div key={t._id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
                  <Link to={`/tournaments/${t._id}`}
                    className="block bg-white rounded-2xl p-5 shadow-card hover:shadow-card-hover border border-gray-100 transition-all duration-300 group">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{t.name}</h3>
                        <p className="text-xs text-gray-500 mt-1 capitalize">{t.sport} · {t.format?.replace(/_/g, ' ')}</p>
                      </div>
                      <span className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">Open</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-3">
                      <span className="flex items-center gap-1"><FiCalendar size={13} /> {new Date(t.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      <span className="flex items-center gap-1"><FiUsers size={13} /> {t.teams?.length || 0}/{t.maxTeams} teams</span>
                      {t.entryFee > 0 && <span className="font-medium text-gray-900">₹{t.entryFee}</span>}
                      {t.entryFee === 0 && <span className="font-medium text-green-600">Free</span>}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why choose us */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-display font-bold text-gray-900">Why Sports Enthusiasts Love Athleon</h2>
              <p className="text-gray-500 mt-4 leading-relaxed">We make it easy to book, play, and compete. No more phone calls to venues, no more WhatsApp groups for organizing games.</p>
              <div className="mt-8 space-y-4">
                {[
                  'Instant venue booking with real-time slot availability',
                  'Find and join pickup games in your city',
                  'Live ball-by-ball scoring for cricket and other sports',
                  'Organize tournaments with auto-generated fixtures',
                  'Track your stats, wins, and sports journey',
                ].map((text) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FiCheck size={12} className="text-primary-600" />
                    </div>
                    <p className="text-gray-600 text-sm">{text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100 text-center">
                <span className="text-4xl">🏏</span>
                <p className="text-sm font-medium text-gray-700 mt-3">Cricket Grounds</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">150+</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100 text-center mt-6">
                <span className="text-4xl">⚽</span>
                <p className="text-sm font-medium text-gray-700 mt-3">Football Turfs</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">120+</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100 text-center -mt-2">
                <span className="text-4xl">🏸</span>
                <p className="text-sm font-medium text-gray-700 mt-3">Badminton Courts</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">200+</p>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100 text-center mt-4">
                <span className="text-4xl">🎾</span>
                <p className="text-sm font-medium text-gray-700 mt-3">Tennis Courts</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">50+</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-3xl p-10 lg:p-14 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent)]" />
            <div className="relative">
              <h2 className="text-3xl font-display font-bold text-white">Ready to Play?</h2>
              <p className="text-primary-100 mt-4 text-lg">Join thousands of sports enthusiasts on Athleon.</p>
              <Link to="/login" className="mt-8 inline-flex items-center gap-2 bg-white text-primary-700 font-semibold text-lg px-8 py-3.5 rounded-xl hover:bg-primary-50 transition-all duration-200 shadow-lg">
                Get Started <FiArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
