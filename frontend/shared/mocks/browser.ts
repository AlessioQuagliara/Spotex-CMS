/**
 * MSW Browser Setup
 * Initialize MSW for browser environment
 */
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

// Setup worker for browser
export const worker = setupWorker(...handlers)
