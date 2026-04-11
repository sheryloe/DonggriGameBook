export const PRESENTATION_PROMPT_VERSION = "1.1.0";
export const PRESENTATION_PARTS = ["P2", "P3", "P4"];

export const PRESENTATION_VIDEO_DIR_BY_PART = {
  P2: "part2-video-prompts",
  P3: "part3-video-prompts",
  P4: "part4-video-prompts"
};

export const PRESENTATION_POSTER_DIR_BY_PART = {
  P2: "part2-poster-prompts",
  P3: "part3-poster-prompts",
  P4: "part4-poster-prompts"
};

export const PART_PRESENTATION_PACKAGES = {
  P2: {
    part_id: "P2",
    title: "Southern Checkpoint Descent",
    title_ko: "Part 2 하향 몰락",
    hook: "명단과 통과권, 증언과 호송을 두고 검문소가 무너지는 파트.",
    playtime_target_minutes: 30,
    chapter_targets: [
      { chapter_id: "CH06", minutes: 5, beat: "하강 관문 진입과 공식선/우회선 선언" },
      { chapter_id: "CH07", minutes: 6, beat: "붉은 회랑 추격과 명단 호송 압박" },
      { chapter_id: "CH08", minutes: 6, beat: "검문국 해부와 배신 경로 확인" },
      { chapter_id: "CH09", minutes: 6, beat: "독성 저장고에서 사람과 보급 슬롯 경쟁" },
      { chapter_id: "CH10", minutes: 7, beat: "침하 항만에서 계약, 강탈, 생포 협상 결전" }
    ],
    trailer: {
      video_id: "P2_TRAILER_MAIN",
      scene_id: "PART2_TRAILER",
      duration: 45,
      source_art_key: "ending_p2_controlled_convoy",
      prompt_en:
        "45-second cinematic trailer for Part 2 of a Korean apocalypse gamebook. Move from the southern gate collapse through a red checkpoint corridor, a blockade bureau, a toxic smoke depot, and a sinking harbor contract. Show official lanes, broker detours, witness cargo, diesel smoke, route stamping, and a final harbor confrontation without revealing the canon ending.",
      prompt_ko_context:
        "Part 2 전체를 묶는 발표용 트레일러. 검문, 호송, 우회선, 증언 패키지, 침하 항만의 계약 갈등을 빠르게 연결한다.",
      camera_notes:
        "Structure as gate break -> convoy pressure -> bureau autopsy -> smoke depot scramble -> harbor deal. Keep the frame compressed and forward-driving.",
      audio_notes:
        "Start with queue PA and stamp clicks, build into diesel percussion and clipped breathing, then cut on a harbor foghorn."
    },
    endings: [
      {
        ending_id: "P2_END_CONTROLLED_CONVOY",
        scene_id: "ENDING_CONTROLLED_CONVOY",
        chapter_id: "CH10",
        duration: 18,
        source_art_key: "ending_p2_controlled_convoy",
        title: "Controlled Convoy",
        title_ko: "통제 호송",
        summary: "공식선은 유지되지만 가장 많은 사람을 살리지는 못한다.",
        prompt_en:
          "A bitter controlled harbor evacuation where sealed convoy lights move through diesel fog, survivors are filtered by stamped route cards, and witness crates disappear behind official trucks.",
        prompt_ko_context:
          "공식 통제는 성공했지만 더 많은 생존자를 태우지 못한 엔딩. 질서와 결손이 동시에 느껴져야 한다.",
        visual_anchor: "official convoy lights, sealed route cards, diesel fog, survivors divided by rope barriers",
        camera_notes:
          "Open on route stamps and rope barriers, then drift with the convoy lights before ending on those left behind.",
        audio_notes: "Diesel idle, clipped PA announcements, low brass, and a fading manifest stamp."
      },
      {
        ending_id: "P2_END_WITNESS_FERRY",
        scene_id: "ENDING_WITNESS_FERRY",
        chapter_id: "CH10",
        duration: 18,
        source_art_key: "ending_p2_witness_ferry",
        title: "Witness Ferry",
        title_ko: "증언선",
        summary: "증언 패키지를 살리고 더 적은 수를 데려간다.",
        prompt_en:
          "A witness ferry departing through harbor smoke with survivors guarding taped evidence packets, wet queue cards flapping, and a small vessel carrying testimony instead of cargo.",
        prompt_ko_context:
          "많은 사람 대신 증언을 실은 작은 배가 출항하는 엔딩. 보호된 증언과 희생의 무게가 중요하다.",
        visual_anchor: "small ferry, taped witness packets, wet queue cards, survivors shielding documents from spray",
        camera_notes:
          "Stay low to the deck. Let the testimony packets and anxious faces dominate before revealing the harbor behind them.",
        audio_notes: "Hull creaks, wind across plastic tarps, radio fragments, restrained strings."
      },
      {
        ending_id: "P2_END_RED_CORRIDOR",
        scene_id: "ENDING_RED_CORRIDOR",
        chapter_id: "CH10",
        duration: 18,
        source_art_key: "ending_p2_red_corridor",
        title: "Red Corridor",
        title_ko: "적색 회랑",
        summary: "회랑은 뚫었지만 명단과 기록이 붕괴한다.",
        prompt_en:
          "A violent red corridor breakout where warning beacons strobe across wet concrete, barricades collapse, and evacuees rush through a route bought with smoke and force.",
        prompt_ko_context:
          "뚫고 나가는 데는 성공했지만 기록과 정당성이 무너진 엔딩. 붉은 경고등과 폭주가 핵심이다.",
        visual_anchor: "warning beacons, collapsing barricades, wet concrete, evacuee rush, smoke-choked route",
        camera_notes:
          "Use aggressive lateral motion, close debris passes, and end on a corridor still flashing after the crowd is gone.",
        audio_notes: "Alarm sweep, rebar screech, running feet, and a clipped cut to silence."
      },
      {
        ending_id: "P2_END_HARBOR_SEIZURE",
        scene_id: "ENDING_HARBOR_SEIZURE",
        chapter_id: "CH10",
        duration: 18,
        source_art_key: "ending_p2_harbor_seizure",
        title: "Harbor Seizure",
        title_ko: "항만 강탈",
        summary: "항만을 손에 넣지만 다음 파트에 큰 적을 남긴다.",
        prompt_en:
          "A seized harbor under sodium haze where armed survivors reclaim freight lanes, cargo chains drag through water, and the port changes hands in one desperate night.",
        prompt_ko_context:
          "항만을 장악한 승리 엔딩이지만 뒤가 더 위험해지는 장면. 소유권이 바뀐 야간 항만이 중심이다.",
        visual_anchor: "freight lane takeover, sodium haze, dragged cargo chains, improvised survivor command post",
        camera_notes:
          "Frame the harbor as a temporary victory. Reveal new power on the dock, then hint at the larger war beyond the lights.",
        audio_notes: "Container clang, foghorn, rough voices over radios, heavy percussion with no release."
      },
      {
        ending_id: "P2_END_SUNKEN_LIST",
        scene_id: "ENDING_SUNKEN_LIST",
        chapter_id: "CH10",
        duration: 18,
        source_art_key: "ending_p2_sunken_list",
        title: "Sunken List",
        title_ko: "침수 명단",
        summary: "명단과 사람 모두를 충분히 구하지 못한 최저점 엔딩.",
        prompt_en:
          "A mournful harbor ending with manifest pages floating in oily water, abandoned route stamps, and survivors searching the tide for names that are already gone.",
        prompt_ko_context:
          "명단이 물에 잠기고 생존자도 잃어버린 최저점 엔딩. 이름과 물, 실패가 동시에 읽혀야 한다.",
        visual_anchor: "manifest pages in oily tide, abandoned route stamps, survivors with lamps, flooded harbor edge",
        camera_notes:
          "Open on the papers in water, reveal searching lamps, and hold on a name list dissolving under the tide.",
        audio_notes: "Water slap, distant siren, sparse piano, and breath caught in cold air."
      }
    ],
    posters: [
      {
        poster_id: "P2_POSTER_MAIN",
        category: "key_art",
        target_path: "docs/world/presentation/generated/posters/P2_POSTER_MAIN.webp",
        source_art_key_hint: "ending_p2_controlled_convoy",
        prompt_en:
          "Poster for Part 2 Southern Checkpoint Descent, Korean apocalypse checkpoint collapse, one survivor convoy split between official lane and broker lane, red warning lights, diesel fog, manifest cards, compressed corridor framing, realistic cinematic key art, strong title space.",
        prompt_ko_context:
          "Part 2 메인 포스터. 공식선과 우회선 사이에 갈라진 호송을 한 프레임에서 보여준다.",
        composition_notes:
          "한쪽은 공식 검문선, 다른 쪽은 브로커 우회선으로 분리한다. 주인공과 명단 카드가 동시에 보여야 한다."
      },
      {
        poster_id: "P2_POSTER_WITNESS_CHAIN",
        category: "character_conflict",
        target_path: "docs/world/presentation/generated/posters/P2_POSTER_WITNESS_CHAIN.webp",
        source_art_key_hint: "ending_p2_witness_ferry",
        prompt_en:
          "Character conflict poster for Part 2, Korean apocalypse harbor night, witness packet taped to a survivor chest, route stamp ink on wet gloves, broker shadow versus checkpoint floodlights, documentary realism, tense political survival mood.",
        prompt_ko_context:
          "증언 패키지와 통과권을 둘러싼 갈등 포스터. 물기, 잉크, 그림자가 핵심이다.",
        composition_notes:
          "인물 2명과 증언 패키지를 전면 배치하고, 배경에 검문등과 항만 구조물을 깔아 압박을 만든다."
      },
      {
        poster_id: "P2_POSTER_HARBOR_NIGHT",
        category: "environment",
        target_path: "docs/world/presentation/generated/posters/P2_POSTER_HARBOR_NIGHT.webp",
        source_art_key_hint: "ending_p2_harbor_seizure",
        prompt_en:
          "Environment poster for Part 2, sinking harbor under sodium haze, cranes, chained cargo, survivor silhouettes, checkpoint lane paint bleeding into black water, Korean disaster realism, cinematic negative space.",
        prompt_ko_context:
          "침하 항만의 밤 풍경 포스터. 항만 자체가 파트의 결말 압박을 말해야 한다.",
        composition_notes:
          "거대한 항만 구조물과 작은 생존자 실루엣 대비를 크게 잡는다."
      }
    ],
    demo_route: [
      "CH06 공식선 진입으로 queue pressure 노출",
      "CH07 명단 호송 우선 선택",
      "CH08 검문국 해부에서 배신 단서 회수",
      "CH09 증언 패키지와 보급 슬롯 충돌 시연",
      "CH10 Witness Ferry / Controlled Convoy 비교 시연"
    ]
  },
  P3: {
    part_id: "P3",
    title: "Cold Quarantine Line",
    title_ko: "Part 3 동해 격리선",
    hook: "인증과 공개, 희생과 전력 배분이 충돌하는 냉랭한 파트.",
    playtime_target_minutes: 30,
    chapter_targets: [
      { chapter_id: "CH11", minutes: 5, beat: "철의 우회와 책임 선언" },
      { chapter_id: "CH12", minutes: 6, beat: "잔향 기지에서 신호 복구와 로그 해독" },
      { chapter_id: "CH13", minutes: 7, beat: "백색 야적장 triage 딜레마" },
      { chapter_id: "CH14", minutes: 5, beat: "해무 변전소의 라인 선택" },
      { chapter_id: "CH15", minutes: 7, beat: "격리 파수의 정식 인증/강행 돌파 결말" }
    ],
    trailer: {
      video_id: "P3_TRAILER_MAIN",
      scene_id: "PART3_TRAILER",
      duration: 45,
      source_art_key: "ending_p3_certified_passage",
      prompt_en:
        "45-second cinematic trailer for Part 3 of a Korean apocalypse gamebook. Start in iron detour frost, move through an echo base, white freight yards, a sea-fog power grid, and the quarantine watch cliff. Show cold wind, route authentication, exposed evidence, medical triage, sacrificed capacity, and a final guarded passage without confirming which truth survives.",
      prompt_ko_context:
        "Part 3 전체를 묶는 발표용 트레일러. 냉기, 증거, 인증, 희생의 기조를 유지한다.",
      camera_notes:
        "Build as detour -> signal -> triage -> power routing -> final watch cliff. Use negative space and cold pauses between impact beats.",
      audio_notes:
        "Open with wind and mast hum, introduce clipped radio chatter, then build into restrained percussion and a final relay cutoff."
    },
    endings: [
      {
        ending_id: "P3_END_CERTIFIED_PASSAGE",
        scene_id: "ENDING_CERTIFIED_PASSAGE",
        chapter_id: "CH15",
        duration: 18,
        source_art_key: "ending_p3_certified_passage",
        title: "Certified Passage",
        title_ko: "정식 통과",
        summary: "가장 많은 질서를 지키지만, 많은 진실을 묻는다.",
        prompt_en:
          "A severe certified passage ending where frost-covered checkpoint lights hold steady, stamped papers pass one by one, and exhausted survivors cross under rules that still exclude too many.",
        prompt_ko_context:
          "정식 인증으로 통과를 성사시킨 엔딩. 질서는 유지되지만 손실이 명확해야 한다.",
        visual_anchor: "frosted checkpoint lights, stamped papers, measured survivor line, cold wire barriers",
        camera_notes:
          "Hold on the ritual of authentication, then reveal who is still standing outside the line.",
        audio_notes: "Wind through fencing, stamp clicks, low synth drone, restrained footsteps."
      },
      {
        ending_id: "P3_END_PUBLIC_BREACH",
        scene_id: "ENDING_PUBLIC_BREACH",
        chapter_id: "CH15",
        duration: 18,
        source_art_key: "ending_p3_public_breach",
        title: "Public Breach",
        title_ko: "공개 돌파",
        summary: "증거 공개는 성공하지만 이후의 혼란 비용이 크게 남는다.",
        prompt_en:
          "A public breach ending where exposed records spread across a frozen checkpoint, loudspeakers crackle, the crowd surges forward, and truth wins only by tearing the line apart.",
        prompt_ko_context:
          "증거 공개로 선을 무너뜨리는 엔딩. 진실과 혼란이 동시에 와야 한다.",
        visual_anchor: "exposed records, frozen checkpoint, crackling loudspeakers, crowd surge, torn barriers",
        camera_notes:
          "Open on the records becoming public, then let the barrier collapse fill the frame.",
        audio_notes: "Feedback howl, crowd roar, brittle ice under boots, abrupt cut after impact."
      },
      {
        ending_id: "P3_END_COLD_MERCY",
        scene_id: "ENDING_COLD_MERCY",
        chapter_id: "CH15",
        duration: 18,
        source_art_key: "ending_p3_cold_mercy",
        title: "Cold Mercy",
        title_ko: "냉혹한 자비",
        summary: "의약품과 인명을 우선했지만 경로와 증거 일부를 버린다.",
        prompt_en:
          "A cold mercy ending where medicine crates and rescued patients leave through sea fog while abandoned proof and damaged routing gear remain behind in silence.",
        prompt_ko_context:
          "사람을 우선해 의약품과 환자를 살리지만 다른 것을 포기하는 엔딩.",
        visual_anchor: "medicine crates, rescued patients, sea fog, abandoned proof, damaged routing gear",
        camera_notes:
          "Center the rescued bodies and medicine first, then show the cost in what must be left behind.",
        audio_notes: "Blanket rustle, distant generator, softened strings, winter wind."
      },
      {
        ending_id: "P3_END_SEALED_RELAY",
        scene_id: "ENDING_SEALED_RELAY",
        chapter_id: "CH15",
        duration: 18,
        source_art_key: "ending_p3_sealed_relay",
        title: "Sealed Relay",
        title_ko: "봉인 중계",
        summary: "중계소는 유지되지만 기록은 일부 봉인되고 미래가 닫힌다.",
        prompt_en:
          "A sealed relay ending where the mast keeps broadcasting one controlled signal through sea fog, evidence lockers close, and a fragile line survives by narrowing the truth.",
        prompt_ko_context:
          "중계소는 살아남지만 진실 일부를 봉인하는 엔딩. 차가운 안개와 봉인된 기록이 핵심이다.",
        visual_anchor: "radio mast beacon, sealed evidence lockers, controlled signal, sea fog, narrow safe corridor",
        camera_notes:
          "Frame the mast as alive but morally compromised, with the lockers closing in the foreground.",
        audio_notes: "Mast hum, clipped relay tone, muted metal latches, thin choir pad."
      },
      {
        ending_id: "P3_END_SACRIFICE_CORRIDOR",
        scene_id: "ENDING_SACRIFICE_CORRIDOR",
        chapter_id: "CH15",
        duration: 18,
        source_art_key: "ending_p3_sacrifice_corridor",
        title: "Sacrifice Corridor",
        title_ko: "희생 회랑",
        summary: "희생을 발판으로 길을 열지만 가장 무거운 기억을 남긴다.",
        prompt_en:
          "A sacrifice corridor ending where one power-fed route through the quarantine cliff stays open just long enough, emergency lights burn white, and the cost is written on every face that passes.",
        prompt_ko_context:
          "누군가의 희생으로 길을 여는 엔딩. 백색 조명과 표정의 무게가 핵심이다.",
        visual_anchor: "single powered route, quarantine cliff lights, emergency white glare, exhausted survivors, memorial stillness",
        camera_notes:
          "Track the final passage, then stop on the empty route after the last crossing.",
        audio_notes: "Power relay thrum, held breath, slow percussion, long tail of wind."
      }
    ],
    posters: [
      {
        poster_id: "P3_POSTER_MAIN",
        category: "key_art",
        target_path: "docs/world/presentation/generated/posters/P3_POSTER_MAIN.webp",
        source_art_key_hint: "ending_p3_certified_passage",
        prompt_en:
          "Poster for Part 3 Cold Quarantine Line, Korean apocalypse radio mast and sea-fog checkpoint, one survivor between certified passage papers and exposed evidence, cold blue palette, sparse negative space, realistic cinematic key art.",
        prompt_ko_context:
          "Part 3 메인 포스터. 인증 문서와 공개 증거 사이에 선 인물이 중심이다.",
        composition_notes:
          "넓은 여백과 낮은 온도의 색을 유지하고, 라디오 마스트와 문서 묶음을 같이 배치한다."
      },
      {
        poster_id: "P3_POSTER_TRIAGE",
        category: "ethics",
        target_path: "docs/world/presentation/generated/posters/P3_POSTER_TRIAGE.webp",
        source_art_key_hint: "ending_p3_cold_mercy",
        prompt_en:
          "Ethics poster for Part 3, frozen freight yard triage, medicine crates, exposed records, a child in thermal blanket, rusted power grid in background, documentary disaster realism, restrained dread.",
        prompt_ko_context:
          "의약품과 기록, 생존자 triage를 보여주는 포스터. 구조보다 선택의 무게가 우선이다.",
        composition_notes:
          "전경에는 환자와 의약품, 중경에는 기록물, 배경에는 전력망을 배치해 딜레마를 만든다."
      },
      {
        poster_id: "P3_POSTER_RELAY",
        category: "environment",
        target_path: "docs/world/presentation/generated/posters/P3_POSTER_RELAY.webp",
        source_art_key_hint: "ending_p3_sealed_relay",
        prompt_en:
          "Environment poster for Part 3, sea-fog relay station, rusted mast beacon, narrow lit corridor, sealed lockers, frost on metal railings, Korean apocalypse realism, elegant negative space.",
        prompt_ko_context:
          "중계소와 바다 안개, 좁은 안전 통로를 강조하는 환경 포스터.",
        composition_notes:
          "거대한 마스트와 작은 안전 통로의 대비가 중요하다. 차가운 안개를 넉넉하게 쓴다."
      }
    ],
    demo_route: [
      "CH11 우회 루트에서 책임 선언",
      "CH12 신호 복구보다 로그 해독 우선",
      "CH13 triage에서 의약품과 증거 충돌 시연",
      "CH14 전력 분기 위젯 설명",
      "CH15 Public Breach / Certified Passage 비교 시연"
    ]
  },
  P4: {
    part_id: "P4",
    title: "Outer Sea Moral Gate",
    title_ko: "Part 4 외해 관문",
    hook: "배분, 방송, 승선 명부, 코어 선택이 마지막 공공심판으로 수렴하는 파트.",
    playtime_target_minutes: 40,
    chapter_targets: [
      { chapter_id: "CH16", minutes: 6, beat: "역할 승계와 균열 사구 진입" },
      { chapter_id: "CH17", minutes: 7, beat: "파편 수문과 유입 제어" },
      { chapter_id: "CH18", minutes: 10, beat: "소금 정거장의 공개 배분 심판" },
      { chapter_id: "CH19", minutes: 8, beat: "외해 전초의 정치 대면" },
      { chapter_id: "CH20", minutes: 9, beat: "독도의 문에서 3개 최종 선택" }
    ],
    trailer: {
      video_id: "P4_TRAILER_MAIN",
      scene_id: "PART4_TRAILER",
      duration: 50,
      source_art_key: "ending_p4_witnessed_redesign",
      prompt_en:
        "50-second cinematic trailer for Part 4 of a Korean apocalypse gamebook. Move from fractured dunes to corroded floodgates, through a salt station judgement hall, an outer-sea platform political standoff, and the Dokdo gate core. Show boarding lists, broadcast rigs, public queue pressure, moral voting, and three final futures without declaring the canon choice.",
      prompt_ko_context:
        "Part 4 전체를 묶는 발표용 트레일러. 공개 심판, 승선 명부, 방송 장비, 독도 코어의 압박을 한 흐름으로 보여준다.",
      camera_notes:
        "Build as inheritance -> floodgate control -> public judgement -> ideological standoff -> core choice. Use heavier symmetry and public-facing shots.",
      audio_notes:
        "Begin with sea wind and distant speakers, add hull percussion and queue ambience, then finish on a broadcast tone cut mid-sentence."
    },
    endings: [
      {
        ending_id: "P4_END_ORDERED_SELECTION",
        scene_id: "ENDING_ORDERED_SELECTION",
        chapter_id: "CH20",
        duration: 20,
        source_art_key: "ending_p4_ordered_selection",
        title: "Ordered Selection",
        title_ko: "선별 유지",
        summary: "가장 많은 붕괴를 막지만 배제 체계를 이어간다.",
        prompt_en:
          "A disciplined final ending at the Dokdo gate where ordered boarding lines move under pale dawn, green approval lamps blink across salt-stained barriers, and exclusion survives as the cost of stability.",
        prompt_ko_context:
          "질서를 유지한 채 선별을 지속하는 엔딩. 새벽빛과 승인 램프, 남겨진 사람의 그림자가 동시에 필요하다.",
        visual_anchor: "ordered boarding lines, green approval lamps, salt-stained barriers, dawn sea haze, restrained security presence",
        camera_notes:
          "Begin on the lines moving cleanly, then reveal the unchosen side of the barrier before the final wide shot.",
        audio_notes: "Dawn wind, speaker announcements, slow low brass, measured footsteps on metal decking."
      },
      {
        ending_id: "P4_END_GATE_BROKEN",
        scene_id: "ENDING_GATE_BROKEN",
        chapter_id: "CH20",
        duration: 20,
        source_art_key: "ending_p4_gate_broken",
        title: "Gate Broken",
        title_ko: "선별 파괴",
        summary: "해방감은 크지만 이후 혼란과 손실도 최대다.",
        prompt_en:
          "A shattered final gate where boarding barriers break under storm spray, lists tear apart, broadcast rigs spark, and the crowd surges into a dangerous freedom at first light.",
        prompt_ko_context:
          "관문을 부수고 모두를 해방하지만 혼란 비용이 최대인 엔딩. 파손과 해방감이 같이 와야 한다.",
        visual_anchor: "broken boarding barriers, storm spray, torn lists, sparking broadcast rigs, crowd surge at dawn",
        camera_notes:
          "Keep the frame public and chaotic. End on the broken gate itself, not on a triumphant face.",
        audio_notes: "Metal rupture, crowd swell, surf impact, clipped broadcast feedback, then wind."
      },
      {
        ending_id: "P4_END_WITNESSED_REDESIGN",
        scene_id: "ENDING_WITNESSED_REDESIGN",
        chapter_id: "CH20",
        duration: 20,
        source_art_key: "ending_p4_witnessed_redesign",
        title: "Witnessed Redesign",
        title_ko: "기록 공개 후 재설계",
        summary: "가장 균형적이지만 사전 준비가 부족하면 큰 대가를 치른다.",
        prompt_en:
          "A hard-won redesign ending where public testimony plays across weathered speakers, revised boarding lists hang in dawn light, and survivors rebuild the gate rules under witness instead of secrecy.",
        prompt_ko_context:
          "기록을 공개하고 규칙을 다시 짜는 균형 엔딩. 새 명부와 증언 방송, 피곤한 합의가 핵심이다.",
        visual_anchor: "weathered speakers, revised boarding lists, dawn light, public testimony, exhausted but present survivors",
        camera_notes:
          "Center the new lists and the speaker system. Human faces should read relief and cost at the same time.",
        audio_notes: "Broadcast testimony, sea wind, restrained hopeful strings, mechanical hum settling into quiet."
      }
    ],
    posters: [
      {
        poster_id: "P4_POSTER_MAIN",
        category: "key_art",
        target_path: "docs/world/presentation/generated/posters/P4_POSTER_MAIN.webp",
        source_art_key_hint: "ending_p4_witnessed_redesign",
        prompt_en:
          "Poster for Part 4 Outer Sea Moral Gate, Korean apocalypse salt station judgement hall, one survivor before boarding lists, broadcast speakers, and a sea gate core, dawn blue palette, weathered cream paper, realistic cinematic key art.",
        prompt_ko_context:
          "Part 4 메인 포스터. 승선 명부와 방송 스피커, 최종 관문이 하나의 의식처럼 보여야 한다.",
        composition_notes:
          "중앙 대칭 구도를 유지하고, 인물 뒤에 명부 게시판과 스피커를 계단식으로 배치한다."
      },
      {
        poster_id: "P4_POSTER_PUBLIC_JUDGEMENT",
        category: "public_square",
        target_path: "docs/world/presentation/generated/posters/P4_POSTER_PUBLIC_JUDGEMENT.webp",
        source_art_key_hint: "ending_p4_ordered_selection",
        prompt_en:
          "Public judgement poster for Part 4, salt station allocation hall, survivors facing a queue board, loudspeakers, rope lanes, boarded windows, moral pressure, Korean apocalypse realism, civic ritual tension.",
        prompt_ko_context:
          "공개 심판 장면을 전면에 놓는 포스터. 줄, 게시판, 사람들의 시선이 압박을 만들어야 한다.",
        composition_notes:
          "전경에는 줄과 사람, 중경에는 게시판과 스피커, 후경에는 바다 안개를 둔다."
      },
      {
        poster_id: "P4_POSTER_DOKDO_GATE",
        category: "final_environment",
        target_path: "docs/world/presentation/generated/posters/P4_POSTER_DOKDO_GATE.webp",
        source_art_key_hint: "ending_p4_gate_broken",
        prompt_en:
          "Final environment poster for Part 4, Dokdo gate core above rough sea, corroded metal, lighthouse glow, broadcast antennae, broken and rebuilt boarding rails, Korean apocalypse realism, heavy dawn atmosphere.",
        prompt_ko_context:
          "독도의 문 환경 포스터. 코어 시설 자체가 마지막 선택의 무게를 설명해야 한다.",
        composition_notes:
          "관문 코어와 외해를 크게 잡고, 승선 레일의 파손과 재구성 흔적을 동시에 보여준다."
      }
    ],
    demo_route: [
      "CH16 역할 승계로 파트 톤 소개",
      "CH17 수문 운용 방식 비교",
      "CH18 공개 배분 심판과 방송 준비 위젯 시연",
      "CH19 3개 최종 노선 명시",
      "CH20 3엔딩과 에필로그 카드 차이 시연"
    ]
  }
};
