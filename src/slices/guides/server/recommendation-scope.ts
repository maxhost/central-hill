export interface GuideRecommendationScope { cityIds: readonly string[] }
export function normalizedRecommendationScope(scope?: GuideRecommendationScope): string[] | undefined {
  return scope ? [...new Set(scope.cityIds)].sort() : undefined;
}
export function recommendationScopeKey(scope?: GuideRecommendationScope): string {
  const ids = normalizedRecommendationScope(scope);
  return ids === undefined ? "global" : JSON.stringify(ids);
}
