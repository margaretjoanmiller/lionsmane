/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
 */

package org.jackrabbitsforge.articles

import com.prof18.rssparser.RssParser
import com.prof18.rssparser.model.RssChannel
import io.quarkus.logging.Log
import io.quarkus.scheduler.Scheduled
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
import io.ktor.client.*
import io.ktor.client.call.body
import io.ktor.client.engine.cio.CIO
import io.ktor.client.plugins.*
import io.ktor.client.request.request
import org.jsoup.Jsoup
import org.jsoup.safety.Safelist
import java.time.Instant
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException
import java.util.Locale
import java.util.UUID

@ApplicationScoped
class ArticleFetcher(private val feedRepository: FeedRepository, private val articleRepository: ArticleRepository) {

    val client = HttpClient(CIO) {
        install(HttpRequestRetry) {
            retryOnServerErrors(maxRetries = 5)
            exponentialDelay()
        }
    }

    @ConsumeEvent("fetchArticles")
    @RunOnVirtualThread
    @Transactional
    fun fetchArticles(feedId: UUID): List<ArticleOut> {
        Log.info("Fetching articles for $feedId")
        try {
            val feed = feedRepository.findByUUID(feedId)
            if (feed == null || feed.id == null) {
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

                    var itemDate = Instant.now()
                    try {
                        itemDate = ZonedDateTime.parse(rawDate, rfc).toInstant()
                    } catch (e: DateTimeParseException) {
                        Log.info("Using backup date parser $e")
                        itemDate = Instant.parse(rawDate)
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


                        val rawDoc: String = runBlocking {
                            client.request(itemLink).body()
                        }
                        val doc = Jsoup.parse(rawDoc)
                        val cleanBody = Jsoup.clean(doc.body().html(), Safelist.basic())
                        val readAbility: ReadArt = Readability4J(itemLink, cleanBody).parse()
                        val content = readAbility.content

                        val rawPreview = item.content
                        var preview = ""
                        if (rawPreview != null) {
                            preview = Jsoup.parse(rawPreview).text()
                        } else {
                            preview = "Preview not available"
                        }

                        val newArt = Article()
                        newArt.title = item.title
                        newArt.author = item.author
                        newArt.description = item.description
                        newArt.content = content
                        newArt.textPreview = preview
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

                        newArt.toDto(feed.id!!)
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

    @Scheduled(every = "30m")
    fun updateAllFeedsSchedule() {
        try {
            val feeds = feedRepository.listAll()
            if (feeds.isEmpty()) {
                Log.info("No feeds")
                return
            }

            feeds.forEach {
                if (it.id != null) fetchArticles(it.id!!)
            }
        } catch (e: Exception) {
            Log.error("Error updating articles", e)
            return
        }
    }

    @ConsumeEvent("fetchAllArticles")
    @RunOnVirtualThread
    fun updateAllFeedsSchedule(whenToFetch: String) {
        Log.info("Fetching all articles")
        try {
            val feeds = feedRepository.listAll()
            if (feeds.isEmpty()) {
                Log.info("No feeds")
                return
            }

            feeds.forEach {
                fetchArticles(it.id!!)
            }
        } catch (e: Exception) {
            Log.error("Error updating articles", e)
            return
        }
    }
}