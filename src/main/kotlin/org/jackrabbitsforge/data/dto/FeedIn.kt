/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
 */

package org.jackrabbitsforge.data.dto

import java.net.URL
import java.util.UUID

data class FeedIn(
    val title: String,
    val description: String?,
    val url: URL,
    val folderId: UUID?
)

data class FeedInUpdate(
    val title: String?,
    val description: String?,
    val url: URL?,
    val folderId: UUID?
)
