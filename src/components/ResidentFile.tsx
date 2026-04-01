import dossierPortrait from "../assets/dossier-portrait.svg";
import { PlayerProfile } from "../lib/playerProfile";
import { StoryState } from "../types/story";

interface ResidentFileProps {
  profile: PlayerProfile;
  tier: string;
  state: StoryState;
  progress: string;
  alertLevel: string;
  compact?: boolean;
}

function meterWidth(value: number) {
  return `${Math.max(8, Math.min(100, value))}%`;
}

export function ResidentFile({
  profile,
  tier,
  state,
  progress,
  alertLevel,
  compact = false,
}: ResidentFileProps) {
  const vitality = 32 + state.supplies * 7;
  const stress = 12 + state.noise * 9;

  return (
    <section
      className={`resident-file ${compact ? "resident-file--compact" : ""}`.trim()}
      aria-label="거주 파일"
    >
      <div className="resident-file__portrait">
        <img src={dossierPortrait} alt="입성자 파일용 흑백 초상 콜라주" />
        <span className="resident-file__level">{profile.assignedZone}</span>
      </div>

      <div className="resident-file__body">
        <div className="resident-file__title-row">
          <div>
            <strong>{profile.name}</strong>
            <p>{profile.role}</p>
          </div>
          <span className="resident-file__call-sign">{profile.callSign}</span>
        </div>

        <div className="resident-file__codes">
          <span>{profile.dossierId}</span>
          <span>{profile.wristband}</span>
          <span>{tier}</span>
        </div>

        <div className="resident-file__meter">
          <div className="resident-file__meter-head">
            <span>회수 적합도</span>
            <strong>{vitality}/100</strong>
          </div>
          <div className="resident-file__meter-track">
            <div style={{ width: meterWidth(vitality) }} />
          </div>
        </div>

        <div className="resident-file__meter">
          <div className="resident-file__meter-head">
            <span>검문 압박</span>
            <strong>{stress}/100</strong>
          </div>
          <div className="resident-file__meter-track resident-file__meter-track--danger">
            <div style={{ width: meterWidth(stress) }} />
          </div>
        </div>

        <dl className="resident-file__stats">
          <div>
            <dt>진행도</dt>
            <dd>{progress}</dd>
          </div>
          <div>
            <dt>경보</dt>
            <dd>{alertLevel}</dd>
          </div>
          <div>
            <dt>보급</dt>
            <dd>{state.supplies}</dd>
          </div>
          <div>
            <dt>소음</dt>
            <dd>{state.noise}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
