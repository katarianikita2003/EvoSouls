import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';

export default function Collection() {
  const { address, isConnected } = useAccount();
  const [creatures, setCreatures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected && address) {
      fetchUserCreatures();
    } else {
      setLoading(false);
    }
  }, [address, isConnected]);

  const fetchUserCreatures = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/creatures/user/${address}`);
      const data = await response.json();
      setCreatures(data || []);
    } catch (error) {
      console.error('Error fetching creatures:', error);
      setCreatures([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Connect Your Wallet</h2>
            <p className="text-gray-300">Please connect your wallet to view your collection</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">My Collection</h1>
        
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : creatures.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-white text-xl mb-4">You don\'t have any creatures yet!</p>
            <a href="/" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
              Mint Your First Creature
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creatures.map((creature, index) => (
              <div key={creature.tokenId || index} className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6">
                <h3 className="text-white text-xl font-bold mb-2">{creature.name}</h3>
                <p className="text-gray-300">Level: {creature.level || 1}</p>
                <p className="text-gray-300">Element: {creature.element}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}