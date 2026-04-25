---
title: "Failed dose escalations of compound XYZ-441 in a phase I oncology dose-finding panel"
tier: dark
researcher_hint: Dr. Asma Khan
domain: chemistry
---

## Abstract

Compound XYZ-441, a second-generation KRAS G12C covalent inhibitor, was evaluated in an in-house phase I dose escalation across MCF-7, A549, and HCT-116 cell lines at doses from 5 mg/kg to 120 mg/kg in xenograft models prior to any clinical protocol. Dose-limiting toxicities (DLTs) were observed at all doses ≥40 mg/kg, and tumor regression did not exceed 18% at any sub-toxic dose. We terminated the program after three independent cohorts failed to reproduce the efficacy window reported by Chen et al. (2023). This document records the negative result so downstream programs targeting analogous covalent warheads can triangulate against our data.

## Methods

Female BALB/c nude mice (n=8 per arm, three cohorts, 192 animals total) were inoculated subcutaneously with 5×10^6 MCF-7, A549, or HCT-116 cells in a 1:1 Matrigel mixture. XYZ-441 was formulated as a PEG-400/Kolliphor EL/water (30/10/60 v/v) suspension and dosed QD by oral gavage once tumor volumes reached 150–200 mm³. Serum PK samples were taken at 0.25, 0.5, 1, 2, 4, 8, and 24 h after the first dose; Cmax and AUC0–24 were computed by non-compartmental analysis in Phoenix WinNonlin 8.3.

Body weight was measured twice weekly. ALT/AST were measured at day 7, 14, and 21. Histopathology was performed on liver and kidney at sacrifice.

## Results

At 5, 10, and 20 mg/kg QD the compound was well tolerated. Tumor growth inhibition (TGI) was 8%, 11%, and 14% respectively in the MCF-7 arm, 6%, 9%, and 13% in A549, and 4%, 7%, and 12% in HCT-116. At 40 mg/kg we observed 2/8 animals developing grade 2 hepatotoxicity (ALT 4–6× ULN) by day 14; TGI was 18% in MCF-7. At 80 mg/kg, 5/8 animals reached DLT by day 10 (ALT >8× ULN, body weight loss >15%). At 120 mg/kg, 7/8 animals reached DLT by day 7. No complete responses were observed at any dose.

The therapeutic index we computed was effectively <1: no dose produced TGI ≥25% without producing DLT in ≥25% of animals. This contrasts with Chen et al.'s reported TGI of 62% at 30 mg/kg in a similar HCT-116 model. We attempted to replicate their exact formulation (0.5% methylcellulose in water) across three independent technicians; results did not differ meaningfully (mean TGI 13.4% vs 12.8%).

## Discussion

We identify three likely contributors to the negative outcome. First, our batch of XYZ-441 showed plasma protein binding of 98.7% (human) and 97.9% (mouse), higher than the 94% reported in the literature; free fraction is roughly halved, which would meaningfully reduce in vivo target engagement. Second, metabolite M3 (a glucuronide conjugate) dominated the 4-h plasma profile, consistent with fast phase II clearance not anticipated from the in vitro microsomal data. Third, we observed off-target CYP3A4 inhibition at Cmax (IC50 ≈ 1.8 μM), explaining the transaminase elevations at higher doses.

The divergence from Chen et al. may reflect a difference in vehicle-driven absorption (their 0.5% methylcellulose vs our PEG/Kolliphor) but our direct replication with their vehicle did not rescue efficacy. We encourage groups with analogous covalent warheads (BRF-119, ARS-1629) to examine plasma protein binding early and to avoid over-relying on published PK without independent measurement.

## References (local)

- Chen, Z., et al. "A second-generation covalent KRAS G12C inhibitor." Unpublished internal report, 2023.
- Walters, P. "Notes on MCF-7 batch variability." Private communication, 2024.
- In-house SOP PK-017: PK analysis by NCA.
