/*
 * Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
 */

package org.jackrabbitsforge.data.entities

import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.Id
import jakarta.persistence.ManyToMany
import java.util.UUID

@Entity
class Tag {
    @Id
    @GeneratedValue
    var id: UUID? = null

    lateinit var name: String

    @ManyToMany
    var feeds: MutableList<Feed> = mutableListOf<Feed>()
}