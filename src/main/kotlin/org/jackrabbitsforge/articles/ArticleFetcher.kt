/*
 * Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
 */

package org.jackrabbitsforge.articles

import com.prof18.rssparser.RssParser
import io.quarkus.logging.Log
import jakarta.enterprise.context.ApplicationScoped
import org.jackrabbitsforge.data.dto.ArticleIn
import org.jackrabbitsforge.data.dto.ArticleOut
import org.jackrabbitsforge.data.entities.Article
import org.jackrabbitsforge.data.repositories.ArticleRepository
import org.jackrabbitsforge.data.repositories.FeedRepository
import org.jsoup.Jsoup
import org.jsoup.safety.Safelist
import java.time.LocalDateTime

@ApplicationScoped
class ArticleFetcher(private val articleRepository: ArticleRepository, private val feedRepository: FeedRepository) {


    suspend fun fetchArticles(feedid: Long): List<ArticleIn> {
        val feed = feedRepository.findById(feedid)
        if (feed == null) {
            Log.error("Feed $feedid not found")
            throw RuntimeException("Feed $feedid not found")
        }
        val rssParser: RssParser = RssParser()
        val rssChannel = rssParser.getRssChannel(feed?.url.toString())
        return rssChannel.items
            .map { item ->
                val doc = Jsoup.connect(item.sourceUrl.toString()).timeout(300).get()
                ArticleIn(
                item.title,
                item.author,
                item.description,
                        Jsoup.clean(doc.select("article").html(), Safelist.basicWithImages()),

                item.image,
                item.sourceUrl,
                    LocalDateTime.parse(item.pubDate!!),
                item.categories,
                    item.audio,
                item.sourceUrl,
                    item.guid,
                    item.video,
                    item.commentsUrl)
            }

    }
}