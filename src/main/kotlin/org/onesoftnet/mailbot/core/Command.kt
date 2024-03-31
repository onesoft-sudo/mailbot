package org.onesoftnet.mailbot.core

import dev.kord.common.entity.Permission
import dev.kord.common.entity.Permissions
import dev.kord.core.behavior.reply
import dev.kord.core.event.Event
import dev.kord.core.event.message.MessageCreateEvent
import dev.kord.rest.builder.message.MessageBuilder
import org.onesoftnet.mailbot.arguments.Argument
import org.onesoftnet.mailbot.models.Mail
import org.onesoftnet.mailbot.services.MailService
import org.slf4j.LoggerFactory
import kotlin.reflect.KClass

/**
 * Represents a command that can be executed by the bot.
 *
 * TODO: Add support for slash commands.
 */
abstract class Command(val application: Application) {
    abstract val name: String
    abstract val description: String
    abstract val usage: String
    open val arguments = emptyList<KClass<out Any>>()
    open val optionalsAfter = 0
    open val aliases: Collection<String> = emptyList()
    open val mailOnly = false
    open val permissions: Permissions = Permissions {
        +Permission.ModerateMembers
    }

    private var _internalEvent: Event? = null
    protected val messageCreateEvent: MessageCreateEvent
        get() = _internalEvent as MessageCreateEvent? ?: error("Event is not available")

    abstract suspend fun build(): Unit
    protected abstract suspend fun execute(context: Context<out Any>, args: List<Argument<out Any>>): Unit
    protected suspend fun reply(block: MessageBuilder.() -> Unit) = messageCreateEvent.message.reply(block)

    private suspend fun preconditionCheck(context: Context<out Any>): Boolean {
        if (!context.getMemberPermissions().contains(permissions)) {
            return false
        }

        val channel = context.getChannel()

        if (mailOnly) {
            val service = application.service(MailService::class)
            return channel.categoryId.toString() == service.mailCategory
        }

        return true
    }

    suspend fun run(context: Context<out Any>, args: List<Argument<out Any>>) {
        _internalEvent = context.handle as Event

        if (!preconditionCheck(context)) {
            return
        }

        runCatching {
            execute(context, args)
        }.onFailure { e ->
            if (e is CommandAbortException) {
                return@onFailure
            }

            LoggerFactory.getLogger(this.javaClass).error("An error occurred while executing the command", e)
        }
    }

    fun abort(): Nothing = throw CommandAbortException()

    suspend fun getMailThread(context: Context<out Any>): Mail {
        val service = application.service(MailService::class)
        val channelId = context.getChannel().id.toString()
        val mail = service.getMailByChannelId(channelId)

        if (mail == null) {
            context.reply {
                content = "This channel is not a mail thread."
            }

            abort()
        }

        return mail
    }
}