import { default as cors } from './cors';
import { createConcurrencyLimit } from './concurrency';
import { checkCallQuotas } from './quotas';

const concurrencyLimit = createConcurrencyLimit([
  {
    path: '/lineups/team',
    methods: ['GET'],
    maxConcurrent: 2,
    leaseMs: 75000,
  },
]);

export default {
  standard: [concurrencyLimit, checkCallQuotas],
  concurrencyLimit,
  cors,
  checkCallQuotas,
};
