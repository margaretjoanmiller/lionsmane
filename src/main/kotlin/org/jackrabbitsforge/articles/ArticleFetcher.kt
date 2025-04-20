/*
 * Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
 */

package org.jackrabbitsforge.articles

import com.prof18.rssparser.RssParser
import com.prof18.rssparser.model.RssItem
import jakarta.enterprise.context.ApplicationScoped
import org.jackrabbitsforge.data.dto.ArticleIn
import org.jackrabbitsforge.data.entities.Article
import org.jackrabbitsforge.data.repositories.ArticleRepository
import org.jsoup.Jsoup
import org.jsoup.safety.Safelist
import java.net.URL

@ApplicationScoped
class ArticleFetcher(private val articleRepository: ArticleRepository) {

    suspend fun fetchArticles(feedURL: URL): List<ArticleIn?> {
        val rssParser: RssParser = RssParser()
        val rssChannel = rssParser.getRssChannel(feedURL.toString())
        var articleList: List<RssItem> = rssChannel.items
            .map { item ->
                var art = Article()
                art.title = item.title
                art.author = item.author
                art.description = item.description
                val doc = Jsoup.connect(item.sourceUrl.toString()).timeout(300).get()
                art.content = Jsoup.clean(doc.select("article").html(), Safelist.basicWithImages())
                art.image = item.image
                art.url = item.sourceUrl
                art.publishedDate = item.pubDate

                articleRepository.persist()
                artIn
            }

    }
}