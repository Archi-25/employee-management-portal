#!/usr/bin/env bash
# Verifies every requirement from the assessment brief against the source tree.
#   npm run verify
#
# Marks an item ⚠️ when the only evidence is in test files — that is deliberate
# for Default-vs-OnPush, which the application itself no longer uses.
set -uo pipefail
cd "$(dirname "$0")/.."

echo "══════ ASSESSMENT MODULES ══════"
bash scripts/checks/modules.sh
echo
echo "══════ FEATURE CHECKLIST ══════"
bash scripts/checks/features.sh
