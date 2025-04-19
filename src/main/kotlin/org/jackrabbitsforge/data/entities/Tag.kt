/*
 * Copyright (c) Margaret Miller 2025.  Licensed under the EUPL-1.2 or later.
 */

package org.jackrabbitsforge.data.entities

import jakarta.persistence.*
import java.util.*

@Entity
class Tag {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    var id: UUID? = null

    lateinit var name: String

    @ManyToMany
    var feeds: MutableList<Feed> = mutableListOf<Feed>()
}