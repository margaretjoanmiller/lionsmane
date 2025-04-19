/*
 * Copyright (c) Margaret Miller 2025. Licensed under the EUPL-1.2 or later.
 */

package org.jackrabbitsforge.data.dto

import java.time.OffsetDateTime

data class FeedOut(
    var title: String,
    var description: String,
    var url: String,
    var content: String,
    var articles: List<ArticleOut> = listOf(),
    var lastUpdated: OffsetDateTime,
    var folder: String? = null,
    var tags: List<String>? = null
)