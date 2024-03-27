package org.onesoftnet.mailbot.models

import dev.kord.common.entity.optional.optional
import org.ktorm.entity.Entity
import org.ktorm.schema.*
import java.time.Instant

interface Thread : Entity<Thread> {
    val id: Int
    var title: String?
    var userId: String
    var guildId: String
    var channelId: String
    var createdAt: Instant
    var updatedAt: Instant
}

object Threads : Table<Thread>("threads") {
    val id = int("id").primaryKey()
    val title = varchar("title").optional()
    val userId = varchar("user_id")
    val guildId = varchar("guild_id")
    val channelId = varchar("channel_id")
    val createdAt = timestamp("created_at").bindTo { it.createdAt }
    val updatedAt = timestamp("updated_at").bindTo { it.updatedAt }
}