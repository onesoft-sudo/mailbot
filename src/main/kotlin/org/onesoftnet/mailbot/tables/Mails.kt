package org.onesoftnet.mailbot.tables

import kotlinx.serialization.json.Json
import org.ktorm.database.Database
import org.ktorm.dsl.QueryRowSet
import org.ktorm.schema.BaseTable
import org.ktorm.schema.datetime
import org.ktorm.schema.int
import org.ktorm.schema.varchar
import org.onesoftnet.mailbot.models.Mail
import java.time.LocalDateTime

object Mails : BaseTable<Mail>("mails") {
    val id = int("id").primaryKey()
    val title = varchar("title")
    val userId = varchar("user_id")
    val messages = int("messages")
    val channelId = varchar("channel_id")
    val attributes = varchar("attributes")
    val createdAt = datetime("created_at")
    val updatedAt = datetime("updated_at")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = Mail(
        id = row[id] ?: 0,
        title = row[title].orEmpty(),
        messages = row[messages] ?: 0,
        channelId = row[channelId] ?: throw IllegalStateException("Channel ID is null!"),
        userId = row[userId] ?: throw IllegalStateException("User ID is null!"),
        createdAt = row[createdAt] ?: LocalDateTime.now(),
        updatedAt = row[updatedAt] ?: LocalDateTime.now(),
        attributes = Json.decodeFromString<Mail.Attributes>(row[attributes] ?: "{}")
    )
}

val Database.mails get() = sequenceOf(Mails)