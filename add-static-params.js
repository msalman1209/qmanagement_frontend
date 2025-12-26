// PowerShell script to add generateStaticParams to all dynamic route pages
const fs = require('fs');
const path = require('path');

const roleBasedPages = [
  'src/app/[role]/activity-logs/page.js',
  'src/app/[role]/admin-settings/page.js',
  'src/app/[role]/completed-tasks/page.js',
  'src/app/[role]/configuration/page.js',
  'src/app/[role]/counter-display/page.js',
  'src/app/[role]/dashboard/page.js',
  'src/app/[role]/display-screens-sessions/page.js',
  'src/app/[role]/page.js',
  'src/app/[role]/profile/page.js',
  'src/app/[role]/reports/page.js',
  'src/app/[role]/services/page.js',
  'src/app/[role]/user-dashboard-btns/page.js',
  'src/app/[role]/users/page.js',
  'src/app/[role]/license/page.js',
  'src/app/[role]/logout/page.js'
];

const generateStaticParamsCode = `
// Generate static params for static export
export function generateStaticParams() {
  return [
    { role: 'admin' },
    { role: 'receptionist' },
    { role: 'user' },
    { role: 'super-admin' }
  ];
}
`;

roleBasedPages.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if generateStaticParams already exists
    if (!content.includes('generateStaticParams')) {
      // Add after the first import block or at the beginning
      const lines = content.split('\n');
      let insertIndex = 0;
      
      // Find the last import statement
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith("import{")) {
          insertIndex = i + 1;
        } else if (insertIndex > 0 && lines[i].trim() === '') {
          break;
        }
      }
      
      // Insert generateStaticParams after imports
      lines.splice(insertIndex, 0, generateStaticParamsCode);
      content = lines.join('\n');
      
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
    } else {
      console.log(`⏭️  Skipped (already has generateStaticParams): ${filePath}`);
    }
  } else {
    console.log(`❌ Not found: ${filePath}`);
  }
});

console.log('\n✨ All pages updated!');
