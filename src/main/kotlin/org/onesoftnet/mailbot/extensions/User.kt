package org.onesoftnet.mailbot.extensions

import dev.kord.core.behavior.channel.createMessage
import dev.kord.core.entity.User
import dev.kord.rest.builder.message.create.MessageCreateBuilder

suspend fun User.send(block: MessageCreateBuilder.() -> Unit) =
    getDmChannel().createMessage(block)