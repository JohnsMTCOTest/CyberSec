# OmniHack Mobile PoC

OmniHack Mobile is a mobile-first interactive cybersecurity learning platform proof-of-concept. It orchestrates ephemeral labs with procedural content, integrates ethics gating, and exposes a mobile client optimized for on-the-go training.

## Features
- Node.js backend orchestrator with deterministic lab generation
- Procedural flag and template generation based on cryptographic seeds
- Sample labs across web, red-team, hardware, and binary exploitation tracks
- React Native mobile client with embedded terminal access to lab environments
- Hardware JTAG simulation stub using QEMU with GDB proxy controls
- Safety controls including ethics and acceptable use policies

## Prerequisites
- Docker and Docker Compose
- Node.js 18+
- Python 3.11+
- Yarn / npm for frontend projects
- Expo CLI for running the mobile app

## Quick Start (Docker Compose)

```bash
cd omnihack-mobile
cp .env.example .env # optional for future secrets
docker compose up --build  # use `docker-compose` if your CLI still provides the hyphenated form
```

This launches the backend API, sqlite database, and a ttyd instance used for terminal proxying. The backend image now bundles `ttyd` and the native build toolchain so the stack works out-of-the-box inside GitHub Codespaces when you run `docker compose up --build`.

### Running the Web SQLi Lab locally

1. Ensure the Docker Compose stack is running.
2. Generate a session seed and flag via the backend endpoint:
   ```bash
   curl -X POST http://localhost:4000/api/labs/web-sqli/start -H 'Content-Type: application/json' -d '{"userId":"demo"}'
   ```
3. The response includes the terminal websocket URL and token. Use the mobile app or `tests/example_integration_test.sh` to connect and interact with the lab container.
4. Exploit the SQL injection vulnerability in `/search?q='` to dump the seeded flag `OMNIHACK<seed>` from the database.
5. Submit the recovered flag:
   ```bash
   curl -X POST http://localhost:4000/api/labs/web-sqli/submit -H 'Content-Type: application/json' -d '{"sessionId":"<session>","submission":"OMNIHACKXXXX"}'
   ```
6. The backend runs the validator and reports success.

### Running Generators

```bash
python3 generators/flag_gen.py --seed 1337
python3 generators/template_expander.py lab-templates/web-sqli/lab.yaml --seed 1337 --output /tmp/lab
python3 generators/binary_mutator.py examples/binary-rop/base_binary.bin --seed 1337 --output /tmp/binary.bin
```

### React Native Mobile Client

```bash
cd frontend/mobile
npm install
npx expo start
```

Use the Expo Go app or an emulator to open the QR code. Configure the API base URL in `App.tsx` if not running on localhost.

### Tests

```bash
cd omnihack-mobile
npm install --prefix backend
npm test --prefix backend
pytest tests python_generators_test.py
./tests/example_integration_test.sh
```

## Repository Layout

Refer to the tree structure described in this README for directories containing labs, generators, documentation, and infrastructure manifests.

### Documentation
- `docs/lab-authoring.md` – schema and best practices for lab creation
- `docs/runbook.md` – developer operations guide
- `docs/ethics_and_aup.md` – ethics course outline and acceptable use policy

## Safety & Compliance
- Ethics and acceptable use acknowledgement is enforced before lab access
- Labs are network-isolated and terminated upon policy violations
- Logging and monitoring hooks included in backend for audit trails

## Production Notes
- Kubernetes manifests under `infra/k8s` demonstrate scaling ephemeral lab runners using Firecracker microVMs and strict network policies
- Extend the sqlite adapter to Postgres for production use
- Integrate hardware simulation with remote bench management for physical devices

