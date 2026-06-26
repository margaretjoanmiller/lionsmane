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
		oauthAccessTokens: r.many.oauthAccessToken(),
		oauthClientsUserId: r.many.oauthClient({
			alias: "oauthClient_userId_user_id"
		}),
		oauthClientsViaOauthConsent: r.many.oauthClient({
			alias: "oauthClient_clientId_user_id_via_oauthConsent"
		}),
		oauthRefreshTokens: r.many.oauthRefreshToken(),
		passkeys: r.many.passkey(),
		sessions: r.many.session(),
		twoFactors: r.many.twoFactor(),
	},
	oauthAccessToken: {
		oauthClient: r.one.oauthClient({
			from: r.oauthAccessToken.clientId,
			to: r.oauthClient.clientId
		}),
		oauthRefreshToken: r.one.oauthRefreshToken({
			from: r.oauthAccessToken.refreshId,
			to: r.oauthRefreshToken.id
		}),
		session: r.one.session({
			from: r.oauthAccessToken.sessionId,
			to: r.session.id
		}),
		user: r.one.user({
			from: r.oauthAccessToken.userId,
			to: r.user.id
		}),
	},
	oauthClient: {
		oauthAccessTokens: r.many.oauthAccessToken(),
		user: r.one.user({
			from: r.oauthClient.userId,
			to: r.user.id,
			alias: "oauthClient_userId_user_id"
		}),
		users: r.many.user({
			from: r.oauthClient.clientId.through(r.oauthConsent.clientId),
			to: r.user.id.through(r.oauthConsent.userId),
			alias: "oauthClient_clientId_user_id_via_oauthConsent"
		}),
		oauthRefreshTokens: r.many.oauthRefreshToken(),
	},
	oauthRefreshToken: {
		oauthAccessTokens: r.many.oauthAccessToken(),
		oauthClient: r.one.oauthClient({
			from: r.oauthRefreshToken.clientId,
			to: r.oauthClient.clientId
		}),
		session: r.one.session({
			from: r.oauthRefreshToken.sessionId,
			to: r.session.id
		}),
		user: r.one.user({
			from: r.oauthRefreshToken.userId,
			to: r.user.id
		}),
	},
	session: {
		oauthAccessTokens: r.many.oauthAccessToken(),
		oauthRefreshTokens: r.many.oauthRefreshToken(),
		user: r.one.user({
			from: r.session.userId,
			to: r.user.id
		}),
	},
	passkey: {
		user: r.one.user({
			from: r.passkey.userId,
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