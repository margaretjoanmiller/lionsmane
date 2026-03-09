import { defineRelations } from 'drizzle-orm';
import * as schema from './schema';

export const relations = defineRelations(schema, (r) => ({
  user: {
    sessions: r.many.session({
      from: r.user.id,
      to: r.session.userId,
    }),
    accounts: r.many.account({
      from: r.user.id,
      to: r.account.userId,
    }),
    passkeys: r.many.passkey({
      from: r.user.id,
      to: r.passkey.userId,
    }),
    twoFactors: r.many.twoFactor({
      from: r.user.id,
      to: r.twoFactor.userId,
    }),
    oauthApplications: r.many.oauthApplication({
      from: r.user.id,
      to: r.oauthApplication.userId,
    }),
    oauthAccessTokens: r.many.oauthAccessToken({
      from: r.user.id,
      to: r.oauthAccessToken.userId,
    }),
    oauthConsents: r.many.oauthConsent({
      from: r.user.id,
      to: r.oauthConsent.userId,
    }),
    appliedRules: r.many.appliedRules(),
    folders: r.many.folders(),
    subscriptions: r.many.subscriptions(),
    userFilters: r.many.userFilters(),
  },
  session: {
    user: r.one.user({
      from: r.session.userId,
      to: r.user.id,
    }),
  },
  account: {
    user: r.one.user({
      from: r.account.userId,
      to: r.user.id,
    }),
  },
  passkey: {
    user: r.one.user({
      from: r.passkey.userId,
      to: r.user.id,
    }),
  },
  twoFactor: {
    user: r.one.user({
      from: r.twoFactor.userId,
      to: r.user.id,
    }),
  },
  oauthApplication: {
    user: r.one.user({
      from: r.oauthApplication.userId,
      to: r.user.id,
    }),
    oauthAccessTokens: r.many.oauthAccessToken({
      from: r.oauthApplication.id,
      to: r.oauthAccessToken.clientId,
    }),
    oauthConsents: r.many.oauthConsent({
      from: r.oauthApplication.id,
      to: r.oauthConsent.clientId,
    }),
  },
  oauthAccessToken: {
    oauthApplication: r.one.oauthApplication({
      from: r.oauthAccessToken.clientId,
      to: r.oauthApplication.clientId,
    }),
    user: r.one.user({
      from: r.oauthAccessToken.userId,
      to: r.user.id,
    }),
  },
  oauthConsent: {
    oauthApplication: r.one.oauthApplication({
      from: r.oauthConsent.clientId,
      to: r.oauthApplication.clientId,
    }),
    user: r.one.user({
      from: r.oauthConsent.userId,
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
}));
