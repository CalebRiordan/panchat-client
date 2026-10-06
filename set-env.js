const fs = require('fs');
const path = require('path');

const envFile = `export const env = {
    production: true,
    baseApiUrl: '${process.env.BASE_API_URL}',
};
`;

console.log(`API URL seen by deployed app: ${process.env.BASE_API_URL}`);

const targetPath = path.join(__dirname, './src/environments/environment.ts');
fs.writeFile(targetPath, envFile, (err) => {
  if (err) {
    console.error(err);
    throw err;
  }

  console.log('Successfully generated environment.development.ts');
});
