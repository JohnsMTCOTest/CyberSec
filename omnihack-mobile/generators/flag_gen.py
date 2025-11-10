#!/usr/bin/env python3
"""Deterministic flag generator using a session seed."""
import argparse
import hashlib
import json


def derive_flag(seed: str, label: str = "OMNIHACK") -> str:
    digest = hashlib.sha256(f"{seed}:{label}".encode()).hexdigest()
    return f"{label}{{{digest[:16]}}}"


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate deterministic flags from seed")
    parser.add_argument("--seed", required=True, help="Session seed")
    parser.add_argument("--label", default="OMNIHACK", help="Flag label prefix")
    args = parser.parse_args()
    flag = derive_flag(args.seed, args.label)
    print(json.dumps({"seed": args.seed, "flag": flag}))


if __name__ == "__main__":
    main()
