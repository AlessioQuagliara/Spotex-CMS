// ***********************************************************
// This support file is processed and loaded automatically before test files.
// ***********************************************************

import './commands';

// Hide fetch/XHR requests from command log
Cypress.on('window:before:load', (win) => {
  // @ts-ignore
  win.fetch = null;
});

// Prevent uncaught exceptions from failing tests
Cypress.on('uncaught:exception', (err, runnable) => {
  // Return false to prevent failing the test
  return false;
});
