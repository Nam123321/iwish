#!/usr/bin/env python3
"""UIP Confidence Scorer — Type A+B epistemic confidence scoring tool.

Phase 1 (Type A): Deterministic evidence-based scoring.
    Scans document for citation patterns, modal hedging, quantitative evidence,
    source diversity, and recency. Computes a base confidence score [0.0, 1.0].

Phase 2 (Type B, --deep): LLM prompt template for semantic adjustment.
    Bounded ±0.10 from Phase 1 base score (user constraint: Q4).

Exit codes: 0=success, 1=error, 2=partial.
"""
from __future__ import annotations

import argparse
import json
import math
import os
import re
import sys
from datetime import datetime, timezone

TOOL_NAME = "uip-confidence-scorer"
VERSION = "1.0.0"
MAX_LLM_ADJUSTMENT = 0.10  # Hard constraint per user decision

# Scoring dimension weights (sum = 1.0)
WEIGHTS = {
    "citation_density": 0.25,    # References, URLs, file links
    "modal_hedging": 0.20,       # Confident vs hedging language
    "quantitative_evidence": 0.20, # Numbers, percentages, metrics
    "source_diversity": 0.15,    # Variety of evidence types
    "temporal_recency": 0.10,    # How recent are the references
    "internal_consistency": 0.10, # No contradictions detected
}

# Citation patterns
CITATION_PATTERNS = [
    re.compile(r"\[[\d,\s]+\]"),                          # [1], [1,2,3]
    re.compile(r"\((?:et al\.|[\w\s]+,?\s*\d{4})\)"),     # (Author, 2024), (et al.)
    re.compile(r"https?://\S+"),                           # URLs
    re.compile(r"\[.*?\]\(file:///.*?\)"),                  # File links [x](file:///)
    re.compile(r"Source:|Reference:|See:|Ref\.|cited from", re.I),  # Explicit citations
    re.compile(r"according to|based on|as reported by|as stated in", re.I),  # Citation language
]

# Hedging vs confident language
HEDGE_WORDS = re.compile(
    r"\b(might|may|could|possibly|perhaps|likely|unlikely|uncertain|"
    r"unclear|appears|seems|suggests|approximately|roughly|about|"
    r"estimated|tentatively|presumably|arguably)\b", re.I)

CONFIDENT_WORDS = re.compile(
    r"\b(certainly|definitely|clearly|proven|demonstrated|confirmed|"
    r"established|validated|verified|evidenced|documented|measured)\b", re.I)

# Quantitative evidence
QUANT_PATTERNS = [
    re.compile(r"\b\d+(?:\.\d+)?%"),                       # Percentages
    re.compile(r"\$\d+(?:[KMBkmb]|\s*(?:million|billion))?"), # Currency
    re.compile(r"\b\d+(?:,\d{3})+\b"),                      # Large numbers
    re.compile(r"\b\d+(?:\.\d+)?x\b"),                      # Multipliers
    re.compile(r"\bp\s*[<>=]\s*0?\.\d+"),                    # P-values
    re.compile(r"\b(?:KPI|ROI|IRR|NPV|MRR|ARR|DAU|MAU|NPS)\s*[:=]\s*\d", re.I),  # Metrics
]

# Source type markers
SOURCE_TYPES = {
    "academic": re.compile(r"\b(journal|paper|study|research|peer-reviewed|published)\b", re.I),
    "market_data": re.compile(r"\b(market\s+size|TAM|SAM|SOM|revenue|growth\s+rate|CAGR)\b", re.I),
    "user_data": re.compile(r"\b(survey|interview|user\s+research|beta\s+feedback|NPS|retention)\b", re.I),
    "technical": re.compile(r"\b(benchmark|load\s+test|performance\s+test|profiling|audit)\b", re.I),
    "competitor": re.compile(r"\b(competitor|rival|alternative|market\s+leader|incumbent)\b", re.I),
    "internal": re.compile(r"\b(our\s+data|internal|team|sprint|backlog|ticket)\b", re.I),
}

# Temporal markers
YEAR_PATTERN = re.compile(r"\b(20[12]\d)\b")
RECENT_YEARS = {str(y) for y in range(datetime.now().year - 2, datetime.now().year + 1)}

# Contradiction patterns (simplified)
CONTRADICTION_SIGNALS = re.compile(
    r"\b(however|but|contrary|contradicts|inconsistent|on\s+the\s+other\s+hand|"
    r"nevertheless|despite|although|notwithstanding)\b", re.I)


def _read(path: str) -> str:
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            return f.read()
    except OSError as e:
        print(json.dumps({"tool": TOOL_NAME, "error": str(e)}))
        sys.exit(1)


