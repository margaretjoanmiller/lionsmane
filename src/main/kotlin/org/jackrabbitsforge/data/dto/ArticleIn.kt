/*
 * Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
 */

package org.jackrabbitsforge.data.dto

import java.io.Serializable
import java.sql.Date
import java.time.LocalDateTime

/**
 * DTO for {@link org.jackrabbitsforge.data.entities.Article}
 */
data class ArticleIn(
    val title: String? = null,
    val author: String? = null,
    val description: String? = null,
    val content: String? = null,
    val image: String? = null,
    val url: String? = null,
    val publishedDate: String? = null,
    val categories: List<String>? = null,
    val audio: String? = null,
    val source: String? = null,
    val GUID: String? = null,
    val video: String? = null,
    val commentsUrl: String? = null
) : Serializable