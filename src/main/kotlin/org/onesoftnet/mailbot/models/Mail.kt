package org.onesoftnet.mailbot.models

import dev.kord.common.entity.Snowflake
import dev.kord.core.entity.channel.TextChannel
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.ktorm.database.Database
import org.ktorm.dsl.delete
import org.ktorm.dsl.eq
import org.ktorm.dsl.update
import org.onesoftnet.mailbot.builders.MailReplyBuilder
import org.onesoftnet.mailbot.core.Application
import org.onesoftnet.mailbot.tables.Mails
import java.time.LocalDateTime

data class Mail(
    val id: Int,
    val title: String?,
    val userId: String,
    val messages: Int,
    val channelId: String,
    val closed: Boolean,
    val attributes: Attributes,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
) {
    suspend fun user() = Application.kord.getUser(Snowflake(userId))

    suspend fun reply(application: Application, block: suspend MailReplyBuilder.() -> MailMessage?): MailMessage? {
        val builder = MailReplyBuilder(application, this)
        return builder.block()
    }

    suspend fun close(application: Application, channel: TextChannel? = null) {
        application.database.update(Mails) {
            set(it.closed, true)
            set(it.updatedAt, LocalDateTime.now())

            where {
                it.id eq id
            }
        }

        if (channel != null) {
            channel.delete()
        }
        else {
            application.kord
                .getChannelOf<TextChannel>(Snowflake(channelId))
                ?.delete()
        }
    }

    @Serializable
    data class Attributes(
        val displayNames: Map<String, String> = mapOf()
    ) {
        override fun toString(): String {
            return Json.encodeToString(this)
        }
    }
}