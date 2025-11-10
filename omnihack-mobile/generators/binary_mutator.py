#!/usr/bin/env python3
"""Binary mutator that appends session metadata without breaking execution."""
import argparse
import hashlib
import os
import shutil


CHUNK_MARKER = b"\n#OMNIHACK_MUTATION#\n"


def mutate_binary(input_path: str, output_path: str, seed: str) -> None:
    if not os.path.exists(input_path):
        raise FileNotFoundError(input_path)
    shutil.copyfile(input_path, output_path)
    with open(output_path, "ab") as f:
        digest = hashlib.sha256(seed.encode()).hexdigest()
        f.write(CHUNK_MARKER + digest.encode())


def main() -> None:
    parser = argparse.ArgumentParser(description="Mutate binaries per session")
    parser.add_argument("input", help="Input binary path")
    parser.add_argument("--output", required=True, help="Output binary path")
    parser.add_argument("--seed", required=True, help="Session seed")
    args = parser.parse_args()
    mutate_binary(args.input, args.output, args.seed)


if __name__ == "__main__":
    main()
