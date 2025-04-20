/*
 * Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
 */

package org.jackrabbitsforge.data.repositories

import io.quarkus.hibernate.orm.panache.kotlin.PanacheRepository
import jakarta.enterprise.context.ApplicationScoped
import org.jackrabbitsforge.data.dto.FeedDto
import org.jackrabbitsforge.data.entities.Feed
import java.util.UUID

@ApplicationScoped
class FeedRepository: PanacheRepository<Feed> {

    fun findByName(name: String) = find(name).firstResult()

    fun findById(id: UUID) = find("$id")

}