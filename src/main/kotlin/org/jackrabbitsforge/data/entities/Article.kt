/*
 * Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
 */

package org.jackrabbitsforge.data.entities

import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.Id
import jakarta.persistence.ManyToOne
import org.jackrabbitsforge.data.dto.ArticleOut
import java.sql.Date
import java.time.ZoneOffset

@Entity
class Article {
    @Id
    @GeneratedValue
    var id: Long? = null

    var title: String? = null
    var author: String? = null
    var description: String? = null
    var content: String? = null
    var image: String? = null
    var url: String? = null
    var publishedDate: Date? = null

    var categories: List<String>? = null

    var audio: String? = null
    var source: String? = null
    var GUID: String? = null
    var video: String? = null
    var commentsUrl: String? = null

    @ManyToOne
    lateinit var feed: Feed

    fun toDto() = ArticleOut(
        id!!,
        title,
        author,
        content,
        image,
        url,
        publishedDate?.toInstant()?.atOffset(ZoneOffset.UTC),
        categories ?: listOf(),
        audio
    )
}