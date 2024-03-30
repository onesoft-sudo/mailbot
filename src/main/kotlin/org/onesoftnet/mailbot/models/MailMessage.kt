package org.onesoftnet.mailbot.models

import org.onesoftnet.mailbot.mailing.MailMessageType
import java.time.LocalDateTime

data class MailMessage(
    val id: Int,
    val type: MailMessageType,
    val content: String?,
    val threadId: Int,
    val userId: String,
    val serialNumber: Int,
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
        messageId: String,
        createdAt: LocalDateTime,
    ) : this(id, MailMessageType.valueOf(type), content, threadId, userId, serialNumber, messageId, createdAt)
}