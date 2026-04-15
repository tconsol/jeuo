import { Link } from 'react-router-dom';
import { FiInstagram, FiTwitter, FiFacebook, FiYoutube, FiMail, FiPhone } from 'react-icons/fi';

const SPORTS = ['Cricket', 'Football', 'Badminton', 'Basketball', 'Tennis', 'Volleyball'];

const LINKS = {
  Platform: [
    { label: 'Book a Venue', to: '/venues' },
    { label: 'Activities', to: '/activities' },
    { label: 'Tournaments', to: '/tournaments' },
    { label: 'Live Scores', to: '/matches' },
  ],
  'For Owners': [
    { label: 'List Your Venue', to: '/register', external: false, ownerLink: true },
    { label: 'Owner Dashboard', to: 'http://localhost:5174', external: true },
    { label: 'Revenue Reports', to: 'http://localhost:5174/revenue', external: true },
  ],
  Support: [
    { label: 'Help Center', to: '/help' },
    { label: 'Contact Us', to: '/contact' },
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms of Service', to: '/terms' },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-14 pb-6 mt-auto hidden lg:block">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-10 border-b border-gray-800">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-display font-bold text-white text-sm">
                A
              </div>
              <span className="text-white font-display font-bold text-lg">Athleon</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              India's sports community platform. Find venues, join activities, and compete in tournaments.
            </p>
            {/* Social */}
            <div className="flex items-center gap-3">
              {[
                { Icon: FiInstagram, href: '#' },
                { Icon: FiTwitter, href: '#' },
                { Icon: FiFacebook, href: '#' },
                { Icon: FiYoutube, href: '#' },
              ].map(({ Icon, href }) => (
                <a
                  key={href + Icon.toString()}
                  href={href}
                  className="w-8 h-8 bg-gray-800 hover:bg-indigo-600 rounded-lg flex items-center justify-center transition-colors"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Page links */}
          {Object.entries(LINKS).map(([title, items]) => (
            <div key={title}>
              <h3 className="text-white font-semibold text-sm mb-3">{title}</h3>
              <ul className="space-y-2">
                {items.map(({ label, to, external }) =>
                  external ? (
                    <li key={label}>
                      <a
                        href={to}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        {label}
                      </a>
                    </li>
                  ) : (
                    <li key={label}>
                      <Link to={to} className="text-sm text-gray-400 hover:text-white transition-colors">
                        {label}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}

          {/* Sports */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-3">Sports</h3>
            <ul className="space-y-2">
              {SPORTS.map((sport) => (
                <li key={sport}>
                  <Link
                    to={`/venues?sport=${sport.toLowerCase()}`}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {sport}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Contact strip */}
        <div className="flex flex-wrap items-center gap-6 py-5 border-b border-gray-800 text-sm text-gray-400">
          <a href="mailto:info@tconsolutions.com" className="flex items-center gap-2 hover:text-white transition-colors">
            <FiMail size={14} /> info@tconsolutions.com
          </a>
          <a href="tel:+919000000000" className="flex items-center gap-2 hover:text-white transition-colors">
            <FiPhone size={14} /> +91 90000 00000
          </a>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} Athleon by TCon Solutions. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-gray-300 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-gray-300 transition-colors">Terms</Link>
            <Link to="/sitemap" className="hover:text-gray-300 transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
