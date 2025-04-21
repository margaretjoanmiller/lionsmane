/*
 * Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
 */

package org.jackrabbitsforge.articles

import com.prof18.rssparser.RssParser
import jakarta.transaction.TransactionScoped
import org.jackrabbitsforge.data.dto.ArticleIn
import org.jsoup.Jsoup
import org.jsoup.safety.Safelist

@TransactionScoped
class ArticleFetcher {


    suspend fun fetchArticles(feedUrl: String): List<ArticleIn> {
        val rssParser: RssParser = RssParser()
        val rssChannel = rssParser.getRssChannel(feedUrl)
        return rssChannel.items
            .map { item ->
                val doc = Jsoup.connect(item.link!!).timeout(3000).get()
                ArticleIn(
                    item.title,
                    item.author,
                    item.description,
                    Jsoup.clean(doc.select("article").html(), Safelist.basicWithImages()),

                    item.image,
                    item.sourceUrl,
                    item.pubDate,
                    item.categories,
                    item.audio,
                    item.sourceUrl,
                    item.guid,
                    item.video,
                    item.commentsUrl
                )
            }

    }
}