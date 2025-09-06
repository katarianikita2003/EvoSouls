// import React, { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import confetti from 'canvas-confetti';

// const EvolutionAnimation = ({ creature, evolutionData, onComplete }) => {
//   const [stage, setStage] = useState('charging'); // charging, transforming, reveal, complete
//   const [particles, setParticles] = useState([]);

//   useEffect(() => {
//     // Stage progression
//     const timers = [];
    
//     timers.push(setTimeout(() => setStage('transforming'), 2000));
//     timers.push(setTimeout(() => setStage('reveal'), 4000));
//     timers.push(setTimeout(() => {
//       setStage('complete');
//       triggerConfetti();
//     }, 6000));

//     // Generate particles
//     const newParticles = Array.from({ length: 50 }, (_, i) => ({
//       id: i,
//       x: Math.random() * window.innerWidth,
//       y: Math.random() * window.innerHeight,
//       size: Math.random() * 4 + 2,
//       duration: Math.random() * 2 + 3,
//       delay: Math.random() * 2
//     }));
//     setParticles(newParticles);

//     return () => timers.forEach(clearTimeout);
//   }, []);

//   const triggerConfetti = () => {
//     const duration = 3 * 1000;
//     const animationEnd = Date.now() + duration;
//     const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

//     const randomInRange = (min, max) => Math.random() * (max - min) + min;

//     const interval = setInterval(() => {
//       const timeLeft = animationEnd - Date.now();
//       if (timeLeft <= 0) return clearInterval(interval);

//       const particleCount = 50 * (timeLeft / duration);
//       confetti(Object.assign({}, defaults, {
//         particleCount,
//         origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
//         colors: ['#ff6b6b', '#4dabf7', '#51cf66', '#ffd43b', '#ff8787']
//       }));
//       confetti(Object.assign({}, defaults, {
//         particleCount,
//         origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
//         colors: ['#ff6b6b', '#4dabf7', '#51cf66', '#ffd43b', '#ff8787']
//       }));
//     }, 250);
//   };

//   const getEvolutionColor = () => {
//     const colors = {
//       aggressive: 'from-red-600 to-orange-600',
//       defensive: 'from-blue-600 to-cyan-600',
//       strategic: 'from-purple-600 to-pink-600',
//       risky: 'from-yellow-600 to-red-600',
//       adaptive: 'from-green-600 to-blue-600'
//     };
//     return colors[evolutionData.behaviorType.primary] || 'from-purple-600 to-pink-600';
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black">
//       {/* Particle Background */}
//       <div className="absolute inset-0">
//         {particles.map(particle => (
//           <motion.div
//             key={particle.id}
//             className="absolute bg-white rounded-full opacity-50"
//             style={{
//               width: particle.size,
//               height: particle.size,
//               left: particle.x,
//               top: particle.y
//             }}
//             animate={{
//               x: [0, Math.random() * 200 - 100],
//               y: [0, -200],
//               opacity: [0, 1, 0]
//             }}
//             transition={{
//               duration: particle.duration,
//               delay: particle.delay,
//               repeat: Infinity,
//               ease: "easeOut"
//             }}
//           />
//         ))}
//       </div>

//       {/* Main Evolution Animation */}
//       <AnimatePresence mode="wait">
//         {stage === 'charging' && (
//           <motion.div
//             key="charging"
//             exit={{ opacity: 0 }}
//             className="relative"
//           >
//             <motion.div
//               className="flex items-center justify-center w-64 h-64 rounded-full bg-gradient-to-br from-gray-700 to-gray-900"
//               animate={{
//                 scale: [1, 1.2, 1],
//                 boxShadow: [
//                   '0 0 0 0 rgba(255, 255, 255, 0)',
//                   '0 0 60px 30px rgba(255, 255, 255, 0.5)',
//                   '0 0 0 0 rgba(255, 255, 255, 0)'
//                 ]
//               }}
//               transition={{
//                 duration: 1.5,
//                 repeat: Infinity
//               }}
//             >
//               <div className="text-6xl">{creature.emoji || '🔮'}</div>
//             </motion.div>
//             <motion.p
//               className="mt-8 text-xl text-center text-white"
//               animate={{ opacity: [0.5, 1, 0.5] }}
//               transition={{ duration: 2, repeat: Infinity }}
//             >
//               Gathering evolution energy...
//             </motion.p>
//           </motion.div>
//         )}

