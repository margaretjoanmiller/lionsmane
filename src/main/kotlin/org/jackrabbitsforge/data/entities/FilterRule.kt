package org.jackrabbitsforge.data.entities

import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.Id
import java.time.Instant
import java.util.*

@Entity
class FilterRule {
    @Id
    @GeneratedValue
    var id: UUID? = null
    var title: String? = null

//    @JdbcTypeCode(SqlTypes.JSON)
//    var rules: String? = null

    var action: FilterAction = FilterAction.HIDE
    lateinit var createdAt: Instant
    var updatedAt: Instant? = null

}

enum class FilterAction {
    HIDE,
    MARK_READ,
    HIGHLIGHT,
    ARCHIVE,
    TAG
}