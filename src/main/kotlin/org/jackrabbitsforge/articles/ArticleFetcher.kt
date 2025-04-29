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
import org.jackrabbitsforge.utils.smartLocalDateTimeParse
import org.jackrabbitsforge.utils.localDateTimeToInstant
import org.jsoup.Jsoup
import org.jsoup.safety.Safelist
import java.time.Clock
import java.time.Instant
import java.time.ZoneId
import java.time.ZoneOffset
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale
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
                    val itemLink = item.link

                    val rfc = DateTimeFormatter.ofPattern("EEE, dd MMM yyyy HH:mm:ss Z", Locale.ENGLISH)

                    val rawDate = item.pubDate
                    if (rawDate == null) {
                        return@map null
                    }

                    var itemDate = ZonedDateTime.parse(rawDate, rfc).toInstant()

                    if (itemDate == null) {
                        itemDate = rawDate.smartLocalDateTimeParse().toInstant(ZoneOffset.UTC)
                    }

                    if (itemLink != null
                        && itemDate != null
                    ) {
                        val dupeArt = articleRepository.findByArticleUrl(itemLink).firstResult()
                        if (dupeArt != null) {
                            Log.info("Article already exists: $itemLink")
                            return@map null
                        }
                        if (itemDate
                                .isBefore(feed.lastUpdated)
                        ) {
                            return@map null
                        }
                        val doc = Jsoup.connect(itemLink).timeout(3000).get()
                        val cleanBody = Jsoup.clean(doc.body().html(), Safelist.basic())
                        val readAbility: ReadArt = Readability4J(itemLink, cleanBody).parse()
                        val content = readAbility.contentWithDocumentsCharsetOrUtf8
                        val textPreview = readAbility.textContent

                        val newArt = Article()
                        newArt.title = item.title
                        newArt.author = item.author
                        newArt.description = item.description
                        newArt.content = content
                        newArt.textPreview = textPreview
                        newArt.image = item.image
                        newArt.url = itemLink
                        newArt.publishedDate = itemDate
                        newArt.categories = item.categories
                        newArt.audio = item.audio
                        newArt.GUID = item.guid
                        newArt.video = item.video
                        newArt.commentsUrl = item.commentsUrl
                        newArt.feed = feed

                        articleRepository.persist(newArt)

                        newArt.toDto()
                    } else {
                        return@map null
                    }
                }
            feed.lastUpdated = Instant.now()
            feedRepository.persist(feed)
            return newArts.filterNotNull()
        } catch (e: Exception) {
            Log.error("Error getting feedRefresh", e)
            return listOf()
        }
    }
}