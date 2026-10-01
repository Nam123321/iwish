#!/usr/bin/env python3
import os, sys
# --- [Watchmen Core Injection] ---
_script_dir = os.path.dirname(os.path.abspath(__file__))
_agent_dir = os.path.abspath(os.path.join(_script_dir, ".."))
if _agent_dir not in sys.path:
    sys.path.insert(0, _agent_dir)
try:
    import watchmen_core
    watchmen_core.verify_execution(__file__)
except ImportError:
    pass
# ---------------------------------

import argparse
import json
import yaml
import re
from pathlib import Path

# 4 Taxonomy Clusters for AI/ML Workload Detection
TAXONOMY = {
    "core_aiml": [
        "machine learning", "deep learning", "model training", "inference",
        "feature engineering", "dataset", "ground truth", "precision", "recall",
        "f1 score", "roc-auc", "data drift", "concept drift"
    ],
    "genai_models": [
        "llm", "slm", "gen ai", "generative ai", "rag", "retrieval augmented generation",
        "embedding", "embeddings", "vector db", "vector database", "pgvector", "pinecone",
        "milvus", "qdrant", "prompt engineering", "few-shot", "hallucination",
        "system prompt", "context window", "fine-tuning", "lora", "qlora"
    ],
    "agentic_systems": [
        "agent", "agents", "agentic", "multi-agent", "tool calling", "function calling",
        "react loop", "autonomous agent", "planner", "subagent", "orchestrator",
        "workflow dag", "swarm"
    ],
    "evolution_adaptation": [
        "continuous learning", "self-learning", "self-evolution", "active learning",
        "feedback loop", "reinforcement learning", "rlhf", "model evaluation",
        "prompt evaluation", "shadow deployment"
    ]
}

def extract_text_from_story(story_dir):
    """Safely extracts combined text from story.md, data-spec.md, and ui-spec.md."""
    dir_path = Path(story_dir).resolve()
    if not dir_path.exists():
        return "", {}

    combined_text = []
    frontmatter = {}

    story_file = dir_path / "story.md"
    if story_file.exists():
        try:
            content = story_file.read_text(encoding="utf-8", errors="ignore")
            # Parse YAML frontmatter if present
            if content.startswith("---"):
                parts = content.split("---", 2)
                if len(parts) >= 3:
                    try:
                        frontmatter = yaml.safe_load(parts[1]) or {}
                    except Exception:
                        pass
                    combined_text.append(parts[2])
                else:
                    combined_text.append(content)
            else:
                combined_text.append(content)
        except Exception:
            pass

    for spec_name in ["data-spec.md", "ui-spec.md", "task.md"]:
        spec_file = dir_path / spec_name
        if spec_file.exists():
            try:
                combined_text.append(spec_file.read_text(encoding="utf-8", errors="ignore"))
            except Exception:
                pass

    return "\n".join(combined_text), frontmatter

def run_featuregraph_pass(story_dir):
    """Pass 1: Checks FeatureGraph topology if available."""
    # Look for repo-topology or featuregraph references
    dir_path = Path(story_dir).resolve()
    ai_detected = False
    details = []

    # Check if any parent or local directory has a feature graph node mentioning AI
    fg_candidates = list(dir_path.glob("*featuregraph*.json")) + list(dir_path.glob("*topology*.json"))
    for cand in fg_candidates:
        try:
            with open(cand, 'r', encoding='utf-8') as f:
                data = json.load(f)
                content_str = json.dumps(data).lower()
                for cluster, kws in TAXONOMY.items():
                    for kw in kws:
                        if kw in content_str:
                            ai_detected = True
                            details.append(f"FeatureGraph match: '{kw}' in {cand.name}")
                            break
        except Exception:
            pass

    return ai_detected, details

def run_regex_taxonomy_pass(text):
    """Pass 2: Semantic Keyword Scanner over 4 taxonomy clusters."""
    text_lower = text.lower()
    matches = {}
    total_matches = 0

    for cluster_name, keywords in TAXONOMY.items():
        matched_in_cluster = []
        for kw in keywords:
            # Use word boundary or exact match
            pattern = r'\b' + re.escape(kw) + r'\b'
            if re.search(pattern, text_lower):
                matched_in_cluster.append(kw)
        if matched_in_cluster:
            matches[cluster_name] = matched_in_cluster
            total_matches += len(matched_in_cluster)

    return matches, total_matches

