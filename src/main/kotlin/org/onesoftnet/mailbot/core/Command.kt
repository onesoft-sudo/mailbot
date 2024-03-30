package org.onesoftnet.mailbot.core

import dev.kord.core.behavior.reply
import dev.kord.core.event.Event
import dev.kord.core.event.message.MessageCreateEvent
import dev.kord.rest.builder.message.MessageBuilder
import org.onesoftnet.mailbot.arguments.Argument
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
    private var _internalEvent: Event? = null
    protected val messageCreateEvent: MessageCreateEvent
        get() = _internalEvent as MessageCreateEvent? ?: error("Event is not available")

    abstract suspend fun build(): Unit
    protected abstract suspend fun execute(context: Context<out Any>, args: List<Argument<out Any>>): Unit
    protected suspend fun reply(block: MessageBuilder.() -> Unit) = messageCreateEvent.message.reply(block)

    suspend fun run(context: Context<out Any>, args: List<Argument<out Any>>) {
        _internalEvent = context.handle as Event
        execute(context, args)
    }
}