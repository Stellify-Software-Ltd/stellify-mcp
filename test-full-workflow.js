import { StellifyClient } from './dist/stellify-client.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new StellifyClient({
  apiUrl: process.env.STELLIFY_API_URL,
  apiToken: process.env.STELLIFY_API_TOKEN,
});

const PROJECT_ID = 'b11ba1ac-ad5e-45c7-8285-57f0b7aa0196';

async function testFullWorkflow() {
  console.log('Testing Full Element Workflow: Create → Update with Attributes\n');

  try {
    // Step 1: Create route
    console.log('1. Creating test route...');
    const timestamp = Date.now();
    const route = await client.createRoute({
      project_id: PROJECT_ID,
      name: `Contact Form ${timestamp}`,
      path: `/contact-${timestamp}`,
      method: 'GET',
      type: 'web',
    });
    console.log('✅ Route created:', route.data.uuid);
    console.log('');

    // Step 2: Create form wrapper
    console.log('2. Creating form wrapper (s-form)...');
    const form = await client.createElement({
      page: route.data.uuid,
      type: 's-form',
    });
    console.log('✅ Form created:', form.data.uuid);
    console.log('');

    // Step 3: Update form with attributes
    console.log('3. Updating form with HTML attributes...');
    const updatedForm = await client.updateElement(form.data.uuid, {
      name: 'Contact Form',
      tag: 'form',
      method: 'POST',
      action: '/api/contact',
      classes: ['space-y-4', 'max-w-md', 'mx-auto'],
    });
    console.log('✅ Form updated with attributes');
    console.log('   Form data:', JSON.stringify(updatedForm.data, null, 2));
    console.log('');

    // Step 4: Create email input
    console.log('4. Creating email input (s-input)...');
    const emailInput = await client.createElement({
      parent: form.data.uuid,
      type: 's-input',
    });
    console.log('✅ Email input created:', emailInput.data.uuid);
    console.log('');

    // Step 5: Update email input with full attributes
    console.log('5. Configuring email input with HTML attributes...');
    const updatedEmail = await client.updateElement(emailInput.data.uuid, {
      name: 'Email Field',
      tag: 'input',
      type: 'email',
      placeholder: 'Enter your email',
      required: true,
      classes: ['form-input', 'w-full', 'px-4', 'py-2', 'border', 'rounded'],
    });
    console.log('✅ Email input configured');
    console.log('   Input data:', JSON.stringify(updatedEmail.data, null, 2));
    console.log('');

    // Step 6: Create submit button
    console.log('6. Creating submit button (s-wrapper)...');
    const button = await client.createElement({
      parent: form.data.uuid,
      type: 's-wrapper',
    });
    console.log('✅ Button created:', button.data.uuid);
    console.log('');

    // Step 7: Update button with attributes
    console.log('7. Configuring button with HTML attributes...');
    const updatedButton = await client.updateElement(button.data.uuid, {
      name: 'Submit Button',
      tag: 'button',
      type: 'submit',
      text: 'Send Message',
      classes: ['bg-blue-500', 'text-white', 'px-6', 'py-2', 'rounded', 'hover:bg-blue-600'],
    });
    console.log('✅ Button configured');
    console.log('   Button data:', JSON.stringify(updatedButton.data, null, 2));
    console.log('');

    console.log('🎉 Full workflow test complete!');
    console.log('\n📋 Summary:');
    console.log(`  Route: ${route.data.uuid} (${route.data.path})`);
    console.log(`  Form: ${form.data.uuid}`);
    console.log(`  Email Input: ${emailInput.data.uuid}`);
    console.log(`  Submit Button: ${button.data.uuid}`);
    console.log('\n✨ Successfully built a complete contact form with:');
    console.log('   - Form wrapper with POST action');
    console.log('   - Email input with validation');
    console.log('   - Submit button with styling');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      console.error('Response status:', error.response.status);
    }
    process.exit(1);
  }
}

testFullWorkflow();
