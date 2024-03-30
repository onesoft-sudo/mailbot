package org.onesoftnet.mailbot.tables

import org.ktorm.database.Database
import org.ktorm.dsl.QueryRowSet
import org.ktorm.schema.BaseTable
import org.ktorm.schema.datetime
import org.ktorm.schema.int
import org.ktorm.schema.varchar
import org.onesoftnet.mailbot.mailing.MailMessageType
import org.onesoftnet.mailbot.models.Mail
import org.onesoftnet.mailbot.models.MailMessage
import java.time.LocalDateTime

object MailMessages : BaseTable<MailMessage>("messages") {
    val id = int("id").primaryKey()
    val type = varchar("type")
    val userId = varchar("user_id")
    val threadId = int("thread_id")
    val serialNumber = int("serial_number")
    val messageId = varchar("message_id")
    val content = varchar("content")
    val createdAt = datetime("created_at")

    override fun doCreateEntity(row: QueryRowSet, withReferences: Boolean) = MailMessage(
        id = row[id] ?: 0,
        content = row[content].orEmpty(),
        threadId = row[threadId] ?: throw IllegalStateException("Thread ID is null!"),
        userId = row[userId] ?: throw IllegalStateException("User ID is null!"),
        type = row[type] ?: throw IllegalStateException("Type is null!"),
        messageId = row[messageId] ?: throw IllegalStateException("Type is null!"),
        serialNumber = row[serialNumber] ?: 0,
        createdAt = row[createdAt] ?: LocalDateTime.now(),
    )
}

val Database.messages get() = sequenceOf(MailMessages)