//         {stage === 'transforming' && (
//           <motion.div
//             key="transforming"
//             initial={{ scale: 0, rotate: 0 }}
//             animate={{ scale: 1, rotate: 720 }}
//             exit={{ opacity: 0 }}
//             className="relative"
//           >
//             <motion.div
//               className={`w-64 h-64 bg-gradient-to-br ${getEvolutionColor()} rounded-full flex items-center justify-center`}
//               animate={{
//                 scale: [1, 1.5, 1, 1.3, 1],
//                 filter: ['brightness(1)', 'brightness(2)', 'brightness(1)']
//               }}
//               transition={{
//                 duration: 2,
//                 times: [0, 0.3, 0.5, 0.7, 1]
//               }}
//             >
//               <motion.div
//                 className="text-6xl"
//                 animate={{
//                   scale: [1, 0, 0, 1.2],
//                   rotate: [0, 180, 360, 0]
//                 }}
//                 transition={{
//                   duration: 2,
//                   times: [0, 0.3, 0.7, 1]
//                 }}
//               >
//                 {stage === 'transforming' && creature.emoji}
//               </motion.div>
//             </motion.div>
//             <motion.div
//               className="absolute inset-0 rounded-full"
//               style={{
//                 background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)'
//               }}
//               animate={{
//                 scale: [0, 2, 0],
//                 opacity: [0, 1, 0]
//               }}
//               transition={{
//                 duration: 1,
//                 repeat: 2
//               }}
//             />
//           </motion.div>
//         )}

//         {stage === 'reveal' && (
//           <motion.div
//             key="reveal"
//             initial={{ scale: 0, opacity: 0 }}
//             animate={{ scale: 1, opacity: 1 }}
//             transition={{ type: "spring", stiffness: 200, damping: 20 }}
//             className="relative"
//           >
//             <motion.div
//               className={`w-80 h-80 bg-gradient-to-br ${getEvolutionColor()} rounded-lg shadow-2xl flex flex-col items-center justify-center p-8`}
//               animate={{
//                 boxShadow: [
//                   '0 0 60px rgba(255, 255, 255, 0.8)',
//                   '0 0 120px rgba(255, 255, 255, 0.4)',
//                   '0 0 60px rgba(255, 255, 255, 0.8)'
//                 ]
//               }}
//               transition={{
//                 duration: 2,
//                 repeat: Infinity
//               }}
//             >
//               <motion.div
//                 className="mb-4 text-8xl"
//                 animate={{
//                   scale: [1, 1.2, 1],
//                   rotate: [0, 10, -10, 0]
//                 }}
//                 transition={{
//                   duration: 3,
//                   repeat: Infinity
//                 }}
//               >
//                 {evolutionData.evolutionData.visualTraits.emoji || '✨'}
//               </motion.div>
//               <h2 className="mb-2 text-3xl font-bold text-white">Evolution Complete!</h2>
//               <p className="text-xl text-white/90">{evolutionData.evolutionData.name}</p>
//             </motion.div>
//           </motion.div>
//         )}

//         {stage === 'complete' && (
//           <motion.div
//             key="complete"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             className="text-center"
//           >
//             <div className="max-w-2xl p-8 mx-auto bg-gray-900/90 backdrop-blur rounded-2xl">
//               <h1 className="mb-6 text-4xl font-bold text-white">
//                 {creature.name} evolved into {evolutionData.evolutionData.name}!
//               </h1>
              
//               <div className="grid grid-cols-2 gap-8 mb-8">
//                 {/* Before */}
//                 <div>
//                   <h3 className="mb-4 text-xl font-semibold text-gray-400">Before</h3>
//                   <div className="p-4 bg-gray-800 rounded-lg">
//                     <div className="mb-2 text-5xl text-center">{creature.emoji}</div>
//                     <div className="space-y-2 text-sm">
//                       <div className="flex justify-between">
//                         <span className="text-gray-400">Attack:</span>
//                         <span className="text-orange-400">{creature.stats.attack}</span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span className="text-gray-400">Defense:</span>
//                         <span className="text-blue-400">{creature.stats.defense}</span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span className="text-gray-400">Speed:</span>
//                         <span className="text-green-400">{creature.stats.speed}</span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
                
