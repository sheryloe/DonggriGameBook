# Part 1 950 Scorecard Audit

- generated_at: 2026-08-08T12:51:25.437Z
- pass: true
- scorecard_tracking_pass: true
- manual_action_routing_pass: true
- score_assumption_guard_pass: true
- status_headline: RELEASE BLOCKED: 4 manual evidence lanes pending (950-05, 950-14, 950-17, 950-20)
- target_total: 950/1000
- release_evidence_score: 787/1000
- proven_score: 787/800
- unverified_pending_score: 167/200
- conservative_total: 954/1000 (product_value_tracking_not_release_readiness)
- conservative_total_meets_950: true
- release_evidence_meets_950: false
- agy_followup_reported_total: 972/1000
- item_floor: 48/50
- items_at_or_above_floor_by_score: 16/20
- items_floor_proven: 16/20
- all_items_48_plus_proven: false
- public_go_allowed: false
- completion_proven: false

## Score Semantics

- RELEASE BLOCKED: 4 manual evidence lanes pending (950-05, 950-14, 950-17, 950-20)
- target_total: 950/1000
- release_evidence_score: 787/1000
- proven_score: 787/800
- unverified_pending_score: 167/200
- conservative_total_usage: product_value_tracking_not_release_readiness
- pending_manual_ids: 950-05, 950-14, 950-17, 950-20

## Items

| id | lens | proof | score | status | floor proven | evidence |
| --- | --- | --- | ---: | --- | --- | --- |
| 950-01 | early retention | automatic | 48/50 | proven | true | CH01 first10=true, choices=17, mobileAudio=true |
| 950-02 | early retention | automatic | 49/50 | proven | true | mobileCdp=true, width=390, blockingAudio=0 |
| 950-03 | choice UX | automatic | 50/50 | proven | true | first10=true, splitChoices=211, extraction=true |
| 950-04 | systems narrative | automatic | 49/50 | proven | true | splitChoices=211, outcomeEvents=211, sameNext=0 |
| 950-05 | player trust | manual_required | 40/50 | pending_manual | false | postManual98=false, manualPass=false, gateReady=false |
| 950-06 | story structure | automatic | 50/50 | proven | true | narrative950=true, splitSourceEvents=96 |
| 950-07 | climax design | automatic | 50/50 | proven | true | narrative950=true, bossLock=true |
| 950-08 | mood and sensory writing | automatic | 50/50 | proven | true | ch05SensoryCount=undefined, ch05AbstractCount=56 |
| 950-09 | app-game writing | automatic | 49/50 | proven | true | narrativeChecks=8, narrativePass=true |
| 950-10 | replay value | automatic | 48/50 | proven | true | splitChoices=211, rewrittenOutcomes=211, bossLock=true |
| 950-11 | audio direction | automatic | 49/50 | proven | true | bgmPass=true, assets=8, unmapped=0 |
| 950-12 | audio direction | automatic | 49/50 | proven | true | usedTracks=8, maxShare=0.234375 |
| 950-13 | audio feedback | automatic | 48/50 | proven | true | textTicks=44, choiceSelects=2, blockingAudio=0 |
| 950-14 | voice quality | manual_required | 40/50 | pending_manual | false | ttsTechnical=true, scoredRows=0/20, average=pending, manualDecision=pending |
| 950-15 | mobile audio UX | automatic | 49/50 | proven | true | mixerAudit=true, cdpMixer=true, sliders=3 |
| 950-16 | mobile UX | automatic | 50/50 | proven | true | width=390, overflow=false, textOverflow=0, outOfBounds=0 |
| 950-17 | Toss in-app feasibility | manual_required | 47/50 | pending_manual | false | sourceBackGuard=true, manualMobile=false, manualDecision=pending |
| 950-18 | Toss in-app feasibility | automatic | 50/50 | proven | true | sourceLifecycle=true, lifecycleProbe=true, pauses=1, resumes=1 |
| 950-19 | Toss in-app feasibility | automatic | 49/50 | proven | true | resumeGate=true, unlock=true, finalScreen=RESULT |
| 950-20 | release readiness | manual_required | 40/50 | pending_manual | false | finalClosurePass=false, completion=false, goal=false, publicGo=false, blockers=5 |

## Below-Floor Or Unproven Items

