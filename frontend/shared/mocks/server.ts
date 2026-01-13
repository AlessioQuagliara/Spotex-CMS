/**
 * MSW Node Setup
 * Initialize MSW for Node.js environment (testing)
 */
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Setup server for Node.js (testing)
export const server = setupServer(...handlers)
