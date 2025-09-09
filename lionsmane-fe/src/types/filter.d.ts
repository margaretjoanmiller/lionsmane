export interface Conditions {
  keywords?: string[]; // Any keyword contains any of these
  titleContains?: string[]; // Title contains any of these
  contentContains?: string[]; // Content contains any of these
  authors?: string[]; // Author is any of these
  categories?: string[]; // Category is any of these
  feeds?: string[]; // Source feed is any of these
}
export interface FilterRule {
  id: string;
  conditions: Conditions;
  action: {
    type: 'blur' | 'hide' | 'markRead';
    contentWarning: string | undefined; // For blur action
  };
  isActive: boolean;
}
