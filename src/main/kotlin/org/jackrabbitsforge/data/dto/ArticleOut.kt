/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
 */

package org.jackrabbitsforge.data.dto

import java.time.Instant
import java.util.*

data class ArticleOut(
    var id: UUID?,
    var read: Boolean,
    var starred: Boolean,
    var title: String?,
    var author: String?,
    var content: String?,
    var textPreview: String?,
    var image: String?,
    var url: String?,
    var publishedAt: Instant?,
    var categories: List<String>? = listOf(),
    var audio: String?,
    var feedId: UUID?
)
