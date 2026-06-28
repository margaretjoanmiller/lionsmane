import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  account: {
    user: r.one.user({
      from: r.account.userId,
      to: r.user.id,
    }),
  },
  user: {
    accounts: r.many.account(),
    oauthAccessTokens: r.many.oauthAccessToken(),
    oauthClientsUserId: r.many.oauthClient({
      alias: "oauthClient_userId_user_id",
    }),
    oauthClientsViaOauthConsent: r.many.oauthClient({
      alias: "oauthClient_clientId_user_id_via_oauthConsent",
    }),
    oauthRefreshTokens: r.many.oauthRefreshToken(),
    passkeys: r.many.passkey(),
    sessions: r.many.session(),
    twoFactors: r.many.twoFactor(),
    appliedRules: r.many.appliedRules(),
    folders: r.many.folders(),
    subscriptions: r.many.subscriptions(),
    userFilters: r.many.userFilters(),
  },
  oauthAccessToken: {
    oauthClient: r.one.oauthClient({
      from: r.oauthAccessToken.clientId,
      to: r.oauthClient.clientId,
    }),
    oauthRefreshToken: r.one.oauthRefreshToken({
      from: r.oauthAccessToken.refreshId,
      to: r.oauthRefreshToken.id,
    }),
    session: r.one.session({
      from: r.oauthAccessToken.sessionId,
      to: r.session.id,
    }),
    user: r.one.user({
      from: r.oauthAccessToken.userId,
      to: r.user.id,
    }),
  },
  oauthClient: {
    oauthAccessTokens: r.many.oauthAccessToken(),
    user: r.one.user({
      from: r.oauthClient.userId,
      to: r.user.id,
      alias: "oauthClient_userId_user_id",
    }),
    users: r.many.user({
      from: r.oauthClient.clientId.through(r.oauthConsent.clientId),
      to: r.user.id.through(r.oauthConsent.userId),
      alias: "oauthClient_clientId_user_id_via_oauthConsent",
    }),
    oauthRefreshTokens: r.many.oauthRefreshToken(),
  },
  oauthRefreshToken: {
    oauthAccessTokens: r.many.oauthAccessToken(),
    oauthClient: r.one.oauthClient({
      from: r.oauthRefreshToken.clientId,
      to: r.oauthClient.clientId,
    }),
    session: r.one.session({
      from: r.oauthRefreshToken.sessionId,
      to: r.session.id,
    }),
    user: r.one.user({
      from: r.oauthRefreshToken.userId,
      to: r.user.id,
    }),
  },
  session: {
    oauthAccessTokens: r.many.oauthAccessToken(),
    oauthRefreshTokens: r.many.oauthRefreshToken(),
    user: r.one.user({
      from: r.session.userId,
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
