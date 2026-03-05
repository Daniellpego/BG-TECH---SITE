# MIXBUG Execution Logs

## Comandos executados

### Validação sintática do script principal
```bash
python - <<'PY'
from pathlib import Path
import re
s=Path('painel-cfo/index.html').read_text()
m=re.findall(r'<script>([\s\S]*?)</script>', s)
Path('/tmp/painel-script.js').write_text(m[-1])
print('scripts',len(m),'bytes',len(m[-1]))
PY
node --check /tmp/painel-script.js
```
Saída:
```text
scripts 1 bytes 94840
```

### Tentativa de execução das suítes E2E requeridas
```bash
cd painel-cfo/tests && npx playwright test --config=playwright.config.js e2e/06-concurrency.spec.js
cd painel-cfo/tests && npx playwright test --config=playwright.config.js e2e/07-persistence.spec.js
cd painel-cfo/tests && npx playwright test --config=playwright.config.js e2e/08-dashboard-sync.spec.js
cd painel-cfo/tests && npx playwright test --config=playwright.config.js e2e/09-mixbug.spec.js
```
Saída (todas):
```text
npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.
npm error code E403
npm error 403 403 Forbidden - GET https://registry.npmjs.org/playwright
npm error 403 In most cases, you or one of your dependencies are requesting
npm error 403 a package version that is forbidden by your security policy, or
npm error 403 on a server you do not have access to.
```

## Conclusão
O ambiente bloqueou download de `playwright` (403 no registry), impedindo execução E2E local nesta sessão.
