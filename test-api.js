import { StellifyClient } from './dist/stellify-client.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new StellifyClient({
  apiUrl: process.env.STELLIFY_API_URL,
  apiToken: process.env.STELLIFY_API_TOKEN,
});

const PROJECT_ID = '57ba58c5-6e32-4c3a-acf3-8566c46df4c1';

async function test() {
  console.log('Testing Stellify API connection...\n');

  try {
    // Test 1: Search for existing files
    console.log('1. Searching for files...');
    const files = await client.searchFiles({ query: 'Calculator' });
    console.log('✅ File search successful:', JSON.stringify(files, null, 2));
    console.log('');

    // Test 2: Create a new file (directory auto-detected from type)
    console.log('2. Creating CalculatorController...');
    const file = await client.createFile({
      name: 'CalculatorController',
      type: 'controller',
    });
    console.log('✅ File created:', JSON.stringify(file, null, 2));
    console.log('');

    // Test 3: Create a method
    console.log('3. Creating add() method...');
    const method = await client.createMethod({
      file: file.data.uuid,
      name: 'add',
      visibility: 'public',
      returnType: 'int',
      parameters: [
        { name: 'a', type: 'int' },
        { name: 'b', type: 'int' },
      ],
    });
    console.log('✅ Method created:', JSON.stringify(method, null, 2));
    console.log('');

    // Test 4: Add method body
    console.log('4. Adding method implementation...');
    const body = await client.addMethodBody({
      file_uuid: file.data.uuid,
      method_uuid: method.data.uuid,
      code: 'return $a + $b;',
    });
    console.log('✅ Method body parsed:', JSON.stringify(body, null, 2));
    console.log('');

    console.log('🎉 All tests passed! MCP server is ready to use.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    process.exit(1);
  }
}

test();
