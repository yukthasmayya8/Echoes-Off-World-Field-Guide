import { GuidedRouteFeature } from './GuidedRouteFeature';
import { defineFeature } from '../integration/featureTypes';

export default defineFeature({
  key: 'guidedRoute',
  component: GuidedRouteFeature,
  owner: 'Echoes core team',
});
