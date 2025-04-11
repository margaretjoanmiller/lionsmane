/*
 * Copyright (c) Margaret Miller 2025. Licensed under the EUPL-1.2 or later.
 */

package org.jackrabbitsforge.resources

import java.util.LinkedHashMap;

import jakarta.ws.rs.Path;

import org.jackrabbitsforge.data.entities.Feed

@Path("feeds")
class FeedResource {
    private val feeds: LinkedHashMap<String, Feed> = LinkedHashMap()


}