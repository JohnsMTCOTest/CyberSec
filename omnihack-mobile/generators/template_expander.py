#!/usr/bin/env python3
"""Expand lab templates using deterministic parameters."""
import argparse
import os
import yaml
import hashlib
import json
from typing import Dict, Any


def deterministic_value(seed: str, name: str, length: int = 8) -> str:
    digest = hashlib.sha256(f"{seed}:{name}".encode()).hexdigest()
    return digest[:length]


def generate_parameters(lab: Dict[str, Any], seed: str) -> Dict[str, Any]:
    params = {"SEED": seed}
    for param in lab.get("parameters", []):
        name = param.get("name")
        if not name:
            continue
        ptype = param.get("type")
        if ptype == "random_hex":
            params[name] = deterministic_value(seed, name, param.get("length", 8))
        elif ptype == "random_int":
            minimum = param.get("min", 0)
            maximum = param.get("max", 100)
            num = int(deterministic_value(seed, name, 12), 16)
            params[name] = minimum + (num % (maximum - minimum + 1))
        elif ptype == "choice":
            choices = param.get("choices", [])
            idx = int(deterministic_value(seed, name, 8), 16) % len(choices)
            params[name] = choices[idx]
        else:
            raise ValueError(f"Unsupported parameter type {ptype}")
    return params


def render_artifacts(lab: Dict[str, Any], params: Dict[str, Any]) -> Dict[str, str]:
    artifacts = {}
    for key, template in (lab.get("artifacts") or {}).items():
        artifacts[key] = template
        for param_key, value in params.items():
            artifacts[key] = artifacts[key].replace(f"{{{{{param_key}}}}}", str(value))
    return artifacts


def write_outputs(output_dir: str, artifacts: Dict[str, str]) -> None:
    os.makedirs(output_dir, exist_ok=True)
    for key, value in artifacts.items():
        with open(os.path.join(output_dir, f"{key}.txt"), "w") as f:
            f.write(value)


def main() -> None:
    parser = argparse.ArgumentParser(description="Expand lab template")
    parser.add_argument("lab", help="Path to lab.yaml")
    parser.add_argument("--seed", required=True, help="Session seed")
    parser.add_argument("--output", required=True, help="Output directory")
    args = parser.parse_args()

    with open(args.lab, "r") as f:
        lab = yaml.safe_load(f)
    params = generate_parameters(lab, args.seed)
    artifacts = render_artifacts(lab, params)
    write_outputs(args.output, artifacts)
    print(json.dumps({"parameters": params, "artifacts": artifacts}))


if __name__ == "__main__":
    main()
