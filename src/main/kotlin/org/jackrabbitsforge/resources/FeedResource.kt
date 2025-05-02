/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
 */

package org.jackrabbitsforge.resources

import io.quarkus.logging.Log
import io.quarkus.security.Authenticated
import io.quarkus.security.identity.SecurityIdentity
import io.smallrye.mutiny.Uni
import io.vertx.mutiny.core.eventbus.EventBus
import jakarta.transaction.Transactional
import jakarta.validation.Valid
import jakarta.ws.rs.*
import jakarta.ws.rs.core.Response
import kotlinx.datetime.Clock
import kotlinx.datetime.DateTimeUnit
import kotlinx.datetime.TimeZone
import kotlinx.datetime.minus
import org.jackrabbitsforge.utils.checkUrl
import org.jackrabbitsforge.data.dto.ArticleOut
import org.jackrabbitsforge.data.dto.FeedDto
import org.jackrabbitsforge.data.dto.FeedIn
import org.jackrabbitsforge.data.entities.Feed
import org.jackrabbitsforge.data.repositories.FeedRepository
import java.time.Instant
import java.util.UUID

@Authenticated
@Transactional
@Path("/feeds")
class FeedResource(
    private var feedRepository: FeedRepository,
    private var identity: SecurityIdentity,
    private val eventBus: EventBus
) {

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
    fun postFeed(@Valid feed: FeedIn): Response {
        val newFeed = Feed()
        newFeed.title = feed.title
        newFeed.description = feed.description ?: ""
        newFeed.url = feed.url
        newFeed.userName = identity.principal.name
        val threeWeeksAgo = Clock.System.now().minus(3, DateTimeUnit.Companion.WEEK, TimeZone.Companion.UTC)
        newFeed.lastUpdated = Instant.parse(threeWeeksAgo.toString())

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
    fun updateFeed(id: UUID, feed: FeedDto): Response {
        val feedToUpdate = feedRepository.findByUUID(id)
        if (feedToUpdate == null) {
            return Response.status(404).build()
        }
        if (feedToUpdate.userName != identity.principal.name) {
            return Response.status(401).build()
        }
        feedToUpdate.title = feed.title ?: feedToUpdate.title
        feedToUpdate.url = feed.url ?: feedToUpdate.url
        feedToUpdate.description = feed.description ?: feedToUpdate.description
        return Response.ok(feedToUpdate.toDto()).status(200).build()
    }

    @DELETE
    @Path("/{id}")
    fun deleteFeed(id: UUID): Response {
        val feedToDelete = feedRepository.findByUUID(id)

        if (feedToDelete == null) {
            return Response.status(404).build()
        }
        if (feedToDelete.userName != identity.principal.name) {
            return Response.status(401).build()
        }
        try {
            feedRepository.deleteByUUID(id)
        } catch (e: Exception) {
            Log.error("Error deleting feed", e)
            return Response.serverError().build()
        }
        return Response.ok().status(200).build()
    }

    @GET
    @Path("/{id}")
    fun getFeed(id: UUID): FeedDto? {
        try {
            val feed = feedRepository.findByUUID(id)?.toDto()
            return feed
        } catch (e: Exception) {
            Log.error("Error getting feed", e)
            return null
        }
    }

    @GET
    @Path("/refresh/{id}")
    fun getFeedRefresh(id: UUID): Response {
        eventBus.publish("fetchArticles", id)
        return Response.accepted().build()
    }

    @GET
    @Path("/refresh/all")
    fun getAllFeedsRefresh(): Response {
        eventBus.publish("fetchAllArticles", "now")
        return Response.accepted().build()
    }
}
