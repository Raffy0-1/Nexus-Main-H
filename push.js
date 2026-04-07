const { execSync } = require('child_process');
try {
  console.log('Adding files...');
  execSync('git add .', { stdio: 'inherit' });
  console.log('Committing files...');
  execSync('git commit -m "feat: complete final integrations"', { stdio: 'inherit' });
  console.log('Pushing to GitHub...');
  execSync('git push https://github.com/Raffy0-1/Nexus-Main-H.git HEAD:main', { stdio: 'inherit' });
  console.log('Push complete!');
} catch (e) {
  console.error('Error during git execution:', e.message);
}
