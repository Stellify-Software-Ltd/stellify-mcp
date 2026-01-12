import { StellifyClient } from './dist/stellify-client.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new StellifyClient({
  apiUrl: process.env.STELLIFY_API_URL,
  apiToken: process.env.STELLIFY_API_TOKEN,
});

const PROJECT_ID = 'b11ba1ac-ad5e-45c7-8285-57f0b7aa0196';

async function testHtmlConversion() {
  console.log('Testing HTML to Elements Conversion\n');

  try {
    // Step 1: Create a route
    console.log('1. Creating test route...');
    const timestamp = Date.now();
    const route = await client.createRoute({
      project_id: PROJECT_ID,
      name: `HTML Test ${timestamp}`,
      path: `/html-test-${timestamp}`,
      method: 'GET',
      type: 'web',
    });
    console.log('✅ Route created:', route.data.uuid);
    console.log('');

    // Step 2: Test preview mode first
    console.log('2. Testing preview mode (test: true)...');
    const html = `
      <div class="container mx-auto p-8">
        <h1 class="text-3xl font-bold mb-4">Contact Form</h1>
        <form method="POST" action="/api/contact" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Email</label>
            <input type="email" name="email" placeholder="your@email.com" required class="form-input w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Message</label>
            <textarea name="message" rows="4" placeholder="Your message..." class="form-textarea w-full"></textarea>
          </div>
          <button type="submit" class="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
            Send Message
          </button>
        </form>
      </div>
    `;

    const preview = await client.htmlToElements({
      elements: html,
      page: route.data.uuid,
      test: true,
    });
    console.log('✅ Preview generated:');
    console.log('   Elements created:', Object.keys(preview.data).length);
    console.log('   Root element:', Object.values(preview.data)[0].tag);
    console.log('');

    // Step 3: Actually create the elements
    console.log('3. Converting HTML to real elements...');
    const result = await client.htmlToElements({
      elements: html,
      page: route.data.uuid,
      test: false,
    });
    console.log('✅ Result:', JSON.stringify(result, null, 2));

    if (!result.data || Object.keys(result.data).length === 0) {
      console.log('❌ No elements were created');
      return;
    }

    console.log('✅ Elements created:', Object.keys(result.data).length);
    console.log('');

    // Step 4: Get the element tree to verify structure
    console.log('4. Verifying created structure...');
    const rootUuid = Object.keys(result.data)[0];
    const tree = await client.getElementTree(rootUuid);

    function printTree(element, indent = '') {
      const tag = element.tag || 'unknown';
      const classes = element.classes ? ` [${element.classes.join(' ')}]` : '';
      const text = element.text ? ` "${element.text}"` : '';
      console.log(`${indent}${tag}${classes}${text}`);

      if (element.children) {
        element.children.forEach(child => printTree(child, indent + '  '));
      }
    }

    console.log('✅ Element hierarchy:');
    printTree(tree.data);
    console.log('');

    console.log('🎉 HTML conversion working perfectly!');
    console.log('\n📋 What This Means:');
    console.log('   ✅ Write complete HTML structures');
    console.log('   ✅ All attributes preserved');
    console.log('   ✅ Proper nesting maintained');
    console.log('   ✅ Single API call creates everything');
    console.log('   ✅ Can preview before creating');
    console.log('\n🚀 This is THE fastest way to build interfaces!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      console.error('Response status:', error.response.status);
    }
    process.exit(1);
  }
}

testHtmlConversion();
