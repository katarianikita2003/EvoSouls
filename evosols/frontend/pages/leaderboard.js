import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    // Mock leaderboard data for demo
    setLeaderboard([
      { rank: 1, address: '0x1234...5678', creature: 'Inferno Dragon', wins: 45, battles: 50, winRate: '90%' },
      { rank: 2, address: '0x8765...4321', creature: 'Tsunami Leviathan', wins: 38, battles: 45, winRate: '84%' },
      { rank: 3, address: '0x9876...1234', creature: 'Quake Beast', wins: 35, battles: 42, winRate: '83%' },
      { rank: 4, address: '0x5432...8765', creature: 'Phoenix Lord', wins: 30, battles: 40, winRate: '75%' },
      { rank: 5, address: '0x2345...6789', creature: 'Ocean Spirit', wins: 28, battles: 38, winRate: '74%' }
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white text-center mb-8">Leaderboard</h1>
        
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-900/50">
                <tr className="text-left text-gray-300">
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Player</th>
                  <th className="px-6 py-4">Creature</th>
                  <th className="px-6 py-4 text-center">Wins</th>
                  <th className="px-6 py-4 text-center">Battles</th>
                  <th className="px-6 py-4 text-center">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <tr key={entry.rank} className="border-t border-gray-700 hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`text-2xl font-bold ${entry.rank <= 3 ? 'text-yellow-400' : 'text-gray-400'}`}>
                        {entry.rank === 1 ? '' : entry.rank === 2 ? '' : entry.rank === 3 ? '' : `#${entry.rank}`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white">{entry.address}</td>
                    <td className="px-6 py-4 text-purple-400">{entry.creature}</td>
                    <td className="px-6 py-4 text-center text-green-400">{entry.wins}</td>
                    <td className="px-6 py-4 text-center text-gray-300">{entry.battles}</td>
                    <td className="px-6 py-4 text-center text-orange-400 font-semibold">{entry.winRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}