/*
 * Copyright (c) Margaret Miller 2025.  Licensed under the EUPL-1.2 or later.
 */

package org.jackrabbitsforge.data.entities

import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.Id
import jakarta.persistence.ManyToOne
import java.sql.Date
import java.util.UUID

@Entity
class Article {
    @Id
    @GeneratedValue
     var id: UUID? = null

    lateinit var title: String
    lateinit var author: String
    lateinit var description: String
    lateinit var content: String
    lateinit var image: String
    lateinit var url: String
    open lateinit var publishedDate: Date

    var categories: List<String>? = null

    var audio: String? = null
    var source: String? = null
    var GUID: String? = null
    var video: String? = null
    var commentsUrl: String? = null

    @ManyToOne
lateinit var feed: Feed
}