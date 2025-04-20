package org.jackrabbitsforge.articles

import io.quarkus.logging.Log
import jakarta.enterprise.context.ApplicationScoped
import org.jackrabbitsforge.data.dto.ArticleIn
import java.net.URL
import org.jsoup.Jsoup
import org.jsoup.safety.Safelist

@ApplicationScoped
class ArticleFetcher {

    fun fetchArticles(articleUrls: List<URL>): List<ArticleIn?> {
        return articleUrls.map { url ->
            try {
                val doc = Jsoup.connect(url.toString()).timeout(300).get()
                val title = doc.title()
                val description = doc.select("meta[name=description]").attr("content")
                val content =  Jsoup.clean(doc.select("article").html(), Safelist.basicWithImages())
                val image = doc.select("meta[property=og:image]").attr("content")
                val urlString = url.toString()
                ArticleIn(title, description, content, image, urlString)
            }
            catch (e: Exception) {
                Log.error("Error fetching article", e)
                null
            }
        }
    }
}