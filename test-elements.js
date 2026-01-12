import { StellifyClient } from './dist/stellify-client.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new StellifyClient({
  apiUrl: process.env.STELLIFY_API_URL,
  apiToken: process.env.STELLIFY_API_TOKEN,
});

const PROJECT_ID = 'b11ba1ac-ad5e-45c7-8285-57f0b7aa0196';

async function testElements() {
  console.log('Testing Stellify Element Creation with UUID...\n');

  try {
    // Test 1: Create a test route first
    console.log('1. Creating test route...');
    const timestamp = Date.now();
    const route = await client.createRoute({
      project_id: PROJECT_ID,
      name: `Test Page ${timestamp}`,
      path: `/test-elements-${timestamp}`,
      method: 'GET',
      type: 'web',
    });
    console.log('✅ Route created:', route.data.uuid);
    console.log('');

    // Test 2: Create an element on that route
    console.log('2. Creating element (s-wrapper)...');
    const element = await client.createElement({
      page: route.data.uuid,
      type: 's-wrapper',
    });
    console.log('✅ Element created:', JSON.stringify(element, null, 2));
    console.log('');

    // Test 3: Verify UUID is in the element data
    console.log('3. Verifying UUID in element data...');
    if (element.data && element.data.uuid) {
      console.log('✅ UUID found at root level:', element.data.uuid);
      console.log('   Matches element UUID:', element.uuid === element.data.uuid ? '✅ YES' : '❌ NO');
    } else {
      console.log('❌ UUID NOT found in element.data');
      console.log('   Element data structure:', JSON.stringify(element.data, null, 2));
    }
    console.log('');

    // Test 3b: Verify route's data array contains the element UUID
    console.log('3b. Verifying route contains element UUID...');
    const routeCheck = await client.client.get(`/route/${route.data.uuid}`);
    const routeData = routeCheck.data.data;
    if (routeData.data && Array.isArray(routeData.data) && routeData.data.includes(element.data.uuid)) {
      console.log('✅ Route data array contains element UUID');
      console.log('   Route data array:', routeData.data);
    } else {
      console.log('❌ Route data array does NOT contain element UUID');
      console.log('   Route data:', JSON.stringify(routeData, null, 2));
    }
    console.log('');

    // Test 4: Create a child element
    console.log('4. Creating child element (s-input)...');
    const childElement = await client.createElement({
      type: 's-input',
      parent: element.data.uuid,
    });
    console.log('✅ Child element created:', childElement.data.uuid);

    // Verify child UUID
    if (childElement.data && childElement.data.uuid) {
      console.log('✅ UUID found in child element.data:', childElement.data.uuid);
      console.log('   Has parent reference:', childElement.data.parent ? '✅ YES (' + childElement.data.parent + ')' : '❌ NO');
    } else {
      console.log('❌ UUID NOT found in child element.data');
    }
    console.log('');

    console.log('🎉 Element creation test complete!');
    console.log('\nCreated Resources:');
    console.log(`  Route: ${route.data.uuid} (${route.data.path})`);
    console.log(`  Parent Element: ${element.data.uuid}`);
    console.log(`  Child Element: ${childElement.data.uuid}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      console.error('Response status:', error.response.status);
    }
    process.exit(1);
  }
}

testElements();
