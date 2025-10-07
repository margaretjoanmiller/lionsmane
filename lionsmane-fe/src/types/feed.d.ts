import { feedSchema } from 'lionsmane-common';
import { z } from 'zod';

const subscriptionSchema = feedSchema
  .extend({
    description: z.string().min(1).max(255).optional(),
  })
  .omit({
    minifluxId: true,
  });

export type Feed = z.infer<typeof subscriptionSchema>;

export interface FeedTreeData {
  id: string;
  name: string;
  unreadCount: number | null;
  favicon: string | null;
  folderId: string | null;
  type: 'feed' | 'folder';
  children?: Array<FeedTreeData>;
}
