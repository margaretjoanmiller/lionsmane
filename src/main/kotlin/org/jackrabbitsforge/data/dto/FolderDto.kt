/*
 * Copyright (c) Margaret Miller 2025. Licensed under the EUPL-1.2 or later.
 */

package org.jackrabbitsforge.data.dto

import java.io.Serializable
import kotlin.uuid.Uuid

/**
 * DTO for {@link org.jackrabbitsforge.data.entities.Folder}
 */
data class FolderDto(val id: Uuid? = null, val name: String? = null, val description: String? = null) : Serializable