def _score_citations(content: str, word_count: int) -> tuple[float, dict]:
    total = 0
    detail = {}
    for pat in CITATION_PATTERNS:
        matches = pat.findall(content)
        total += len(matches)
    detail["total_citations"] = total
    # Density = citations per 500 words
    density = (total / max(word_count, 1)) * 500
    detail["density_per_500w"] = round(density, 2)
    # Score: 0 citations = 0.1, 1-3 per 500w = 0.5, 4+ = 0.9
    if density >= 4:
        score = 0.9
    elif density >= 2:
        score = 0.7
    elif density >= 1:
        score = 0.5
    elif total > 0:
        score = 0.3
    else:
        score = 0.1
    detail["score"] = score
    return score, detail


def _score_hedging(content: str) -> tuple[float, dict]:
    hedges = len(HEDGE_WORDS.findall(content))
    confident = len(CONFIDENT_WORDS.findall(content))
    total = hedges + confident
    detail = {"hedge_count": hedges, "confident_count": confident}
    if total == 0:
        score = 0.5  # Neutral
    else:
        confidence_ratio = confident / total
        # High confidence ratio = high score, but too high = suspicious
        if confidence_ratio > 0.85:
            score = 0.6  # Suspiciously confident
            detail["note"] = "Unusually high certainty — possible overconfidence"
        elif confidence_ratio > 0.5:
            score = 0.8
        elif confidence_ratio > 0.3:
            score = 0.6
        else:
            score = 0.3  # Too much hedging
    detail["confidence_ratio"] = round(confident / max(total, 1), 3)
    detail["score"] = score
    return score, detail


def _score_quantitative(content: str) -> tuple[float, dict]:
    total = 0
    for pat in QUANT_PATTERNS:
        total += len(pat.findall(content))
    detail = {"quantitative_data_points": total}
    if total >= 10:
        score = 0.9
    elif total >= 5:
        score = 0.7
    elif total >= 2:
        score = 0.5
    elif total >= 1:
        score = 0.3
    else:
        score = 0.1
    detail["score"] = score
    return score, detail


def _score_source_diversity(content: str) -> tuple[float, dict]:
    types_found = []
    for stype, pat in SOURCE_TYPES.items():
        if pat.search(content):
            types_found.append(stype)
    detail = {"source_types_found": types_found, "count": len(types_found)}
    if len(types_found) >= 4:
        score = 0.9
    elif len(types_found) >= 3:
        score = 0.7
    elif len(types_found) >= 2:
        score = 0.5
    elif len(types_found) >= 1:
        score = 0.3
    else:
        score = 0.1
    detail["score"] = score
    return score, detail


def _score_recency(content: str) -> tuple[float, dict]:
    years = YEAR_PATTERN.findall(content)
    detail = {"years_mentioned": list(set(years))[:10]}
    if not years:
        score = 0.5  # Can't determine
        detail["note"] = "No year references found"
    else:
        recent = sum(1 for y in years if y in RECENT_YEARS)
        ratio = recent / len(years)
        detail["recent_ratio"] = round(ratio, 3)
        if ratio >= 0.6:
            score = 0.8
        elif ratio >= 0.3:
            score = 0.5
        else:
            score = 0.3
            detail["note"] = "Most references are outdated"
    detail["score"] = score
    return score, detail


def _score_consistency(content: str) -> tuple[float, dict]:
    contradictions = len(CONTRADICTION_SIGNALS.findall(content))
    detail = {"contradiction_signals": contradictions}
    # Some contradictions are healthy (showing nuance); too many = inconsistent
    if contradictions == 0:
        score = 0.7  # No contradictions could mean nuance is missing
        detail["note"] = "No hedge/contrast language — may lack nuance"
    elif contradictions <= 5:
        score = 0.8  # Healthy amount of nuance
    elif contradictions <= 10:
        score = 0.6
    else:
        score = 0.4
        detail["note"] = "High contradiction density may indicate inconsistency"
    detail["score"] = score
    return score, detail


def score_document(filepath: str) -> dict:
    """Run Phase 1 deterministic confidence scoring."""
    content = _read(filepath)
    words = content.split()
    word_count = len(words)

    dimensions = {}
    cit_s, cit_d = _score_citations(content, word_count)
    dimensions["citation_density"] = cit_d

    hedge_s, hedge_d = _score_hedging(content)
    dimensions["modal_hedging"] = hedge_d

    quant_s, quant_d = _score_quantitative(content)
    dimensions["quantitative_evidence"] = quant_d

    src_s, src_d = _score_source_diversity(content)
    dimensions["source_diversity"] = src_d

    rec_s, rec_d = _score_recency(content)
    dimensions["temporal_recency"] = rec_d

    con_s, con_d = _score_consistency(content)
    dimensions["internal_consistency"] = con_d

    # Weighted average
    scores = {
        "citation_density": cit_s,
        "modal_hedging": hedge_s,
        "quantitative_evidence": quant_s,
        "source_diversity": src_s,
        "temporal_recency": rec_s,
        "internal_consistency": con_s,
    }

    base_score = sum(scores[k] * WEIGHTS[k] for k in WEIGHTS)
    base_score = round(base_score, 3)

    # Determine confidence band
    if base_score >= 0.75:
        band = "high"
    elif base_score >= 0.50:
        band = "moderate"
    elif base_score >= 0.30:
        band = "low"
    else:
        band = "very_low"

    return {
        "tool": TOOL_NAME,
        "version": VERSION,
        "phase": "A",
        "context_file": filepath,
        "word_count": word_count,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "base_score": base_score,
        "confidence_band": band,
        "adjustment_bounds": {
            "min": round(max(0.0, base_score - MAX_LLM_ADJUSTMENT), 3),
            "max": round(min(1.0, base_score + MAX_LLM_ADJUSTMENT), 3),
        },
        "dimension_scores": scores,
        "dimension_weights": WEIGHTS,
        "dimension_details": dimensions,
    }


