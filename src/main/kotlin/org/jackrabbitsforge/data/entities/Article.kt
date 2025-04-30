/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
 */

package org.jackrabbitsforge.data.entities

import jakarta.persistence.*
import org.jackrabbitsforge.data.dto.ArticleOut
import java.time.Instant
import java.util.UUID

@Entity
class Article {
    @Id
    @GeneratedValue
    var id: UUID? = null

    @Column(columnDefinition = "TEXT")
    var title: String? = null
    var author: String? = null

    @Column(columnDefinition = "TEXT")
    var description: String? = null

    @Column(columnDefinition = "TEXT")
    var content: String? = null

    @Column(columnDefinition = "TEXT")
    var textPreview: String? = null
    var image: String? = null

    @Column(columnDefinition = "TEXT")
    var url: String? = null
    var publishedDate: Instant? = null

    var categories: List<String>? = null

    var audio: String? = null
    var GUID: String? = null
    var video: String? = null
    var commentsUrl: String? = null

    @ManyToOne
    lateinit var feed: Feed

    fun toDto(feedId: UUID) = ArticleOut(
        id,
        title,
        author,
        content,
        textPreview,
        image,
        url,
        publishedDate,
        categories ?: listOf(),
        audio,
        feedId
    )
}