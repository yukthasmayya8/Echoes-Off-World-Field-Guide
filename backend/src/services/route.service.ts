import type { GuidedRoute, GuidedRouteListResult } from '@echoes/shared';
import type { Dataset } from '../data';

export class RouteService {
  constructor(private readonly dataset: Dataset) {}

  list(): GuidedRouteListResult {
    return {
      count: this.dataset.routes.length,
      routes: this.dataset.routes,
    };
  }

  getBySlug(slug: string): GuidedRoute | undefined {
    return this.dataset.routesBySlug.get(slug);
  }
}
