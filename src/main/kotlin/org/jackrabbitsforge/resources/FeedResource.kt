/*
 * Copyright (c) Margaret Miller 2025. Licensed under the EUPL-1.2 or later.
 */

package org.jackrabbitsforge.resources

import io.quarkus.logging.Log
import io.quarkus.security.Authenticated
import io.quarkus.security.identity.SecurityIdentity
import jakarta.transaction.Transactional
import jakarta.ws.rs.*
import jakarta.ws.rs.core.Response
import kotlinx.datetime.Clock
import kotlinx.datetime.DateTimeUnit
import kotlinx.datetime.TimeZone
import kotlinx.datetime.minus
import org.jackrabbitsforge.data.dto.FeedDto
import org.jackrabbitsforge.data.entities.Feed
import org.jackrabbitsforge.data.repositories.FeedRepository
import java.net.URI
import java.time.OffsetDateTime


@Authenticated
@Transactional
@Path("feeds")
class FeedResource(
    private var feedRepository: FeedRepository,
    private var identity: SecurityIdentity
) {

    @GET
    fun listFeeds(): List<FeedDto> = feedRepository.listAll()
        .filter { f -> f.userName == identity.principal.name }
        .map { f -> f.toDto() }

    @POST
    fun postFeed(feed: FeedDto): Response {
        val newFeed = Feed()
        newFeed.title = feed.title ?: ""
        newFeed.description = feed.description ?: newFeed.description
        if (feed.url != null) {
            newFeed.url = URI.create(feed.url).toURL()
        }
        newFeed.userName = identity.principal.name
        val threeWeeksAgo = Clock.System.now().minus(3, DateTimeUnit.WEEK, TimeZone.UTC)
        newFeed.lastUpdated = OffsetDateTime.parse(threeWeeksAgo.toString())
        try {
            feedRepository.persist(newFeed)
        } catch (e: Exception) {
            Log.error("Error creating feed", e)
        }
        return Response.ok(newFeed.toDto()).status(201).build()
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
        feedToUpdate.description = feed.description ?: feedToUpdate.description
        if (feed.url != null) {
            feedToUpdate.url = URI.create(feed.url).toURL()
        }
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
}