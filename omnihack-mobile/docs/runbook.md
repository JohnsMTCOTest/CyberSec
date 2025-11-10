# Developer Runbook

## Local Development

1. Install dependencies:
   ```bash
   npm install --prefix backend
   pip install -r requirements.txt  # optional for additional python deps
   ```
2. Start services:
   ```bash
   docker-compose up
   ```
3. Run backend locally with hot reload via `npm run start` (ts-node).
4. Execute unit tests with `npm test --prefix backend` and `pytest`.

## Adding Labs

1. Duplicate an existing lab folder.
2. Update Dockerfile and supporting artifacts.
3. Modify `lab.yaml` and ensure parameter placeholders exist.
4. Run `python generators/template_expander.py ...` to validate.
5. Commit updates and run CI pipeline locally before pushing.

## Monitoring & Logging

- Backend logs requests and lab lifecycle events (extend `server.ts`).
- Container stdout/stderr should be forwarded to centralized logging.
- Network isolation enforced via Docker networks; extend to CNI in k8s.

## Incident Response

- Triggered alerts result in lab session termination.
- Review database records for session metadata.
- Export audit logs for compliance if necessary.

## Deployment Notes

- Use `infra/docker/docker-compose.yml` for multi-service local stack.
- Production deployments rely on `infra/k8s/` manifests.
- Integrate with identity provider for SSO and RBAC.
