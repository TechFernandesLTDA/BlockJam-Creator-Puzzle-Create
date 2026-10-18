#!/bin/bash

# Get declared dependencies from package.json
DECLARED=$(node -e "const pkg = require('./apps/mobile/package.json'); const deps = {...pkg.dependencies, ...pkg.devDependencies}; console.log(Object.keys(deps).sort().join('\n'))")

# Get all imports from source
IMPORTS=$(
  (grep -rh "from '" apps/mobile/src --include="*.tsx" --include="*.ts" | grep -v "from './" | grep -v "from '@/" | sed "s/.*from '//" | sed "s/'.*$//" | grep -v "^\.\./") && \
  (grep -rh "from \"" apps/mobile/src --include="*.tsx" --include="*.ts" | grep -v "from './" | grep -v "from '@/" | sed 's/.*from "//' | sed 's/".*$//' | grep -v "^\.\./") && \
  (grep -rh "import('" apps/mobile/src --include="*.tsx" --include="*.ts" | sed "s/.*import('//" | sed "s/'.*$//" | grep -v "^\.\." | grep -v "^\./") && \
  (grep -rh 'import("' apps/mobile/src --include="*.tsx" --include="*.ts" | sed 's/.*import("//' | sed 's/".*$//' | grep -v "^\.\." | grep -v "^\./")
) | sort -u

echo "=== DECLARED DEPENDENCIES ==="
echo "$DECLARED"

echo ""
echo "=== IMPORTED PACKAGES FROM SOURCE ==="
echo "$IMPORTS"

echo ""
echo "=== MISSING PACKAGES ==="
MISSING=$(comm -23 <(echo "$IMPORTS" | sort) <(echo "$DECLARED" | sort))
if [ -z "$MISSING" ]; then
  echo "NONE - All imported packages are declared"
else
  echo "$MISSING"
fi
