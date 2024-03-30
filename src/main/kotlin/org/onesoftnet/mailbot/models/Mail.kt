package org.onesoftnet.mailbot.models

import java.time.LocalDateTime

data class Mail(
    val id: Int,
    val title: String?,
    val userId: String,
    val messages: Int,
    val channelId: String,
    val createdAt: LocalDateTime,
    val updatedAt: LocalDateTime,
)