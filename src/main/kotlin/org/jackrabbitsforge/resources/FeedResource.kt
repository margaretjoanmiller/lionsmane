/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
 */

package org.jackrabbitsforge.resources

import io.quarkus.logging.Log
import io.quarkus.security.Authenticated
import io.quarkus.security.identity.SecurityIdentity
import io.vertx.mutiny.core.eventbus.EventBus
import jakarta.transaction.Transactional
import jakarta.validation.Valid
import jakarta.ws.rs.*
import jakarta.ws.rs.core.Response
import kotlinx.datetime.Clock
import kotlinx.datetime.DateTimeUnit
import kotlinx.datetime.TimeZone
import kotlinx.datetime.minus
import org.jackrabbitsforge.data.dto.FeedDto
import org.jackrabbitsforge.data.dto.FeedIn
import org.jackrabbitsforge.data.dto.FeedInUpdate
import org.jackrabbitsforge.data.entities.Feed
import org.jackrabbitsforge.data.repositories.ArticleRepository
import org.jackrabbitsforge.data.repositories.FeedRepository
import org.jackrabbitsforge.data.repositories.FolderRepository
import java.time.Instant
import java.util.UUID

@Authenticated
@Transactional
@Path("/feeds")
class FeedResource(
    private var feedRepository: FeedRepository,
    private var folderRepository: FolderRepository,
    private var articleRepository: ArticleRepository,
    private var identity: SecurityIdentity,
    private val eventBus: EventBus,
) {

    @GET
    fun listFeeds(): List<FeedDto> {
        try {
            val feedDtos = feedRepository.listAll()
                .filter { f -> f.userName == identity.principal.name }
                .map { f -> f.toDto() }
            val feedDtoWithUnread = feedDtos.map{
                f -> f.numberUnread = articleRepository.getUnreadCount(f.id!!)
                f
            }
            return feedDtoWithUnread
        } catch (e: Exception) {
            Log.error("Error listing feeds", e)
            throw e
        }
    }

    @POST
    fun postFeed(@Valid feed: FeedIn): Response {
        val existingFeedName = feedRepository.findByName(feed.title)
        if (existingFeedName != null) {
            return Response.status(409).build()
        }
        val existingFeedUrl = feedRepository.findByUrl(feed.url)
        if (existingFeedUrl != null) {
            return Response.status(409).build()
        }

        val newFeed = Feed()
        newFeed.title = feed.title
        newFeed.description = feed.description ?: ""
        newFeed.url = feed.url
        newFeed.userName = identity.principal.name
        val threeWeeksAgo = Clock.System.now().minus(3, DateTimeUnit.Companion.WEEK, TimeZone.Companion.UTC)
        newFeed.lastUpdated = Instant.parse(threeWeeksAgo.toString())
        feedRepository.persist(newFeed)

        val folderId = feed.folderId
        if (folderId != null) {
            try {
                val folderToFileInto = folderRepository.findByUUID(folderId)
                if (folderToFileInto == null)
                    return Response.status(404).build()
                if (folderToFileInto.userName != identity.principal.name)
                    return Response.status(404).build()
                newFeed.folder = folderToFileInto
            } catch (e: Exception) {
                Log.error("User tried to update feed with non-existent folder")
                return Response.status(422).build()
            }
        }

        Log.info("Created new feed with id: ${newFeed.id}")
        return Response.ok(newFeed.toDto()).status(Response.Status.CREATED).build()
    }

    @POST
    @Path("/update/{id}")
    fun updateFeed(id: UUID, @Valid feed: FeedInUpdate): Response {
        val feedToUpdate = feedRepository.findByUUID(id)
        if (feedToUpdate == null) {
            return Response.status(404).build()
        }
        if (feedToUpdate.userName != identity.principal.name) {
            return Response.status(404).build() // don't let the user know they found a real feed
        }
        feedToUpdate.title = feed.title ?: feedToUpdate.title
        val feedUrl = feed.url
        if (feedUrl != null)
            feedToUpdate.url = feedUrl
        feedToUpdate.description = feed.description ?: feedToUpdate.description

        val folderId = feed.folderId
        if (folderId != null) {
            try {
                val folderToFileInto = folderRepository.findByUUID(folderId)
                if (folderToFileInto == null)
                    return Response.status(404).build()
                if (folderToFileInto.userName != identity.principal.name)
                    return Response.status(404).build()
                feedToUpdate.folder = folderToFileInto
            } catch (e: Exception) {
                Log.error("User tried to update feed with non-existent folder")
                return Response.status(422).build()
            }
        }

        return Response.ok(feedToUpdate.toDto()).status(200).build()
    }

    @GET
    @Path("/delete/{id}")
    fun deleteFeed(id: UUID): Response {
        val feedToDelete = feedRepository.findByUUID(id)

        if (feedToDelete == null) {
            return Response.status(404).build()
        }
        if (feedToDelete.userName != identity.principal.name) {
            return Response.status(404).build()
        }
        try {
            feedRepository.deleteByUUID(id)
        } catch (e: Exception) {
            Log.error("Error deleting feed", e)
            return Response.serverError().build()
        }
        Log.info("Deleting feed...")
        return Response.ok().build()
    }

    @GET
    @Path("/{id}")
    fun getFeed(id: UUID): FeedDto? {
        try {
            var feed = feedRepository.findByUUID(id)?.toDto()
            feed?.numberUnread = articleRepository.getUnreadCount(id)
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
