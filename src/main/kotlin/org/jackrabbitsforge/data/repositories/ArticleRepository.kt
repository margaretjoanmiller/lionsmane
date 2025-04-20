package org.jackrabbitsforge.data.repositories

import io.quarkus.hibernate.orm.panache.kotlin.PanacheRepository
import jakarta.enterprise.context.ApplicationScoped
import org.jackrabbitsforge.data.entities.Article

@ApplicationScoped
class ArticleRepository: PanacheRepository<Article> {
    fun findByFeedId(feedId: Long) = list("feed.id", feedId)
}