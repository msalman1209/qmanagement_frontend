// PowerShell script to remove generateStaticParams from all client component pages
const fs = require('fs');
const path = require('path');

const roleBasedPages = [
  'src/app/[role]/activity-logs/page.js',
  'src/app/[role]/completed-tasks/page.js',
  'src/app/[role]/configuration/page.js',
  'src/app/[role]/counter-display/page.js',
  'src/app/[role]/dashboard/page.js',
  'src/app/[role]/display-screens-sessions/page.js',
  'src/app/[role]/page.js',
  'src/app/[role]/profile/page.js',
  'src/app/[role]/reports/page.js',
  'src/app/[role]/user-dashboard-btns/page.js',
  'src/app/[role]/logout/page.js'
];

roleBasedPages.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Remove generateStaticParams function and comment
    const generateStaticParamsPattern = /\n\/\/ Generate static params for static export\nexport function generateStaticParams\(\) \{\n  return \[\n    \{ role: 'admin' \},\n    \{ role: 'receptionist' \},\n    \{ role: 'user' \},\n    \{ role: 'super-admin' \}\n  \];\n\}\n/g;
    
    if (content.match(generateStaticParamsPattern)) {
      content = content.replace(generateStaticParamsPattern, '\n');
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Removed from: ${filePath}`);
    } else {
      console.log(`⏭️  Skipped (no generateStaticParams found): ${filePath}`);
    }
  } else {
    console.log(`❌ Not found: ${filePath}`);
  }
});

console.log('\n✨ All pages cleaned!');
