# Lab Authoring Guide

This guide describes the OmniHack lab YAML schema and workflow.

## YAML Schema

```yaml
id: unique-lab-id
title: "Human readable title"
description: "What the student learns"
difficulty: beginner|intermediate|advanced
seeded: true|false
topology:
  component_name: "container-image:tag"
artifacts:
  artifact_name: "Template with {{PLACEHOLDERS}}"
parameters:
  - name: PARAM_NAME
    type: random_hex|random_int|choice
    length: optional for random_hex
    min: optional for random_int
    max: optional for random_int
    choices: [list] for choice
validators:
  - type: flag_contains|file_exists|http_response_contains|pcap_contains
    value: required for flag_contains/http_response_contains
    path: required for file_exists
hints:
  - "Tiered hints"
cleanup: true|false
```

## Workflow

1. Create a new folder under `lab-templates/` with a descriptive name.
2. Add infrastructure files (Dockerfile, scripts, binaries) required to run the lab.
3. Author `lab.yaml` using placeholders for seeded values.
4. Test the lab with `python generators/template_expander.py <path>/lab.yaml --seed 1337 --output /tmp/lab`.
5. Validate container builds and runtime behaviour locally.
6. Submit the lab with accompanying documentation and hints.

## Validators

- `flag_contains`: Student submission must include rendered value.
- `file_exists`: Verifies presence of a file within session staging directory.
- `http_response_contains`: Planned validator to fetch HTTP endpoint and search for string.
- `pcap_contains`: Planned validator to parse PCAP for seeded content.

Extend `backend/src/validators` to add new validator handlers.

## Safety Checklist

- Ensure lab services bind to private interfaces only.
- Avoid shipping real-world credentials; rely on seeded placeholders.
- Include clear instructions about boundaries and acceptable behaviour.
