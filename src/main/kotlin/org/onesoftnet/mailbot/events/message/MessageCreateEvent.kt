package org.onesoftnet.mailbot.events.message

import dev.kord.core.behavior.reply
import dev.kord.core.event.message.MessageCreateEvent
import org.ktorm.dsl.from
import org.ktorm.dsl.insert
import org.onesoftnet.mailbot.core.EventListener
import org.onesoftnet.mailbot.models.Threads

class MessageCreateEvent : EventListener<MessageCreateEvent>() {
    override val eventType = MessageCreateEvent::class

    override suspend fun handler(event: MessageCreateEvent) {
        if (event.member?.isBot != false || event.guildId == null) {
            return
        }

        val id = application.database.insert(Threads) {
            set(it.userId, event.member!!.id.toString())
            set(it.guildId, event.guildId.toString())
            set(it.channelId, event.message.channelId.toString())
        }

        event.message.reply {
            content = "Hello world! Your thread ID is **#${id}**."
        }
    }
}