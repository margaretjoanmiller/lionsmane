/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
 */

package org.jackrabbitsforge.resources

import io.quarkus.logging.Log
import io.quarkus.security.Authenticated
import jakarta.transaction.Transactional
import jakarta.validation.Valid
import jakarta.ws.rs.GET
import jakarta.ws.rs.PATCH
import jakarta.ws.rs.Path
import org.hibernate.HibernateException
import org.jackrabbitsforge.data.dto.ArticleOut
import org.jackrabbitsforge.data.repositories.ArticleRepository
import java.util.*

class ArticleNotFoundException : Exception("Article not found")

@Authenticated
@Path("/articles")
class ArticleResource(
    private var articleRepository: ArticleRepository,
) {

    @GET
    @Path("/{id}")
    fun getArticle(id: UUID): ArticleOut {
        try {
            val articleOut = articleRepository.findByUUID(id)

            val feedId = articleOut?.feed?.id
            if (feedId == null) {
                Log.error("Orphaned article, could not find feed")
                throw Error("Orphaned article, could not find feed")
            }

            return articleOut.toDto()
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
            return articlesOut.map {
                val feedId = it.feed.id
                if (feedId == null) {
                    Log.error("Orphaned article, could not find feed")
                    throw Error("Orphaned article, could not find feed")
                }
                it.toDto()
            }
        } catch (e: Exception) {
            Log.error("Error getting articles", e)
            throw e
        }
    }

    data class ArticleUpdateReq(
        val read: Boolean? = null,
        val starred: Boolean? = null
    )

    @PATCH
    @Path("/{id}")
    @Transactional
    fun updateArticle(id: UUID, @Valid articleUpdate: ArticleUpdateReq) {
        if (articleUpdate.read != null) {
            try {
                val articleOut = articleRepository.findByUUID(id) ?: throw ArticleNotFoundException()
                articleOut.read = articleUpdate.read

                articleRepository.persistAndFlush(articleOut)
            } catch (e: HibernateException) {
                Log.error("Error updating article at database", e)
                throw e
            }
        } else if (articleUpdate.starred != null) {
            try {
                val articleOut = articleRepository.findByUUID(id) ?: throw ArticleNotFoundException()
                articleOut.starred = articleUpdate.starred

                articleRepository.persistAndFlush(articleOut)
            } catch (e: HibernateException) {
                Log.error("Error updating article at database", e)
                throw e
            }
        }
    }
}