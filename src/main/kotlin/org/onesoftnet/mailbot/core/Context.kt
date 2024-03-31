package org.onesoftnet.mailbot.core

import dev.kord.common.entity.Permissions
import dev.kord.core.behavior.channel.asChannelOf
import dev.kord.core.behavior.reply
import dev.kord.core.entity.Member
import dev.kord.core.entity.Message
import dev.kord.core.entity.User
import dev.kord.core.entity.channel.TextChannel
import dev.kord.core.event.message.MessageCreateEvent
import dev.kord.rest.builder.message.create.MessageCreateBuilder
import org.onesoftnet.mailbot.utils.Environment

sealed class Context<T>(val application: Application, val handle: T) {
    abstract val type: Type
    abstract val user: User
    abstract val member: Member?
    abstract val commandName: String
    abstract suspend fun getChannel(): TextChannel
    abstract suspend fun reply(block: suspend MessageCreateBuilder.() -> Unit): Message
    abstract suspend fun getMemberPermissions(): Permissions

    enum class Type {
        LEGACY,
        CHAT_INPUT
    }

    class Legacy(application: Application, handle: MessageCreateEvent, val argv: List<String>, val args: List<String>) : Context<MessageCreateEvent>(application, handle) {
        override val type = Type.LEGACY
        override val user
            get() = handle.message.author ?: error("Author is null")
        override val member
            get() = handle.member ?: error("Member is null")
        override val commandName: String
            get() = argv[0]
        private var cachedChannel: TextChannel? = null
        private var cachedPermissions: Permissions? = null

        val prefix = Environment.getOrFail("BOT_PREFIX")

        override suspend fun getChannel(): TextChannel {
            if (cachedChannel != null) {
                return cachedChannel!!
            }

            val channel = handle.message.channel.asChannelOf<TextChannel>()
            cachedChannel = channel
            return channel
        }

        override suspend fun getMemberPermissions(): Permissions {
            if (cachedPermissions != null) {
                return cachedPermissions!!
            }

            val result = member.permissions ?: member.getPermissions()
            cachedPermissions = result
            return result
        }

        override suspend fun reply(block: suspend MessageCreateBuilder.() -> Unit) = handle.message.reply { block() }
    }
}