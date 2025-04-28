/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
 */

package org.jackrabbitsforge.utils

import io.quarkus.logging.Log
import kotlinx.datetime.DateTimePeriod
import java.net.URI
import java.net.URL
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter

fun checkUrl(url: String): URL {
    try {
        val newUrl = URI(url).toURL()
        return newUrl
    } catch (e: Exception) {
        Log.warn("Invalid url", e)
        throw e
    }
}


// credit to github user @thomasnield for this checker
// however it's been altered to use Instant instead
fun LocalDateTime.localDateTimeToInstant(): Instant =
    this.atZone(ZoneId.systemDefault()).toInstant()

fun String.smartLocalDateTimeParse(): LocalDateTime {
    val dtmStrRaw = replace("/", "-")

    val dtmStr =
        dtmStrRaw.replace(
            Regex("(Mo(n(day)?)?|Tu(e(sday)?)?|We(d(nesday)?)?|Th(u(rsday)?)?|Fr(i(day)?)?|Sa(t(urday)?)?|Su(n(day)?)?)"),
            ""
        )


    val (dt, tm) = dtmStr.split(" ")

    return dt.smartLocalDateParse().atTime(tm.smartLocalTimeParse())
}

fun String.smartLocalDateParse(): LocalDate {
    val dtStr = replace("/", "-")

    return when {

        dtStr.matches(Regex("[0-9]{2}-[0-9]-[0-9]{4}")) ->
            LocalDate.parse(dtStr, DateTimeFormatter.ofPattern("d-M-yyyy"))

        dtStr.matches(Regex("[0-9]-[0-9]-[0-9]{2}")) ->
            LocalDate.parse(dtStr, DateTimeFormatter.ofPattern("M-d-yy"))

        dtStr.matches(Regex("[0-9]-[0-9]{2}-[0-9]{2}")) ->
            LocalDate.parse(dtStr, DateTimeFormatter.ofPattern("M-dd-yy"))

        dtStr.matches(Regex("[0-9]-[0-9]-[0-9]{4}")) ->
            LocalDate.parse(dtStr, DateTimeFormatter.ofPattern("M-d-yyyy"))

        dtStr.matches(Regex("[0-9]-[0-9]{2}-[0-9]{4}")) ->
            LocalDate.parse(dtStr, DateTimeFormatter.ofPattern("M-dd-yyyy"))


        dtStr.matches(Regex("[0-9]{4}-[0-9]{2}-[0-9]{2}")) ->
            LocalDate.parse(dtStr, DateTimeFormatter.ofPattern("yyyy-MM-dd"))

        dtStr.matches(Regex("[0-9]{2}-[0-9]{2}-[0-9]{4}")) ->
            LocalDate.parse(dtStr, DateTimeFormatter.ofPattern("MM-dd-yyyy"))

        dtStr.matches(Regex("[0-9]{4}-[0-9]{1,2}-[0-9]{1,2}")) ->
            LocalDate.parse(dtStr, DateTimeFormatter.ofPattern("yyyy-M-d"))

        dtStr.matches(Regex("[0-9]{1,2}-[0-9]{1,2}-[0-9]{4}")) ->
            LocalDate.parse(dtStr, DateTimeFormatter.ofPattern("M-d-yyyy"))

        dtStr.matches(Regex("[0-9]{2}-[0-9]{2}-[0-9]{2}")) ->
            LocalDate.parse(dtStr, DateTimeFormatter.ofPattern("MM-dd-yy"))

        else -> throw Exception("Unrecognized date format: $this")
    }
}

fun String.smartLocalTimeParse() = when {

    //matches(Regex("((2[4-9])|(3[1-9])):[0-9]{2}")) -> SpillTime(this).toLocalTime()

    matches(Regex("[0-9]{2}:[0-9]{2}")) ->
        LocalTime.parse(this, DateTimeFormatter.ofPattern("HH:mm"))

    matches(Regex("[0-9]:[0-9]{2}")) ->
        LocalTime.parse(this, DateTimeFormatter.ofPattern("H:mm"))

    matches(Regex("[0-9]{4}")) ->
        LocalTime.parse(this, DateTimeFormatter.ofPattern("HHmm"))


    matches(Regex("[0-9]{2}:[0-9]{2} (AM|PM)")) ->
        LocalTime.parse(this, DateTimeFormatter.ofPattern("HH:mm aa"))

    matches(Regex("[0-9]:[0-9]{2} (AM|PM)")) ->
        LocalTime.parse(this, DateTimeFormatter.ofPattern("H:mm aa"))

    matches(Regex("[0-9]{4} (AM|PM)")) ->
        LocalTime.parse(this, DateTimeFormatter.ofPattern("HHmm aa"))

    matches(Regex("[0-9]{3}")) ->
        LocalTime.parse(this, DateTimeFormatter.ofPattern("Hmm"))

    matches(Regex("[0-9]{2}")) ->
        LocalTime.parse("00$this", DateTimeFormatter.ofPattern("HHmm"))

    matches(Regex("[0-9]")) ->
        LocalTime.parse("000$this", DateTimeFormatter.ofPattern("HHmm"))

    matches(Regex("[0-9]{2}:[0-9]{2}:[0-9]{2}")) ->
        LocalTime.parse(this, DateTimeFormatter.ofPattern("HH:mm:ss"))

    matches(Regex("[0-9]:[0-9]{2}:[0-9]{2}")) ->
        LocalTime.parse(this, DateTimeFormatter.ofPattern("H:mm:ss"))

    else -> throw Exception("Unrecognized time format: $this")
}