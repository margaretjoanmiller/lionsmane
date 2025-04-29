/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
 */

package org.jackrabbitsforge.data.dto

import java.io.Serializable
import java.net.URL
import java.time.Instant
import java.util.UUID

/**
 * DTO for {@link org.jackrabbitsforge.data.entities.Feed}
 */
data class FeedDto(
    val id: UUID? = null,
    val title: String? = null,
    val description: String? = null,
    val url: URL? = null,
    val lastUpdated: Instant? = null
) : Serializable