import { useState, useEffect } from 'react';
import { useGameStore } from './store/gameStore';

// Typewriter Effect Hook
function useTypewriter(text: string, speed: number = 30) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    if (!text) return;

    // Play sound hook point here: Audio.play('typing')
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(i));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return displayedText;
}

function App() {
  const store = useGameStore();

  // Dummy Event Text for Demo
  const currentEventDesc = "[SYSTEM LOG] 어둠 속에서 거대한 그림자가 일어선다. 무수히 많은 방독면을 목걸이처럼 엮어 건 거구의 사내, 블랙마켓의 변절자 '도살자'다. 그는 당신의 숨통을 조여온다.";
  const typedText = useTypewriter(currentEventDesc, 40);

  const renderScreen = () => {
      if (store.stats.hp <= 0) {
          return (
             <div style={{ backgroundColor: '#131313', color: '#8B0000', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
                 <h1 style={{ fontSize: '5rem', margin: 0, textShadow: '2px 2px #ffb4a8' }}>K.I.A</h1>
                 <p style={{ color: '#e3beb8', fontSize: '1.2rem' }}>YOU LOST ALL UNSECURED ITEMS.</p>
                 <button
                    onClick={() => store.dieAndLoseLoot()}
                    style={{ marginTop: '2rem', padding: '1rem 2rem', backgroundColor: '#353534', border: '1px solid #5a403c', color: '#e5e2e1', cursor: 'pointer', fontFamily: 'monospace' }}
                 >
                     WAKE UP AT HUB
                 </button>
             </div>
          )
      }

      const isHub = store.currentNodeId.endsWith('-01');
      if (isHub) {
          return (
             <div style={{ backgroundColor: '#131313', color: '#e5e2e1', minHeight: '100vh', padding: '2rem', fontFamily: 'monospace' }}>
                 <div style={{ borderBottom: '2px solid #353534', paddingBottom: '1rem', marginBottom: '2rem' }}>
                    <h1 style={{ color: '#ffb4a8', margin: 0 }}>BASECAMP HUB</h1>
                    <p style={{ color: '#e3beb8', margin: 0 }}>LOCATION: {store.currentNodeId}</p>
                 </div>

                 <div style={{ display: 'flex', gap: '2rem' }}>
                     {/* Stats & Quests Panel */}
                     <div style={{ flex: 1, backgroundColor: '#0e0e0e', padding: '1.5rem', border: '1px solid #5a403c' }}>
                         <h3 style={{ marginTop: 0, color: '#8adb4d' }}>OPERATOR VITALS</h3>
                         <p>HP: {store.stats.hp} / {store.stats.max_hp}</p>
                         <p>NOISE: {store.stats.noise}</p>
                         <p>CONTAMINATION: {store.stats.contamination}</p>

                         <hr style={{ borderColor: '#353534' }}/>
                         <h3 style={{ color: '#ffb4a8' }}>ACTIVE QUESTS</h3>
                         {Object.entries(store.quests).filter(([_, status]) => status === 'active').map(([qId]) => (
                             <div key={qId} style={{ color: '#e3beb8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                 &gt; {qId.replace(/_/g, ' ').toUpperCase()}
                             </div>
                         ))}

                         <hr style={{ borderColor: '#353534' }}/>
                         <h3 style={{ color: '#8adb4d' }}>INVENTORY</h3>
                         <pre style={{ color: '#e3beb8', fontSize: '0.8rem' }}>{JSON.stringify(store.inventory, null, 2)}</pre>
                     </div>

                     {/* Actions */}
                     <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                         <button style={{ padding: '1.5rem', backgroundColor: '#201f1f', color: '#e5e2e1', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
                             [1] ORGANIZE STASH
                         </button>
                         <button style={{ padding: '1.5rem', backgroundColor: '#201f1f', color: '#e5e2e1', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
                             [2] BLACK MARKET (MERCHANT)
                         </button>
                         <div style={{ flexGrow: 1 }} />
                         <button
                            onClick={() => store.moveToNode(store.currentChapterId === 'CH01' ? 'YD-02' : 'BW-03')}
                            style={{ padding: '2rem', backgroundColor: '#8B0000', color: '#131313', border: 'none', fontSize: '1.5rem', fontWeight: 'bold', cursor: 'pointer' }}
                         >
                             \ DEPLOY TO RAID /
                         </button>
                     </div>
                 </div>
             </div>
          );
      }

      // Exploring Screen with Typewriter Effect
      return (
          <div style={{ backgroundColor: '#131313', color: '#e5e2e1', minHeight: '100vh', padding: '2rem', fontFamily: 'monospace' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #353534', paddingBottom: '1rem', marginBottom: '2rem' }}>
                 <div>
                     <h2 style={{ color: '#ffb4a8', margin: 0 }}>RAID: {store.currentChapterId}</h2>
                     <p style={{ margin: 0, color: '#e3beb8' }}>NODE: {store.currentNodeId}</p>
                 </div>
                 <div style={{ textAlign: 'right' }}>
                     <p style={{ margin: 0, color: '#8adb4d' }}>HP: {store.stats.hp} | NOISE: {store.stats.noise} | RAD: {store.stats.contamination}</p>
                 </div>
              </div>

              {/* Typewriter Event Text Area */}
              <div style={{ backgroundColor: '#0e0e0e', padding: '2rem', border: '1px solid #5a403c', minHeight: '200px' }}>
                  <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: '#ffb4a8' }}>
                     {typedText}<span style={{ animation: 'blink 1s step-end infinite' }}>_</span>
                  </p>
              </div>
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes blink { 50% { opacity: 0; } }
              `}} />

              {/* Action Choices */}
              <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                  <button onClick={() => store.modifyStat('noise', 5)} style={{ flex: 1, padding: '1rem', backgroundColor: '#201f1f', color: '#e5e2e1', border: '1px solid #5a403c', cursor: 'pointer' }}>
                      SCAVENGE (HIGH NOISE)
                  </button>
                  <button onClick={() => store.modifyStat('hp', -20)} style={{ flex: 1, padding: '1rem', backgroundColor: '#313030', color: '#ffb4a8', border: '1px solid #8b0000', cursor: 'pointer' }}>
                      FIGHT BUTCHER (HP COST)
                  </button>
                  <button onClick={() => store.extractToHub()} style={{ flex: 1, padding: '1rem', backgroundColor: '#201f1f', color: '#8adb4d', border: '1px solid #56a315', cursor: 'pointer' }}>
                      EXTRACT (RETURN TO HUB)
                  </button>
              </div>
          </div>
      );
  };

  return (
    <>
      {renderScreen()}
    </>
  );
}

export default App;