def build_phase_b(phase1: dict) -> str:
    try:
        import yaml
    except ImportError:
        return "# PyYAML not installed — Phase B skipped"

    deep = {
        "tool": TOOL_NAME, "phase": "B",
        "prompt_template": {
            "role": "system",
            "content": (
                "You are an epistemic confidence calibrator. Phase 1 deterministic "
                "analysis has scored this document. Your task is to provide a BOUNDED "
                f"adjustment of ±{MAX_LLM_ADJUSTMENT} to the base score based on "
                "semantic factors the regex analysis cannot capture.\n\n"
                "Factors to evaluate:\n"
                "1. Logical coherence: Do conclusions follow from evidence?\n"
                "2. Domain expertise signals: Is the author knowledgeable?\n"
                "3. Evidence quality: Are cited sources authoritative?\n"
                "4. Completeness: Are key aspects addressed?\n"
                "5. Bias detection: Is reasoning balanced?\n\n"
                f"HARD CONSTRAINT: Your adjusted_score MUST be within "
                f"[{phase1['adjustment_bounds']['min']}, {phase1['adjustment_bounds']['max']}]. "
                "Any score outside this range will be REJECTED."
            ),
        },
        "context_data": {
            "base_score": phase1["base_score"],
            "confidence_band": phase1["confidence_band"],
            "adjustment_bounds": phase1["adjustment_bounds"],
            "dimension_scores": phase1["dimension_scores"],
        },
        "output_schema": {
            "type": "object",
            "required": ["adjusted_score", "adjustment", "rationale", "factors"],
            "properties": {
                "adjusted_score": {
                    "type": "number",
                    "minimum": phase1["adjustment_bounds"]["min"],
                    "maximum": phase1["adjustment_bounds"]["max"],
                },
                "adjustment": {
                    "type": "number",
                    "minimum": -MAX_LLM_ADJUSTMENT,
                    "maximum": MAX_LLM_ADJUSTMENT,
                },
                "rationale": {"type": "string"},
                "factors": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "direction": {"type": "string", "enum": ["up", "down", "neutral"]},
                            "magnitude": {"type": "number", "minimum": 0, "maximum": 0.05},
                            "reason": {"type": "string"},
                        },
                    },
                },
            },
        },
        "guardrails": [
            f"adjusted_score MUST be in [{phase1['adjustment_bounds']['min']}, {phase1['adjustment_bounds']['max']}]",
            f"|adjustment| MUST be ≤ {MAX_LLM_ADJUSTMENT}",
            "adjustment = adjusted_score - base_score (MUST be mathematically exact)",
            "Each factor must justify its direction with a concrete quote or observation",
            "Sum of factor magnitudes should approximately equal |adjustment|",
        ],
    }
    return yaml.dump(deep, default_flow_style=False, sort_keys=False, width=120)


def main(argv=None):
    p = argparse.ArgumentParser(prog=TOOL_NAME,
        description=f"Confidence Scorer. Phase 1: deterministic scoring. "
                    f"Phase 2 (--deep): bounded LLM adjustment (±{MAX_LLM_ADJUSTMENT}).")
    p.add_argument("--context", required=True, metavar="FILE", help="Document to score")
    p.add_argument("--deep", action="store_true", help="Enable Phase 2 LLM adjustment prompt")
    p.add_argument("--dry-run", action="store_true", help="Validate inputs only")
    args = p.parse_args(argv)

    path = os.path.abspath(args.context)
    if not os.path.isfile(path):
        print(json.dumps({"tool": TOOL_NAME, "error": f"Not found: {path}"}))
        return 1

    if args.dry_run:
        print(json.dumps({"tool": TOOL_NAME, "dry_run": True,
                          "context_file": path, "deep": args.deep, "status": "ready"}, indent=2))
        return 0

    result = score_document(path)
    print(json.dumps(result, indent=2))

    if args.deep:
        print("\n---")
        print(build_phase_b(result))

    return 0


if __name__ == "__main__":
    sys.exit(main())
