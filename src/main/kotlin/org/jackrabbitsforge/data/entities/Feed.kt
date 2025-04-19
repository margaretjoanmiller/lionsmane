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
class Feed(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    var id: UUID,
    var title: String, var description: String?, var url: URL,

    var userName: String,

    @OneToMany
    var articles: MutableList<Article> = mutableListOf<Article>(),
    var lastUpdated: OffsetDateTime? = null,

    @ManyToOne
    var folder: Folder,

    @ManyToMany(mappedBy = "feeds")
    var tags: MutableList<Tag>? = null,
) {

    fun toDto() = FeedDto(id, title, description, url.toString(), lastUpdated)
}
