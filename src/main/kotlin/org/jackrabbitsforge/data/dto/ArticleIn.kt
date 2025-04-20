package org.jackrabbitsforge.data.dto

import java.io.Serializable
import java.sql.Date

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
    val publishedDate: Date? = null,
    val categories: MutableList<List<String>>? = null,
    val audio: String? = null,
    val source: String? = null,
    val GUID: String? = null,
    val video: String? = null,
    val commentsUrl: String? = null
) : Serializable