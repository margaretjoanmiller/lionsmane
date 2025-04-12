/*
 * Copyright (c) Margaret Miller 2025. Licensed under the EUPL-1.2 or later.
 */

package org.jackrabbitsforge.data.repositories

import io.quarkus.hibernate.orm.panache.kotlin.PanacheRepository
import jakarta.enterprise.context.ApplicationScoped
import jakarta.persistence.EntityManager
import org.jackrabbitsforge.data.dto.FeedDto
import org.jackrabbitsforge.data.entities.Feed
import org.mapstruct.factory.Mappers
import java.util.UUID

@ApplicationScoped
class FeedRepository: PanacheRepository<Feed> {

    private var feedMapper: FeedMapper = Mappers.getMapper(FeedMapper::class.java)

    fun findByName(name: String) = find(name).firstResult()

    fun findById(id: UUID) = find("$id")

}