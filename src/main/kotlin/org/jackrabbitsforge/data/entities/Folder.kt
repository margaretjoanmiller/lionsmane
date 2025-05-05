/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
 */

package org.jackrabbitsforge.data.entities

import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.Id
import jakarta.persistence.OneToMany
import org.jackrabbitsforge.data.dto.FolderOut
import java.util.UUID

@Entity
class Folder {
    @Id
    @GeneratedValue
    var id: UUID? = null

    lateinit var userName: String

    lateinit var name: String
    var description: String? = null

    @OneToMany(mappedBy = "folder", orphanRemoval = false)
    var feeds: MutableList<Feed> = mutableListOf<Feed>()

    fun toDto() = FolderOut(
        id,
        userName,
        name,
        description,
        feeds.map { feed ->
            feed.id!!
        } as MutableList<UUID>?
    )
}