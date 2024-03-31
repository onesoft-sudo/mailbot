package org.onesoftnet.mailbot.events.message

import dev.kord.core.behavior.reply
import dev.kord.core.entity.ReactionEmoji
import dev.kord.core.event.message.MessageCreateEvent
import kotlinx.coroutines.sync.Semaphore
import org.onesoftnet.mailbot.arguments.Argument
import org.onesoftnet.mailbot.core.Application
import org.onesoftnet.mailbot.core.Context
import org.onesoftnet.mailbot.core.EventListener
import org.onesoftnet.mailbot.services.MailService
import org.onesoftnet.mailbot.utils.Environment
import kotlin.reflect.full.primaryConstructor

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
        if (event.message.author?.isBot != false)
            return

        val prefix = Environment.getOrFail("BOT_PREFIX")

        if (!event.message.content.startsWith(prefix)) {
            return
        }

        val argv = event.message.content
            .substring(prefix.length)
            .trim()
            .split("\\s+".toRegex())
        println(argv)
        val (commandName) = argv
        val command = application.resolveCommand(commandName) ?: return
        val args = if (argv.size > 1) argv.slice(1..<argv.size) else emptyList()
        val context = Context.Legacy(application, event, argv, args)

        @Suppress("UNCHECKED_CAST")
        val arguments = command.arguments.mapIndexed { index, argumentClass ->
            val argument = argumentClass.primaryConstructor?.call(context, index, index >= command.optionalsAfter) as Argument<out Any>?
                ?: error("Argument has no primary constructor")

            val (_, error) = argument.tryTransform()

            error?.let {
                event.message.reply {
                    content = ":x: ${it.message}"
                }

                return
            }

            argument
        }

        command.run(context, arguments)
    }
}