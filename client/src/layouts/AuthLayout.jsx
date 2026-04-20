import { Outlet, Link } from 'react-router-dom';

const SPORT_IMAGES = [
  'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg', // cricket batter
  'https://images.pexels.com/photos/3727464/pexels-photo-3727464.jpeg', // football player
  'https://images.pexels.com/photos/3808013/pexels-photo-3808013.jpeg', // basketball player
];

const QUOTES = [
  { text: 'Champions keep playing until they get it right.', author: 'Billie Jean King' },
  { text: 'The more difficult the victory, the greater the happiness in winning.', author: 'Pelé' },
  { text: 'Winning isn\'t everything, but wanting to win is.', author: 'Vince Lombardi' },
];

// Pick a consistent one per session
const idx = Math.floor(Date.now() / (1000 * 60 * 60)) % 3;

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel   sports visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col">
        <img
          src={SPORT_IMAGES[idx]}
          alt="Sports"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/90 via-primary-800/75 to-primary-700/60" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <span className="text-white text-xl font-bold">A</span>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">Athléon</span>
          </div>

          {/* Center tagline */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-full text-xs font-medium text-white/90 mb-6 w-fit">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Your complete sports ecosystem
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              Play More.<br />
              Win Together.<br />
              <span className="text-primary-300">Level Up.</span>
            </h1>
            <p className="text-white/70 mt-5 text-lg leading-relaxed max-w-sm">
              Book venues, find players, score live, and compete in tournaments   all in one platform.
            </p>

            {/* Stats row */}
            <div className="flex gap-8 mt-10">
              {[['500+', 'Venues'], ['50K+', 'Players'], ['200+', 'Tournaments']].map(([val, lbl]) => (
                <div key={lbl}>
                  <p className="text-2xl font-bold text-white">{val}</p>
                  <p className="text-xs text-white/60 mt-0.5">{lbl}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom quote */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5">
            <p className="text-white/90 text-sm italic leading-relaxed">"{QUOTES[idx].text}"</p>
            <p className="text-white/50 text-xs mt-2">  {QUOTES[idx].author}</p>
          </div>
        </div>
      </div>

      {/* Right panel   auth form */}
      <div className="flex-1 flex flex-col bg-gray-50 lg:bg-white overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 p-6 pb-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <span className="text-white font-bold">A</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">Athléon</span>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10 lg:py-0">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 pb-6">© 2025 Athléon · <Link to="/venues" className="hover:text-primary-600">Venues</Link> · <Link to="/tournaments" className="hover:text-primary-600">Tournaments</Link></p>
      </div>
    </div>
  );
}

