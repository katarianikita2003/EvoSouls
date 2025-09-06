// frontend/components/EvolutionModal.js
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { updateCreatureMetadata } from '../utils/verbwireClient';

export default function EvolutionModal({ creature, onComplete }) {
  const [evolving, setEvolving] = useState(false);
  const [evolutionStage, setEvolutionStage] = useState(0);
  const [newForm, setNewForm] = useState(null);

  const evolutionForms = {
    fire: {
      base: { name: 'Pyro Phoenix', emoji: '🔥' },
      evolved: {
        aggressive: { name: 'Inferno Dragon', emoji: '🐉', color: 'from-red-600 to-orange-700' },
        defensive: { name: 'Magma Titan', emoji: '🛡️', color: 'from-orange-600 to-red-800' },
        strategic: { name: 'Solar Sage', emoji: '☀️', color: 'from-yellow-500 to-red-600' },
        adaptive: { name: 'Phoenix Lord', emoji: '🦅', color: 'from-orange-500 to-purple-600' }
      },
      ultimate: {
        aggressive: { name: 'Apocalypse Wyrm', emoji: '🌋', color: 'from-red-700 to-black' },
        defensive: { name: 'Eternal Guardian', emoji: '🗿', color: 'from-orange-700 to-gray-900' },
        strategic: { name: 'Cosmic Phoenix', emoji: '✨', color: 'from-purple-600 to-orange-600' },
        adaptive: { name: 'Elemental Master', emoji: '🎭', color: 'from-red-500 via-orange-500 to-yellow-500' }
      }
    },
    water: {
      base: { name: 'Aqua Serpent', emoji: '💧' },
      evolved: {
        aggressive: { name: 'Tsunami Leviathan', emoji: '🌊', color: 'from-blue-600 to-cyan-700' },
        defensive: { name: 'Ice Fortress', emoji: '🏔️', color: 'from-cyan-600 to-blue-800' },
        strategic: { name: 'Mist Weaver', emoji: '🌫️', color: 'from-blue-500 to-purple-600' },
        adaptive: { name: 'Ocean Spirit', emoji: '🧊', color: 'from-cyan-500 to-blue-600' }
      },
      ultimate: {
        aggressive: { name: 'Abyssal Terror', emoji: '🦈', color: 'from-blue-900 to-black' },
        defensive: { name: 'Glacier Ancient', emoji: '❄️', color: 'from-white to-blue-900' },
        strategic: { name: 'Void Kraken', emoji: '🦑', color: 'from-purple-900 to-blue-900' },
        adaptive: { name: 'Tidal Sovereign', emoji: '🔱', color: 'from-blue-400 via-cyan-500 to-purple-600' }
      }
    },
    earth: {
      base: { name: 'Terra Golem', emoji: '🌿' },
      evolved: {
        aggressive: { name: 'Quake Beast', emoji: '🦏', color: 'from-green-600 to-brown-700' },
        defensive: { name: 'Mountain Core', emoji: '⛰️', color: 'from-gray-600 to-green-800' },
        strategic: { name: 'Nature Druid', emoji: '🌳', color: 'from-green-500 to-emerald-600' },
        adaptive: { name: 'Crystal Guardian', emoji: '💎', color: 'from-emerald-500 to-purple-600' }
      },
      ultimate: {
        aggressive: { name: 'Gaia\'s Wrath', emoji: '🌍', color: 'from-green-900 to-red-800' },
        defensive: { name: 'World Tree', emoji: '🌲', color: 'from-brown-800 to-green-900' },
        strategic: { name: 'Elemental Sage', emoji: '🍃', color: 'from-green-600 to-blue-600' },
        adaptive: { name: 'Life Bringer', emoji: '🌺', color: 'from-green-400 via-yellow-400 to-pink-400' }
      }
    }
  };

  const getDominantBehavior = (behavior) => {
    const scores = {
      aggressive: behavior.aggressive || 0,
      defensive: behavior.defensive || 0,
      strategic: behavior.strategic || 0,
      adaptive: behavior.adaptive || 0
    };
    
    return Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b)[0];
  };

  const triggerEvolution = async () => {
    setEvolving(true);
    
    const dominantBehavior = getDominantBehavior(creature.behavior);
    const evolutionTier = creature.level >= 20 ? 'ultimate' : 'evolved';
    const evolution = evolutionForms[creature.element][evolutionTier][dominantBehavior];
    
    // Evolution animation stages
    for (let i = 1; i <= 5; i++) {
      setEvolutionStage(i);
      await new Promise(resolve => setTimeout(resolve, 600));
    }
    
    // Confetti!
    confetti({
      particleCount: 200,
      spread: 90,
      origin: { y: 0.6 }
    });
    
    setNewForm(evolution);
    
    // Update metadata on Verbwire
    try {
      await updateCreatureMetadata(creature.tokenId, {
        ...creature,
        name: evolution.name,
        level: creature.level + 1,
        evolutionStage: evolutionTier,
        appearance: evolution
      });
    } catch (error) {
      console.error('Error updating NFT metadata:', error);
    }
    
    setTimeout(() => {
      onComplete(evolution);
    }, 3000);
  };

  useEffect(() => {
    if (creature) {
      triggerEvolution();
    }
  }, [creature]);

  const evolutionAnimations = {
    1: { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] },
    2: { scale: [1, 1.5, 1], rotate: [0, 180] },
    3: { scale: [1, 2, 1], filter: 'blur(5px)' },
    4: { scale: [1, 0.5, 1.5], filter: 'brightness(2)' },
    5: { scale: [1.5, 1], rotate: [360, 0], filter: 'brightness(1)' }
  };

  return (
    <AnimatePresence>
      {evolving && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
        >
          <div className="text-center">
            {evolutionStage < 5 ? (
              <>
                <motion.div
                  animate={evolutionAnimations[evolutionStage]}
                  transition={{ duration: 0.6 }}
                  className="text-9xl mb-8"
                >
                  {evolutionForms[creature.element].base.emoji}
                </motion.div>
                <motion.h2
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-4xl font-bold text-white"
                >
                  Evolving...
                </motion.h2>
                <div className="flex justify-center mt-4 space-x-2">
                  {[1, 2, 3, 4, 5].map((stage) => (
                    <motion.div
                      key={stage}
                      animate={{ scale: stage <= evolutionStage ? 1.5 : 1 }}
                      className={`w-3 h-3 rounded-full ${
                        stage <= evolutionStage ? 'bg-purple-500' : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </>
            ) : (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', duration: 1 }}
              >
                <div className={`text-9xl mb-8 bg-gradient-to-r ${newForm.color} bg-clip-text text-transparent`}>
                  {newForm.emoji}
                </div>
                <h2 className="text-5xl font-bold text-white mb-2">Evolution Complete!</h2>
                <p className="text-2xl text-purple-400">{creature.name} → {newForm.name}</p>
                
                <div className="mt-8 space-y-2 text-gray-300">
                  <p>New abilities unlocked!</p>
                  <p>Stats increased!</p>
                  <p>Special moves learned!</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}