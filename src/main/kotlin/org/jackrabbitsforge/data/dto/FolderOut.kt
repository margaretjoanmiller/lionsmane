/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later
 */

package org.jackrabbitsforge.data.dto

import java.io.Serializable
import java.util.*

/**
 * DTO for {@link org.jackrabbitsforge.data.entities.Folder}
 */
data class FolderOut(
    val id: UUID? = null,
    val userName: String? = null,
    val name: String? = null,
    val description: String? = null,
    val feeds: MutableList<UUID>? = mutableListOf()
) : Serializable