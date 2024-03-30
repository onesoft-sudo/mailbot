package org.onesoftnet.mailbot.events.message

import dev.kord.core.behavior.reply
import dev.kord.core.entity.ReactionEmoji
import dev.kord.core.event.message.MessageCreateEvent
import kotlinx.coroutines.sync.Semaphore
import org.onesoftnet.mailbot.core.Application
import org.onesoftnet.mailbot.core.EventListener
import org.onesoftnet.mailbot.services.MailService

class MessageCreateEvent(application: Application) : EventListener<MessageCreateEvent>(application) {
    override val eventType = MessageCreateEvent::class
    private val mailService = application.service(MailService::class)
    private val semaphore = Semaphore(1)

    override suspend fun onEvent(event: MessageCreateEvent) {
        if (event.member != null && event.member?.isBot != false) {
            return
        }

        if (event.guildId != null) {
            onGuildMessage(event)
        } else {
            onDirectMessage(event)
        }
    }

    private suspend fun onDirectMessage(event: MessageCreateEvent) {
        if (event.message.author?.isBot != false)
            return

        val userId = event.message.author!!.id.toString()

        semaphore.acquire()
        mailService.check(userId) {
            ifFound {
                mailService.forwardUserMessage(event, it)
                event.message.addReaction(ReactionEmoji.Unicode("☑\uFE0F"))
                semaphore.release()
            }

            ifNotFound {
                event.message.author?.let {
                    createMail(it)
                    mailService.respondToMailCreation(event)
                    semaphore.release()
                } ?: semaphore.release()
            }
        }
    }

    private suspend fun onGuildMessage(event: MessageCreateEvent) {
        event.message.reply {
            content = "Not implemented!"
        }
    }
}