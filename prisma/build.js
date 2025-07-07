const { execSync } = require('child_process');

// قم بتنفيذ أمر توليد عميل Prisma
try {
  console.log('Generating Prisma Client...');
  execSync('npx prisma generate');
  console.log('Prisma Client has been generated successfully');
} catch (error) {
  console.error('Error generating Prisma Client:', error);
  process.exit(1);
} 