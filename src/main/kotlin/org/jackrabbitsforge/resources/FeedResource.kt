/*
 * Copyright (c) Margaret Miller 2025. Licensed under the EUPL-1.2 or later.
 */

package org.jackrabbitsforge.resources

import jakarta.ws.rs.GET
import java.util.LinkedHashMap;

import jakarta.ws.rs.Path;

import org.jackrabbitsforge.data.entities.Feed
import org.jackrabbitsforge.data.repositories.FeedRepository

@Path("feeds")
class FeedResource(private var feedRepository: FeedRepository) {
    private val feeds: LinkedHashMap<String, Feed> = LinkedHashMap()

    @GET
    fun listFeeds() = feedRepository.listAll()

}