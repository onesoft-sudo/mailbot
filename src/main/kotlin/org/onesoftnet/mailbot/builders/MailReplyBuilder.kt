package org.onesoftnet.mailbot.builders

import dev.kord.common.entity.Snowflake
import dev.kord.core.behavior.channel.createMessage
import dev.kord.core.entity.Message
import dev.kord.rest.builder.message.create.MessageCreateBuilder
import org.ktorm.dsl.eq
import org.ktorm.dsl.insert
import org.ktorm.dsl.update
import org.onesoftnet.mailbot.core.Application
import org.onesoftnet.mailbot.mailing.MailMessageType
import org.onesoftnet.mailbot.models.Mail
import org.onesoftnet.mailbot.models.MailMessage
import org.onesoftnet.mailbot.tables.MailMessages
import org.onesoftnet.mailbot.tables.Mails
import org.slf4j.LoggerFactory
import java.time.LocalDateTime

class MailReplyBuilder(val application: Application, val mail: Mail) {
    private val database = application.database

    lateinit var content: String
    lateinit var type: MailMessageType
    lateinit var userId: String
    lateinit var messageId: String
    lateinit var attributes: MailMessage.Attributes

    suspend fun sendToUser(block: suspend MessageCreateBuilder.() -> Unit): Message? {
        try {
            val user = application.kord.getUser(Snowflake(userId))
            val channel = user?.getDmChannel()
            println(channel)
            return channel?.createMessage { block() }
        }
        catch (e: Exception) {
            LoggerFactory.getLogger(javaClass).error("Failed to send message to the user", e)
            return null
        }
    }

    fun build(): MailMessage {
        val id = database.insert(MailMessages) {
            set(it.content, content)
            set(it.type, type.value)
            set(it.threadId, mail.id)
            set(it.userId, userId)
            set(it.messageId, messageId)
            set(it.serialNumber, mail.messages + 1)
            set(it.attributes, attributes.toString())
        }

        database.update(Mails) {
            set(it.messages, mail.messages + 1)

            where {
                it.id eq mail.id
            }
        }

        return MailMessage(
            id = id,
            content = content,
            type = type,
            threadId = mail.id,
            userId = userId,
            serialNumber = mail.messages + 1,
            messageId = messageId,
            createdAt = LocalDateTime.now(),
            attributes = attributes
        )
    }
}