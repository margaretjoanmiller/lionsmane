/*
 * Copyright (c) Margaret Miller 2025. Licensed under the EUPL-1.2 or later.
 */

package org.jackrabbitsforge.resources

import io.quarkus.security.Authenticated
import jakarta.ws.rs.GET
import jakarta.ws.rs.POST
import jakarta.ws.rs.Path
import jakarta.ws.rs.core.Response
import org.jackrabbitsforge.data.dto.FeedDto
import org.jackrabbitsforge.data.entities.Feed
import org.jackrabbitsforge.data.repositories.FeedRepository
import java.net.URI

@Authenticated
@Path("feeds")
class FeedResource(private var feedRepository: FeedRepository) {
    private val feeds: LinkedHashMap<String, Feed> = LinkedHashMap()

    @GET
    fun listFeeds(): List<FeedDto> = feedRepository.listAll()
        .map { f -> f.toDto() }

    @POST
    fun postFeed(feed: FeedDto): Response {
        var newFeed = Feed(feed.title ?: "", feed.description, URI.create(feed.url!!).toURL())
        feedRepository.persist(newFeed)

        return Response.ok(newFeed.toDto()).status(201).build()
    }
}