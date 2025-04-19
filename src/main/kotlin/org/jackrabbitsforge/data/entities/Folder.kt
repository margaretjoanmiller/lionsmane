/*
 * Copyright (c) Margaret Miller 2025.  Licensed under the EUPL-1.2 or later.
 */

package org.jackrabbitsforge.data.entities

import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.Id
import jakarta.persistence.OneToMany
import kotlin.uuid.ExperimentalUuidApi
import kotlin.uuid.Uuid

@Entity
class Folder {
    @Id
    @GeneratedValue
    @ExperimentalUuidApi
    var id: Uuid? = null

    lateinit var userName: String

    lateinit var name: String
    var description: String? = null

    @OneToMany
    var feeds: MutableList<Feed> = mutableListOf<Feed>()
}