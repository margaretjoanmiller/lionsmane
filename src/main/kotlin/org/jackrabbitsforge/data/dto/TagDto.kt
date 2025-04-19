/*
 * Copyright (c) Margaret Miller 2025. Licensed under the EUPL-1.2 or later.
 */

package org.jackrabbitsforge.data.dto

import java.io.Serializable

/**
 * DTO for {@link org.jackrabbitsforge.data.entities.Tag}
 */
data class TagDto(val id: Long? = null, val name: String? = null) : Serializable