---
title: "Failed replication of the 2022 allosteric SHP2 inhibitor paper using supplied cell lines"
tier: dark
researcher_hint: Dr. Camila Rivera
domain: chemistry
---

## Abstract

We attempted to replicate the key efficacy claims of the 2022 paper on allosteric SHP2 inhibition in MAPK-driven models (citation withheld as the authors were cooperative and we do not wish to single them out). Despite receiving their exact compound, cell lines, and reagents, we were unable to reproduce the reported 70% tumor regression in the HCC-827 xenograft model. Our best replication achieved 22% tumor growth inhibition at a 3× higher dose. This document records our protocol, the deviations we observed, and our best current hypothesis for the discrepancy.

## Methods

Compound SHP-099 was supplied from the authors' lab at 98.7% purity (HPLC). HCC-827 cells were obtained from the authors at passage 14. Female nu/nu mice were obtained from Charles River (strain 088) — the authors used Jackson Labs (strain 007850); we ran a parallel arm with Jackson mice.

Dosing was 75 mg/kg QD by oral gavage in 0.5% methylcellulose / 0.2% Tween-80, matching the published protocol exactly. Tumor volumes were measured twice weekly. PK was sampled at day 7 and day 21 (Cmax, AUC).

## Results

In our primary cohort (Charles River mice, n=10), tumor growth inhibition at day 28 was 22% ± 6%. In the parallel Jackson Labs cohort (n=10), TGI was 31% ± 8%. The authors reported 70% TGI with complete responses in 3/10 animals. We observed no complete responses.

PK exposures were 22% lower than the authors reported (mean Cmax 3.1 μM vs 4.0 μM; AUC0–24 28 μM·h vs 36 μM·h). Compound purity and concentration in dosing solutions were confirmed by LC-MS.

Cell-line characterization: STR profiling matched the published HCC-827 profile. Mycoplasma was negative. EGFR exon 19 deletion was confirmed by Sanger sequencing. However, we detected a previously-unreported KRAS G12D mutation at 8% allele frequency by deep sequencing (30,000×), which was not present in the authors' original STR-profiled reference but could have emerged through continued passaging.

## Discussion

The 8% KRAS G12D subpopulation may explain the reduced efficacy — SHP2 inhibition is known to be less effective in KRAS-mutant contexts. The authors' frozen stocks (passage 14, delivered to us) tested positive for the KRAS G12D subclone, suggesting the drift happened on their end. Re-running with HCC-827 from ATCC (new purchase, passage 6) restored efficacy to 48% TGI — partial rescue but still short of the published 70%.

We were unable to fully close the gap. Remaining sources of variance include: vehicle preparation (ours vs theirs by blinded taste test of 0.5% methylcellulose viscosity — ours was slightly thicker), gavage technique, animal housing conditions, and feeding schedule. We do not claim the paper is wrong; we claim the published result required conditions that are difficult to replicate blind.

## References (local)

- Internal replication failure registry, entry R-2024-019.
- ATCC CRL-2868 spec sheet.
- Deep sequencing report, in-house NGS core, 2024-Q3.
