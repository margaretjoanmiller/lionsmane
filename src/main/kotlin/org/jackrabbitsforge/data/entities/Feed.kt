/*
 * Copyright (c) Margaret Miller 2025. Licensed under the EUPL-1.2-or-later.
 */

package org.jackrabbitsforge.data.entities

import jakarta.persistence.*
import org.jackrabbitsforge.data.dto.FeedDto
import java.net.URL
import java.time.OffsetDateTime

@Entity
class Feed {
    @Id
    @GeneratedValue
    var id: Long? = null
    lateinit var title: String
    var description: String? = ""
    lateinit var url: URL

    lateinit var userName: String

    @OneToMany
    var articles: MutableList<Article> = mutableListOf<Article>()
    var lastUpdated: OffsetDateTime? = null

    @ManyToOne(optional = true)
    var folder: Folder? = null

    @ManyToMany(mappedBy = "feeds")
    var tags: MutableList<Tag>? = null
    fun toDto() = FeedDto(id, title, description, url.toString(), lastUpdated)
}
