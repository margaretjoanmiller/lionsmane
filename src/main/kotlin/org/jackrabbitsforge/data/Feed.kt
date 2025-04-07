/*
 * Copyright (c) Margaret Miller 2025.  Licensed under the EUPL-1.2 or later.
 */

package org.jackrabbitsforge.data

import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.ManyToMany
import java.time.OffsetDateTime
import kotlin.uuid.ExperimentalUuidApi
import kotlin.uuid.Uuid

@Entity
class Feed {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @ExperimentalUuidApi
    var id: Uuid? = null

    lateinit var userName: String

    lateinit var title: String
    lateinit var description: String
    lateinit var url: String
    var articles: List<Article>? = null
    var lastUpdated: OffsetDateTime? = null

    @ManyToMany(mappedBy = "feeds")
    var tags: MutableList<Tag>? = null
}