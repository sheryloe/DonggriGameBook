import { useState, useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { getChapterData, getNodeData, getEventData } from './loaders/chapterLoader';
import { handleChoice, checkRequirement } from './engine/eventRunner';
import { calculateTotalWeight, MAX_CARRY_WEIGHT, isOverencumbered } from './engine/inventoryHelper';
import { sound } from './engine/soundManager';

// Typewriter Effect Hook with Sound Integration
function useTypewriter(text: string, speed: number = 20) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    if (!text) return;

    sound.startTypingSFX();

    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(i));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
        sound.stopTypingSFX();
      }
    }, speed);

    return () => {
        clearInterval(interval);
        sound.stopTypingSFX();
    };
  }, [text, speed]);

  return displayedText;
}

function App() {
  const store = useGameStore();
  const chapterData = getChapterData(store.currentChapterId);

  const currentNode = chapterData ? getNodeData(chapterData, store.currentNodeId) : null;
  const currentEvent = chapterData && store.currentEventId ? getEventData(chapterData, store.currentEventId) : null;

  const displayText = currentEvent ? currentEvent.description : (currentNode ? currentNode.description : '데이터를 찾을 수 없습니다.');
  const typedText = useTypewriter(displayText, 30);

  const totalWeight = calculateTotalWeight();
  const isHeavy = isOverencumbered();

  // BGM Trigger based on node tags or type
  useEffect(() => {
      if (store.stats.hp <= 0) {
          sound.playBGM('/audio/kia_theme.mp3');
      } else if (currentNode?.node_type === 'hub') {
          sound.playBGM('/audio/hub_theme.mp3');
      } else if (currentEvent && currentEvent.type === 'combat') {
          sound.playBGM('/audio/combat_theme.mp3');
      } else {
          sound.playBGM('/audio/explore_theme.mp3');
      }
  }, [currentNode?.node_id, currentEvent?.event_id, store.stats.hp]);

  const renderScreen = () => {
      if (store.stats.hp <= 0) {
          return (
             <div style={{ backgroundColor: '#131313', color: '#8B0000', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
                 <h1 style={{ fontSize: '5rem', margin: 0, textShadow: '2px 2px #ffb4a8' }}>K.I.A</h1>
                 <p style={{ color: '#e3beb8', fontSize: '1.2rem' }}>YOU LOST ALL UNSECURED ITEMS.</p>
                 <button
                    onClick={() => {
                        sound.playOneShot('/audio/revive_gasp.mp3');
                        store.dieAndLoseLoot();
                    }}
                    style={{ marginTop: '2rem', padding: '1rem 2rem', backgroundColor: '#353534', border: '1px solid #5a403c', color: '#e5e2e1', cursor: 'pointer', fontFamily: 'monospace' }}
                 >
                     WAKE UP AT HUB
                 </button>
             </div>
          )
      }

      const isHub = currentNode?.node_type === 'hub';

      const TopBar = () => (
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #353534', paddingBottom: '1rem', marginBottom: '2rem' }}>
             <div>
                 <h2 style={{ color: '#ffb4a8', margin: 0 }}>RAID: {chapterData?.title || store.currentChapterId}</h2>
                 <p style={{ margin: 0, color: '#e3beb8' }}>LOCATION: {currentNode?.name || store.currentNodeId}</p>
             </div>
             <div style={{ textAlign: 'right' }}>
                 <p style={{ margin: 0, color: '#8adb4d' }}>HP: {store.stats.hp} | NOISE: {store.stats.noise} | RAD: {store.stats.contamination}</p>
                 <p style={{ margin: 0, color: isHeavy ? '#ffb4a8' : '#e3beb8' }}>
                     WEIGHT: {totalWeight} / {MAX_CARRY_WEIGHT} kg {isHeavy && '[OVERENCUMBERED]'}
                 </p>
             </div>
          </div>
      );

      if (isHub) {
          return (
             <div style={{ backgroundColor: '#131313', color: '#e5e2e1', minHeight: '100vh', padding: '2rem', fontFamily: 'monospace' }}>
                 <TopBar />

                 <div style={{ display: 'flex', gap: '2rem' }}>
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
                         <h3 style={{ color: '#8adb4d' }}>INVENTORY ( {totalWeight} kg )</h3>
                         <pre style={{ color: '#e3beb8', fontSize: '0.8rem' }}>{JSON.stringify(store.inventory, null, 2)}</pre>
                     </div>

                     <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                         <div style={{ backgroundColor: '#0e0e0e', padding: '2rem', border: '1px solid #5a403c', marginBottom: '1rem', minHeight: '150px' }}>
                              <p style={{ fontSize: '1.1rem', lineHeight: '1.5', color: '#ffb4a8' }}>{typedText}</p>
                         </div>

                         {currentNode?.connections?.map((conn: any, idx: number) => {
                             // 연결 노드 이동 조건 검사
                             const canMove = conn.requires.every((req: string) => checkRequirement(req));
                             return (
                                 <button
                                    key={idx}
                                    onClick={() => {
                                        if (canMove) store.moveToNode(conn.to);
                                    }}
                                    style={{
                                        padding: '1.5rem',
                                        backgroundColor: canMove ? '#8B0000' : '#201f1f',
                                        color: canMove ? '#131313' : '#5a403c',
                                        border: 'none',
                                        fontSize: '1.2rem',
                                        fontWeight: 'bold',
                                        cursor: canMove ? 'pointer' : 'not-allowed'
                                    }}
                                    disabled={!canMove}
                                 >
                                     &gt; {canMove ? `DEPLOY TO ${conn.to}` : `[LOCKED] DEPLOY TO ${conn.to}`}
                                 </button>
                             );
                         })}
                     </div>
                 </div>
             </div>
          );
      }

      // Exploring Screen
      return (
          <div style={{ backgroundColor: '#131313', color: '#e5e2e1', minHeight: '100vh', padding: '2rem', fontFamily: 'monospace' }}>
              <TopBar />

              <div style={{ backgroundColor: '#0e0e0e', padding: '2rem', border: '1px solid #5a403c', minHeight: '200px' }}>
                  <h3 style={{ color: '#8adb4d', marginTop: 0 }}>{currentEvent ? currentEvent.title : '탐색 중...'}</h3>
                  <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: '#ffb4a8' }}>
                     {typedText}<span style={{ animation: 'blink 1s step-end infinite' }}>_</span>
                  </p>
              </div>
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes blink { 50% { opacity: 0; } }
              `}} />

              <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {currentEvent && currentEvent.choices && currentEvent.choices.map((choice: any, idx: number) => {
                      const canChoose = !choice.requires || choice.requires.every((req: string) => checkRequirement(req));

                      return (
                          <button
                             key={idx}
                             onClick={() => {
                                 if (!canChoose) return;
                                 sound.playOneShot('/audio/button_click.mp3');
                                 handleChoice(choice);
                             }}
                             style={{
                                 padding: '1rem',
                                 backgroundColor: '#201f1f',
                                 color: canChoose ? '#e5e2e1' : '#5a403c',
                                 border: canChoose ? '1px solid #5a403c' : '1px dashed #353534',
                                 cursor: canChoose ? 'pointer' : 'not-allowed',
                                 textAlign: 'left'
                             }}
                             disabled={!canChoose}
                          >
                              &gt; {choice.text} {!canChoose && "(조건 불충족)"}
                          </button>
                      );
                  })}

                  {!currentEvent && currentNode?.connections?.map((conn: any, idx: number) => {
                      const canMove = conn.requires.every((req: string) => checkRequirement(req));
                      return (
                          <button
                             key={idx}
                             onClick={() => {
                                 if (canMove) store.moveToNode(conn.to);
                             }}
                             style={{
                                 padding: '1rem',
                                 backgroundColor: '#201f1f',
                                 color: canMove ? '#ffb4a8' : '#5a403c',
                                 border: canMove ? '1px solid #8b0000' : '1px dashed #353534',
                                 cursor: canMove ? 'pointer' : 'not-allowed',
                                 textAlign: 'left'
                             }}
                             disabled={!canMove}
                          >
                              &gt; MOVE TO {conn.to} {!canMove && "(잠김)"}
                          </button>
                      );
                  })}

                  {!currentEvent && currentNode?.node_type === 'exit' && (
                       <button
                         onClick={() => {
                             sound.playOneShot('/audio/extract.mp3');
                             store.extractToHub();
                         }}
                         style={{ padding: '1rem', backgroundColor: '#313030', color: '#8adb4d', border: '1px solid #56a315', cursor: 'pointer', textAlign: 'left', marginTop: '1rem' }}
                      >
                          &gt; [EXTRACTION] RETURN TO BASECAMP
                      </button>
                  )}
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
