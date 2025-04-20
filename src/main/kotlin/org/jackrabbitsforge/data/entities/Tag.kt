/*
 * Copyright (c) Margaret Miller 2025. Licensed under the EUPL-1.2-or-later.
 */

package org.jackrabbitsforge.data.entities

import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.Id
import jakarta.persistence.ManyToMany

@Entity
class Tag {
    @Id
    @GeneratedValue
    var id: Long? = null

    lateinit var name: String

    @ManyToMany
    var feeds: MutableList<Feed> = mutableListOf<Feed>()
}