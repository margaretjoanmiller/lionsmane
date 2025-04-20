package org.jackrabbitsforge.resources

import io.quarkus.logging.Log
import io.quarkus.security.Authenticated
import io.quarkus.security.identity.SecurityIdentity
import jakarta.ws.rs.GET
import jakarta.ws.rs.Path
import org.jackrabbitsforge.data.dto.ArticleOut
import org.jackrabbitsforge.data.dto.FeedOut
import org.jackrabbitsforge.data.repositories.ArticleRepository

@Authenticated
@Path("/articles")
class ArticleResource(private var articleRepository: ArticleRepository, private var identity: SecurityIdentity) {

    @GET
    @Path("/{id}")
    fun getArticle(id: Long): ArticleOut {
        try {
            val articlesOut = articleRepository.findById(id)
            return articlesOut?.toDto() ?: throw Exception("Article not found")
        } catch(e: Exception) {
            Log.error("Error getting article", e)
            throw e
        }
    }
}