# APR-032 P1 bgm01 A V02 Derived Master

- decision: **technical_pass_human_listening_pending**
- parent SHA-256: `80007b3f041eb6c6c60c3bbbed65cb05ab6ed9f27f0167e30bd4aa71cb76075c`
- derived SHA-256: `7e71fd931f04be07251c7364ccff456b90cb00831683982ee315d274e7a27c48`
- derived bytes: 4226611
- gain recipe: -2.800 dB constant gain only
- duration: 105.6131s
- integrated loudness: -18.007 LUFS
- sample peak: -2.832 dBFS
- maximum silence: 0.0438s
- average bitrate: 320 kbps
- G work input: `G:\Donggri_DevDrive\storage\codex-control\reports\DonggrolGameBook\2026-08-08\apr032-a3\in.mp3` (2540792 bytes, `80007b3f041eb6c6c60c3bbbed65cb05ab6ed9f27f0167e30bd4aa71cb76075c`)
- G work output: `G:\Donggri_DevDrive\storage\codex-control\reports\DonggrolGameBook\2026-08-08\apr032-a3\out.mp3` (4226611 bytes, `7e71fd931f04be07251c7364ccff456b90cb00831683982ee315d274e7a27c48`)
- G work retained: true
- F copy mode: exclusive_create_no_overwrite
- eligible for human listening: true
- accountable candidate: false
- runtime/score/seal/bundle/AIT/release transition: none
- JSON audit SHA-256: `5316cae8cd59362b789c70a0d0fbc322d379e63468e12b12a1da13e9018752cf`

The immutable raw parent remains the Google Generative AI/SynthID assertion authority. The derivative does not claim a copied or validated C2PA signature.

The Python toolchain ran only inside the short G: Dev Drive work directory because the fixed F target path is longer than the Windows MAX_PATH ceiling that libsndfile enforces. The acoustic audit therefore reads the retained byte-identical G work output; its SHA-256 equals the F final SHA-256.