//                 {/* After */}
//                 <div>
//                   <h3 className="mb-4 text-xl font-semibold text-purple-400">After</h3>
//                   <div className={`bg-gradient-to-br ${getEvolutionColor()} p-4 rounded-lg`}>
//                     <div className="mb-2 text-5xl text-center">✨</div>
//                     <div className="space-y-2 text-sm text-white">
//                       <div className="flex justify-between">
//                         <span>Attack:</span>
//                         <span className="font-bold">
//                           {creature.stats.attack + evolutionData.evolutionData.statBoosts.attack}
//                           <span className="ml-1 text-green-300">
//                             (+{evolutionData.evolutionData.statBoosts.attack})
//                           </span>
//                         </span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span>Defense:</span>
//                         <span className="font-bold">
//                           {creature.stats.defense + evolutionData.evolutionData.statBoosts.defense}
//                           <span className={evolutionData.evolutionData.statBoosts.defense >= 0 ? 'text-green-300' : 'text-red-300'} ml-1>
//                             ({evolutionData.evolutionData.statBoosts.defense >= 0 ? '+' : ''}{evolutionData.evolutionData.statBoosts.defense})
//                           </span>
//                         </span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span>Speed:</span>
//                         <span className="font-bold">
//                           {creature.stats.speed + evolutionData.evolutionData.statBoosts.speed}
//                           <span className={evolutionData.evolutionData.statBoosts.speed >= 0 ? 'text-green-300' : 'text-red-300'} ml-1>
//                             ({evolutionData.evolutionData.statBoosts.speed >= 0 ? '+' : ''}{evolutionData.evolutionData.statBoosts.speed})
//                           </span>
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* New Moves */}
//               <div className="mb-8">
//                 <h3 className="mb-4 text-xl font-semibold text-white">New Abilities Unlocked</h3>
//                 <div className="flex flex-wrap justify-center gap-3">
//                   {evolutionData.evolutionData.newMoves.map((move, index) => (
//                     <motion.div
//                       key={move}
//                       initial={{ opacity: 0, y: 20 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       transition={{ delay: 7 + index * 0.2 }}
//                       className="px-4 py-2 border rounded-lg bg-purple-600/20 border-purple-500/50"
//                     >
//                       <span className="font-semibold text-purple-300">{move}</span>
//                     </motion.div>
//                   ))}
//                 </div>
//               </div>

//               {/* Behavior Analysis */}
//               <div className="mb-8">
//                 <h3 className="mb-4 text-xl font-semibold text-white">Dominant Playstyle</h3>
//                 <div className="p-4 bg-gray-800 rounded-lg">
//                   <p className="text-2xl font-bold text-purple-400 capitalize">
//                     {evolutionData.behaviorType.primary}
//                   </p>
//                   <p className="mt-2 text-gray-400">
//                     Your creature evolved based on your unique playstyle across {creature.battleCount} battles!
//                   </p>
//                 </div>
//               </div>

//               {/* Action Buttons */}
//               <div className="flex justify-center gap-4">
//                 <motion.button
//                   whileHover={{ scale: 1.05 }}
//                   whileTap={{ scale: 0.95 }}
//                   onClick={onComplete}
//                   className="px-8 py-3 font-bold text-white transition-colors bg-purple-600 rounded-lg hover:bg-purple-700"
//                 >
//                   View Updated NFT
//                 </motion.button>
//                 <motion.button
//                   whileHover={{ scale: 1.05 }}
//                   whileTap={{ scale: 0.95 }}
//                   onClick={() => window.location.href = '/battle'}
//                   className="px-8 py-3 font-bold text-white transition-colors bg-gray-600 rounded-lg hover:bg-gray-700"
//                 >
//                   Battle Again
//                 </motion.button>
//               </div>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// };

// export default EvolutionAnimation;