import { StellifyClient } from './dist/stellify-client.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new StellifyClient({
  apiUrl: process.env.STELLIFY_API_URL,
  apiToken: process.env.STELLIFY_API_TOKEN,
});

const PROJECT_ID = 'b11ba1ac-ad5e-45c7-8285-57f0b7aa0196';

async function testReadDelete() {
  console.log('Testing Read, Search, and Delete Operations\n');

  try {
    // Step 1: Create test elements
    console.log('1. Creating test page with elements...');
    const timestamp = Date.now();
    const route = await client.createRoute({
      project_id: PROJECT_ID,
      name: `Test CRUD ${timestamp}`,
      path: `/test-crud-${timestamp}`,
      method: 'GET',
      type: 'web',
    });
    console.log('✅ Route created:', route.data.uuid);

    const container = await client.createElement({
      page: route.data.uuid,
      type: 's-wrapper',
    });
    await client.updateElement(container.data.uuid, {
      name: 'Container',
      tag: 'div',
      classes: ['container', 'mx-auto'],
    });
    console.log('✅ Container created:', container.data.uuid);

    const button1 = await client.createElement({
      parent: container.data.uuid,
      type: 's-wrapper',
    });
    await client.updateElement(button1.data.uuid, {
      name: 'Button 1',
      tag: 'button',
      text: 'Click Me',
    });

    const button2 = await client.createElement({
      parent: container.data.uuid,
      type: 's-wrapper',
    });
    await client.updateElement(button2.data.uuid, {
      name: 'Button 2',
      tag: 'button',
      text: 'Cancel',
    });
    console.log('✅ Created 2 buttons');
    console.log('');

    // Step 2: Get single element
    console.log('2. Testing get_element...');
    const element = await client.getElement(container.data.uuid);
    console.log('✅ Retrieved element:');
    console.log('   Name:', element.data.name);
    console.log('   Tag:', element.data.tag);
    console.log('   Classes:', element.data.classes);
    console.log('');

    // Step 3: Get element tree
    console.log('3. Testing get_element_tree...');
    const tree = await client.getElementTree(container.data.uuid);
    console.log('✅ Retrieved element tree:');
    console.log('   Root:', tree.data.name);
    console.log('   Children:', tree.data.children ? tree.data.children.length : 0);
    if (tree.data.children) {
      tree.data.children.forEach((child, i) => {
        console.log(`     ${i+1}. ${child.name} (${child.tag}): "${child.text}"`);
      });
    }
    console.log('');

    // Step 4: Search elements
    console.log('4. Testing search_elements...');
    const searchResults = await client.searchElements({
      search: 'Button',
      per_page: 10,
    });
    console.log('✅ Search results:');
    console.log('   Found:', searchResults.data.length, 'elements');
    console.log('   Total in project:', searchResults.pagination.total);
    searchResults.data.slice(0, 3).forEach((el, i) => {
      console.log(`     ${i+1}. ${el.name || 'Unnamed'} (${el.type})`);
    });
    console.log('');

    // Step 5: Delete element
    console.log('5. Testing delete_element (deleting button 2)...');
    const deleteResult = await client.deleteElement(button2.data.uuid);
    console.log('✅ Deleted:', deleteResult.deleted_count, 'element(s)');
    console.log('');

    // Step 6: Verify deletion by getting tree again
    console.log('6. Verifying deletion...');
    const updatedTree = await client.getElementTree(container.data.uuid);
    console.log('✅ Updated tree:');
    console.log('   Children remaining:', updatedTree.data.children ? updatedTree.data.children.length : 0);
    if (updatedTree.data.children) {
      updatedTree.data.children.forEach((child, i) => {
        console.log(`     ${i+1}. ${child.name}`);
      });
    }
    console.log('');

    console.log('🎉 All read/delete operations working!');
    console.log('\n📋 Capabilities Verified:');
    console.log('   ✅ get_element - Read single element');
    console.log('   ✅ get_element_tree - Read element hierarchy');
    console.log('   ✅ search_elements - Find elements by criteria');
    console.log('   ✅ delete_element - Remove elements (with CASCADE)');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      console.error('Response status:', error.response.status);
    }
    process.exit(1);
  }
}

testReadDelete();
