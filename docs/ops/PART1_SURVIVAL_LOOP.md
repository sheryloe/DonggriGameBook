# Part 1 Survival Loop Notes

## Runtime Rule
- Part 1 is a survival loop, not an HP-race RPG.
- Infected encounters resolve through survival choices: stealth, bypass, lure, armor, tool use, medical stabilization, or retreat.
- Injury and infection are failure pressure meters. Reaching 100 ends the run, but ordinary encounters should usually create risk before immediate death.

## Active Systems
- Survival clock: `day`, `timeBlock`, `elapsedHours`
- Deadline state: `deadlineFlags`, `failedQuestIds`
- Rest state: `restCount`, `survivalLog`
- Safehouse choices: short rest, medical treatment, overnight rest
- Inventory use: recovery and contamination-control consumables can be used from the inventory panel
- Ending verdict: CH05 keeps the existing five endings and shows 3-5 reason lines

## Persona Reference Boundary
- External reference root:
  `E:\BloggerGent\datasets\hf\nvidia\Nemotron-Personas-Korea\2026-04-20-v1.0`
- Allowed reference:
  `packs/manifest.json` and active pack `sanitized_profiles` only
- Not allowed:
  raw persona text copied into game data, prompts, or runtime content
- Attribution:
  NVIDIA Nemotron-Personas-Korea, CC BY 4.0

## QA Notes
- Mechanical auto-click duration is not playtime.
- Real target is still 28-33 minutes for CH01~CH05 based on Korean reading time, choice hesitation, encounter animation, audio, and rest/item management.
- Current auto-route scripts need a survival-aware strategy layer before they can be used as balance proof.

