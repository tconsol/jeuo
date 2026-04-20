import {
  FiPieChart, FiUsers, FiLogIn, FiDroplet, FiSun, FiActivity,
  FiWifi, FiBarChart2, FiBookOpen, FiTool, FiCheck,
} from 'react-icons/fi';
import { MdLocalParking, MdWc } from 'react-icons/md';
import { BiCoffee } from 'react-icons/bi';

const amenityIcons = {
  parking:         MdLocalParking,
  washroom:        MdWc,
  'changing-room': FiLogIn,
  drinking_water:  FiDroplet,
  floodlight:      FiSun,
  first_aid:       FiActivity,
  cafeteria:       BiCoffee,
  wifi:            FiWifi,
  scoreboard:      FiBarChart2,
  coaching:        FiBookOpen,
  equipment:       FiTool,
  shower:          FiDroplet,
};

export default function AmenityBadge({ amenity }) {
  const Icon = amenityIcons[amenity] || FiCheck;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 rounded-lg text-xs text-gray-600">
      <Icon size={12} className="text-gray-500 shrink-0" />
      <span className="capitalize">{amenity.replace(/[_-]/g, ' ')}</span>
    </span>
  );
}
