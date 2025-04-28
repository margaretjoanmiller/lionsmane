/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
 */

package org.jackrabbitsforge.articles

import com.prof18.rssparser.RssParser
import com.prof18.rssparser.model.RssChannel
import io.quarkus.logging.Log
import io.quarkus.vertx.ConsumeEvent
import io.smallrye.common.annotation.Blocking
import io.smallrye.common.annotation.RunOnVirtualThread
import jakarta.enterprise.context.ApplicationScoped
import jakarta.transaction.Transactional
import kotlinx.coroutines.runBlocking
import net.dankito.readability4j.Readability4J
import net.dankito.readability4j.Article as ReadArt
import org.jackrabbitsforge.data.dto.ArticleOut
import org.jackrabbitsforge.data.entities.Article
import org.jackrabbitsforge.data.repositories.ArticleRepository
import org.jackrabbitsforge.data.repositories.FeedRepository
import org.jsoup.Jsoup
import org.jsoup.safety.Safelist
import java.time.Clock
import java.time.OffsetDateTime
import java.util.UUID

@ApplicationScoped
class ArticleFetcher(private val feedRepository: FeedRepository, private val articleRepository: ArticleRepository) {


    @ConsumeEvent("fetchArticles")
    @RunOnVirtualThread
    @Blocking
    @Transactional
    fun fetchArticles(feedId: UUID): List<ArticleOut> {
        try {
            val feed = feedRepository.findByUUID(feedId)
            if (feed == null) {
                Log.error("Feed not found: $feedId")
                return listOf()
            }

            val rssParser: RssParser = RssParser()
            val rssChannel: RssChannel = runBlocking { rssParser.getRssChannel(feed.url.toString()) }
            val newArts = rssChannel.items
                .map { item ->
                    if (item.link != null && item.link!!.isNotEmpty()) {
                        val dupeArt = articleRepository.findByUrl(item.sourceUrl!!).firstResult()
                        if (dupeArt != null) {
                            Log.info("Article already exists: ${item.sourceUrl}")
                            return@map null
                        }
                    }
                    if (item.pubDate == null) {
                        return@map null
                    }
                    if (OffsetDateTime.parse(item.pubDate!!).isBefore(feed.lastUpdated)) {
                        return@map null
                    }
                    val doc = Jsoup.connect(item.link!!).timeout(3000).get()
                    val cleanBody = Jsoup.clean(doc.body().html(), Safelist.basic())
                    val readAbility: ReadArt = Readability4J(item.link!!, cleanBody).parse()
                    val content = readAbility.contentWithDocumentsCharsetOrUtf8
                    val textPreview = readAbility.textContent

                    val newArt = Article()
                    newArt.title = item.title
                    newArt.author = item.author
                    newArt.description = item.description
                    newArt.content = content
                    newArt.textPreview = textPreview
                    newArt.image = item.image
                    newArt.url = item.link
                    newArt.publishedDate = item.pubDate
                    newArt.categories = item.categories
                    newArt.audio = item.audio
                    newArt.GUID = item.guid
                    newArt.video = item.video
                    newArt.commentsUrl = item.commentsUrl
                    newArt.feed = feed

                    articleRepository.persist(newArt)

                    newArt.toDto()
                }
            feed.lastUpdated = OffsetDateTime.now()
            feedRepository.persist(feed)
            return newArts.filterNotNull()
        } catch (e: Exception) {
            Log.error("Error getting feedRefresh", e)
            return listOf()
        }
    }
}