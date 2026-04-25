---
title: "Silicon-graphite composite anode fracture under 5C discharge rates"
tier: validated
researcher_hint: Dr. Dmitri Orlov
domain: materials
---

## Abstract

Silicon-graphite composite anodes at 10 wt% silicon loading performed within spec at 1C and 2C discharge rates, but showed catastrophic fracture and 40% capacity loss within 50 cycles at 5C discharge. Post-mortem imaging revealed silicon particle pulverization and delamination from the current collector — consistent with volume-expansion stress beyond the binder's mechanical accommodation capacity. We report conditions and failure mechanisms to help teams targeting fast-charge applications.

## Methods

Electrode composition: 10 wt% nano-silicon (Paraclete PLC200, 80 nm) + 86 wt% natural graphite (BTR China, 20 μm) + 2 wt% Super P + 2 wt% CMC/SBR 1:1 binder. Areal loading 4.2 mg/cm² on 10 μm copper foil.

Full cells paired with NMC622 cathode at N/P ratio 1.08. Electrolyte: 1.2 M LiPF6 in EC:EMC 3:7 with 10% FEC.

Cycling at 25°C: 1C, 2C, and 5C discharge rates (charge held at 0.5C throughout). Voltage window 2.5–4.2 V.

## Results

1C discharge: 82% capacity retention at cycle 500. No visible electrode damage post-mortem.

2C discharge: 71% capacity retention at cycle 500. Mild silicon particle cracking visible at cycle 300 SEM.

5C discharge: 58% capacity retention at cycle 50. 23% at cycle 100. Electrodes disassembled at cycle 100 showed 60%+ of silicon particles fractured into sub-20 nm fragments; copper foil showed visible delamination patches covering 15-20% of area.

Differential voltage analysis showed loss of high-SOC active material consistent with electrical disconnection — silicon particles lose electronic contact after fracturing beyond the carbon conductive network's reach.

Binder swelling tests showed 30% volume expansion of CMC/SBR film at full lithiation — insufficient to accommodate silicon's 300% volume change at 5C dynamics.

## Discussion

Two mitigations were tested. (1) Replacing CMC/SBR with polyacrylic acid (PAA, 15 wt%) improved 5C retention to 68% at cycle 50 but 2C performance degraded (59% at cycle 500 vs 71% with CMC/SBR). PAA is stiffer, better at containing silicon but less tolerant of overall cell expansion.

(2) Reducing silicon loading to 5 wt% kept 5C retention at 79% at cycle 200 — but doubled the electrode mass for the same capacity, eroding cell energy density.

Practical conclusion: 10 wt% Si + fast charge is a combination that does not close in the CMC/SBR binder system. Teams targeting ≥4C discharge with silicon-enhanced anodes should either reduce Si loading, use a stiffer polymer binder (PAA, lithium polyacrylate), or accept higher cycle-life degradation.

The failure is not subtle — it is visible in differential voltage analysis after 30 cycles. We recommend DV analysis as an early warning for silicon-anode fast-charge programs.

## References (local)

- Obrovac, M.N., et al. "Reversible cycling of crystalline silicon." Electrochem Solid-State Lett 2004.
- In-house Si-anode SOP SA-19.
- Binder comparison report, 2023-Q4.
