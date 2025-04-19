/*
 * Copyright (c) Margaret Miller 2025.  Licensed under the EUPL-1.2 or later.
 */

package org.jackrabbitsforge.data.entities

import jakarta.persistence.*
import org.jackrabbitsforge.data.dto.FeedDto
import java.net.URL
import java.time.OffsetDateTime
import java.util.*

@Entity
class Feed(var title: String, var description: String?, var url: URL) {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    lateinit var id: UUID

    lateinit var userName: String

    @OneToMany
    var articles: MutableList<Article> = mutableListOf<Article>()
    var lastUpdated: OffsetDateTime? = null

    @ManyToOne
    lateinit var folder: Folder

    @ManyToMany(mappedBy = "feeds")
    var tags: MutableList<Tag>? = null

    fun toDto() = FeedDto(id, title, description, url.toString(), lastUpdated)
}
