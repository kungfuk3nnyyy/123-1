#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Logo Consistency Fix...\n');

// Check the talent profile view component
const talentProfilePath = 'app/talent/[id]/_components/talent-profile-view.tsx';
console.log('📁 Checking:', talentProfilePath);

try {
  const content = fs.readFileSync(talentProfilePath, 'utf8');
  
  // Check for GigSecureLogo import
  if (content.includes("import { GigSecureLogo } from '@/components/gigsecure-logo'")) {
    console.log('✅ GigSecureLogo import found');
  } else {
    console.log('❌ GigSecureLogo import NOT found');
  }
  
  // Check for proper logo usage
  if (content.includes('<GigSecureLogo size="md" variant="default" href="/" />')) {
    console.log('✅ Consistent GigSecureLogo usage found');
  } else {
    console.log('❌ Consistent GigSecureLogo usage NOT found');
  }
  
  // Check that the old inconsistent logo is removed
  if (!content.includes('<div className="h-1/2 w-1/2 text-white font-bold text-sm">GS</div>')) {
    console.log('✅ Old inconsistent logo removed');
  } else {
    console.log('❌ Old inconsistent logo still present');
  }
  
  // Check that the old color styling is removed
  if (!content.includes('Gig<span className="text-blue-600">Secure</span>')) {
    console.log('✅ Old inconsistent color styling removed');
  } else {
    console.log('❌ Old inconsistent color styling still present');
  }
  
} catch (error) {
  console.log('❌ Error reading file:', error.message);
}

console.log('\n📋 Comparing with other components...');

// Check public header for reference
const publicHeaderPath = 'components/public-header.tsx';
console.log('📁 Checking reference:', publicHeaderPath);

try {
  const headerContent = fs.readFileSync(publicHeaderPath, 'utf8');
  
  if (headerContent.includes('<GigSecureLogo size="md" variant="default" href="/" />')) {
    console.log('✅ Public header uses same consistent logo implementation');
  } else {
    console.log('❌ Public header does not match expected implementation');
  }
  
} catch (error) {
  console.log('❌ Error reading public header file:', error.message);
}

// Check homepage for reference
const homepagePath = 'app/page.tsx';
console.log('📁 Checking reference:', homepagePath);

try {
  const homepageContent = fs.readFileSync(homepagePath, 'utf8');
  
  if (homepageContent.includes("import { GigSecureLogo } from '@/components/gigsecure-logo'")) {
    console.log('✅ Homepage imports GigSecureLogo consistently');
  } else {
    console.log('❌ Homepage does not import GigSecureLogo');
  }
  
} catch (error) {
  console.log('❌ Error reading homepage file:', error.message);
}

console.log('\n🎯 Logo Consistency Fix Verification Complete!');
