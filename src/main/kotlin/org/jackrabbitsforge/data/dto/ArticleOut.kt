/*
 * Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
 */

package org.jackrabbitsforge.data.dto

import java.time.OffsetDateTime

data class ArticleOut(
    var id: Long,
    var title: String?,
    var author: String?,
    var content: String?,
    var image: String?,
    var url: String?,
    var publishedAt: OffsetDateTime?,
    var categories: List<String>? = listOf(),
    var audio: String?,
)
