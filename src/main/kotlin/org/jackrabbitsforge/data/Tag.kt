/*
 * Copyright (c) Margaret Miller 2025.  Licensed under the EUPL-1.2 or later.
 */

package org.jackrabbitsforge.data

import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.JoinTable
import jakarta.persistence.ManyToMany
import kotlin.uuid.ExperimentalUuidApi
import kotlin.uuid.Uuid

@Entity
class Tag {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @ExperimentalUuidApi
    var id: Uuid? = null

    lateinit var name: String

    @ManyToMany
    var feeds: MutableList<Feed> = mutableListOf<Feed>()
}