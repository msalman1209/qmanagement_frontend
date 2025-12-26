const path = require('path');
const fs = require('fs');

// Simulate packaged environment
const resourcesPath = "C:\\Users\\tech solutionor\\AppData\\Local\\Programs\\Queue Management System\\resources";

console.log('=== Testing Paths ===\n');

const appPath = path.join(resourcesPath, 'app');
const nodePath = path.join(resourcesPath, 'node_modules');
const nextDir = path.join(resourcesPath, '.next');
const nextBin = path.join(nodePath, 'next', 'dist', 'bin', 'next');

console.log('App Path:', appPath);
console.log('  Exists:', fs.existsSync(appPath));
if (fs.existsSync(appPath)) {
  console.log('  Contents:', fs.readdirSync(appPath).join(', '));
}

console.log('\nNode Modules Path:', nodePath);
console.log('  Exists:', fs.existsSync(nodePath));
if (fs.existsSync(nodePath)) {
  console.log('  Has "next":', fs.existsSync(path.join(nodePath, 'next')));
}

console.log('\n.next Dir:', nextDir);
console.log('  Exists:', fs.existsSync(nextDir));
if (fs.existsSync(nextDir)) {
  console.log('  Contents:', fs.readdirSync(nextDir).join(', '));
}

console.log('\nNext Binary:', nextBin);
console.log('  Exists:', fs.existsSync(nextBin));

console.log('\n=== Checking app.asar ===');
const asarPath = path.join(resourcesPath, 'app.asar');
console.log('app.asar Path:', asarPath);
console.log('  Exists:', fs.existsSync(asarPath));
