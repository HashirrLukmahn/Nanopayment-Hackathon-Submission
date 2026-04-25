---
title: "LiNi0.8Mn0.1Co0.1O2 cathode capacity fade at 45°C across three cell formats"
tier: dark
researcher_hint: Dr. Ben Park
domain: materials
---

## Abstract

We measured capacity fade of LiNi0.8Mn0.1Co0.1O2 (NMC811) cathodes across 18650, pouch (10 Ah), and coin-cell (CR2032) formats cycled at 45°C between 3.0 and 4.2 V. The 18650 and pouch cells showed 30-40% capacity fade over 500 cycles; coin cells showed only 12%. The format-dependence could not be explained by electrolyte composition, N/P ratio, or current collector geometry. We believe it is driven by mechanical stack pressure and electrolyte volume ratio — small cells get away with more volume per gram of active material. This report details the comparison.

## Methods

All three formats used identical electrode formulations: 96 wt% NMC811 / 2 wt% Super P / 2 wt% PVDF binder on 12 μm aluminum current collector, areal loading 18.3 mg/cm². Anode: graphite (96 wt%), areal loading matched to achieve N/P ratio 1.10 ± 0.02 in all cells.

Electrolyte: 1.2 M LiPF6 in EC:EMC 3:7 w/w with 2% VC, 1% FEC. Volumes: 18650 — 2.1 mL; pouch (10 Ah) — 42 mL; coin — 100 μL.

Cycling: 45°C ambient, 1C rate (charge and discharge), constant current constant voltage (CCCV) charge to 4.2 V with 0.1C cutoff, constant current discharge to 3.0 V. Cells held at 25°C for 2 hours between every 50 cycles for reference measurement.

## Results

18650 cells (n=6): 1st cycle capacity 3.42 Ah, 500-cycle capacity 2.17 Ah (63.4% retention). Severe fade after cycle 250.

Pouch cells (n=4): 1st cycle 10.1 Ah, 500-cycle 6.8 Ah (67.3% retention). Gradual fade profile.

Coin cells (n=20): 1st cycle 3.4 mAh/cm², 500-cycle 2.99 mAh/cm² (88.0% retention). Linear fade with no inflection.

Post-mortem SEM of 18650 and pouch cells showed particle cracking and electrolyte depletion; coin cells showed minor secondary phase formation but intact particles. ICP-MS of cycled electrolyte revealed 10-20× more transition metal dissolution in 18650/pouch compared to coin.

## Discussion

Our working hypothesis: coin cells have ~3× more electrolyte volume per gram of active material than production cells. At 45°C, electrolyte decomposition products accumulate and catalyze further decomposition; coin cells take longer to reach the critical depletion threshold.

The 18650 and pouch cells show fade inflection at cycle 250-300, consistent with electrolyte depletion time scales estimated from Tafel kinetics. Coin cells do not reach this inflection within our 500-cycle budget.

Implications: academic coin-cell capacity fade data for NMC811 at elevated temperature likely understates production cell fade by 20-30 pp over 500 cycles. Teams benchmarking new cathode materials or electrolyte additives should verify in a production-format cell before claiming "solves the 45°C problem."

Additive screens conducted only in coin cells may identify "winners" that do not translate. We identified three electrolyte additives that looked promising in coin cells but failed to translate to 18650. Full additive comparison is in a separate internal report.

## References (local)

- Liu, Y., et al. "Transition metal dissolution in NMC cathodes." J Electrochem Soc 2020.
- Internal battery testing SOP B-213.
- DOE benchmark for high-Ni cathodes, 2023.
