/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
 */

package org.jackrabbitsforge.authorization

import io.quarkus.security.identity.SecurityIdentity
import jakarta.enterprise.inject.Default
import jakarta.inject.Inject
import jakarta.ws.rs.GET
import jakarta.ws.rs.Path
import org.jboss.resteasy.reactive.NoCache

@Path("users")
class UsersResource {
    @Inject
    @field: Default
    lateinit var identity: SecurityIdentity

    @GET
    @Path("/me")
    @NoCache
    fun me(): User {
        return User(identity)
    }

    class User internal constructor(identity: SecurityIdentity) {
        val userName: String = identity.principal.name
    }
}

