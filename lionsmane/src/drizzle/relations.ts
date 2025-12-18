import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
	account: {
		user: r.one.user({
			from: r.account.userId,
			to: r.user.id
		}),
	},
	user: {
		accounts: r.many.account(),
		apikeys: r.many.apikey(),
		appliedRules: r.many.appliedRules(),
		folders: r.many.folders(),
		oauthApplicationsViaOauthAccessToken: r.many.oauthApplication({
			alias: "oauthApplication_id_user_id_via_oauthAccessToken"
		}),
		oauthApplicationsUserId: r.many.oauthApplication({
			alias: "oauthApplication_userId_user_id"
		}),
		oauthApplicationsViaOauthConsent: r.many.oauthApplication({
			alias: "oauthApplication_id_user_id_via_oauthConsent"
		}),
		passkeys: r.many.passkey(),
		sessions: r.many.session(),
		subscriptions: r.many.subscriptions(),
		twoFactors: r.many.twoFactor(),
		articles: r.many.articles(),
		userFilters: r.many.userFilters(),
	},
	apikey: {
		user: r.one.user({
			from: r.apikey.userId,
			to: r.user.id
		}),
	},
	appliedRules: {
		article: r.one.articles({
			from: r.appliedRules.articleId,
			to: r.articles.id
		}),
		userFilter: r.one.userFilters({
			from: r.appliedRules.ruleId,
			to: r.userFilters.id
		}),
		user: r.one.user({
			from: r.appliedRules.userId,
			to: r.user.id
		}),
	},
	articles: {
		appliedRules: r.many.appliedRules(),
		feed: r.one.feeds({
			from: r.articles.feedId,
			to: r.feeds.id
		}),
		enclosures: r.many.enclosures(),
		users: r.many.user({
			from: r.articles.id.through(r.userArticleStates.articleId),
			to: r.user.id.through(r.userArticleStates.userId)
		}),
	},
	userFilters: {
		appliedRules: r.many.appliedRules(),
		user: r.one.user({
			from: r.userFilters.userId,
			to: r.user.id
		}),
	},
	feeds: {
		articles: r.many.articles(),
		subscriptions: r.many.subscriptions(),
	},
	enclosures: {
		article: r.one.articles({
			from: r.enclosures.entryId,
			to: r.articles.minifluxId
		}),
	},
	feedHost: {
		icons: r.many.icons({
			from: r.feedHost.id.through(r.feeds.feedHost),
			to: r.icons.id.through(r.feeds.icon)
		}),
	},
	icons: {
		feedHosts: r.many.feedHost(),
	},
	folders: {
		user: r.one.user({
			from: r.folders.userId,
			to: r.user.id
		}),
		subscriptions: r.many.subscriptions(),
	},
	oauthApplication: {
		usersViaOauthAccessToken: r.many.user({
			from: r.oauthApplication.clientId.through(r.oauthAccessToken.clientId),
			to: r.user.id.through(r.oauthAccessToken.userId),
			alias: "oauthApplication_clientId_user_id_via_oauthAccessToken"
		}),
		user: r.one.user({
			from: r.oauthApplication.userId,
			to: r.user.id,
			alias: "oauthApplication_userId_user_id"
		}),
		usersViaOauthConsent: r.many.user({
			from: r.oauthApplication.clientId.through(r.oauthConsent.clientId),
			to: r.user.id.through(r.oauthConsent.userId),
			alias: "oauthApplication_clientId_user_id_via_oauthConsent"
		}),
	},
	passkey: {
		user: r.one.user({
			from: r.passkey.userId,
			to: r.user.id
		}),
	},
	session: {
		user: r.one.user({
			from: r.session.userId,
			to: r.user.id
		}),
	},
	subscriptions: {
		feed: r.one.feeds({
			from: r.subscriptions.feedId,
			to: r.feeds.id
		}),
		folder: r.one.folders({
			from: r.subscriptions.folderId,
			to: r.folders.id
		}),
		user: r.one.user({
			from: r.subscriptions.userId,
			to: r.user.id
		}),
	},
	twoFactor: {
		user: r.one.user({
			from: r.twoFactor.userId,
			to: r.user.id
		}),
	},
}))