import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { eventRunner } from '../engine/eventRunner';

export const BattleScreen: React.FC = () => {
  const { battleState, stats, updateStat, addBattleLog } = useGameStore();
  const [enemyHp, setEnemyHp] = useState(100);
  const [maxEnemyHp] = useState(100);

  if (!battleState) return null;

  const handleAttack = () => {
    const damage = Math.floor(Math.random() * 20) + 10;
    const newHp = Math.max(0, enemyHp - damage);
    setEnemyHp(newHp);
    addBattleLog(`플레이어의 공격! 적에게 ${damage}의 피해를 입혔습니다.`);

    if (newHp <= 0) {
      addBattleLog("승리했습니다!");
      setTimeout(() => eventRunner.finishBattle(true), 1500);
    } else {
      // Enemy counter-attack
      setTimeout(enemyTurn, 800);
    }
  };

  const enemyTurn = () => {
    const damage = Math.floor(Math.random() * 15) + 5;
    updateStat('hp', -damage);
    addBattleLog(`적의 반격! 플레이어에게 ${damage}의 피해를 입혔습니다.`);

    if (stats.hp - damage <= 0) {
      addBattleLog("패배했습니다...");
      setTimeout(() => eventRunner.finishBattle(false), 1500);
    }
  };

  return (
    <div className="screen-container" style={{ background: 'linear-gradient(rgba(200,0,0,0.2), rgba(0,0,0,0.9)), url(/img/bg/battle_bg.webp)' }}>
      <div className="content-area" style={{ flexDirection: 'column', justifyContent: 'space-around' }}>
        
        {/* Enemy Side */}
        <div className="glass-panel" style={{ width: '400px', textAlign: 'center', animation: 'pulseGlow 2s infinite' }}>
          <h3 style={{ color: 'var(--primary-color)' }}>{battleState.enemyGroupId}</h3>
          <div className="stat-bar-container" style={{ height: '20px', marginTop: '10px' }}>
            <div className="stat-bar-fill hp-fill" style={{ width: `${(enemyHp / maxEnemyHp) * 100}%` }} />
          </div>
          <p style={{ marginTop: '5px' }}>HP {enemyHp} / {maxEnemyHp}</p>
        </div>

        {/* Battle Log */}
        <div className="glass-panel" style={{ width: '600px', height: '150px', overflowY: 'auto', fontSize: '14px', background: 'rgba(0,0,0,0.5)' }}>
          {battleState.log.map((msg, i) => (
            <p key={i} style={{ marginBottom: '5px', color: msg.includes('플레이어') ? 'var(--accent-color)' : 'var(--primary-color)' }}>
              {msg}
            </p>
          ))}
        </div>

        {/* Player Actions */}
        <div style={{ display: 'flex', gap: '20px' }}>
          <button className="btn-primary" onClick={handleAttack} disabled={enemyHp <= 0}>공격</button>
          <button className="btn-primary" style={{ background: 'var(--secondary-color)' }}>방어</button>
          <button className="btn-primary" style={{ background: 'var(--text-muted)' }}>도망</button>
        </div>

      </div>
    </div>
  );
};
