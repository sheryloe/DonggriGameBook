# Part 2-4 Story Contract v2

## Locked content contract
| Part | Target time | Chapter budget | Endings | Core axes |
| --- | ---: | --- | --- | --- |
| P2 | 30m | CH06 5m / CH07 6m / CH08 6m / CH09 6m / CH10 7m | ENDING_A, ENDING_B, ENDING_C, ENDING_D, ENDING_E | official_lane, broker_lane, witness_chain, capacity_ethics, harbor_force |
| P3 | 30m | CH11 5m / CH12 6m / CH13 7m / CH14 5m / CH15 7m | ENDING_A, ENDING_B, ENDING_C, ENDING_D, ENDING_E | p3.route_access, p3.public_evidence, p3.medical_reserve, p3.power_margin, p3.sacrifice_load |
| P4 | 40m | CH16 6m / CH17 7m / CH18 10m / CH19 8m / CH20 9m | ENDING_A, ENDING_B, ENDING_C | order_score, witness_score, solidarity_score, public_support, broadcast_ready, capacity_pressure |

## Locked rules
| Rule | Locked value |
| --- | --- |
| General density | At least 8 events, 12 choices, 2 optional field actions, 1 result event |
| Climax density | CH10, CH15, CH20 require at least 10 events, 15 choices, and an explicit ending gate |
| Side structure | No forced SIDE_A -> SIDE_B -> BOSS chain; field action budget remains capped at 2 |
| Boss closure | Boss victory must close through EV_CH##_RESULT or END_CH##_X without self-loop |
| Failure routing | No blind bounce to the map; fail or setback events stay diegetic |
| Replay rewards | P2 and P3 expand ending spread, P4 expands epilogue variation within 3 endings |
| Repeatable farming | Only designated scavenging events loop, soft cap remains after the second pass |

## Scope
- Part 1 remains the regression baseline only.
- Part 2, Part 3, and Part 4 keep the expanded branching already authored in chapter JSON and UI flow data.
- Field action budget stays capped at 2 and only the scavenging event remains repeatable.
- Climax chapters keep explicit ending gates: CH10 has 5 endings, CH15 has 5 endings, CH20 has 3 endings.
