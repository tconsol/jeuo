import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mb-4 shadow-lg shadow-primary-500/20">
            <span className="text-white text-2xl font-bold">A</span>
          </div>
          <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Athléon
          </h1>
          <p className="text-gray-500 mt-2">Your Sports Ecosystem</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
