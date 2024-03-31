package org.onesoftnet.mailbot.models

import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.onesoftnet.mailbot.mailing.MailMessageType
import java.time.LocalDateTime

data class MailMessage(
    val id: Int,
    val type: MailMessageType,
    val content: String?,
    val threadId: Int,
    val userId: String,
    val serialNumber: Int,
    val attributes: Attributes,
    val messageId: String,
    val createdAt: LocalDateTime,
) {
    constructor(
        id: Int,
        type: String,
        content: String?,
        threadId: Int,
        userId: String,
        serialNumber: Int,
        attributes: Attributes,
        messageId: String,
        createdAt: LocalDateTime,
    ) : this(id, MailMessageType.valueOf(type), content, threadId, userId, serialNumber, attributes, messageId, createdAt)

    @Serializable
    data class Attributes(
        val anonymous: Boolean = false,
    ) {
        override fun toString(): String {
            return Json.encodeToString(this)
        }
    }
}