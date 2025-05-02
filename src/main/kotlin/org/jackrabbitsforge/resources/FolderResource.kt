/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later
 */

package org.jackrabbitsforge.resources

import io.quarkus.logging.Log
import io.quarkus.security.Authenticated
import io.quarkus.security.identity.SecurityIdentity
import jakarta.transaction.Transactional
import jakarta.validation.Valid
import jakarta.ws.rs.DELETE
import jakarta.ws.rs.GET
import jakarta.ws.rs.PATCH
import jakarta.ws.rs.POST
import jakarta.ws.rs.PUT
import jakarta.ws.rs.Path
import jakarta.ws.rs.core.Response
import org.jackrabbitsforge.data.dto.FolderIn
import org.jackrabbitsforge.data.dto.FolderOut
import org.jackrabbitsforge.data.entities.Feed
import org.jackrabbitsforge.data.entities.Folder
import org.jackrabbitsforge.data.repositories.FeedRepository
import org.jackrabbitsforge.data.repositories.FolderRepository
import java.util.UUID
import kotlin.collections.filter

@Authenticated
@Transactional
@Path("/folders")
class FolderResource(
    private val folderRepository: FolderRepository,
    private val feedRepository: FeedRepository,
    private val identity: SecurityIdentity,
) {
    @GET
    fun listFolders(): List<FolderOut> {
        return folderRepository.listAll()
            .filter { f -> f.userName == identity.principal.name }
            .map { it.toDto() }
    }

    @POST
    fun createFolder(@Valid folder: FolderIn): FolderOut {
        val newFolder = Folder()
        newFolder.userName = identity.principal.name
        newFolder.name = folder.name
        newFolder.description = folder.description
        newFolder.feeds = mutableListOf()
        try {
            folder.feeds?.forEach {
                val feed = feedRepository.findByUUID(it)
                if (feed != null) newFolder.feeds.add(feed)
            }

            folderRepository.persist(newFolder)

            return newFolder.toDto()
        } catch (e: Exception) {
            Log.error("Error creating folder: ${folder.name}")
            throw e
        }
    }

    @PUT
    @Path("/{id}")
    fun updateFolder(id: UUID, @Valid folder: FolderIn): Response {
        val folderToUpdate = folderRepository.findByUUID(id)
        if (folderToUpdate == null)
            return Response.status(404).build()
        if (folderToUpdate.userName != identity.principal.name)
            return Response.status(404).build() // don't let the user know they found a real folder

        folderToUpdate.name = folder.name
        folderToUpdate.description = folder.description ?: folderToUpdate.description

        try {
            folder.feeds?.forEach {
                val feed = feedRepository.findByUUID(it)
                if (feed != null) folderToUpdate.feeds.add(feed)
            }
        } catch (e: Exception) {
            Log.error("Error updating folder: ${folder.name}")
            return Response.serverError().build()
        }

        return Response.ok(folderToUpdate.toDto()).status(200).build()
    }

    @DELETE
    @Path("/{id}")
    fun deleteFolder(id: UUID): Response {
        val folderToDelete = folderRepository.findByUUID(id)

        if (folderToDelete == null)
            return Response.status(404).build()
        if (folderToDelete.userName != identity.principal.name)
            return Response.status(404).build()

        try {
            folderRepository.deleteByUUID(id)
        } catch (e: Exception) {
            Log.error("Error deleting folder")
            return Response.serverError().build()
        }

        return Response.ok().build()
    }
}