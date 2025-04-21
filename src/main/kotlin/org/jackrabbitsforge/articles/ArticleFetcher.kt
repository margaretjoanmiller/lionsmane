/*
 * Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
 */

package org.jackrabbitsforge.articles

import com.prof18.rssparser.RssParser
import io.quarkus.logging.Log
import jakarta.enterprise.context.ApplicationScoped
import org.jackrabbitsforge.data.dto.ArticleOut
import org.jackrabbitsforge.data.entities.Article
import org.jackrabbitsforge.data.repositories.ArticleRepository
import org.jackrabbitsforge.data.repositories.FeedRepository
import org.jsoup.Jsoup
import org.jsoup.safety.Safelist
import java.time.LocalDateTime

@ApplicationScoped
class ArticleFetcher(private val articleRepository: ArticleRepository, private val feedRepository: FeedRepository) {


    suspend fun fetchArticles(feedid: Long): List<ArticleOut> {
        val feed = feedRepository.findById(feedid)
        if (feed == null) {
            Log.error("Feed $feedid not found")
            throw RuntimeException("Feed $feedid not found")
        }
        val rssParser: RssParser = RssParser()
        val rssChannel = rssParser.getRssChannel(feed?.url.toString())
        return rssChannel.items
            .map { item ->
                val art = Article()
                art.title = item.title
                art.author = item.author
                art.description = item.description
                val doc = Jsoup.connect(item.sourceUrl.toString()).timeout(300).get()
                art.content = Jsoup.clean(doc.select("article").html(), Safelist.basicWithImages())
                art.image = item.image
                art.url = item.sourceUrl
                if (item.pubDate != null) {
                    art.publishedDate = LocalDateTime.parse(item.pubDate!!)
                }
                art.categories = item.categories
                art.GUID = item.guid
                art.video = item.video
                art.commentsUrl = item.commentsUrl
                art.feed = feed
                articleRepository.persist(art)
                art.toDto()
            }

    }
}