#!/usr/bin/env node

/**
 * Robust Frontend Build Script
 * Detecta dinâmicamente o caminho do frontend em monorepo
 * Roda npm ci + npm run build no diretório correto
 * Funciona em CI/CD e local
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Candidatos de path para o frontend
const candidates = [
  'painel-crm/apps/frontend',
  'apps/frontend',
  'packages/frontend',
  'frontend',
];

let frontendDir = null;

// Verificar candidatos diretos
console.log('🔍 Searching for frontend directory...');
for (const c of candidates) {
  if (fs.existsSync(c) && fs.existsSync(path.join(c, 'package.json'))) {
    console.log(`✓ Found: ${c}`);
    frontendDir = c;
    break;
  }
}

// Se não encontrou, buscar recursivamente
if (!frontendDir) {
  console.log('⏳ Candidates not found, searching recursively...');
  
  const walk = (dir, depth = 0) => {
    if (depth > 4) return null; // Limitar profundidade
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const e of entries) {
        const p = path.join(dir, e.name);
        
        // Skip hidden dirs and node_modules
        if (e.name.startsWith('.') || e.name === 'node_modules') continue;
        
        if (e.isDirectory()) {
          const pkgPath = path.join(p, 'package.json');
          if (fs.existsSync(pkgPath)) {
            try {
              const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
              const deps = { ...pkg.dependencies, ...pkg.devDependencies };
              
              // Detectar se é frontend (Next.js ou React)
              if (deps && (deps['next'] || (deps['react'] && deps['react-dom']))) {
                console.log(`✓ Found: ${p}`);
                return p;
              }
            } catch (e) {
              // Skip invalid package.json
            }
          }
          
          const r = walk(p, depth + 1);
          if (r) return r;
        }
      }
    } catch (e) {
      // Skip directories that can't be read
    }
    
    return null;
  };
  
  frontendDir = walk(process.cwd());
}

if (!frontendDir) {
  console.error('❌ Frontend directory not found!');
  console.error('Searched in candidates:', candidates.join(', '));
  console.error('Please ensure Next.js is installed in one of these paths.');
  process.exit(1);
}

console.log(`\n📦 Using frontend directory: ${frontendDir}\n`);

try {
  // Install dependencies
  console.log('⏳ Installing dependencies with npm ci...');
  execSync('npm ci', { stdio: 'inherit', cwd: frontendDir });
  
  // Build
  console.log('\n⏳ Building frontend...');
  execSync('npm run build', { stdio: 'inherit', cwd: frontendDir });
  
  console.log('\n✅ Frontend build completed successfully!\n');
} catch (e) {
  console.error('❌ Build failed:', e.message);
  process.exit(1);
}
