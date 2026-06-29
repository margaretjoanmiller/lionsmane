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
  userId: string;
  conditions: Conditions;
  action: {
    type: 'blur' | 'hide' | 'markRead';
    contentWarning: string | null; // For blur action
  };
  enabled: boolean;
}

export interface AppliedRules {
  id: string;
  userId: string;
  articleId: string;
  ruleId: string;
  action: 'blur' | 'markRead' | 'hide';
  contentWarning: string | null; // For blur action
  appliedAt: Date;
}
