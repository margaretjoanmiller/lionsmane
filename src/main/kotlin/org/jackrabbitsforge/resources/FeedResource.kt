/*
 * Copyright (c) Margaret Miller 2025. Licensed under the EUPL-1.2 or later.
 */

package org.jackrabbitsforge.resources

import io.quarkus.security.Authenticated
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
@Path("feeds")
class FeedResource(private var feedRepository: FeedRepository) {
    private val feeds: LinkedHashMap<String, Feed> = LinkedHashMap()

    @GET
    fun listFeeds(): List<FeedDto> = feedRepository.listAll()
        .map { f -> f.toDto() }

    @POST
    @Transactional
    fun postFeed(feed: FeedDto): Response {
        val newFeed = Feed(feed.title ?: "", feed.description, URI.create(feed.url!!).toURL())
        feedRepository.persist(newFeed)

        return Response.ok(newFeed.toDto()).status(201).build()
    }

    @PUT
    @Path("/{id}")
    @Transactional
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