/*
 * Copyright (c) Margaret Miller 2025.  Licensed under the EUPL-1.2 or later.
 */

package org.jackrabbitsforge.data.entities

import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.Id
import jakarta.persistence.ManyToMany
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToMany
import java.time.OffsetDateTime
import kotlin.uuid.ExperimentalUuidApi
import kotlin.uuid.Uuid

@Entity
class Feed {
    @Id
    @GeneratedValue
    @ExperimentalUuidApi
    var id: Uuid? = null

    lateinit var userName: String

    lateinit var title: String
    lateinit var description: String
    lateinit var url: String

    @OneToMany
    var articles: MutableList<Article> = mutableListOf<Article>()
    var lastUpdated: OffsetDateTime? = null

    @ManyToOne
lateinit var folder: Folder

    @ManyToMany(mappedBy = "feeds")
    var tags: MutableList<Tag>? = null
}