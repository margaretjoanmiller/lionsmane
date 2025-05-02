/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later
 */

package org.jackrabbitsforge.data.dto

import java.io.Serializable
import java.util.UUID

/**
 * DTO for {@link org.jackrabbitsforge.data.entities.Folder}
 */
data class FolderIn(
    val name: String,
    val description: String? = null,
    val feeds: List<UUID>? = mutableListOf()
) :
    Serializable