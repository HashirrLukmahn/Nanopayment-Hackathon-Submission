---
title: "Solid-state electrolyte interface resistance with LiNi0.8Mn0.1Co0.1O2 cathodes"
tier: dark
researcher_hint: Dr. Dmitri Orlov
domain: materials
---

## Abstract

We measured interfacial resistance between Li6PS5Cl argyrodite solid electrolyte and NMC811 cathode across 42 cold-sintered pellets at varying sintering pressure (200–600 MPa). Interfacial resistance ranged from 180 to 2,100 Ω·cm² after first-cycle formation — two orders of magnitude higher than published simulation predictions (5–20 Ω·cm²). Post-mortem cross-sections revealed a non-conductive amorphous interfacial layer, likely polythionate-containing, growing during formation. We attempted three mitigation strategies; none reduced resistance below 50 Ω·cm². This is a structural bottleneck for sulfide-based solid-state cell commercialization.

## Methods

NMC811 cathode: 75 wt% NMC811 / 22 wt% Li6PS5Cl / 3 wt% vapor-grown carbon fiber, cold-pressed at 370 MPa. Solid electrolyte: Li6PS5Cl synthesized in-house by mechanochemical milling + annealing (550°C, 6 h, Ar).

Symmetric In/Li6PS5Cl/In and full Li/Li6PS5Cl/NMC811 cells were assembled in an argon glove box (< 0.1 ppm O2 and H2O). Impedance spectroscopy from 10 MHz to 1 mHz, 10 mV amplitude.

Sintering pressure sweep: 200, 300, 370, 450, 500, 600 MPa, 5 pellets each.

## Results

Bulk ionic conductivity of Li6PS5Cl pellets: 2.8 × 10⁻³ S/cm at 25°C across all pressures (confirming good pellet densification).

Cathode-electrolyte interfacial resistance after first cycle:
- 200 MPa: 2,100 ± 580 Ω·cm²
- 300 MPa: 1,450 ± 420 Ω·cm²
- 370 MPa: 820 ± 240 Ω·cm²
- 450 MPa: 410 ± 180 Ω·cm²
- 500 MPa: 240 ± 95 Ω·cm²
- 600 MPa: 180 ± 60 Ω·cm² (pellet fracture rate 40% above 550 MPa)

XPS of post-cycle interfaces showed sulfur oxidation (S2p BE shifting from 161.5 eV to 166-169 eV), consistent with polythionate formation. The interfacial layer thickness by STEM cross-section was 40-120 nm depending on sintering pressure (thicker at lower pressure, consistent with more accessible reaction sites).

## Discussion

Mitigation 1 — LiNbO3 coating (Atomic Layer Deposition, 5 nm on NMC particles): reduced interfacial resistance by 40% at best (from 820 Ω·cm² to 490 at 370 MPa) but still two orders of magnitude worse than literature predictions.

Mitigation 2 — Li3PO4 coating (sol-gel, 10 nm): 30% reduction, but introduced additional bulk resistance of ~50 Ω·cm² from the coating itself.

Mitigation 3 — Adding 3 wt% LiNbO3 as a composite cathode sintering aid: 20% reduction, no improvement beyond the ALD coating baseline.

We conclude that the polythionate interfacial layer is thermodynamically driven and forms during formation regardless of coating. Published simulation predictions of 5-20 Ω·cm² assume kinetic-limited thin interfaces (<10 nm) and do not account for the formation-cycle chemistry we observe.

Sulfide-based solid-state cells remain an active research area, but teams targeting commercialization with NMC811 + Li6PS5Cl should budget for 200+ Ω·cm² interfacial resistance as the floor, not the ceiling. Oxide electrolytes (LLZO) are an alternative but introduce their own interfacial issues.

## References (local)

- Koerver, R., et al. "Capacity fade in solid-state batteries." Chem Mater 2017.
- Internal argyrodite synthesis SOP SE-04.
- XPS core-level analysis notebook, 2024.
