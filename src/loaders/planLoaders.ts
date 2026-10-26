import DataLoader from 'dataloader';
import { GraphQLError } from 'graphql';
import type { BackendClient } from '../clients/backendClient.js';
import { planApi, type BackendPlan } from '../clients/planApi.js';
import { userApi, type BackendPlanExercise, type BackendUserExport } from '../clients/userApi.js';

export interface PlanLoaders {
  exercisesByPlan: DataLoader<string, BackendPlanExercise[]>;
  planById: DataLoader<string, BackendPlan>;
}

const notFound = () =>
  new GraphQLError('Plan not found.', { extensions: { code: 'NOT_FOUND', status: 404 } });

// Die Loader leben pro Anfrage (siehe context.ts). Sie sammeln alle Plan-IDs, die in einem Durchlauf
// gebraucht werden, und beantworten sie gemeinsam. Bei mehreren Plänen genügt ein einziger Aufruf
// von GET /users/me/export statt eines Aufrufs pro Plan (löst das N+1-Problem).
export function createPlanLoaders(backend: BackendClient): PlanLoaders {
  let exportPromise: Promise<BackendUserExport> | undefined;
  const loadExport = () => (exportPromise ??= userApi.exportMyData(backend));

  async function loadMany<T>(
    ids: readonly string[],
    single: (id: string) => Promise<T>,
    pick: (plan: BackendUserExport['plans'][number]) => T,
  ): Promise<(T | Error)[]> {
    if (ids.length === 1) return [await single(ids[0]!)];

    const { plans } = await loadExport();
    const byId = new Map(plans.map((plan) => [String(plan.id), plan]));
    return ids.map((id) => {
      const plan = byId.get(id);
      return plan ? pick(plan) : notFound();
    });
  }

  return {
    exercisesByPlan: new DataLoader((ids) =>
      loadMany(
        ids,
        (id) => planApi.listExercises(backend, id),
        (plan) => plan.exercises,
      ),
    ),
    planById: new DataLoader((ids) =>
      loadMany(
        ids,
        (id) => planApi.get(backend, id),
        (plan) => plan,
      ),
    ),
  };
}
