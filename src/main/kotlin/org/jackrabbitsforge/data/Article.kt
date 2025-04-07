/*
 * Copyright (c) Margaret Miller 2025.  Licensed under the EUPL-1.2 or later.
 */

package org.jackrabbitsforge.data

import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import kotlin.uuid.ExperimentalUuidApi
import kotlin.uuid.Uuid

@Entity
class Article {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @ExperimentalUuidApi
    private var id: Uuid? = null;

    private var title: String? = null;
}