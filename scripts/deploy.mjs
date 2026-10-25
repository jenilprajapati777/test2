import { execSync } from 'node:child_process';

console.log('==> Building production assets...');
execSync('npm run build', { stdio: 'inherit' });

console.log('==> Deploying to Vercel...');
try {
  execSync('npx vercel --prod --yes', { stdio: 'inherit' });
} catch (e) {
  console.log('\n======================================================');
  console.log('Authentication required for production deployment.');
  console.log('Please run the following command to log in:');
  console.log('  npx vercel login');
  console.log('Then redeploy with:');
  console.log('  npm run deploy');
  console.log('======================================================\n');
}
