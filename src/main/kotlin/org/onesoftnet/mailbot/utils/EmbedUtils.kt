package org.onesoftnet.mailbot.utils

import dev.kord.core.entity.User

object EmbedUtils {
    fun userInfo(user: User) = "ID: ${user.id}\nUsername: ${user.username}\nMention: <@${user.id}>"
}