package org.onesoftnet.mailbot.models

import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.onesoftnet.mailbot.builders.MailReplyBuilder
import org.onesoftnet.mailbot.core.Application
import java.time.LocalDateTime

data class Mail(
    val id: Int,
    val title: String?,
    val userId: String,
    val messages: Int,
    val channelId: String,
    val attributes: Attributes,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
) {
    suspend fun reply(application: Application, block: suspend MailReplyBuilder.() -> MailMessage?): MailMessage? {
        val builder = MailReplyBuilder(application, this)
        return builder.block()
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