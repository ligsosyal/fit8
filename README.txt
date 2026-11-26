FIT8 - build dependency fix

1. Replace the existing repository-root package.json with the package.json in this ZIP.
   The root is the same folder that contains index.html and the src folder.
2. Do not upload this ZIP as a ZIP file into the repository. Extract it first, then replace package.json.
3. In Vercel > Project Settings > Build and Deployment:
   - Framework Preset: Vite
   - Root Directory: ./
   - Build Command: npm run build (or leave the project default)
   - Output Directory: dist
   - Install Command: leave as Auto / empty so Vercel detects pnpm from packageManager.
4. Redeploy after the GitHub commit.

Why:
The npm registry does not contain @februarysea/workout-motion. This package.json pins the
upstream GitHub source to commit 424fbcc1548b6e14a2276bc0886c13c7a228eb81. The upstream
package requires Node 20+ and builds its dist files during installation. The packageManager
field asks Vercel to use pnpm 10.28.2.

No Firebase configuration, authentication, Firestore rules, user records, or workout data
are changed by these files.

License note:
The animation library is distributed under PolyForm Noncommercial 1.0.0. This setup is
appropriate only for permitted non-commercial use unless separate permission is obtained.
