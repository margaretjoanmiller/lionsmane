/*
 * Copyright (c) Margaret Miller 2025. Licensed under the EUPL-1.2 or later.
 */

package org.jackrabbitsforge.data.dto

import java.io.Serializable
import java.time.OffsetDateTime
import java.util.UUID
import kotlin.uuid.Uuid

/**
 * DTO for {@link org.jackrabbitsforge.data.entities.Feed}
 */
data class FeedDto(
    val id: UUID? = null,
    val title: String? = null,
    val description: String? = null,
    val url: String? = null,
    val lastUpdated: OffsetDateTime? = null
) : Serializable