/*
 * Copyright (c) Margaret Miller 2025. Licensed under the EUPL-1.2 or later.
 */

package org.jackrabbitsforge.resources

import io.quarkus.security.Authenticated
import io.quarkus.security.identity.SecurityIdentity
import jakarta.transaction.Transactional
import jakarta.ws.rs.GET
import jakarta.ws.rs.POST
import jakarta.ws.rs.PUT
import jakarta.ws.rs.Path
import jakarta.ws.rs.core.Response
import org.jackrabbitsforge.data.dto.FeedDto
import org.jackrabbitsforge.data.entities.Feed
import org.jackrabbitsforge.data.repositories.FeedRepository
import java.net.URI
import java.util.*

@Authenticated
@Transactional
@Path("feeds")
class FeedResource(
    private var feedRepository: FeedRepository,
    private var identity: SecurityIdentity
) {
    private val feeds: LinkedHashMap<String, Feed> = LinkedHashMap()

    @GET
    fun listFeeds(): List<FeedDto> = feedRepository.listAll()
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
        feedRepository.persist(newFeed)
        return Response.ok(newFeed.toDto()).status(201).build()
    }

    @PUT
    @Path("/{id}")
    fun updateFeed(id: String, feed: FeedDto): Response {
        val uuid: UUID? = UUID.fromString(id)
        if (uuid == null) {
            return Response.status(422).build()
        }
        val feedToUpdate = feedRepository.findById(uuid).firstResult()
        if (feedToUpdate == null) {
            return Response.status(404).build()
        }
        feedToUpdate.title = feed.title ?: feedToUpdate.title
        feedToUpdate.description = feed.description ?: feedToUpdate.description
        if (feed.url != null) {
            feedToUpdate.url = URI.create(feed.url).toURL()
        }
        return Response.ok(feedToUpdate.toDto()).status(200).build()
    }
}