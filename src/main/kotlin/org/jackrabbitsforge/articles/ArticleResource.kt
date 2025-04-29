/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
 */

package org.jackrabbitsforge.articles

import io.quarkus.logging.Log
import io.quarkus.security.Authenticated
import io.quarkus.security.identity.SecurityIdentity
import jakarta.ws.rs.GET
import jakarta.ws.rs.Path
import org.jackrabbitsforge.data.dto.ArticleOut
import org.jackrabbitsforge.data.repositories.ArticleRepository
import org.jackrabbitsforge.data.repositories.FeedRepository
import java.util.UUID

@Authenticated
@Path("/articles")
class ArticleResource(
    private var articleRepository: ArticleRepository,
    private var feedRepository: FeedRepository,
    private var identity: SecurityIdentity,
) {

    @GET
    @Path("/{id}")
    fun getArticle(id: UUID): ArticleOut {
        try {
            val articleOut = articleRepository.findByUUID(id)
            return articleOut?.toDto() ?: throw Exception("Article not found")
        } catch (e: Exception) {
            Log.error("Error getting article", e)
            throw e
        }
    }

    @GET
    @Path("/feed/{feedId}")
    fun getArticlesForFeed(feedId: UUID): List<ArticleOut> {
        try {
            val articlesOut = articleRepository.findByFeedId(feedId)
            return articlesOut.map { it.toDto() }
        } catch (e: Exception) {
            Log.error("Error getting articles for feed", e)
            throw e
        }
    }

    @GET
    fun getAllArticles(): List<ArticleOut> {
        try {
            val articlesOut = articleRepository.listAll()
            return articlesOut.map { it.toDto() }
        } catch (e: Exception) {
            Log.error("Error getting articles", e)
            throw e
        }
    }
}