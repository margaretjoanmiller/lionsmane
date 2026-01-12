import { defineRelations } from 'drizzle-orm';
import * as schema from './schema';

export const relations = defineRelations(schema, (r) => ({
  account: {
    user: r.one.user({
      from: r.account.userId,
      to: r.user.id,
    }),
  },
  user: {
    accounts: r.many.account(),
    apikeys: r.many.apikey(),
    appliedRules: r.many.appliedRules(),
    folders: r.many.folders(),
    oauthApplicationsViaOauthAccessToken: r.many.oauthApplication(),
    oauthApplicationsUserId: r.many.oauthApplication(),
    oauthApplicationsViaOauthConsent: r.many.oauthApplication(),
    passkeys: r.many.passkey(),
    sessions: r.many.session(),
    subscriptions: r.many.subscriptions(),
    twoFactors: r.many.twoFactor(),
    userFilters: r.many.userFilters(),
  },
  apikey: {
    user: r.one.user({
      from: r.apikey.userId,
      to: r.user.id,
    }),
  },
  appliedRules: {
    article: r.one.articles({
      from: r.appliedRules.articleId,
      to: r.articles.id,
    }),
    userFilter: r.one.userFilters({
      from: r.appliedRules.ruleId,
      to: r.userFilters.id,
    }),
    user: r.one.user({
      from: r.appliedRules.userId,
      to: r.user.id,
    }),
  },
  articles: {
    appliedRules: r.many.appliedRules(),
    feed: r.one.feeds({
      from: r.articles.feedId,
      to: r.feeds.id,
    }),
    enclosures: r.many.enclosures(),
    userArticleStates: r.many.userArticleStates({
      from: r.articles.id,
      to: r.userArticleStates.articleId,
    }),
  },
  userFilters: {
    appliedRules: r.many.appliedRules(),
    user: r.one.user({
      from: r.userFilters.userId,
      to: r.user.id,
    }),
  },
  feeds: {
    articles: r.many.articles(),
    subscriptions: r.many.subscriptions(),
    icons: r.one.icons({
      from: r.feeds.icon,
      to: r.icons.id,
    }),
  },
  enclosures: {
    article: r.one.articles({
      from: r.enclosures.entryId,
      to: r.articles.minifluxId,
    }),
  },
  icons: {
    feedHosts: r.many.feeds(),
  },
  folders: {
    user: r.one.user({
      from: r.folders.userId,
      to: r.user.id,
    }),
    subscriptions: r.many.subscriptions(),
  },
  oauthAccessToken: {
    users: r.many.user({
      from: r.oauthAccessToken.userId,
      to: r.user.id,
    }),
  },
  oauthConsent: {
    users: r.many.user({
      from: r.oauthConsent.userId,
      to: r.user.id,
    }),
  },
  oauthApplication: {
    user: r.one.user({
      from: r.oauthApplication.userId,
      to: r.user.id,
    }),
  },
  passkey: {
    user: r.one.user({
      from: r.passkey.userId,
      to: r.user.id,
    }),
  },
  session: {
    user: r.one.user({
      from: r.session.userId,
      to: r.user.id,
    }),
  },
  subscriptions: {
    feed: r.one.feeds({
      from: r.subscriptions.feedId,
      to: r.feeds.id,
    }),
    folder: r.one.folders({
      from: r.subscriptions.folderId,
      to: r.folders.id,
    }),
    user: r.one.user({
      from: r.subscriptions.userId,
      to: r.user.id,
    }),
  },
  twoFactor: {
    user: r.one.user({
      from: r.twoFactor.userId,
      to: r.user.id,
    }),
  },
}));
