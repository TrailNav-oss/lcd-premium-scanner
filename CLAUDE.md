# LCD Premium Scanner

## Stack
- Next.js 14, Tailwind CSS, TypeScript
- Deploiement : Vercel
- Repo : `TrailNav-oss/lcd-premium-scanner`

## Commandes
```bash
npm run dev      # Dev server → http://localhost:3000
npm run build    # Build production
npm run lint     # Linting
```

## Git & GitHub — Comment commit et push

L'authentification GitHub fonctionne via Git Credential Manager (token en cache Windows).
`gh` CLI n'est PAS configure — utiliser uniquement les commandes `git` natives.

### Workflow
1. `git status` et `git diff` avant tout
2. Staging fichier par fichier : `git add src/fichier1.ts src/fichier2.tsx`
3. Commit avec HEREDOC :
   ```bash
   git commit -m "$(cat <<'EOF'
   fix(module): description courte

   Co-Authored-By: Claude <noreply@anthropic.com>
   EOF
   )"
   ```
4. **Demander confirmation a l'utilisateur AVANT de push** : `git push origin <branche>`

### Regles strictes
- **JAMAIS** `git push --force`
- **JAMAIS** `git add .` ou `git add -A`
- **JAMAIS** push sur `main` sans demander
- **JAMAIS** `--no-verify`
- **TOUJOURS** `git status` avant et apres le commit
- Ne PAS utiliser `gh` CLI
