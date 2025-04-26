/*
 * Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
 */

package org.jackrabbitsforge.data.entities

import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.Id
import jakarta.persistence.OneToMany
import java.util.UUID
import kotlin.uuid.ExperimentalUuidApi

@Entity
class Folder {
    @Id
    @GeneratedValue
    @ExperimentalUuidApi
    var id: UUID? = null

    lateinit var userName: String

    lateinit var name: String
    var description: String? = null

    @OneToMany
    var feeds: MutableList<Feed> = mutableListOf<Feed>()
}