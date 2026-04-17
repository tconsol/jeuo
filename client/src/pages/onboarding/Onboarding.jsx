import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import api from '../../lib/api';

const SPORTS = ['cricket', 'football', 'basketball', 'tennis', 'badminton', 'volleyball', 'table_tennis'];
const LEVELS = ['beginner', 'intermediate', 'advanced', 'professional'];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [selectedSports, setSelectedSports] = useState([]);
  const [skillLevel, setSkillLevel] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const mutation = useMutation({
    mutationFn: (data) => api.put('/users/profile', data),
    onSuccess: () => navigate('/'),
  });

  const toggleSport = (sport) => {
    setSelectedSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  };

  const handleFinish = () => {
    mutation.mutate({
      sports: selectedSports.map((s) => ({ name: s, skillLevel: skillLevel || 'beginner' })),
      onboardingCompleted: true,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${
                s <= step ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h2>
            <p className="text-gray-500 mb-6">
              Let us personalize your experience. Pick the sports you play.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {SPORTS.map((sport) => (
                <button
                  key={sport}
                  onClick={() => toggleSport(sport)}
                  className={`px-4 py-3 rounded-xl border-2 text-sm font-medium capitalize transition ${
                    selectedSports.includes(sport)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {sport.replace('_', ' ')}
                </button>
              ))}
            </div>
            <button
              disabled={selectedSports.length === 0}
              onClick={() => setStep(2)}
              className="w-full mt-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Skill Level</h2>
            <p className="text-gray-500 mb-6">How would you describe your overall skill?</p>
            <div className="space-y-3">
              {LEVELS.map((level) => (
                <button
                  key={level}
                  onClick={() => setSkillLevel(level)}
                  className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium capitalize transition text-left ${
                    skillLevel === level
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)} className="flex-1 py-2.5 border rounded-xl text-gray-600">
                Back
              </button>
              <button
                disabled={!skillLevel}
                onClick={() => setStep(3)}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">All Set!</h2>
            <p className="text-gray-500 mb-6">
              You selected {selectedSports.length} sport{selectedSports.length > 1 ? 's' : ''} at{' '}
              <span className="capitalize font-medium">{skillLevel}</span> level.
            </p>
            <button
              onClick={handleFinish}
              disabled={mutation.isPending}
              className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-40"
            >
              {mutation.isPending ? 'Saving...' : 'Get Started'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
