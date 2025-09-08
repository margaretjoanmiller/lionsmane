export interface FilterRule {
  id: string;
  userId: string;
  name: string;
  priority: number;
  conditions: {
    keywords?: string[]; // Any keyword contains any of these
    titleContains?: string[]; // Title contains any of these
    contentContains?: string[]; // Content contains any of these
    authors?: string[]; // Author is any of these
    categories?: string[]; // Category is any of these
    feeds?: string[]; // Source feed is any of these
  };
  action: {
    type: 'blur' | 'markRead' | 'hide';
    contentWarning?: string; // For blur action
  };
  enabled: boolean;
}
