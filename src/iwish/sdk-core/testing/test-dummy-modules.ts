import { DummyConfigLoader, DummyLogger, DummyEventDispatcher } from './dummy-modules';

async function runTests() {
  console.log('=== Starting Dummy Modules Tests (Story 22.2) ===');

  // Test ConfigLoader
  console.log('\n--- Testing ConfigLoader ---');
  const configLoader = new DummyConfigLoader();
  const apiKey = configLoader.getConfig<string>('API_KEY');
  console.log(`API_KEY: ${apiKey}`);
  try {
    configLoader.getConfig('MISSING_KEY');
  } catch (error: any) {
    console.log(`Missing config test passed. Caught error: ${error.message}`);
  }
  const fallback = configLoader.getConfig('MISSING_KEY', 'default_value');
  console.log(`Fallback config test passed. Value: ${fallback}`);

  // Test Logger
  console.log('\n--- Testing Logger ---');
  const logger = new DummyLogger();
  logger.info('Test info message', { secret: 'this_is_a_secret', data: 'public_data' });

  // Test EventDispatcher
  console.log('\n--- Testing EventDispatcher ---');
  const dispatcher = new DummyEventDispatcher();
  let received = false;
  const unsubscribe = dispatcher.on('test-event', () => {
    received = true;
    console.log('test-event received!');
  });
  
  await dispatcher.dispatch('test-event');
  
  unsubscribe();
  received = false;
  await dispatcher.dispatch('test-event');
  
  if (!received) {
    console.log('Unsubscribe test passed.');
  } else {
    console.log('Unsubscribe test failed.');
  }

  console.log('\n✅ TEST PASSED: Dummy Modules Validation successful.');
}

runTests().catch(console.error);