def inject_aiml_tag(story_dir):
    """Injects domain: AI-ML tag into story.md frontmatter if not already present."""
    story_file = Path(story_dir).resolve() / "story.md"
    if not story_file.exists():
        return False

    content = story_file.read_text(encoding="utf-8")
    if "domain: AI-ML" in content or "'domain: AI-ML'" in content or '"domain: AI-ML"' in content:
        return True # already present

    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            try:
                fm = yaml.safe_load(parts[1]) or {}
                tags = fm.get("tags", [])
                if isinstance(tags, list):
                    if "domain: AI-ML" not in tags:
                        tags.append("domain: AI-ML")
                elif isinstance(tags, str):
                    tags = [tags, "domain: AI-ML"]
                else:
                    tags = ["domain: AI-ML"]
                fm["tags"] = tags
                new_fm = yaml.dump(fm, default_flow_style=False, allow_unicode=True, sort_keys=False)
                new_content = f"---\n{new_fm}---\n{parts[2]}"
                story_file.write_text(new_content, encoding="utf-8")
                return True
            except Exception as e:
                print(f"⚠️ Warning: Could not inject YAML tag cleanly: {e}")
                return False

    return False

def main():
    parser = argparse.ArgumentParser(description="Dual-Pass AI-ML Workload Classifier")
    parser.add_argument("--story-dir", required=True, help="Path to story directory")
    parser.add_argument("--output", required=False, help="Path to write JSON classification evidence")
    parser.add_argument("--auto-tag", action="store_true", help="Automatically inject tag if AI workload detected")
    args = parser.parse_args()

    story_dir = os.path.realpath(args.story_dir)
    if not os.path.exists(story_dir):
        print(f"❌ Story directory not found: {story_dir}")
        sys.exit(1)

    text, frontmatter = extract_text_from_story(story_dir)

    # Check if already tagged
    existing_tags = frontmatter.get("tags", []) if isinstance(frontmatter, dict) else []
    already_tagged = "domain: AI-ML" in existing_tags or "AI-ML" in existing_tags

    # Pass 1: FeatureGraph
    fg_detected, fg_details = run_featuregraph_pass(story_dir)

    # Pass 2: Semantic Taxonomy Scanner
    regex_matches, total_kw_matches = run_regex_taxonomy_pass(text)

    # Reconciliation Logic
    verdict = "NOT_AI"
    confidence = "LOW"

    if already_tagged:
        verdict = "CONFIRMED_AI"
        confidence = "MAX_EXPLICIT_TAG"
    elif fg_detected and total_kw_matches >= 2:
        verdict = "AUTO_TAG"
        confidence = "HIGH (Graph + Keywords Dual Consensus)"
    elif total_kw_matches >= 3:
        verdict = "AUTO_TAG"
        confidence = "HIGH (Strong Keyword Density)"
    elif fg_detected or total_kw_matches >= 1:
        verdict = "DIRECT_INSPECTION"
        confidence = "MEDIUM (Partial Overlap, Human/Orch Verification Recommended)"
    else:
        verdict = "NOT_AI"
        confidence = "HIGH (Zero AI/ML footprint)"

    result = {
        "story_dir": story_dir,
        "verdict": verdict,
        "confidence": confidence,
        "already_tagged": already_tagged,
        "featuregraph_pass": {
            "detected": fg_detected,
            "details": fg_details
        },
        "keyword_pass": {
            "total_matches": total_kw_matches,
            "clusters_matched": regex_matches
        }
    }

    if args.auto_tag and verdict in ["AUTO_TAG", "CONFIRMED_AI"]:
        injected = inject_aiml_tag(story_dir)
        result["tag_injected"] = injected

    if args.output:
        out_path = Path(args.output).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")

    print(json.dumps(result, indent=2, ensure_ascii=False))

    if verdict in ["AUTO_TAG", "CONFIRMED_AI"]:
        sys.exit(0) # AI Detected
    elif verdict == "DIRECT_INSPECTION":
        sys.exit(2) # Ambiguous
    else:
        sys.exit(3) # Not AI

if __name__ == "__main__":
    main()
