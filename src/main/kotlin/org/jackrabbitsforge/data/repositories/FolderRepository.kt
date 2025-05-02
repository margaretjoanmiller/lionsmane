/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later
 */

package org.jackrabbitsforge.data.repositories

import io.quarkus.hibernate.orm.panache.kotlin.PanacheRepository
import io.quarkus.security.Authenticated
import jakarta.enterprise.context.ApplicationScoped
import jakarta.transaction.Transactional
import org.jackrabbitsforge.data.entities.Folder
import java.util.UUID

@Authenticated
@Transactional
@ApplicationScoped
class FolderRepository : PanacheRepository<Folder> {
    fun findByUUID(uuid: UUID) = find("id", uuid).firstResult()

    fun deleteByUUID(uuid: UUID) = delete("id", uuid)
}