- 950-05: Fairness and trust parity (40/50, pending_manual) - After BGM, TTS, and Mobile/Toss exports are imported/applied, run npm run ops:part1:import-evidence -- --input docs/ops/PART1_MANUAL_EVIDENCE_FILLED.json, then npm run qa:part1:post-manual-98 -- --require-ready, then npm run qa:part1:950-scorecard.
- 950-14: TTS human listening readiness (40/50, pending_manual) - After BGM closeout is valid, run npm run ops:part1:tts-evidence-closeout, open docs/ops/PART1_TTS_20LINE_LISTENING_CONSOLE.html, human-listen all 20 locked lines, download PART1_TTS_20LINE_COMPARISON_EXPORT.json, then run npm run ops:part1:tts-evidence-closeout -- --confirm-real-listening so the runner checks default download candidates and internally runs npm run ops:part1:import-tts-listening, npm run qa:part1:tts-human-listening-export, npm run ops:part1:apply-tts-comparison, and the real evidence doctor when the export is valid. Use an explicit --input only after intentionally selecting an exact numbered browser download.
- 950-17: Toss/WebView back behavior (47/50, pending_manual) - After TTS closeout is valid, run npm run ops:part1:mobile-toss-evidence-closeout, open docs/ops/PART1_MOBILE_TOSS_CAPTURE_CONSOLE.html, run a real 360-430px physical/Toss-like session, save screenshot/video assets, run npm run ops:part1:evidence-assets, run npm run ops:part1:evidence-asset-proof-bind with the exact asset/challenge transcript after real visual inspection, download PART1_MOBILE_TOSS_CAPTURE_EXPORT.json, then run npm run ops:part1:mobile-toss-evidence-closeout -- --confirm-real-capture so the runner checks default download candidates and internally runs npm run ops:part1:import-mobile-toss-capture, npm run qa:part1:mobile-toss-capture-export, npm run ops:part1:apply-mobile-toss-capture, and the real evidence doctor when TTS and Mobile/Toss evidence are valid. Use an explicit --input only after intentionally selecting an exact numbered browser download.
- 950-20: Release evidence and no-false-GO boundary (40/50, pending_manual) - After all manual lanes are real-proof ready, run npm run qa:part1:950-scorecard, npm run qa:part1:completion-path, node scripts/write-part1-release-candidate-manifest.mjs, and npm run qa:part1:release-candidate before any completion claim.

## Next Manual Actions

- STEP-01 BGM context: Run npm run ops:part1:bgm-operator-open-packet, run npm run qa:part1:bgm-operator-open-packet, open docs/ops/PART1_BGM_OPERATOR_OPEN_PACKET.html, run npm run ops:part1:bgm-evidence-session, open docs/ops/PART1_BGM_EVIDENCE_SESSION_LAUNCHER.html, run npm run qa:part1:bgm-evidence-session, open docs/ops/PART1_BGM_CONTEXT_RUN_SHEET.html, run npm run qa:part1:bgm-technical-preflight, open docs/ops/PART1_BGM_CHRONO_LISTENING_CONSOLE.html, download PART1_BGM_CHRONO_LISTENING_EXPORT.json, then run npm run ops:part1:bgm-evidence-closeout -- --confirm-real-listening so the closeout runner checks default download candidates, internally runs the BGM context importer, audits the export, and reruns the real evidence doctor when valid. Finally run npm run qa:part1:bgm-evidence-closeout. Use an explicit --input only after intentionally selecting an exact numbered browser download.
- STEP-02 TTS human listening closeout: After BGM closeout is valid, run npm run ops:part1:tts-evidence-closeout, open docs/ops/PART1_TTS_20LINE_LISTENING_CONSOLE.html, human-listen all 20 locked lines, download PART1_TTS_20LINE_COMPARISON_EXPORT.json, then run npm run ops:part1:tts-evidence-closeout -- --confirm-real-listening so the runner checks default download candidates and internally runs npm run ops:part1:import-tts-listening, npm run qa:part1:tts-human-listening-export, npm run ops:part1:apply-tts-comparison, and the real evidence doctor when the export is valid. Use an explicit --input only after intentionally selecting an exact numbered browser download.
- STEP-03 Mobile/Toss physical proof: After TTS closeout is valid, run npm run ops:part1:mobile-toss-evidence-closeout, open docs/ops/PART1_MOBILE_TOSS_CAPTURE_CONSOLE.html, run a real 360-430px physical/Toss-like session, save screenshot/video assets, run npm run ops:part1:evidence-assets, run npm run ops:part1:evidence-asset-proof-bind with the exact asset/challenge transcript after real visual inspection, download PART1_MOBILE_TOSS_CAPTURE_EXPORT.json, then run npm run ops:part1:mobile-toss-evidence-closeout -- --confirm-real-capture so the runner checks default download candidates and internally runs npm run ops:part1:import-mobile-toss-capture, npm run qa:part1:mobile-toss-capture-export, npm run ops:part1:apply-mobile-toss-capture, and the real evidence doctor when TTS and Mobile/Toss evidence are valid. Use an explicit --input only after intentionally selecting an exact numbered browser download.
- STEP-04 Post-manual 98+ review: After BGM, TTS, and Mobile/Toss exports are imported/applied, run npm run ops:part1:import-evidence -- --input docs/ops/PART1_MANUAL_EVIDENCE_FILLED.json, then npm run qa:part1:post-manual-98 -- --require-ready, then npm run qa:part1:950-scorecard.
- STEP-05 Completion boundary: After all manual lanes are real-proof ready, run npm run qa:part1:950-scorecard, npm run qa:part1:completion-path, node scripts/write-part1-release-candidate-manifest.mjs, and npm run qa:part1:release-candidate before any completion claim.
