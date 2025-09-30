const { spawn } = require('child_process');

// Test scenarios for anonymous talent profile access
const tests = [
  {
    name: 'Homepage loads successfully',
    url: 'http://localhost:3000/',
    expectStatus: 200
  },
  {
    name: 'Public talent profile loads (new route)',
    url: 'http://localhost:3000/profiles/talent/cmea2mu1r0001q9m1q7jozmni',
    expectStatus: 200,
    expectNotContain: ['Dashboard', 'My Bookings', 'My Packages']
  },
  {
    name: 'Talent API route accessible',
    url: 'http://localhost:3000/api/talents/cmea2mu1r0001q9m1q7jozmni',
    expectStatus: 200,
    expectContain: ['success', 'talent']
  },
  {
    name: 'Old talent route still works (middleware)',
    url: 'http://localhost:3000/talent/cmea2mu1r0001q9m1q7jozmni',
    expectStatus: 200
  },
  {
    name: 'Explore packages page loads',
    url: 'http://localhost:3000/explore-packages',
    expectStatus: 200
  }
];

function runTest(test) {
  return new Promise((resolve) => {
    const curl = spawn('curl', ['-s', '-I', test.url]);
    let output = '';
    
    curl.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    curl.on('close', () => {
      const statusLine = output.split('\n')[0];
      const statusCode = parseInt(statusLine.split(' ')[1]);
      
      const result = {
        name: test.name,
        passed: statusCode === test.expectStatus,
        status: statusCode,
        details: statusLine
      };
      
      console.log(`${result.passed ? '✓' : '✗'} ${result.name}: ${result.status} ${result.details.split(' ').slice(2).join(' ')}`);
      resolve(result);
    });
  });
}

function runContentTest(test) {
  return new Promise((resolve) => {
    const curl = spawn('curl', ['-s', test.url]);
    let output = '';
    
    curl.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    curl.on('close', () => {
      let passed = true;
      let details = [];
      
      if (test.expectContain) {
        test.expectContain.forEach(term => {
          if (!output.includes(term)) {
            passed = false;
            details.push(`Missing: ${term}`);
          }
        });
      }
      
      if (test.expectNotContain) {
        test.expectNotContain.forEach(term => {
          if (output.includes(term)) {
            passed = false;
            details.push(`Found: ${term}`);
          }
        });
      }
      
      const result = {
        name: test.name + ' (content)',
        passed,
        details: details.length > 0 ? details.join(', ') : 'Content check passed'
      };
      
      console.log(`${result.passed ? '✓' : '✗'} ${result.name}: ${result.details}`);
      resolve(result);
    });
  });
}

async function runAllTests() {
  console.log('🧪 Running Anonymous Talent Profile Access Tests\n');
  
  for (const test of tests) {
    await runTest(test);
    if (test.expectContain || test.expectNotContain) {
      await runContentTest(test);
    }
  }
  
  console.log('\n✅ All tests completed!');
}

runAllTests();
