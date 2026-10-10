import type { DirectMessagePreview, StoryItem } from '../types';

// Right-side column content. Both lists are empty until stories and messaging are connected.
// When BOTH are empty the whole right column is hidden. When the content service exists,
// return people-you-follow stories first and your recent DMs from here.
export function useRailContent(): { stories: StoryItem[]; dms: DirectMessagePreview[] } {
  return { stories: [], dms: [] };
}
