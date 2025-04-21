/*
 * Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
 */

package org.jackrabbitsforge.feeds

import io.quarkus.logging.Log
import io.quarkus.security.Authenticated
import io.quarkus.security.identity.SecurityIdentity
import io.smallrye.mutiny.Uni
import io.vertx.mutiny.core.eventbus.EventBus
import jakarta.transaction.Transactional
import jakarta.ws.rs.*
import jakarta.ws.rs.core.Response
import kotlinx.datetime.Clock
import kotlinx.datetime.DateTimeUnit
import kotlinx.datetime.TimeZone
import kotlinx.datetime.minus
import org.jackrabbitsforge.data.dto.ArticleOut
import org.jackrabbitsforge.data.dto.FeedDto
import org.jackrabbitsforge.data.entities.Feed
import org.jackrabbitsforge.data.repositories.FeedRepository
import java.net.URI
import java.net.URL
import java.time.OffsetDateTime

@Authenticated
@Transactional
@Path("feeds")
class FeedResource(
    private var feedRepository: FeedRepository,
    private var identity: SecurityIdentity,
    private val eventBus: EventBus
) {

    fun checkUrl(url: String): URL {
        try {
            val newUrl = URI.create(url).toURL()
            return newUrl
        } catch (e: Exception) {
            Log.warn("Invalid url", e)
            throw e
        }
    }

    @GET
    fun listFeeds(): List<FeedDto> {
        try {
            val feedDtos = feedRepository.listAll()
                .filter { f -> f.userName == identity.principal.name }
                .map { f -> f.toDto() }
            return feedDtos
        } catch (e: Exception) {
            Log.error("Error listing feeds", e)
            throw e
        }
    }

    @POST
    fun postFeed(feed: FeedDto): Response {
        val newFeed = Feed()
        newFeed.title = feed.title ?: ""
        newFeed.description = feed.description ?: ""
        if (feed.url == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity("URL is required").build()
        }
        newFeed.url = checkUrl(feed.url)
        newFeed.userName = identity.principal.name
        val threeWeeksAgo = Clock.System.now().minus(3, DateTimeUnit.Companion.WEEK, TimeZone.Companion.UTC)
        newFeed.lastUpdated = OffsetDateTime.parse(threeWeeksAgo.toString())

        try {
            feedRepository.persist(newFeed)
            Log.info("Created new feed with id: ${newFeed.id}")
            return Response.ok(newFeed.toDto()).status(Response.Status.CREATED).build()
        } catch (e: Exception) {
            Log.error("Error creating feed", e)
            return Response.serverError().build()
        }
    }

    @PUT
    @Path("/{id}")
    fun updateFeed(id: Long, feed: FeedDto): Response {
        val feedToUpdate = feedRepository.findById(id)
        if (feedToUpdate == null) {
            return Response.status(404).build()
        }
        if (feedToUpdate.userName != identity.principal.name) {
            return Response.status(401).build()
        }
        feedToUpdate.title = feed.title ?: feedToUpdate.title
        if (feed.url != null) {
            feedToUpdate.url = checkUrl(feed.url)
        }
        feedToUpdate.description = feed.description ?: feedToUpdate.description
        return Response.ok(feedToUpdate.toDto()).status(200).build()
    }

    @DELETE
    @Path("/{id}")
    fun deleteFeed(id: Long): Response {
        val feedToDelete = feedRepository.findById(id)

        if (feedToDelete == null) {
            return Response.status(404).build()
        }
        if (feedToDelete.userName != identity.principal.name) {
            return Response.status(401).build()
        }
        try {
            feedRepository.deleteById(id)
        } catch (e: Exception) {
            Log.error("Error deleting feed", e)
            return Response.serverError().build()
        }
        return Response.ok().status(200).build()
    }

    @GET
    @Path("/{id}")
    fun getFeed(id: Long): FeedDto? {
        try {
            val feed = feedRepository.findById(id)?.toDto()
            return feed
        } catch (e: Exception) {
            Log.error("Error getting feed", e)
            return null
        }
    }

    @GET
    @Path("/refresh/{id}")
    fun getFeedRefresh(id: Long): Uni<List<ArticleOut>> {
        return eventBus.request<List<ArticleOut>>("fetchArticles", id).onItem().transform { it.body() }
    }
}